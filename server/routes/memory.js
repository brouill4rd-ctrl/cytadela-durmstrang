import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db, {
  dbMemoryYearToFrontend,
  dbMemoryPersonToFrontend,
  dbMemoryStaffToFrontend,
  dbMemoryTrophyToFrontend,
  dbMemoryCertificateToFrontend,
  dbMemoryDiplomaToFrontend,
  dbMemoryAwardToFrontend,
  dbMemoryRankingToFrontend,
  dbMemoryPlebisciteToFrontend,
  dbMemoryChronicleToFrontend,
  dbMemoryGazetteToFrontend,
  dbMemoryCustomAchievementToFrontend
} from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// =========================================================================
// 1. PUBLIC / GENERAL MEMORIAL ARCHIVE ENDPOINTS
// =========================================================================

/**
 * GET /api/memory/overview
 * Returns general stats, all published years, recent trophies, and featured wall-of-fame items.
 */
router.get('/overview', (req, res) => {
  try {
    const yearsRows = db.prepare(`
      SELECT * FROM memory_school_years 
      WHERE status = 'published' 
      ORDER BY start_date DESC, created_at DESC
    `).all();
    const years = yearsRows.map(dbMemoryYearToFrontend);

    const trophiesRows = db.prepare(`
      SELECT t.*, y.name as year_name, y.year_code 
      FROM memory_trophies t
      JOIN memory_school_years y ON t.school_year_id = y.id
      WHERE y.status = 'published'
      ORDER BY y.start_date DESC
    `).all();
    const trophies = trophiesRows.map(row => ({
      ...dbMemoryTrophyToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    const awardsRows = db.prepare(`
      SELECT a.*, y.name as year_name, y.year_code 
      FROM memory_awards a
      JOIN memory_school_years y ON a.school_year_id = y.id
      WHERE y.status = 'published'
      ORDER BY a.created_at DESC
    `).all();
    const awards = awardsRows.map(row => ({
      ...dbMemoryAwardToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    const totalGraduates = db.prepare(`
      SELECT COUNT(*) as count FROM memory_person_snapshots p
      JOIN memory_school_years y ON p.school_year_id = y.id
      WHERE p.is_graduate = 1 AND y.status = 'published'
    `).get().count;

    const totalCertificates = db.prepare(`
      SELECT COUNT(*) as count FROM memory_certificates c
      JOIN memory_school_years y ON c.school_year_id = y.id
      WHERE y.status = 'published'
    `).get().count;

    const totalDiplomas = db.prepare(`
      SELECT COUNT(*) as count FROM memory_diplomas d
      JOIN memory_school_years y ON d.school_year_id = y.id
      WHERE y.status = 'published'
    `).get().count;

    res.json({
      years,
      trophies,
      awards,
      stats: {
        totalYears: years.length,
        totalGraduates,
        totalCertificates,
        totalDiplomas,
        totalTrophies: trophies.length
      }
    });
  } catch (err) {
    console.error('[Memory] Overview error:', err);
    res.status(500).json({ error: 'Nie udało się pobrać danych Izby Pamięci' });
  }
});

/**
 * GET /api/memory/years
 * Returns list of school years.
 */
router.get('/years', (req, res) => {
  try {
    const { includeDrafts } = req.query;
    let query = `SELECT * FROM memory_school_years`;
    if (!includeDrafts) {
      query += ` WHERE status = 'published'`;
    }
    query += ` ORDER BY start_date DESC, created_at DESC`;

    const rows = db.prepare(query).all();
    res.json(rows.map(dbMemoryYearToFrontend));
  } catch (err) {
    console.error('[Memory] Years error:', err);
    res.status(500).json({ error: 'Błąd pobierania lat szkolnych' });
  }
});

/**
 * GET /api/memory/years/:yearId
 * Complete multi-section archive for a specific school year.
 */
router.get('/years/:yearId', (req, res) => {
  try {
    const { yearId } = req.params;
    let yearRow = db.prepare(`SELECT * FROM memory_school_years WHERE id = ? OR year_code = ?`).get(yearId, yearId);
    if (!yearRow) {
      return res.status(404).json({ error: 'Nie odnaleziono archiwum tego roku szkolnego' });
    }
    const year = dbMemoryYearToFrontend(yearRow);

    // 1. Person Snapshots (Students & Graduates)
    const personRows = db.prepare(`SELECT * FROM memory_person_snapshots WHERE school_year_id = ? ORDER BY is_graduate DESC, ranking_position ASC, points DESC`).all(year.id);
    const people = personRows.map(dbMemoryPersonToFrontend);
    const graduates = people.filter(p => p.isGraduate);
    const students = people.filter(p => !p.isGraduate && p.role === 'student');

    // 2. Staff Snapshots (Professors, Interns, Heads)
    const staffRows = db.prepare(`SELECT * FROM memory_staff_snapshots WHERE school_year_id = ? ORDER BY sort_order ASC, name ASC`).all(year.id);
    const staff = staffRows.map(dbMemoryStaffToFrontend);
    const professors = staff.filter(s => s.role === 'professor' || s.role === 'house_head');
    const interns = staff.filter(s => s.role === 'intern');
    const leadership = staff.filter(s => ['headmaster', 'deputy', 'admin', 'herald', 'warden'].includes(s.role));
    const houseHeads = staff.filter(s => s.role === 'house_head');

    // 3. Trophies
    const trophyRows = db.prepare(`SELECT * FROM memory_trophies WHERE school_year_id = ? ORDER BY points DESC`).all(year.id);
    const trophies = trophyRows.map(dbMemoryTrophyToFrontend);

    // 4. Certificates
    const certRows = db.prepare(`SELECT * FROM memory_certificates WHERE school_year_id = ? ORDER BY average_score DESC, student_name ASC`).all(year.id);
    const certificates = certRows.map(dbMemoryCertificateToFrontend);

    // 5. Diplomas
    const diplomaRows = db.prepare(`SELECT * FROM memory_diplomas WHERE school_year_id = ? ORDER BY date DESC, place ASC`).all(year.id);
    const diplomas = diplomaRows.map(dbMemoryDiplomaToFrontend);

    // 6. Awards
    const awardRows = db.prepare(`SELECT * FROM memory_awards WHERE school_year_id = ? ORDER BY created_at DESC`).all(year.id);
    const awards = awardRows.map(dbMemoryAwardToFrontend);

    // 7. Frozen Rankings
    const rankingRows = db.prepare(`SELECT * FROM memory_rankings WHERE school_year_id = ?`).all(year.id);
    const rankings = rankingRows.map(dbMemoryRankingToFrontend);

    // 8. Plebiscites
    const plebisciteRows = db.prepare(`SELECT * FROM memory_plebiscites WHERE school_year_id = ?`).all(year.id);
    const plebiscites = plebisciteRows.map(dbMemoryPlebisciteToFrontend);

    // 9. Chronicle Events
    const chronicleRows = db.prepare(`SELECT * FROM memory_chronicle_events WHERE school_year_id = ? ORDER BY order_index ASC, date ASC`).all(year.id);
    const chronicleEvents = chronicleRows.map(dbMemoryChronicleToFrontend);

    // 10. Gazette Snapshot
    const gazetteRow = db.prepare(`SELECT * FROM memory_gazette_snapshots WHERE school_year_id = ?`).get(year.id);
    const gazette = gazetteRow ? dbMemoryGazetteToFrontend(gazetteRow) : null;

    // 11. Custom Achievements
    const achRows = db.prepare(`SELECT * FROM memory_custom_achievements WHERE school_year_id = ? ORDER BY date DESC`).all(year.id);
    const achievements = achRows.map(dbMemoryCustomAchievementToFrontend);

    res.json({
      year,
      people,
      graduates,
      students,
      staff,
      professors,
      interns,
      leadership,
      houseHeads,
      trophies,
      certificates,
      diplomas,
      awards,
      rankings,
      plebiscites,
      chronicleEvents,
      gazette,
      achievements
    });
  } catch (err) {
    console.error('[Memory] Year detail error:', err);
    res.status(500).json({ error: 'Błąd pobierania danych roku szkolnego' });
  }
});

/**
 * GET /api/memory/wall-of-fame
 * Aggregated Wall of Fame: House Cup Winners, Students of the Year, Professors of the Year, Legend records.
 */
router.get('/wall-of-fame', (req, res) => {
  try {
    // 1. House Cup Champions across all years
    const houseCupsRows = db.prepare(`
      SELECT t.*, y.name as year_name, y.year_code, y.start_date
      FROM memory_trophies t
      JOIN memory_school_years y ON t.school_year_id = y.id
      WHERE t.trophy_type = 'house_cup' AND y.status = 'published'
      ORDER BY y.start_date DESC
    `).all();
    const houseCups = houseCupsRows.map(row => ({
      ...dbMemoryTrophyToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    // 2. Students & Professors of the Year
    const topAwardsRows = db.prepare(`
      SELECT a.*, y.name as year_name, y.year_code, y.start_date
      FROM memory_awards a
      JOIN memory_school_years y ON a.school_year_id = y.id
      WHERE a.award_type IN ('uczen_roku', 'profesor_roku', 'mistrz_pojedynkow', 'herold_roku') AND y.status = 'published'
      ORDER BY y.start_date DESC, a.award_type ASC
    `).all();
    const topAwards = topAwardsRows.map(row => ({
      ...dbMemoryAwardToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    // 3. All-time highest scores
    const topStudentsRows = db.prepare(`
      SELECT p.*, y.name as year_name, y.year_code
      FROM memory_person_snapshots p
      JOIN memory_school_years y ON p.school_year_id = y.id
      WHERE y.status = 'published'
      ORDER BY p.points DESC
      LIMIT 10
    `).all();
    const allTimeTopStudents = topStudentsRows.map(row => ({
      ...dbMemoryPersonToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    // 4. Custom Special Achievements & Records
    const specialAchievementsRows = db.prepare(`
      SELECT c.*, y.name as year_name, y.year_code
      FROM memory_custom_achievements c
      JOIN memory_school_years y ON c.school_year_id = y.id
      WHERE y.status = 'published'
      ORDER BY c.date DESC
    `).all();
    const specialAchievements = specialAchievementsRows.map(row => ({
      ...dbMemoryCustomAchievementToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    res.json({
      houseCups,
      topAwards,
      allTimeTopStudents,
      specialAchievements
    });
  } catch (err) {
    console.error('[Memory] Wall of fame error:', err);
    res.status(500).json({ error: 'Błąd pobierania Ściany Chwały' });
  }
});

/**
 * GET /api/memory/trophies
 * All trophies in the Hall of Trophies.
 */
router.get('/trophies', (req, res) => {
  try {
    const { house } = req.query;
    let query = `
      SELECT t.*, y.name as year_name, y.year_code, y.start_date
      FROM memory_trophies t
      JOIN memory_school_years y ON t.school_year_id = y.id
      WHERE y.status = 'published'
    `;
    const params = [];
    if (house && house !== 'all') {
      query += ` AND t.house = ?`;
      params.push(house);
    }
    query += ` ORDER BY y.start_date DESC, t.points DESC`;

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(row => ({
      ...dbMemoryTrophyToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    })));
  } catch (err) {
    console.error('[Memory] Trophies error:', err);
    res.status(500).json({ error: 'Błąd pobierania Sali Pucharów' });
  }
});

/**
 * GET /api/memory/documents
 * Documents hall: Certificates and Diplomas with search/filters.
 */
router.get('/documents', (req, res) => {
  try {
    const { type, house, yearId, search } = req.query;

    let certQuery = `
      SELECT c.*, y.name as year_name, y.year_code
      FROM memory_certificates c
      JOIN memory_school_years y ON c.school_year_id = y.id
      WHERE y.status = 'published'
    `;
    const certParams = [];
    if (house && house !== 'all') {
      certQuery += ` AND c.house = ?`;
      certParams.push(house);
    }
    if (yearId && yearId !== 'all') {
      certQuery += ` AND c.school_year_id = ?`;
      certParams.push(yearId);
    }
    if (search) {
      certQuery += ` AND (c.student_name LIKE ? OR c.document_number LIKE ?)`;
      certParams.push(`%${search}%`, `%${search}%`);
    }
    certQuery += ` ORDER BY c.issue_date DESC`;

    let diplQuery = `
      SELECT d.*, y.name as year_name, y.year_code
      FROM memory_diplomas d
      JOIN memory_school_years y ON d.school_year_id = y.id
      WHERE y.status = 'published'
    `;
    const diplParams = [];
    if (house && house !== 'all') {
      diplQuery += ` AND d.house = ?`;
      diplParams.push(house);
    }
    if (yearId && yearId !== 'all') {
      diplQuery += ` AND d.school_year_id = ?`;
      diplParams.push(yearId);
    }
    if (search) {
      diplQuery += ` AND (d.recipient_name LIKE ? OR d.title LIKE ? OR d.description LIKE ?)`;
      diplParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    diplQuery += ` ORDER BY d.date DESC`;

    const certificates = (!type || type === 'all' || type === 'certificates')
      ? db.prepare(certQuery).all(...certParams).map(row => ({
          ...dbMemoryCertificateToFrontend(row),
          yearName: row.year_name,
          yearCode: row.year_code,
          docType: 'certificate'
        }))
      : [];

    const diplomas = (!type || type === 'all' || type === 'diplomas')
      ? db.prepare(diplQuery).all(...diplParams).map(row => ({
          ...dbMemoryDiplomaToFrontend(row),
          yearName: row.year_name,
          yearCode: row.year_code,
          docType: 'diploma'
        }))
      : [];

    res.json({
      certificates,
      diplomas,
      totalCount: certificates.length + diplomas.length
    });
  } catch (err) {
    console.error('[Memory] Documents error:', err);
    res.status(500).json({ error: 'Błąd pobierania Sali Dokumentów' });
  }
});

/**
 * GET /api/memory/chronicle
 * Timeline of Citadel history.
 */
router.get('/chronicle', (req, res) => {
  try {
    const { category, yearId } = req.query;
    let query = `
      SELECT e.*, y.name as year_name, y.year_code
      FROM memory_chronicle_events e
      JOIN memory_school_years y ON e.school_year_id = y.id
      WHERE y.status = 'published'
    `;
    const params = [];
    if (category && category !== 'all') {
      query += ` AND e.category = ?`;
      params.push(category);
    }
    if (yearId && yearId !== 'all') {
      query += ` AND e.school_year_id = ?`;
      params.push(yearId);
    }
    query += ` ORDER BY e.date DESC, e.order_index ASC`;

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(row => ({
      ...dbMemoryChronicleToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    })));
  } catch (err) {
    console.error('[Memory] Chronicle error:', err);
    res.status(500).json({ error: 'Błąd pobierania Kroniki Wydarzeń' });
  }
});

/**
 * GET /api/memory/people
 * Chronicle of People: Graduates, Professors, Staff, Interns across years.
 */
router.get('/people', (req, res) => {
  try {
    const { role, house, yearId, search } = req.query;

    let query = `
      SELECT p.*, y.name as year_name, y.year_code
      FROM memory_person_snapshots p
      JOIN memory_school_years y ON p.school_year_id = y.id
      WHERE y.status = 'published'
    `;
    const params = [];

    if (role && role !== 'all') {
      if (role === 'graduate') {
        query += ` AND p.is_graduate = 1`;
      } else {
        query += ` AND p.role = ?`;
        params.push(role);
      }
    }
    if (house && house !== 'all') {
      query += ` AND p.house = ?`;
      params.push(house);
    }
    if (yearId && yearId !== 'all') {
      query += ` AND p.school_year_id = ?`;
      params.push(yearId);
    }
    if (search) {
      query += ` AND (p.character_name LIKE ? OR p.full_name LIKE ? OR p.best_subject LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ` ORDER BY p.is_graduate DESC, p.ranking_position ASC, p.points DESC`;

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(row => ({
      ...dbMemoryPersonToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    })));
  } catch (err) {
    console.error('[Memory] People error:', err);
    res.status(500).json({ error: 'Błąd pobierania Kroniki Ludzi' });
  }
});

/**
 * GET /api/memory/person/:identifier
 * Complete historical dossier of an individual character across all recorded school years.
 */
router.get('/person/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    const cleanId = decodeURIComponent(identifier).trim().toLowerCase();

    // Find all snapshot entries matching user_id or character_name
    const personSnapshots = db.prepare(`
      SELECT p.*, y.name as year_name, y.year_code, y.start_date, y.end_date
      FROM memory_person_snapshots p
      JOIN memory_school_years y ON p.school_year_id = y.id
      WHERE (p.user_id = ? OR LOWER(p.character_name) = ? OR LOWER(p.full_name) = ? OR p.id = ?)
        AND y.status = 'published'
      ORDER BY y.start_date DESC
    `).all(identifier, cleanId, cleanId, identifier);

    // Also find staff snapshots
    const staffSnapshots = db.prepare(`
      SELECT s.*, y.name as year_name, y.year_code, y.start_date
      FROM memory_staff_snapshots s
      JOIN memory_school_years y ON s.school_year_id = y.id
      WHERE (s.user_id = ? OR LOWER(s.name) = ? OR s.id = ?)
        AND y.status = 'published'
      ORDER BY y.start_date DESC
    `).all(identifier, cleanId, identifier);

    // Also find certificates
    const certificates = db.prepare(`
      SELECT c.*, y.name as year_name, y.year_code
      FROM memory_certificates c
      JOIN memory_school_years y ON c.school_year_id = y.id
      WHERE (c.user_id = ? OR LOWER(c.student_name) = ?)
        AND y.status = 'published'
      ORDER BY c.issue_date DESC
    `).all(identifier, cleanId).map(row => ({
      ...dbMemoryCertificateToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    // Also find diplomas
    const diplomas = db.prepare(`
      SELECT d.*, y.name as year_name, y.year_code
      FROM memory_diplomas d
      JOIN memory_school_years y ON d.school_year_id = y.id
      WHERE (d.user_id = ? OR LOWER(d.recipient_name) = ?)
        AND y.status = 'published'
      ORDER BY d.date DESC
    `).all(identifier, cleanId).map(row => ({
      ...dbMemoryDiplomaToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    // Also find awards
    const awards = db.prepare(`
      SELECT a.*, y.name as year_name, y.year_code
      FROM memory_awards a
      JOIN memory_school_years y ON a.school_year_id = y.id
      WHERE (a.user_id = ? OR LOWER(a.recipient_name) = ?)
        AND y.status = 'published'
      ORDER BY a.created_at DESC
    `).all(identifier, cleanId).map(row => ({
      ...dbMemoryAwardToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    if (personSnapshots.length === 0 && staffSnapshots.length === 0 && certificates.length === 0 && diplomas.length === 0) {
      return res.status(404).json({ error: 'Nie odnaleziono wpisów historycznych dla tej postaci' });
    }

    const primaryPerson = personSnapshots[0] || staffSnapshots[0];

    res.json({
      name: primaryPerson?.character_name || primaryPerson?.full_name || primaryPerson?.name || primaryPerson?.student_name,
      avatar: primaryPerson?.avatar || '',
      house: primaryPerson?.house || '',
      snapshots: personSnapshots.map(row => ({
        ...dbMemoryPersonToFrontend(row),
        yearName: row.year_name,
        yearCode: row.year_code
      })),
      staffSnapshots: staffSnapshots.map(row => ({
        ...dbMemoryStaffToFrontend(row),
        yearName: row.year_name,
        yearCode: row.year_code
      })),
      certificates,
      diplomas,
      awards,
      summary: {
        totalCertificates: certificates.length,
        totalDiplomas: diplomas.length,
        totalAwards: awards.length,
        isGraduate: personSnapshots.some(s => s.is_graduate)
      }
    });
  } catch (err) {
    console.error('[Memory] Person detail error:', err);
    res.status(500).json({ error: 'Błąd pobierania dossier postaci' });
  }
});

/**
 * GET /api/memory/order/:houseKey
 * Dedicated historical showcase for a specific Order (Reinhall, Björnhall, Ravnheim, Otergard).
 */
router.get('/order/:houseKey', (req, res) => {
  try {
    const { houseKey } = req.params;
    const cleanHouse = houseKey.toLowerCase();

    // 1. Trophies won
    const trophiesRows = db.prepare(`
      SELECT t.*, y.name as year_name, y.year_code, y.start_date
      FROM memory_trophies t
      JOIN memory_school_years y ON t.school_year_id = y.id
      WHERE t.house = ? AND y.status = 'published'
      ORDER BY y.start_date DESC
    `).all(cleanHouse);
    const trophies = trophiesRows.map(row => ({
      ...dbMemoryTrophyToFrontend(row),
      yearName: row.year_name,
      yearCode: row.year_code
    }));

    // 2. Best yearly points score
    const bestYearRow = db.prepare(`
      SELECT * FROM memory_school_years 
      WHERE winning_house = ? AND status = 'published'
      ORDER BY winning_points DESC LIMIT 1
    `).get(cleanHouse);

    // 3. Historical House Heads
    const houseHeadsRows = db.prepare(`
      SELECT s.*, y.name as year_name, y.year_code, y.start_date
      FROM memory_staff_snapshots s
      JOIN memory_school_years y ON s.school_year_id = y.id
      WHERE s.house = ? AND (s.role = 'house_head' OR s.title LIKE '%Opiekun%') AND y.status = 'published'
      ORDER BY y.start_date DESC
    `).all(cleanHouse);

    // 4. Best historical students
    const topStudentsRows = db.prepare(`
      SELECT p.*, y.name as year_name, y.year_code
      FROM memory_person_snapshots p
      JOIN memory_school_years y ON p.school_year_id = y.id
      WHERE p.house = ? AND y.status = 'published'
      ORDER BY p.points DESC
      LIMIT 10
    `).all(cleanHouse);

    // 5. Order honors and awards
    const awardsRows = db.prepare(`
      SELECT a.*, y.name as year_name, y.year_code
      FROM memory_awards a
      JOIN memory_school_years y ON a.school_year_id = y.id
      WHERE a.house = ? AND y.status = 'published'
      ORDER BY y.start_date DESC
    `).all(cleanHouse);

    res.json({
      house: cleanHouse,
      trophiesCount: trophies.filter(t => t.trophyType === 'house_cup').length,
      allTrophies: trophies,
      bestRecord: bestYearRow ? { points: bestYearRow.winning_points, yearName: bestYearRow.name } : null,
      houseHeadsTimeline: houseHeadsRows.map(row => ({
        ...dbMemoryStaffToFrontend(row),
        yearName: row.year_name,
        yearCode: row.year_code
      })),
      topStudents: topStudentsRows.map(row => ({
        ...dbMemoryPersonToFrontend(row),
        yearName: row.year_name,
        yearCode: row.year_code
      })),
      awards: awardsRows.map(row => ({
        ...dbMemoryAwardToFrontend(row),
        yearName: row.year_name,
        yearCode: row.year_code
      }))
    });
  } catch (err) {
    console.error('[Memory] Order showcase error:', err);
    res.status(500).json({ error: 'Błąd pobierania gabloty Zakonu' });
  }
});

/**
 * GET /api/memory/search
 * Universal search across all archival entities.
 */
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ results: [] });
    }
    const term = `%${q.trim()}%`;

    // 1. People
    const people = db.prepare(`
      SELECT p.*, y.name as year_name, y.year_code 
      FROM memory_person_snapshots p
      JOIN memory_school_years y ON p.school_year_id = y.id
      WHERE (p.character_name LIKE ? OR p.full_name LIKE ? OR p.best_subject LIKE ?) AND y.status = 'published'
      LIMIT 10
    `).all(term, term, term).map(r => ({
      type: 'person',
      title: r.character_name,
      subtitle: `${r.house?.toUpperCase()} • ${r.class_year} (${r.year_name})`,
      avatar: r.avatar,
      linkId: r.user_id || r.character_name,
      yearId: r.school_year_id
    }));

    // 2. Staff
    const staff = db.prepare(`
      SELECT s.*, y.name as year_name, y.year_code 
      FROM memory_staff_snapshots s
      JOIN memory_school_years y ON s.school_year_id = y.id
      WHERE (s.name LIKE ? OR s.subject_name LIKE ? OR s.title LIKE ?) AND y.status = 'published'
      LIMIT 8
    `).all(term, term, term).map(r => ({
      type: 'staff',
      title: r.name,
      subtitle: `${r.title || r.subject_name} (${r.year_name})`,
      avatar: r.avatar,
      linkId: r.user_id || r.name,
      yearId: r.school_year_id
    }));

    // 3. Certificates & Diplomas
    const certificates = db.prepare(`
      SELECT c.*, y.name as year_name 
      FROM memory_certificates c
      JOIN memory_school_years y ON c.school_year_id = y.id
      WHERE (c.student_name LIKE ? OR c.document_number LIKE ?) AND y.status = 'published'
      LIMIT 6
    `).all(term, term).map(r => ({
      type: 'certificate',
      title: `Świadectwo: ${r.student_name}`,
      subtitle: `${r.document_number} • ${r.final_evaluation} (${r.year_name})`,
      linkId: r.id,
      yearId: r.school_year_id
    }));

    const diplomas = db.prepare(`
      SELECT d.*, y.name as year_name 
      FROM memory_diplomas d
      JOIN memory_school_years y ON d.school_year_id = y.id
      WHERE (d.recipient_name LIKE ? OR d.title LIKE ? OR d.description LIKE ?) AND y.status = 'published'
      LIMIT 6
    `).all(term, term, term).map(r => ({
      type: 'diploma',
      title: d => `Dyplom: ${r.title}`,
      subtitle: `${r.recipient_name} • Miejsce: ${r.place} (${r.year_name})`,
      linkId: r.id,
      yearId: r.school_year_id
    }));

    // 4. Chronicle & Events
    const events = db.prepare(`
      SELECT e.*, y.name as year_name 
      FROM memory_chronicle_events e
      JOIN memory_school_years y ON e.school_year_id = y.id
      WHERE (e.title LIKE ? OR e.description LIKE ?) AND y.status = 'published'
      LIMIT 6
    `).all(term, term).map(r => ({
      type: 'event',
      title: r.title,
      subtitle: `${r.date} • ${r.category} (${r.year_name})`,
      linkId: r.id,
      yearId: r.school_year_id
    }));

    res.json({
      query: q,
      results: [...people, ...staff, ...certificates, ...diplomas, ...events]
    });
  } catch (err) {
    console.error('[Memory] Search error:', err);
    res.status(500).json({ error: 'Błąd wyszukiwania w Izbie Pamięci' });
  }
});

// =========================================================================
// 2. AUTOMATIC YEAR ARCHIVATION ENGINE & CMS (ADMIN)
// =========================================================================

/**
 * POST /api/memory/archive-year/preview
 * Scans active users, point standings, lessons, exams, and generates an editable preview snapshot.
 */
router.post('/archive-year/preview', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      yearCode = 'XVIII',
      name = 'XVIII Rok Szkolny',
      term = 'Semestr Zimowy 2026',
      startDate = '2026-08-01',
      endDate = '2026-10-31',
      headmaster = 'Arcymistrz Valdemar Krag-Hansen',
      deputy = 'Prof. Morana Vane',
      highlightEvent = 'Uroczyste Zamknięcie Roku & Finał Pucharu Twierdzy'
    } = req.body;

    // 1. Calculate active House Rankings from points / ledger / users
    const housePointsMap = {
      reinhall: parseInt(db.prepare("SELECT value FROM school_config WHERE key = 'base_reinhall_points'").get()?.value || '0', 10),
      bjornhall: parseInt(db.prepare("SELECT value FROM school_config WHERE key = 'base_bjornhall_points'").get()?.value || '0', 10),
      ravnheim: parseInt(db.prepare("SELECT value FROM school_config WHERE key = 'base_ravnheim_points'").get()?.value || '0', 10),
      otergard: parseInt(db.prepare("SELECT value FROM school_config WHERE key = 'base_otergard_points'").get()?.value || '0', 10)
    };

    // Add points from approved transactions
    const txSums = db.prepare(`
      SELECT house, SUM(points) as total 
      FROM point_transactions 
      WHERE is_revoked = 0 
      GROUP BY house
    `).all();
    txSums.forEach(r => {
      if (housePointsMap[r.house] !== undefined) {
        housePointsMap[r.house] += (r.total || 0);
      }
    });

    const houseStandings = Object.entries(housePointsMap)
      .map(([house, points]) => ({
        house,
        name: house.charAt(0).toUpperCase() + house.slice(1),
        points
      }))
      .sort((a, b) => b.points - a.points)
      .map((h, idx) => ({ ...h, rank: idx + 1 }));

    const winningHouse = houseStandings[0]?.house || 'ravnheim';
    const winningPoints = houseStandings[0]?.points || 2400;

    // 2. Scan active students
    const activeStudents = db.prepare(`
      SELECT id, username, full_name, name, surname, avatar, house, role, class_year, points, specialization 
      FROM users 
      WHERE role = 'student' AND status = 'approved'
      ORDER BY points DESC
    `).all();

    // Auto-detect graduates (e.g. students in Klasa II or with high points)
    const detectedPeopleSnapshots = activeStudents.map((u, idx) => {
      const isGrad = (u.class_year === 'Klasa II' || u.points >= 200);
      return {
        id: `snap-${u.id}-${yearCode.toLowerCase()}`,
        userId: u.id,
        characterName: u.full_name || `${u.name} ${u.surname}`,
        fullName: u.full_name || `${u.name} ${u.surname}`,
        avatar: u.avatar || '',
        house: u.house || 'ravnheim',
        role: isGrad ? 'graduate' : 'student',
        classYear: u.class_year || 'Klasa I',
        finalGrade: u.points >= 350 ? 'Wybitny' : (u.points >= 200 ? 'Powyżej Oczekiwań' : 'Zadowalający'),
        bestSubject: u.specialization || 'Starożytne Runy',
        rankingPosition: idx + 1,
        points: u.points || 0,
        honorsCount: isGrad ? 2 : 1,
        titles: isGrad ? ['Absolwent Cytadeli', `Szpica Zakonu ${u.house}`] : ['Adept Cytadeli'],
        functions: [u.class_year || 'Klasa I'],
        isGraduate: isGrad,
        notes: isGrad ? 'Pomyślnie ukończono program edukacji magicznej.' : 'Zaliczono kolejny stopień zaawansowania.'
      };
    });

    const bestStudent = detectedPeopleSnapshots[0]?.characterName || '';

    // 3. Scan active faculty
    const activeFaculty = db.prepare(`
      SELECT id, full_name, name, surname, avatar, house, role, title, office, department_name, taught_subject_ids 
      FROM users 
      WHERE role IN ('professor', 'admin') AND status = 'approved'
    `).all();

    const detectedStaffSnapshots = activeFaculty.map((f, idx) => ({
      id: `stf-${f.id}-${yearCode.toLowerCase()}`,
      userId: f.id,
      name: f.full_name || `${f.name} ${f.surname}`,
      avatar: f.avatar || '',
      title: f.title || (f.role === 'admin' ? (f.gender === 'czarodziejka' ? 'Arcymistrzyni Dyrekcji' : 'Arcymistrz Dyrekcji') : 'Profesor'),
      role: f.role === 'admin' ? 'headmaster' : 'professor',
      house: f.house || '',
      subjectName: f.department_name || 'Czarna Magia',
      department: f.office || 'Komnaty Profesorskie',
      mentorName: '',
      internStatus: '',
      dutiesSummary: 'Prowadzenie zajęć i nadzór nad salami wykładowymi.',
      sortOrder: idx + 1
    }));

    const bestProfessor = detectedStaffSnapshots.find(s => s.role === 'professor')?.name || 'Prof. Ezra Camhi';

    // 4. Proposed Trophies
    const proposedTrophies = [
      {
        id: `trophy-${yearCode.toLowerCase()}-housecup`,
        house: winningHouse,
        trophyType: 'house_cup',
        title: `Wielki Puchar Twierdzy Magii ${name}`,
        points: winningPoints,
        houseHead: `Opiekun ${winningHouse.charAt(0).toUpperCase() + winningHouse.slice(1)}`,
        topScorers: detectedPeopleSnapshots.filter(p => p.house === winningHouse).slice(0, 3).map(p => ({
          name: p.characterName,
          points: p.points,
          avatar: p.avatar
        })),
        description: `Triumfalne zwycięstwo Zakonu ${winningHouse.toUpperCase()} w ${name} z łącznym wynikiem ${winningPoints} punktów.`,
        icon: '🏆',
        imageUrl: '/trophy_gold.jpg'
      }
    ];

    // 5. Proposed Certificates for Graduates
    const proposedCertificates = detectedPeopleSnapshots.filter(p => p.isGraduate).map((p, idx) => ({
      id: `cert-${yearCode.toLowerCase()}-${String(idx + 1).padStart(3, '0')}`,
      userId: p.userId,
      studentName: p.characterName,
      house: p.house,
      classYear: p.classYear,
      documentNumber: `TMD/SW/${yearCode}/${String(idx + 1).padStart(3, '0')}`,
      issueDate: endDate,
      finalEvaluation: p.finalGrade,
      subjectsGrades: [
        { subject: p.bestSubject, grade: '6', gradeLabel: 'Wybitny', examScore: '95%' },
        { subject: 'Czarna Magia', grade: '5', gradeLabel: 'Powyżej Oczekiwań', examScore: '90%' }
      ],
      examResults: [
        { examName: 'Oficjalny Egzamin Końcowy II Kręgu', score: 94, grade: p.finalGrade }
      ],
      averageScore: 5.2,
      authorityName: headmaster,
      authorityTitle: 'Dyrektor Cytadeli Durmstrang',
      sealType: p.house === 'reinhall' ? 'gold_wolf' : (p.house === 'bjornhall' ? 'iron_bear' : (p.house === 'ravnheim' ? 'silver_raven' : 'emerald_otter')),
      visibility: 'public'
    }));

    // 6. Proposed Awards
    const proposedAwards = [
      {
        id: `award-${yearCode.toLowerCase()}-student`,
        userId: detectedPeopleSnapshots[0]?.userId || '',
        recipientName: bestStudent,
        house: detectedPeopleSnapshots[0]?.house || winningHouse,
        awardType: 'uczen_roku',
        title: `Uczeń Roku ${yearCode}`,
        description: `Za wybitne osiągnięcia w nauce i najwyższą lokatę punktową (${detectedPeopleSnapshots[0]?.points || 0} pkt).`,
        icon: '⭐',
        visibility: 'public'
      },
      {
        id: `award-${yearCode.toLowerCase()}-prof`,
        userId: '',
        recipientName: bestProfessor,
        house: '',
        awardType: 'profesor_roku',
        title: `Profesor Roku ${yearCode}`,
        description: 'Wyróżnienie za pasję pedagogiczną i zaangażowanie w życie Cytadeli.',
        icon: '👑',
        visibility: 'public'
      }
    ];

    res.json({
      preview: {
        year: {
          id: `year-${yearCode.toLowerCase()}`,
          yearCode,
          name,
          term,
          dateRange: `${startDate} – ${endDate}`,
          startDate,
          endDate,
          winningHouse,
          winningPoints,
          headmaster,
          deputy,
          bestStudent,
          bestProfessor,
          highlightEvent,
          studentCount: detectedPeopleSnapshots.length,
          professorCount: detectedStaffSnapshots.length,
          status: 'draft',
          isFeatured: 1,
          summary: `Oficjalne archiwum ${name}. Triumf Zakonu ${winningHouse.toUpperCase()} oraz wręczenie świadectw absolwentom II Kręgu.`
        },
        houseStandings,
        people: detectedPeopleSnapshots,
        staff: detectedStaffSnapshots,
        trophies: proposedTrophies,
        certificates: proposedCertificates,
        awards: proposedAwards,
        rankings: [
          {
            rankingType: 'students',
            standings: detectedPeopleSnapshots.map(p => ({
              rank: p.rankingPosition,
              name: p.characterName,
              house: p.house,
              points: p.points,
              classYear: p.classYear
            }))
          },
          {
            rankingType: 'houses',
            standings: houseStandings
          }
        ]
      }
    });
  } catch (err) {
    console.error('[Memory] Archive preview error:', err);
    res.status(500).json({ error: 'Nie udało się wygenerować podglądu archiwum roku' });
  }
});

/**
 * POST /api/memory/archive-year/publish
 * Commits the approved year snapshot into the permanent database.
 */
router.post('/archive-year/publish', authenticateToken, requireAdmin, (req, res) => {
  const adminName = req.user?.fullName || req.user?.username || 'Arcymistrz Dyrekcji';
  const data = req.body;

  if (!data || !data.year || !data.year.yearCode) {
    return res.status(400).json({ error: 'Nieprawidłowe dane archiwum' });
  }

  const { year, people = [], staff = [], trophies = [], certificates = [], awards = [], rankings = [], plebiscites = [], chronicleEvents = [], gazette = null, achievements = [] } = data;

  const yearId = year.id || `year-${year.yearCode.toLowerCase()}`;

  try {
    const runTransaction = db.transaction(() => {
      // 1. Insert or replace School Year
      const insertYear = db.prepare(`
        INSERT OR REPLACE INTO memory_school_years (
          id, year_code, name, term, date_range, start_date, end_date,
          winning_house, winning_points, headmaster, deputy, best_student,
          best_professor, highlight_event, student_count, professor_count,
          status, is_featured, summary, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      insertYear.run(
        yearId, year.yearCode, year.name, year.term || '', year.dateRange || '',
        year.startDate || '', year.endDate || '', year.winningHouse || '',
        year.winningPoints || 0, year.headmaster || '', year.deputy || '',
        year.bestStudent || '', year.bestProfessor || '', year.highlightEvent || '',
        people.length || year.studentCount || 0, staff.length || year.professorCount || 0,
        year.status || 'published', year.isFeatured ? 1 : 0, year.summary || ''
      );

      // Clean old child records if re-publishing
      db.prepare(`DELETE FROM memory_person_snapshots WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_staff_snapshots WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_trophies WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_certificates WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_diplomas WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_awards WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_rankings WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_plebiscites WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_chronicle_events WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_gazette_snapshots WHERE school_year_id = ?`).run(yearId);
      db.prepare(`DELETE FROM memory_custom_achievements WHERE school_year_id = ?`).run(yearId);

      // 2. Insert Person Snapshots
      const insertPerson = db.prepare(`
        INSERT INTO memory_person_snapshots (
          id, school_year_id, user_id, character_name, full_name, avatar,
          house, role, class_year, final_grade, best_subject, ranking_position,
          points, honors_count, titles, functions, is_graduate, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      people.forEach((p, idx) => {
        insertPerson.run(
          p.id || `per-${yearId}-${idx + 1}`,
          yearId,
          p.userId || '',
          p.characterName || p.fullName || 'Adept',
          p.fullName || p.characterName || 'Adept',
          p.avatar || '',
          p.house || 'ravnheim',
          p.role || (p.isGraduate ? 'graduate' : 'student'),
          p.classYear || 'Klasa I',
          p.finalGrade || '',
          p.bestSubject || '',
          p.rankingPosition || (idx + 1),
          p.points || 0,
          p.honorsCount || 0,
          JSON.stringify(p.titles || []),
          JSON.stringify(p.functions || []),
          p.isGraduate ? 1 : 0,
          p.notes || ''
        );
      });

      // 3. Insert Staff Snapshots
      const insertStaff = db.prepare(`
        INSERT INTO memory_staff_snapshots (
          id, school_year_id, user_id, name, avatar, title, role,
          house, subject_name, department, mentor_name, intern_status,
          duties_summary, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      staff.forEach((s, idx) => {
        insertStaff.run(
          s.id || `stf-${yearId}-${idx + 1}`,
          yearId,
          s.userId || '',
          s.name,
          s.avatar || '',
          s.title || 'Profesor',
          s.role || 'professor',
          s.house || '',
          s.subjectName || '',
          s.department || '',
          s.mentorName || '',
          s.internStatus || '',
          s.dutiesSummary || '',
          s.sortOrder || (idx + 1)
        );
      });

      // 4. Insert Trophies
      const insertTrophy = db.prepare(`
        INSERT INTO memory_trophies (
          id, school_year_id, house, trophy_type, title, points,
          house_head, top_scorers, description, icon, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      trophies.forEach((t, idx) => {
        insertTrophy.run(
          t.id || `trophy-${yearId}-${idx + 1}`,
          yearId,
          t.house || year.winningHouse || 'ravnheim',
          t.trophyType || 'house_cup',
          t.title || 'Puchar Twierdzy',
          t.points || 0,
          t.houseHead || '',
          JSON.stringify(t.topScorers || []),
          t.description || '',
          t.icon || '🏆',
          t.imageUrl || ''
        );
      });

      // 5. Insert Certificates
      const insertCert = db.prepare(`
        INSERT INTO memory_certificates (
          id, school_year_id, user_id, student_name, house, class_year,
          document_number, issue_date, final_evaluation, subjects_grades,
          exam_results, average_score, authority_name, authority_title,
          seal_type, visibility
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      certificates.forEach((c, idx) => {
        insertCert.run(
          c.id || `cert-${yearId}-${idx + 1}`,
          yearId,
          c.userId || '',
          c.studentName,
          c.house || 'ravnheim',
          c.classYear || 'Klasa II',
          c.documentNumber || `TMD/SW/${year.yearCode}/${String(idx + 1).padStart(3, '0')}`,
          c.issueDate || year.endDate || '2026-10-31',
          c.finalEvaluation || 'Wybitny',
          JSON.stringify(c.subjectsGrades || []),
          JSON.stringify(c.examResults || []),
          c.averageScore || 5.0,
          c.authorityName || year.headmaster || 'Arcymistrz Dyrekcji',
          c.authorityTitle || 'Dyrektor Cytadeli Durmstrang',
          c.sealType || 'gold_wolf',
          c.visibility || 'public'
        );
      });

      // 6. Insert Awards
      const insertAward = db.prepare(`
        INSERT INTO memory_awards (
          id, school_year_id, user_id, recipient_name, house,
          award_type, title, description, icon, visibility
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      awards.forEach((a, idx) => {
        insertAward.run(
          a.id || `award-${yearId}-${idx + 1}`,
          yearId,
          a.userId || '',
          a.recipientName,
          a.house || '',
          a.awardType || 'specjalne',
          a.title,
          a.description || '',
          a.icon || '⭐',
          a.visibility || 'public'
        );
      });

      // 7. Insert Rankings
      const insertRanking = db.prepare(`
        INSERT INTO memory_rankings (
          id, school_year_id, ranking_type, standings, snapshot_date
        ) VALUES (?, ?, ?, ?, ?)
      `);
      rankings.forEach((r, idx) => {
        insertRanking.run(
          r.id || `rnk-${yearId}-${r.rankingType || idx + 1}`,
          yearId,
          r.rankingType || 'students',
          JSON.stringify(r.standings || []),
          r.snapshotDate || year.endDate || '2026-10-31'
        );
      });

      // 8. Insert Plebiscites if any
      const insertPlebiscite = db.prepare(`
        INSERT INTO memory_plebiscites (
          id, school_year_id, title, edition, description, categories
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      plebiscites.forEach((pl, idx) => {
        insertPlebiscite.run(
          pl.id || `pleb-${yearId}-${idx + 1}`,
          yearId,
          pl.title || 'Lodowe Sople',
          pl.edition || '',
          pl.description || '',
          JSON.stringify(pl.categories || [])
        );
      });

      // 9. Insert Chronicle Events if any
      const insertChronicle = db.prepare(`
        INSERT INTO memory_chronicle_events (
          id, school_year_id, title, category, date, description,
          results, linked_diploma_ids, tags, image_url, order_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      chronicleEvents.forEach((ev, idx) => {
        insertChronicle.run(
          ev.id || `chr-${yearId}-${idx + 1}`,
          yearId,
          ev.title,
          ev.category || 'wydarzenie',
          ev.date || year.startDate || '2026-09-01',
          ev.description || '',
          JSON.stringify(ev.results || []),
          JSON.stringify(ev.linkedDiplomaIds || []),
          JSON.stringify(ev.tags || []),
          ev.imageUrl || '',
          ev.orderIndex || (idx + 1)
        );
      });

      // 10. Audit Log
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, admin, action, detail)
        VALUES (?, datetime('now'), ?, 'MEMORY_YEAR_PUBLISHED', ?)
      `).run(uuidv4(), adminName, `Opublikowano archiwum roku ${year.name} (${year.yearCode}) w Izbie Pamięci.`);
    });

    runTransaction();

    console.log(`[Memory] Successfully published archive for year: ${year.name}`);
    res.json({ success: true, yearId, message: `Archiwum ${year.name} zostało pomyślnie opublikowane w Izbie Pamięci.` });
  } catch (err) {
    console.error('[Memory] Publish archive error:', err);
    res.status(500).json({ error: 'Nie udało się opublikować archiwum roku' });
  }
});

// =========================================================================
// 3. CMS SINGLE ENTITY CRUD (ADMIN)
// =========================================================================

/**
 * POST /api/memory/certificates
 * Add single certificate manually.
 */
router.post('/certificates', authenticateToken, requireAdmin, (req, res) => {
  try {
    const cert = req.body;
    const id = cert.id || `cert-man-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO memory_certificates (
        id, school_year_id, user_id, student_name, house, class_year,
        document_number, issue_date, final_evaluation, subjects_grades,
        exam_results, average_score, authority_name, authority_title,
        seal_type, visibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, cert.schoolYearId, cert.userId || '', cert.studentName,
      cert.house || 'ravnheim', cert.classYear || 'Klasa II',
      cert.documentNumber || `TMD/SW/MAN/${Date.now().toString().slice(-4)}`,
      cert.issueDate || new Date().toISOString().split('T')[0],
      cert.finalEvaluation || 'Wybitny',
      JSON.stringify(cert.subjectsGrades || []),
      JSON.stringify(cert.examResults || []),
      cert.averageScore || 5.0,
      cert.authorityName || 'Arcymistrz Valdemar Krag-Hansen',
      cert.authorityTitle || 'Dyrektor Cytadeli Durmstrang',
      cert.sealType || 'gold_wolf',
      cert.visibility || 'public'
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error('[Memory] Add cert error:', err);
    res.status(500).json({ error: 'Błąd dodawania świadectwa' });
  }
});

/**
 * DELETE /api/memory/certificates/:id
 */
router.delete('/certificates/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare(`DELETE FROM memory_certificates WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania świadectwa' });
  }
});

/**
 * POST /api/memory/diplomas
 * Add single diploma manually.
 */
router.post('/diplomas', authenticateToken, requireAdmin, (req, res) => {
  try {
    const dipl = req.body;
    const id = dipl.id || `dip-man-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO memory_diplomas (
        id, school_year_id, user_id, recipient_name, house, category,
        title, place, description, issuer, date, badge_icon, image_url, visibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, dipl.schoolYearId, dipl.userId || '', dipl.recipientName,
      dipl.house || 'ravnheim', dipl.category || 'turniej',
      dipl.title, dipl.place || 'I', dipl.description || '',
      dipl.issuer || 'Dyrekcja Cytadeli', dipl.date || new Date().toISOString().split('T')[0],
      dipl.badgeIcon || '📜', dipl.imageUrl || '', dipl.visibility || 'public'
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error('[Memory] Add diploma error:', err);
    res.status(500).json({ error: 'Błąd dodawania dyplomu' });
  }
});

/**
 * DELETE /api/memory/diplomas/:id
 */
router.delete('/diplomas/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare(`DELETE FROM memory_diplomas WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania dyplomu' });
  }
});

/**
 * POST /api/memory/awards
 * Add single award.
 */
router.post('/awards', authenticateToken, requireAdmin, (req, res) => {
  try {
    const aw = req.body;
    const id = aw.id || `aw-man-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO memory_awards (
        id, school_year_id, user_id, recipient_name, house,
        award_type, title, description, icon, visibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, aw.schoolYearId, aw.userId || '', aw.recipientName,
      aw.house || '', aw.awardType || 'specjalne', aw.title,
      aw.description || '', aw.icon || '⭐', aw.visibility || 'public'
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Błąd dodawania wyróżnienia' });
  }
});

/**
 * DELETE /api/memory/awards/:id
 */
router.delete('/awards/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare(`DELETE FROM memory_awards WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania wyróżnienia' });
  }
});

/**
 * POST /api/memory/custom-achievements
 */
router.post('/custom-achievements', authenticateToken, requireAdmin, (req, res) => {
  try {
    const ach = req.body;
    const id = ach.id || `ach-man-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO memory_custom_achievements (
        id, school_year_id, title, recipient_name, house, description, category, date, image_url, icon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, ach.schoolYearId, ach.title, ach.recipientName,
      ach.house || '', ach.description, ach.category || 'Zasługa dla Twierdzy',
      ach.date || new Date().toISOString().split('T')[0],
      ach.imageUrl || '', ach.icon || '🛡️'
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Błąd dodawania osiągnięcia' });
  }
});

/**
 * DELETE /api/memory/custom-achievements/:id
 */
router.delete('/custom-achievements/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare(`DELETE FROM memory_custom_achievements WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania osiągnięcia' });
  }
});

export default router;
