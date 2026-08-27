import { Router } from 'express';
import db, {
  dbLotteryRoundToFrontend,
  dbLotteryTicketToFrontend,
  dbFutharkRuneToFrontend,
  dbUserToFrontend,
  calculateHouseRankings
} from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { awardPoints } from '../services/pointsService.js';
import { credit as creditSkirnir, debit as debitSkirnir } from '../services/skirnirService.js';

const router = Router();

function getAllFutharkRuneNames() {
  return db.prepare('SELECT name FROM futhark_runes ORDER BY sort_order ASC').all().map(r => r.name);
}

router.get('/runes', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM futhark_runes ORDER BY sort_order ASC').all();
    res.json(rows.map(dbFutharkRuneToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania run Futharku: ' + err.message });
  }
});

// GET /api/lottery/current — get current active round and user's tickets
router.get('/current', (req, res) => {
  const { userId } = req.query;

  let roundRow = db.prepare("SELECT * FROM lottery_rounds WHERE status = 'active' ORDER BY round_number DESC LIMIT 1").get();

  if (!roundRow) {
    // Create new round if none active
    const newRoundId = `round-${Date.now()}`;
    const roundNumber = (db.prepare('SELECT MAX(round_number) as max_rn FROM lottery_rounds').get()?.max_rn || 42) + 1;
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO lottery_rounds (id, round_number, title, description, ticket_price, jackpot, bonus_house_points, status, end_date, winning_runes, total_tickets_sold, participants_count, winners_summary)
      VALUES (?, ?, ?, ?, 20, 2500, 100, 'active', ?, '[]', 0, 0, '[]')
    `).run(
      newRoundId,
      roundNumber,
      `Wielkie Losowanie Przesilenia Północy (Runda #${roundNumber})`,
      'Wybierz 3 runy z prastarego Futharku Starszego i zdobądź Skarbiec Odyna!',
      nextWeek
    );

    roundRow = db.prepare('SELECT * FROM lottery_rounds WHERE id = ?').get(newRoundId);
  }

  const round = dbLotteryRoundToFrontend(roundRow);

  let userTickets = [];
  if (userId) {
    const ticketRows = db.prepare('SELECT * FROM lottery_tickets WHERE round_id = ? AND user_id = ? ORDER BY purchased_at DESC').all(round.id, userId);
    userTickets = ticketRows.map(dbLotteryTicketToFrontend);
  }

  res.json({
    round,
    userTickets,
    allRunes: getAllFutharkRuneNames()
  });
});

