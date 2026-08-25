import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ENUMS, addHistory, getWorldState, validateChanges } from '../worldState.js';
import { discordBot } from '../discordBot.js';

const router = Router();
const admin = [requireAuth, requireRole('admin')];
const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

router.get('/', (_req, res) => res.json(getWorldState()));
router.post('/preview', ...admin, (req, res) => {
  try { res.json({ ...getWorldState(new Date(req.body.at || Date.now())), ...validateChanges(req.body.changes || {}), preview: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
router.get('/director', ...admin, (_req, res) => res.json({ state:getWorldState(), enums:ENUMS,
  overrides:db.prepare('SELECT * FROM world_overrides ORDER BY starts_at DESC').all(), schedules:db.prepare('SELECT * FROM world_schedules ORDER BY starts_at DESC').all(),
  effects:db.prepare('SELECT * FROM world_effects ORDER BY created_at DESC').all(), scars:db.prepare('SELECT * FROM world_scars ORDER BY visible_from DESC').all(),
  history:db.prepare('SELECT * FROM world_state_history ORDER BY timestamp DESC LIMIT 100').all() }));

router.put('/base', ...admin, async (req, res) => {
  try {
    const changes = validateChanges(req.body.changes || {}); const before = getWorldState();
    const columns = { weather:'weather',temperature:'temperature',windDirection:'wind_direction',windIntensity:'wind_intensity',citadelState:'citadel_state',threatLevel:'threat_level',skyState:'sky_state',seaState:'sea_state',narrativeReport:'narrative_report',ceremonialMode:'ceremonial_mode' };
    const tx = db.transaction(() => { for (const [field,value] of Object.entries(changes)) { if (!columns[field]) continue; db.prepare(`UPDATE world_state SET ${columns[field]}=?, updated_at=? WHERE id='current'`).run(typeof value==='boolean'?Number(value):value,new Date().toISOString()); addHistory({actor:req.user,field,previous:before[field],next:value,reason:req.body.reason}); } }); tx();
    const state = getWorldState();
    let discord = null;
    if (req.body.publishToDiscord) {
      try { discord = { ok:true, ...(await discordBot.announceWorldState(state, { channelId:req.body.discordChannelId, actorName:req.user.fullName })) }; }
      catch (error) { discord = { ok:false, error:error.message }; }
    }
    res.json({ ...state, discord });
  } catch(e) { res.status(400).json({error:e.message}); }
});
router.post('/overrides', ...admin, (req,res) => { try { const {field,value,startsAt,endsAt,reason,priority=100}=req.body; validateChanges({[field]:value}); const oid=id('wo'); db.prepare('INSERT INTO world_overrides VALUES (?,?,?,?,?,?,?,?,?)').run(oid,field,JSON.stringify(value),new Date(startsAt||Date.now()).toISOString(),endsAt?new Date(endsAt).toISOString():null,priority,reason||null,req.user.id,new Date().toISOString()); addHistory({actor:req.user,field,previous:getWorldState()[field],next:value,reason,source:'OVERRIDE'}); res.status(201).json({id:oid,state:getWorldState()}); } catch(e){res.status(400).json({error:e.message});} });
router.delete('/overrides/:id', ...admin, (req,res)=>{db.prepare('DELETE FROM world_overrides WHERE id=?').run(req.params.id);res.json({ok:true,state:getWorldState()});});
router.post('/schedules', ...admin, (req,res)=>{try{const changes=validateChanges(req.body.changes||{});const sid=id('ws');db.prepare('INSERT INTO world_schedules VALUES (?,?,?,?,?,?,?,?)').run(sid,req.body.name||'Zaplanowana zmiana',JSON.stringify(changes),new Date(req.body.startsAt).toISOString(),req.body.endsAt?new Date(req.body.endsAt).toISOString():null,req.body.priority||50,req.user.id,new Date().toISOString());res.status(201).json({id:sid});}catch(e){res.status(400).json({error:e.message});}});
router.delete('/schedules/:id', ...admin, (req,res)=>{db.prepare('DELETE FROM world_schedules WHERE id=?').run(req.params.id);res.json({ok:true});});
router.post('/effects', ...admin, (req,res)=>{const eid=id('we');db.prepare('INSERT INTO world_effects VALUES (?,?,?,?,?,?,?,?,?,?)').run(eid,req.body.name,req.body.type,JSON.stringify(req.body.config||{}),JSON.stringify(req.body.conditions||[]),req.body.startsAt||null,req.body.endsAt||null,req.body.enabled===false?0:1,req.body.sourceEventId||null,new Date().toISOString());res.status(201).json({id:eid});});
router.post('/scars', ...admin, (req,res)=>{const sid=id('scar');db.prepare('INSERT INTO world_scars VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(sid,req.body.name,req.body.description,req.body.type,req.body.location||null,req.body.visualVariant||null,req.body.sourceEventId||null,req.body.visibleFrom||new Date().toISOString(),req.body.visibleUntil||null,req.body.visibility||'PUBLIC',req.body.archiveReference||null,new Date().toISOString());res.status(201).json({id:sid});});
router.post('/events', ...admin, (req,res)=>{try{const changes=validateChanges(req.body.changes||{}),eid=req.body.id||id('event');db.prepare('INSERT INTO events (id,title,date,type,description,starts_at,ends_at,world_changes,is_world_event) VALUES (?,?,?,?,?,?,?,?,1)').run(eid,req.body.title,new Date(req.body.startsAt).toLocaleDateString('pl-PL'),req.body.type||'world',req.body.description||'',new Date(req.body.startsAt).toISOString(),req.body.endsAt?new Date(req.body.endsAt).toISOString():null,JSON.stringify(changes));res.status(201).json({id:eid,state:getWorldState()});}catch(e){res.status(400).json({error:e.message});}});
router.post('/events/:id/close-with-scar', ...admin, (req,res)=>{const event=db.prepare('SELECT * FROM events WHERE id=? AND is_world_event=1').get(req.params.id);if(!event)return res.status(404).json({error:'Nie znaleziono wydarzenia świata.'});const closedAt=new Date().toISOString(),sid=id('scar');const tx=db.transaction(()=>{db.prepare('UPDATE events SET ends_at=? WHERE id=?').run(closedAt,event.id);db.prepare('INSERT INTO world_scars VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(sid,req.body.name,req.body.description,req.body.type||'EVENT_MARK',req.body.location||null,req.body.visualVariant||null,event.id,closedAt,req.body.visibleUntil||null,req.body.visibility||'PUBLIC',req.body.archiveReference||null,closedAt);addHistory({actor:req.user,field:'activeEvent',previous:event.id,next:null,reason:req.body.reason||'Zakończenie wydarzenia',source:'EVENT'});});tx();res.json({ok:true,scarId:sid,state:getWorldState()});});

export default router;
