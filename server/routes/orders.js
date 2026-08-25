import express from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ensureOrderSchema, seedOrderDefaults, createProject, contribute, assignCouncilMember, getOrderRoom, COUNCIL_PERMISSIONS } from '../orderService.js';

ensureOrderSchema(db);
seedOrderDefaults(db);
const router = express.Router();
const fail = (res, err) => res.status(/niedostępny|wyłącznie|uprawnień/.test(err.message) ? 403 : 400).json({ error: err.message });

router.get('/:orderId', requireAuth, (req, res) => { try { res.json(getOrderRoom(db, req.params.orderId.toLowerCase(), req.user)); } catch (e) { fail(res, e); } });
router.post('/projects', requireAuth, requireRole('admin'), (req, res) => { try { res.status(201).json({ id: createProject(db, req.body, req.user.id) }); } catch (e) { fail(res, e); } });
router.post('/projects/:projectId/contributions', requireAuth, (req, res) => { try { res.status(201).json(contribute(db, { ...req.body, projectId: req.params.projectId }, req.user)); } catch (e) { if (/UNIQUE/.test(e.message)) return res.status(409).json({ error: 'Ten wkład lub jego źródło zostało już wykorzystane.' }); fail(res, e); } });
router.post('/council/roles', requireAuth, requireRole('admin'), (req, res) => { try { const permissions = (req.body.permissions || []).filter(p => COUNCIL_PERMISSIONS.includes(p)); const id = crypto.randomUUID(); db.prepare('INSERT INTO order_council_roles (id,order_id,name,permissions,seats,created_at) VALUES (?,?,?,?,?,?)').run(id, req.body.orderId, req.body.name, JSON.stringify(permissions), Number(req.body.seats || 1), new Date().toISOString()); res.status(201).json({ id }); } catch (e) { fail(res, e); } });
router.post('/council/memberships', requireAuth, requireRole('admin'), (req, res) => { try { res.status(201).json({ id: assignCouncilMember(db, req.body, req.user.id) }); } catch (e) { fail(res, e); } });

export default router;