// POST /api/lottery/buy-ticket — buy lottery ticket (zalogowani)
router.post('/buy-ticket', requireAuth, (req, res) => {
  const { userId, chosenRunes, roundId } = req.body;

  if (!userId || !Array.isArray(chosenRunes) || chosenRunes.length !== 3) {
    return res.status(400).json({ error: 'Musisz wybrać dokładnie 3 unikatowe runy ze Starszego Futharku.' });
  }

  // Validate unique runes
  const uniqueRunes = new Set(chosenRunes);
  const allRuneNames = getAllFutharkRuneNames();
  if (uniqueRunes.size !== 3 || chosenRunes.some(r => !allRuneNames.includes(r))) {
    return res.status(400).json({ error: 'Nieprawidłowe lub powtórzone runy w losie.' });
  }

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!userRow) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });
  const user = dbUserToFrontend(userRow);

  const targetRoundId = roundId || db.prepare("SELECT id FROM lottery_rounds WHERE status = 'active' ORDER BY round_number DESC LIMIT 1").get()?.id;
  const roundRow = db.prepare('SELECT * FROM lottery_rounds WHERE id = ?').get(targetRoundId);
  if (!roundRow || roundRow.status !== 'active') {
    return res.status(400).json({ error: 'Ta runda loterii nie jest już aktywna.' });
  }

  const ticketPrice = roundRow.ticket_price || 20;
  if ((user.currency || 0) < ticketPrice) {
    return res.status(400).json({ error: `Niewystarczająca liczba Skirnirów na zakup losu (${ticketPrice} ᛋ). Posiadasz: ${user.currency} ᛋ.` });
  }

  const ticketId = `ticket-${user.id}-${Date.now()}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const txId = `tx-lot-${Date.now()}`;
  const refCode = `SKR-LOT-${Math.floor(10000 + Math.random() * 90000)}`;

  const executeTicketPurchase = db.transaction(() => {
    // 1. Deduct ticket price via central service
    debitSkirnir({
      userId: user.id,
      userName: user.fullName,
      amount: ticketPrice,
      category: 'loteria',
      title: `Zakup Losu Loterii (Runda #${roundRow.round_number})`,
      note: `Wybrane Runy: ${chosenRunes.map(r => r.toUpperCase()).join(' - ')}`,
      recipientId: 'lottery-pool',
      recipientName: 'Skandynawska Loteria Odyna',
      sourceType: 'LOTTERY_PURCHASE',
      sourceId: roundRow.id,
      idempotencyKey: `lot-buy-${ticketId}`
    });

    // 2. Add ticket to database
    db.prepare(`
      INSERT INTO lottery_tickets (id, round_id, user_id, user_name, house, chosen_runes, purchased_at, matches_count, prize_won, claimed)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)
    `).run(
      ticketId, roundRow.id, user.id, user.fullName, user.house || 'ravnheim',
      JSON.stringify(chosenRunes), nowStr
    );

    // 3. Increase jackpot by 75% of ticket price and increment ticket counter
    const jackpotAddition = Math.round(ticketPrice * 0.75);
    db.prepare(`
      UPDATE lottery_rounds
      SET jackpot = jackpot + ?, total_tickets_sold = total_tickets_sold + 1
      WHERE id = ?
    `).run(jackpotAddition, roundRow.id);
  });

  executeTicketPurchase();

  const updatedRound = dbLotteryRoundToFrontend(db.prepare('SELECT * FROM lottery_rounds WHERE id = ?').get(roundRow.id));
  const createdTicket = dbLotteryTicketToFrontend(db.prepare('SELECT * FROM lottery_tickets WHERE id = ?').get(ticketId));
  const updatedUser = dbUserToFrontend(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id));

  res.json({
    success: true,
    ticket: createdTicket,
    round: updatedRound,
    user: updatedUser,
    message: `Pomyślnie zakupiono los na Loterię Odyna! Wybrane runy: ${chosenRunes.map(r => r.toUpperCase()).join(', ')}.`
  });
});

