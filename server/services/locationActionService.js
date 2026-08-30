import { randomUUID } from 'crypto';
import { debit as debitSkirnir } from './skirnirService.js';
import { buildLocationActionDefinition } from '../seed/locationActionDefinitions.js';

function parseActions(value) {
  try {
    const actions = JSON.parse(value || '[]');
    return Array.isArray(actions) ? actions : [];
  } catch (_) {
    return [];
  }
}

function awardXp(db, userId, amount) {
  if (!amount || amount <= 0) return 0;
  const user = db.prepare('SELECT xp, level, next_level_xp FROM users WHERE id=?').get(userId);
  if (!user) throw new Error('Użytkownik nie istnieje.');

  let xp = (user.xp || 0) + amount;
  let level = user.level || 1;
  let nextLevelXp = user.next_level_xp || 500;
  while (xp >= nextLevelXp) {
    xp -= nextLevelXp;
    level += 1;
    nextLevelXp = Math.round(nextLevelXp * 1.5);
  }
  db.prepare('UPDATE users SET xp=?, level=?, next_level_xp=? WHERE id=?')
    .run(xp, level, nextLevelXp, userId);
  return amount;
}

function addInventoryItem(db, userId, definition) {
  const itemName = definition.effects.item;
  if (!itemName) return null;
  const user = db.prepare('SELECT inventory FROM users WHERE id=?').get(userId);
  if (!user) throw new Error('Użytkownik nie istnieje.');
  let inventory = [];
  try { inventory = JSON.parse(user.inventory || '[]'); } catch (_) {}

  const itemId = `item-location-${definition.locationId}-${definition.actionIndex}-${userId.slice(0, 8)}`;
  if (!inventory.some(item => item.id === itemId)) {
    inventory.unshift({
      id: itemId,
      name: itemName,
      icon: definition.kind === 'trade' ? '🛍️' : definition.kind === 'exchange' ? '🔄' : '🌿',
      rarity: 'Pamiątka z lokacji',
      price: Math.max(1, definition.effects.skirnirCost || 2),
      description: `Zdobyto podczas działania „${definition.label}”.`,
    });
    db.prepare('UPDATE users SET inventory=? WHERE id=?').run(JSON.stringify(inventory), userId);
  }
  return itemName;
}

export function executeLocationAction({ locationId, userId, actionIndex, discordThreadId, db }) {
  const location = db.prepare('SELECT id, name, actions FROM locations WHERE id=?').get(locationId);
  if (!location) throw Object.assign(new Error('Lokacja nie istnieje.'), { statusCode: 404 });
  const actions = parseActions(location.actions);
  const actionLabel = Number.isInteger(actionIndex) ? actions[actionIndex] : null;
  if (!actionLabel) throw Object.assign(new Error('To działanie nie jest dostępne.'), { statusCode: 400 });

  const definition = buildLocationActionDefinition(location, actionLabel, actionIndex);
  const existing = db.prepare(`
    SELECT result_text, effect_json FROM user_location_action_log
    WHERE user_id=? AND location_id=? AND action_index=?
  `).get(userId, locationId, actionIndex);
  if (existing) {
    let effects = {};
    try { effects = JSON.parse(existing.effect_json || '{}'); } catch (_) {}
    return { definition, result: existing.result_text || definition.result, effects, duplicate: true };
  }

  const logId = randomUUID();
  const reserved = db.prepare(`
    INSERT OR IGNORE INTO user_location_action_log
      (id, location_id, user_id, action_index, action_label, discord_thread_id, result_text, effect_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, '{}')
  `).run(logId, locationId, userId, actionIndex, definition.label, discordThreadId, definition.result);

  if (reserved.changes === 0) {
    const raced = db.prepare(`
      SELECT result_text, effect_json FROM user_location_action_log
      WHERE user_id=? AND location_id=? AND action_index=?
    `).get(userId, locationId, actionIndex);
    let effects = {};
    try { effects = JSON.parse(raced?.effect_json || '{}'); } catch (_) {}
    return { definition, result: raced?.result_text || definition.result, effects, duplicate: true };
  }

  try {
    const effects = { xpAwarded: 0, skirnirySpent: 0, itemAdded: null };
    if (definition.effects.skirnirCost > 0) {
      debitSkirnir({
        userId,
        amount: definition.effects.skirnirCost,
        category: 'działanie lokacji',
        title: definition.label,
        note: `Lokacja: ${location.name}`,
        recipientId: `location-${location.id}`,
        recipientName: location.name,
        sourceType: 'LOCATION_ACTION',
        sourceId: definition.id,
        idempotencyKey: `location-action:${userId}:${location.id}:${actionIndex}`,
      });
      effects.skirnirySpent = definition.effects.skirnirCost;
    }
    effects.itemAdded = addInventoryItem(db, userId, definition);
    effects.xpAwarded = awardXp(db, userId, definition.effects.xp);

    db.prepare('UPDATE user_location_action_log SET effect_json=? WHERE id=?')
      .run(JSON.stringify(effects), logId);
    return { definition, result: definition.result, effects, duplicate: false };
  } catch (error) {
    db.prepare('DELETE FROM user_location_action_log WHERE id=?').run(logId);
    throw error;
  }
}
