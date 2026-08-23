import { Router } from 'express';
import db, {
  dbStoreItemToFrontend,
  dbShoppingListToFrontend,
  dbUserToFrontend,
  calculateHouseRankings
} from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/market/items — list all items
router.get('/items', (req, res) => {
  const { shopId, category, search } = req.query;

  let query = 'SELECT * FROM store_items WHERE 1=1';
  const params = [];

  if (shopId && shopId !== 'all') {
    query += ' AND shop_id = ?';
    params.push(shopId);
  }

  if (category && category !== 'all') {
    query += ' AND category_slug = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ? OR lore LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY price ASC';

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(dbStoreItemToFrontend));
});

// Helper function to check and reward completed shopping lists
function checkShoppingListCompletion(userId, userName, house) {
  const userRow = db.prepare('SELECT inventory FROM users WHERE id = ?').get(userId);
  if (!userRow) return [];

  const inventory = JSON.parse(userRow.inventory || '[]');
  const ownedItemIds = new Set(inventory.map(i => i.id));

  const allLists = db.prepare('SELECT * FROM shopping_lists').all();
  const completedLists = [];

  for (const list of allLists) {
    const requiredIds = JSON.parse(list.required_item_ids || '[]');
    const isCompleted = requiredIds.every(id => ownedItemIds.has(id));

    if (isCompleted) {
      // Check if already recorded in user_shopping_lists
      const existing = db.prepare('SELECT * FROM user_shopping_lists WHERE user_id = ? AND list_id = ?').get(userId, list.id);

      if (!existing || existing.completed === 0) {
        const userListId = `usl-${userId}-${list.id}`;
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

        // 1. Mark completed in user_shopping_lists
        db.prepare(`
          INSERT INTO user_shopping_lists (id, user_id, list_id, completed, completed_at, points_awarded, skirnirs_awarded)
          VALUES (?, ?, ?, 1, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET completed = 1, completed_at = ?, points_awarded = ?, skirnirs_awarded = ?
        `).run(
          userListId, userId, list.id, nowStr, list.reward_points, list.reward_skirnirs,
          nowStr, list.reward_points, list.reward_skirnirs
        );

        // 2. Award house points & personal points in point_transactions & users table
        if (house) {
          const ptId = `pt-shop-${Date.now()}-${list.slug}`;
          db.prepare(`
            INSERT INTO point_transactions (id, student_id, student_name, house, points, source, professor_id, professor_name, date, comment, is_revoked, created_at)
            VALUES (?, ?, ?, ?, ?, 'wyprawka', 'system', 'Rada Dyrekcji Durmstrang', ?, ?, 0, datetime('now'))
          `).run(
            ptId, userId, userName, house, list.reward_points, nowStr,
            `Nagroda za ukończenie Wyprawki: ${list.title}`
          );

          db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(list.reward_points, userId);
        }

        // 3. Award bonus Skirnirs to user and vault
        if (list.reward_skirnirs > 0) {
          db.prepare('UPDATE users SET currency = currency + ? WHERE id = ?').run(list.reward_skirnirs, userId);
          db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ?').run(list.reward_skirnirs, userId);

          // Bank transaction
          const txId = `tx-list-${Date.now()}`;
          const refCode = `SKR-LST-${Math.floor(10000 + Math.random() * 90000)}`;
          db.prepare(`
            INSERT INTO bank_transactions (id, sender_id, sender_name, recipient_id, recipient_name, amount, type, category, title, note, status, reference_code, date, created_at)
            VALUES (?, 'cytadela-treasury', 'Rada Dyrekcji Cytadeli', ?, ?, ?, 'inflow', 'nagroda_wyprawka', ?, ?, 'completed', ?, ?, datetime('now'))
          `).run(
            txId, userId, userName, list.reward_skirnirs,
            `Nagroda za skompletowanie: ${list.title}`,
            `Gratulacje! Odznaka: ${list.badge}`,
            refCode, nowStr
          );
        }

        completedLists.push({
          listId: list.id,
          title: list.title,
          rewardPoints: list.reward_points,
          rewardSkirnirs: list.reward_skirnirs,
          badge: list.badge
        });
      }
    }
  }

  return completedLists;
}