// POST /api/lottery/draw — trigger bot drawing ceremony (Admin)
router.post('/draw', requireAuth, requireRole('admin'), (req, res) => {
  const { roundId, customWinningRunes } = req.body;

  const targetRoundId = roundId || db.prepare("SELECT id FROM lottery_rounds WHERE status = 'active' ORDER BY round_number DESC LIMIT 1").get()?.id;
  const roundRow = db.prepare('SELECT * FROM lottery_rounds WHERE id = ?').get(targetRoundId);

  if (!roundRow) {
    return res.status(404).json({ error: 'Runda loterii nie istnieje.' });
  }

  // Draw 3 random unique runes if not provided
  let winningRunes = customWinningRunes;
  if (!Array.isArray(winningRunes) || winningRunes.length !== 3) {
    const shuffled = [...getAllFutharkRuneNames()].sort(() => 0.5 - Math.random());
    winningRunes = shuffled.slice(0, 3);
  }

  const winningSet = new Set(winningRunes);
  const tickets = db.prepare('SELECT * FROM lottery_tickets WHERE round_id = ?').all(roundRow.id);

  const winnersSummary = [];
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const jackpot = roundRow.jackpot || 2500;

  const executeDraw = db.transaction(() => {
    // Check all tickets for matches
    for (const t of tickets) {
      const chosen = JSON.parse(t.chosen_runes || '[]');
      const matches = chosen.filter(r => winningSet.has(r)).length;

      let prizeSkirnirs = 0;
      let prizePoints = 0;
      let tierLabel = '';

      if (matches === 3) {
        prizeSkirnirs = Math.round(jackpot * 0.6); // 60% of jackpot
        prizePoints = roundRow.bonus_house_points || 100;
        tierLabel = 'I Miejsce (3 Trafione Runy)';
      } else if (matches === 2) {
        prizeSkirnirs = Math.round(jackpot * 0.25 / Math.max(1, tickets.filter(tk => JSON.parse(tk.chosen_runes).filter(r => winningSet.has(r)).length === 2).length));
        prizePoints = 40;
        tierLabel = 'II Miejsce (2 Trafione Runy)';
      } else if (matches === 1) {
        prizeSkirnirs = Math.round(jackpot * 0.15 / Math.max(1, tickets.filter(tk => JSON.parse(tk.chosen_runes).filter(r => winningSet.has(r)).length === 1).length));
        prizePoints = 15;
        tierLabel = 'III Miejsce (1 Trafiona Runa)';
      }

      // Update ticket record
      db.prepare(`
        UPDATE lottery_tickets
        SET matches_count = ?, prize_won = ?, claimed = 1
        WHERE id = ?
      `).run(matches, prizeSkirnirs, t.id);

      if (prizeSkirnirs > 0 || prizePoints > 0) {
        // Award house points via central service
        if (prizePoints > 0 && t.house) {
          awardPoints({
            studentId: t.user_id,
            studentName: t.user_name,
            house: t.house,
            points: prizePoints,
            source: `Wygrana w Loterii Odyna: ${tierLabel}`,
            sourceType: 'LOTTERY_WIN',
            sourceId: roundRow.id,
            actorId: 'bot',
            actorName: 'Skandynawska Loteria Odyna',
            comment: `Wygrana w Loterii Odyna: ${tierLabel}`,
            idempotencyKey: `lot-win-pt-${t.id}`
          });
        }

        // Credit Skirniry via central service
        if (prizeSkirnirs > 0) {
          creditSkirnir({
            userId: t.user_id,
            userName: t.user_name,
            amount: prizeSkirnirs,
            category: 'loteria',
            title: `Wygrana w Loterii (${tierLabel})`,
            note: `Trafione runy: ${chosen.filter(r => winningSet.has(r)).join(', ')}`,
            sourceType: 'LOTTERY_WIN',
            sourceId: roundRow.id,
            idempotencyKey: `lot-win-skr-${t.id}`
          });
        }

        winnersSummary.push({
          tier: tierLabel,
          winnerName: t.user_name,
          house: t.house,
          prizeSkirnirs,
          prizePoints,
          runes: chosen
        });
      }
    }

    // Mark round as completed
    db.prepare(`
      UPDATE lottery_rounds
      SET status = 'completed', winning_runes = ?, winners_summary = ?
      WHERE id = ?
    `).run(
      JSON.stringify(winningRunes),
      JSON.stringify(winnersSummary),
      roundRow.id
    );

    // Automatically create next active round
    const nextRoundId = `round-${Date.now()}`;
    const nextRoundNumber = roundRow.round_number + 1;
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO lottery_rounds (id, round_number, title, description, ticket_price, jackpot, bonus_house_points, status, end_date, winning_runes, total_tickets_sold, participants_count, winners_summary)
      VALUES (?, ?, ?, ?, 20, 2500, 100, 'active', ?, '[]', 0, 0, '[]')
    `).run(
      nextRoundId,
      nextRoundNumber,
      `Wielkie Losowanie Przesilenia Północy (Runda #${nextRoundNumber})`,
      'Wybierz 3 runy z prastarego Futharku Starszego i zdobądź Skarbiec Odyna!',
      nextWeek
    );
  });

  executeDraw();

  const completedRound = dbLotteryRoundToFrontend(db.prepare('SELECT * FROM lottery_rounds WHERE id = ?').get(roundRow.id));
  const newActiveRound = dbLotteryRoundToFrontend(db.prepare("SELECT * FROM lottery_rounds WHERE status = 'active' ORDER BY round_number DESC LIMIT 1").get());
  const rankings = calculateHouseRankings('overall');

  res.json({
    success: true,
    drawnRunes: winningRunes,
    completedRound,
    newRound: newActiveRound,
    winners: winnersSummary,
    rankings,
    message: `Losowanie zakończone! Wylosowane runy: ${winningRunes.map(r => r.toUpperCase()).join(' • ')}. Wyłoniono ${winnersSummary.length} zwycięzców.`
  });
});

// GET /api/lottery/history — list completed lottery rounds
router.get('/history', (req, res) => {
  const rows = db.prepare("SELECT * FROM lottery_rounds WHERE status = 'completed' ORDER BY round_number DESC LIMIT 20").all();
  res.json(rows.map(dbLotteryRoundToFrontend));
});

export default router;