// POST /api/market/buy — buy an item from market (zalogowani)
router.post('/buy', requireAuth, (req, res) => {
  const { userId, itemId } = req.body;

  if (!userId || !itemId) {
    return res.status(400).json({ error: 'Wymagane ID użytkownika i przedmiotu.' });
  }

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!userRow) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });
  const user = dbUserToFrontend(userRow);

  const itemRow = db.prepare('SELECT * FROM store_items WHERE id = ?').get(itemId);
  if (!itemRow) return res.status(404).json({ error: 'Przedmiot nie istnieje w asortymencie.' });
  const item = dbStoreItemToFrontend(itemRow);

  // Check house exclusivity
  if (item.houseExclusive && user.house && item.houseExclusive !== user.house) {
    return res.status(400).json({ error: `Ten artefakt jest zastrzeżony wyłącznie dla Zakonu: ${item.houseExclusive.toUpperCase()}.` });
  }

  // Check already owned
  const currentInventory = user.inventory || [];
  if (currentInventory.some(i => i.id === item.id)) {
    return res.status(400).json({ error: 'Posiadasz już ten unikatowy przedmiot w swoim ekwipunku.' });
  }

  // Check currency
  if ((user.currency || 0) < item.price) {
    return res.status(400).json({ error: `Niewystarczająca liczba Skirnirów. Cena: ${item.price} ᛋ, posiadasz: ${user.currency} ᛋ.` });
  }

  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const txId = `tx-buy-${Date.now()}`;
  const refCode = `SKR-BUY-${Math.floor(10000 + Math.random() * 90000)}`;

  let completedLists = [];

  const executePurchase = db.transaction(() => {
    // 1. Deduct currency from user and bank account
    db.prepare('UPDATE users SET currency = currency - ? WHERE id = ?').run(item.price, userId);
    db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE user_id = ?').run(item.price, userId);

    // 2. Add item to inventory
    const updatedInventory = [...currentInventory, item];
    db.prepare('UPDATE users SET inventory = ? WHERE id = ?').run(JSON.stringify(updatedInventory), userId);

    // 3. Record bank transaction
    db.prepare(`
      INSERT INTO bank_transactions (id, sender_id, sender_name, recipient_id, recipient_name, amount, type, category, title, note, status, reference_code, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'outflow', 'zakup', ?, ?, 'completed', ?, ?, datetime('now'))
    `).run(
      txId, user.id, user.fullName, item.shopId, item.shopName, item.price,
      `Zakup: ${item.name}`,
      `Kram: ${item.shopName} (${item.rarity})`,
      refCode, nowStr
    );

    // 4. Automatically check shopping lists completion
    completedLists = checkShoppingListCompletion(user.id, user.fullName, user.house);
  });

  executePurchase();

  const updatedUserRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const updatedUser = dbUserToFrontend(updatedUserRow);
  const rankings = calculateHouseRankings('overall');

  res.json({
    success: true,
    user: updatedUser,
    purchasedItem: item,
    completedLists,
    rankings,
    message: `Pomyślnie zakupiono: ${item.name} za ${item.price} Skirnirów!`
  });
});

// GET /api/market/shopping-lists — list all shopping lists with user status
router.get('/shopping-lists', (req, res) => {
  const { userId } = req.query;

  const lists = db.prepare('SELECT * FROM shopping_lists ORDER BY reward_points ASC').all();
  let userInventory = [];
  let userCompletedIds = new Set();

  if (userId) {
    const userRow = db.prepare('SELECT inventory FROM users WHERE id = ?').get(userId);
    if (userRow) {
      try {
        userInventory = JSON.parse(userRow.inventory || '[]');
      } catch {
        userInventory = [];
      }
    }

    const userListRows = db.prepare('SELECT list_id FROM user_shopping_lists WHERE user_id = ? AND completed = 1').all(userId);
    userCompletedIds = new Set(userListRows.map(r => r.list_id));
  }

  const ownedItemIds = new Set(userInventory.map(i => i.id));

  // Also get all store items map for displaying item details in list
  const allItems = db.prepare('SELECT * FROM store_items').all().map(dbStoreItemToFrontend);
  const itemsMap = new Map(allItems.map(item => [item.id, item]));

  const result = lists.map(row => {
    const list = dbShoppingListToFrontend(row);
    const requiredItems = list.requiredItemIds.map(id => itemsMap.get(id) || { id, name: id, price: 100, icon: '📦' });
    const ownedCount = list.requiredItemIds.filter(id => ownedItemIds.has(id)).length;
    const totalCount = list.requiredItemIds.length;
    const isCompleted = userCompletedIds.has(list.id) || (totalCount > 0 && ownedCount === totalCount);

    return {
      ...list,
      requiredItems,
      ownedCount,
      totalCount,
      progressPercent: totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0,
      isCompleted
    };
  });

  res.json(result);
});

// POST /api/market/shopping-lists/check — force re-check and claim for user (zalogowani)
router.post('/shopping-lists/check', requireAuth, (req, res) => {
  const { userId } = req.body;
  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!userRow) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });
  const user = dbUserToFrontend(userRow);

  const completed = checkShoppingListCompletion(user.id, user.fullName, user.house);
  const updatedUser = dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
  const rankings = calculateHouseRankings('overall');

  res.json({
    success: true,
    completedLists: completed,
    user: updatedUser,
    rankings
  });
});

export default router;
