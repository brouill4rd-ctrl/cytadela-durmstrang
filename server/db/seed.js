import db from './connection.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { SEED_LOCATIONS } from '../seed/locationsData.js';
import { WORLD_SEED_LOCATIONS } from '../seed/worldLocationsData.js';
import { validatePassword } from '../utils/passwordPolicy.js';

export function runSeed() {
// ===================== SEED DATA =====================

// Wersja sesji pozwala natychmiast unieważnić aktywne JWT po zmianie hasła.
try {
  const userColumns = db.pragma('table_info(users)');
  if (!userColumns.some(column => column.name === 'session_version')) {
    db.exec('ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;');
  }
} catch (error) {
  throw new Error(`Nie udało się dodać wersjonowania sesji użytkowników: ${error.message}`);
}

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
const demoSeedEnabled = String(process.env.SEED_DEMO_USERS || '').toLowerCase() === 'true';

if (demoSeedEnabled && userCount === 0) {
  console.log('[DB] Seeding initial users...');

  const demoPassword = process.env.DEV_SEED_PASSWORD || '';
  const demoPasswordCheck = validatePassword(demoPassword);
  if (!demoPasswordCheck.valid) {
    throw new Error(`SEED_DEMO_USERS wymaga bezpiecznego DEV_SEED_PASSWORD. ${demoPasswordCheck.error}`);
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, email, name, surname, full_name, role, status, house, title, avatar, department, department_name, default_banner_category, office, specialization, class_year, origin, level, xp, next_level_xp, points, currency, wand, patronus, companion, appearance, backstory, taught_subject_ids, grades, inventory, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const DEFAULT_HASH = bcrypt.hashSync(demoPassword, 12);

  // Valdemar (Student)
  insertUser.run(
    'usr-valdemar', 'valdemar', DEFAULT_HASH, 'valdemar@nordic.no',
    'Valdemar', 'Krag-Hansen', 'Valdemar Krag-Hansen',
    'student', 'approved', 'ravnheim',
    'Adept Drugiego Kręgu Ravnheim',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    null, null, null, null, null,
    'Rok IV • Semestr Zimowy', 'Trondheim, Północne Fiordy',
    4, 840, 1200, 115, 340,
    'Czarne Drzewo Cisowe, Włókno Serca Wilka Lodowcowego, 12¾ cala, Sztywna',
    'Puchacz Śnieżny (Bubo scandiacus)', 'Puchacz Śnieżny (Hugin)',
    'Wysoki adept w opończy ze srebrzystego wilczego futra z rodowym sygnetem Ravnheim.',
    'Pochodzi ze starego skandynawskiego rodu badaczy run i pieczęci cienia.',
    '[]',
    JSON.stringify([
      { subjectId: 'czarna-magia', subjectName: 'Czarna Magia', lessonTitle: 'Wiązanie Cieni', grade: 'Wybitny (W)', professor: '' },
      { subjectId: 'starozytne-runy', subjectName: 'Starożytne Runy', lessonTitle: 'Futhark Starszy', grade: 'Powyżej Oczekiwań (P)', professor: '' },
      { subjectId: 'klatwy-i-uroki', subjectName: 'Klątwy i Magia Bojowa', lessonTitle: 'Tarcza Żelaza', grade: 'Wybitny (W)', professor: '' }
    ]),
    JSON.stringify([
      { id: 'item-1', name: 'Zimowa Opończa z Wilczym Kołnierzem', category: 'robes', rarity: 'rare', icon: '🧥', price: 150 },
      { id: 'item-2', name: 'Różdżka Cisowa (Wilcze Serce)', category: 'wands', rarity: 'epic', icon: '🪄', price: 280 },
      { id: 'item-3', name: 'Grimuar: Rytuały Ciemnego Przesilenia', category: 'grimoires', rarity: 'legendary', icon: '📖', price: 450 }
    ]),
    '2026-08-01'
  );

  // Prof. Morana Vane
  insertUser.run(
    'usr-morana', 'morana', DEFAULT_HASH, 'morana@durmstrang.edu',
    'Morana', 'Vane', '',
    'professor', 'approved', 'ravnheim',
    'Opiekunka Zakonu Ravnheim • Katedra Czarnej Magii',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    'czarna-magia', 'Czarna Magia & Klątwy', 'czarna-magia',
    'Wieża Nocnych Szeptów, Sala Cienia IV',
    'Nekromancja Północna, Pętanie Eteryczne i Wiązanie Cieni',
    null, null, 1, 0, 500, 0, 0, null, null, null, null, null,
    JSON.stringify(['czarna-magia', 'psychologia-magiczna']),
    '[]', '[]', '2026-07-15'
  );

  // Prof. Gunnar Vargson
  insertUser.run(
    'usr-gunnar', 'gunnar', DEFAULT_HASH, 'gunnar@durmstrang.edu',
    'Gunnar', 'Vargson', '',
    'professor', 'approved', 'bjornhall',
    'Mistrz Szermierki Runicznej • Opiekun Zakonu Björnhall',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'liga-bojowa', 'Liga Bojowa & Hólmganga', 'liga-bojowa',
    'Twierdza Żelaznego Kręgu, Zbrojownia Północy',
    'Magia Bojowa, Tarcze Runiczne i Pojedynki Lodowe',
    null, null, 1, 0, 500, 0, 0, null, null, null, null, null,
    JSON.stringify(['klatwy-i-uroki', 'zielarstwo']),
    '[]', '[]', '2026-07-20'
  );


  // Arcymistrzyni Valgerda Storm
  insertUser.run(
    'usr-valgerda', 'valgerda', DEFAULT_HASH, 'valgerda@durmstrang.edu',
    'Valgerda', 'Storm', 'Arcymistrzyni Valgerda Storm',
    'admin', 'approved', null,
    'Arcymistrzyni Cytadeli Durmstrang • Strażniczka Paktu 1294',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    'edykty', 'Rada Dyrekcji Twierdzy', 'edykty',
    'Komnaty Najwyższej Wieży Durmstrang',
    'Najwyższa Magia Północy, Starożytne Pieczęcie i Prawa Cytadeli',
    null, null, 1, 0, 500, 0, 0, null, null, null, null, null,
    '[]', '[]', '[]', '2026-06-01'
  );

  // Seed welcome email for Valdemar
  db.prepare(`
    INSERT INTO emails (id, to_email, to_name, from_addr, from_name, subject, date, read, type, body)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'mail-welcome-valdemar',
    'valdemar@nordic.no', 'Valdemar Krag-Hansen',
    'dyrekcja@durmstrang.edu', 'Arcymistrzyni Valgerda Storm',
    '[DURMSTRANG] Oficjalny Dekret Przyjęcia do Cytadeli Durmstrang',
    '2026-08-01 09:00', 1, 'acceptance',
    `Szanowny Adepcie Valdemarze Krag-Hansen,

Z upoważnienia Rady Mistrzów Cytadeli Durmstrang mamy zaszczyt poinformować, że Twoje podanie rekrutacyjne zostało oficjalnie ROZPATRZONE POZYTYWNIE.

Twoja tożsamość została wpisana do Wiecznej Księgi Paktu 1294. Zgłoś się do Wielkiej Sali Hrafnhöll na Ceremonię Przydziału przed Kamieniem Przysięgi.

Z magicznym pozdrowieniem,
Arcymistrzyni Valgerda Storm
Dyrektor Cytadeli Durmstrang`
  );

  console.log('[DB] Seeded users + welcome email.');
}

// Konto administratora powstaje wyłącznie z jednorazowych sekretów bootstrap.
// Po utworzeniu konta BOOTSTRAP_ADMIN_PASSWORD należy usunąć ze środowiska.
const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
const bootstrapUsername = String(process.env.BOOTSTRAP_ADMIN_USERNAME || '').trim().toLowerCase();
const bootstrapPassword = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || '');
const bootstrapEmail = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
const bootstrapFullName = String(process.env.BOOTSTRAP_ADMIN_FULL_NAME || '').trim();
const bootstrapConfigured = Boolean(bootstrapUsername && bootstrapPassword && bootstrapEmail && bootstrapFullName);

if (adminCount === 0 && bootstrapConfigured) {
  const passwordCheck = validatePassword(bootstrapPassword);
  if (!passwordCheck.valid) throw new Error(`BOOTSTRAP_ADMIN_PASSWORD: ${passwordCheck.error}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bootstrapEmail)) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL nie jest poprawnym adresem e-mail.');
  }
  const [bootstrapName, ...bootstrapSurnameParts] = bootstrapFullName.split(/\s+/);
  const bootstrapSurname = bootstrapSurnameParts.join(' ') || 'Administrator';
  db.prepare(`
    INSERT INTO users (id, username, password, email, name, surname, full_name, role, status, house, title, avatar, department, department_name, default_banner_category, office, specialization, class_year, origin, level, xp, next_level_xp, points, currency, wand, patronus, companion, appearance, backstory, taught_subject_ids, grades, inventory, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `usr-admin-${randomUUID()}`, bootstrapUsername, bcrypt.hashSync(bootstrapPassword, 12), bootstrapEmail,
    bootstrapName, bootstrapSurname, bootstrapFullName,
    'admin', 'approved', null,
    'Arcymistrz Cytadeli',
    '', null, null, null, null, null,
    null, null,
    1, 0, 500, 0, 150,
    null, null, null, null, null,
    '[]', '[]', '[]',
    new Date().toISOString().split('T')[0]
  );
  console.log(`[DB] Utworzono konto administratora bootstrap: ${bootstrapUsername}.`);
} else if (adminCount === 0 && process.env.NODE_ENV === 'production') {
  throw new Error('Brak administratora. Ustaw jednorazowo BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_EMAIL i BOOTSTRAP_ADMIN_FULL_NAME.');
}

// Starsze instalacje mogły zawierać konta z hasłami demonstracyjnymi. W
// produkcji serwer nie wystartuje, dopóki nie zostaną bezpiecznie obrócone.
const knownWeakPasswords = ['123', 'admin123'];
const weakAccounts = db.prepare("SELECT id, username, password FROM users WHERE status = 'approved'").all()
  .filter(user => knownWeakPasswords.some(password => bcrypt.compareSync(password, user.password)));
const rotateWeakPasswords = ['1', 'true', 'yes', 'on'].includes(String(process.env.ROTATE_WEAK_PASSWORDS || '').toLowerCase());

if (weakAccounts.length > 0) {
  if (rotateWeakPasswords) {
    db.transaction(() => {
      const update = db.prepare('UPDATE users SET password = ?, session_version = session_version + 1 WHERE id = ?');
      weakAccounts.forEach(user => {
        const uniqueRandomPassword = `${randomUUID()}${randomUUID()}`;
        update.run(bcrypt.hashSync(uniqueRandomPassword, 12), user.id);
      });
    })();
    console.warn(`[DB] Unieważniono znane słabe hasła dla ${weakAccounts.length} kont. Użytkownicy muszą ustawić nowe hasła przez odzyskiwanie konta lub administratora.`);
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error(`Wykryto ${weakAccounts.length} kont ze znanym słabym hasłem. Ustaw jednorazowo ROTATE_WEAK_PASSWORDS=true, aby je unieważnić przy starcie.`);
  } else {
    console.warn(`[DB] Wykryto ${weakAccounts.length} kont ze znanym słabym hasłem. Przed produkcją ustaw jednorazowo ROTATE_WEAK_PASSWORDS=true.`);
  }
}

// Seed default school config
const configCount = db.prepare('SELECT COUNT(*) as count FROM school_config').get().count;
if (configCount === 0) {
  const insertConfig = db.prepare('INSERT INTO school_config (key, value) VALUES (?, ?)');
  insertConfig.run('school_year', 'XIX Rok Szkolny (2026/2027)');
  insertConfig.run('current_term', 'Semestr Zimowy');
  insertConfig.run('term_start', '2026-08-01');
  insertConfig.run('term_end', '2027-06-30');
  insertConfig.run('base_reinhall_points', '0');
  insertConfig.run('base_bjornhall_points', '0');
  insertConfig.run('base_ravnheim_points', '0');
  insertConfig.run('base_otergard_points', '0');
}

// Every edition starts from zero. Existing installations are normalized too,
// so a legacy configured balance can never bypass the point ledger.
const zeroBasePoints = db.prepare(`
  INSERT INTO school_config (key, value) VALUES (?, '0')
  ON CONFLICT(key) DO UPDATE SET value = '0'
`);
for (const key of ['base_reinhall_points', 'base_bjornhall_points', 'base_ravnheim_points', 'base_otergard_points']) {
  zeroBasePoints.run(key);
}
db.prepare('UPDATE houses SET starting_points = 0 WHERE starting_points != 0').run();

// Seed default bot config
const botConfigCount = db.prepare('SELECT COUNT(*) as count FROM discord_bot_config').get().count;
if (botConfigCount === 0) {
  db.prepare(`
    INSERT INTO discord_bot_config (id, bot_token, guild_id, lessons_channel_id, is_active, webhook_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'bot-default',
    'BOT_TOKEN_DISCORD_DURMSTRANG_SECRET',
    '112233445566778899',
    '998877665544332211',
    1,
    'https://discord.com/api/webhooks/lessons-archive'
  );
}

// Seed default exam grading scale
const gradingScaleCount = db.prepare('SELECT COUNT(*) as count FROM exam_grading_scales').get().count;
if (gradingScaleCount === 0) {
  const scaleId = 'scale-durmstrang-default';
  db.prepare('INSERT INTO exam_grading_scales (id, name, is_default, created_by) VALUES (?, ?, 1, ?)').run(
    scaleId, 'Skala Ocen Cytadeli Durmstrang', 'system'
  );
  const insertEntry = db.prepare('INSERT INTO exam_grading_scale_entries (id, scale_id, name, abbreviation, min_percent, max_percent, is_passing, sort_order, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertEntry.run('gse-troll', scaleId, 'Troll', 'T', 0, 39.99, 0, 1, '#ef4444');
  insertEntry.run('gse-nedzny', scaleId, 'Nędzny', 'N', 40, 54.99, 1, 2, '#f97316');
  insertEntry.run('gse-zadowalajacy', scaleId, 'Zadowalający', 'Z', 55, 69.99, 1, 3, '#3b82f6');
  insertEntry.run('gse-powyzej', scaleId, 'Powyżej Oczekiwań', 'PO', 70, 84.99, 1, 4, '#10b981');
  insertEntry.run('gse-wybitny', scaleId, 'Wybitny', 'W', 85, 100, 1, 5, '#eab308');
  console.log('[DB] Seeded default exam grading scale.');
}

// Seed default discord role mappings
const roleMappingsCount = db.prepare('SELECT COUNT(*) as count FROM discord_role_mappings').get().count;
if (roleMappingsCount === 0) {
  const insertRoleMapping = db.prepare(`
    INSERT OR IGNORE INTO discord_role_mappings (id, category, internal_key, role_label, discord_role_id, discord_role_name, color, auto_assign)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultRoleMappings = [
    // Houses
    ['map-house-reinhall', 'house', 'reinhall', 'Zakon Reinhall (Jeleń)', '', '🦌 Reinhall', '#a8384b', 1],
    ['map-house-bjornhall', 'house', 'bjornhall', 'Zakon Björnhall (Niedźwiedź)', '', '🐻 Björnhall', '#5b8aaf', 1],
    ['map-house-ravnheim', 'house', 'ravnheim', 'Zakon Ravnheim (Kruk)', '', '🐦 Ravnheim', '#7a6ea0', 1],
    ['map-house-otergard', 'house', 'otergard', 'Zakon Otergard (Wydra)', '', '🦦 Otergard', '#3aaa9f', 1],
    // Ranks / Roles
    ['map-role-student', 'role', 'student', 'Adept Cytadeli (Uczeń)', '', '📜 Adept Cytadeli', '#94a3b8', 1],
    ['map-role-prefect', 'role', 'prefect', 'Strażnik Zakonu', '', '🛡️ Strażnik Zakonu', '#38bdf8', 1],
    ['map-role-professor', 'role', 'professor', 'Profesor / Mistrz Katedry', '', '🧙‍♂️ Profesor', '#f59e0b', 1],
    ['map-role-teacher', 'role', 'teacher', 'Profesor Katedry', '', '🧙‍♂️ Profesor', '#f59e0b', 1],
    ['map-role-headmaster', 'role', 'headmaster', 'Dyrekcja Cytadeli', '', '👑 Dyrekcja Cytadeli', '#fcd34d', 1],
    ['map-role-deputy', 'role', 'deputy_headmaster', 'Wicedyrektor Cytadeli', '', '👑 Dyrekcja Cytadeli', '#fcd34d', 1],
    ['map-role-admin', 'role', 'admin', 'Rada Arcymistrzów', '', '⚡ Rada Arcymistrzów', '#ef4444', 1],
    // Class Years
    ['map-class-1', 'class_year', 'klasa_1', 'Klasa I (I Rok Adeptów)', '', 'I Rok', '#64748b', 1],
    ['map-class-2', 'class_year', 'klasa_2', 'Klasa II (II Rok Adeptów)', '', 'II Rok', '#64748b', 1],
    ['map-class-3', 'class_year', 'klasa_3', 'Klasa III (III Rok Adeptów)', '', 'III Rok', '#64748b', 1],
    ['map-class-4', 'class_year', 'klasa_4', 'Klasa IV (IV Rok Adeptów)', '', 'IV Rok', '#64748b', 1],
    // General
    ['map-gen-verified', 'general', 'verified', 'Zweryfikowany Adept', '', '✨ Zweryfikowany', '#10b981', 1]
  ];

  for (const m of defaultRoleMappings) {
    insertRoleMapping.run(...m);
  }
}

// ===================== MIGRACJA: HASHOWANIE HASEŁ =====================
// Jednorazowe - hashuje hasła które nie są jeszcze bcrypt hashami
{
  const plainUsers = db.prepare("SELECT id, password FROM users WHERE password NOT LIKE '$2%'").all();
  if (plainUsers.length > 0) {
    console.log(`[DB] Migracja: hashowanie ${plainUsers.length} haseł bcrypt...`);
    const updatePwd = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    for (const u of plainUsers) {
      updatePwd.run(bcrypt.hashSync(u.password, 12), u.id);
    }
    console.log('[DB] Migracja haseł zakończona.');
  }
}

// Seed initial lessons and point transactions
const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons').get().count;
if (false && lessonCount === 0) {
  console.log('[DB] Seeding lessons, thread messages and point ledger...');

  const insertLesson = db.prepare(`
    INSERT INTO lessons (id, subject_id, subject_name, class_year, topic, description, professor_id, professor_name, professor_avatar, date, status, discord_thread_id, discord_channel_id, discord_guild_id, discord_thread_url, total_points, participants_count, created_at, updated_at, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMessage = db.prepare(`
    INSERT INTO lesson_messages (id, lesson_id, discord_message_id, discord_user_id, author_name, author_display_name, author_avatar, author_house, content, timestamp, order_index, reply_to_id, reply_to_author, reply_to_content, is_bot, is_system, is_command, command_data, embeds, reactions, attachments, is_edited, edit_history, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertParticipant = db.prepare(`
    INSERT INTO lesson_participants (id, lesson_id, student_id, student_name, house, is_present, points_awarded, comment, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPointTx = db.prepare(`
    INSERT INTO point_transactions (id, student_id, student_name, house, points, source, lesson_id, professor_id, professor_name, date, comment, is_revoked, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ==================== LEKCJA 1: ELIKSIRY - ELIKSIR WIGGENOWY ====================
  const lesson1Id = 'les-eliksiry-wiggen-2026';
  insertLesson.run(
    lesson1Id,
    'eliksiry',
    'Eliksiry',
    'Klasa II',
    'Eliksir Wiggenowy — Stabilizacja i Warzenie Północne',
    'Podczas zajęć adepci poznali arktyczną odmianę Eliksiru Wiggenowego z dodatkiem kory jarzębiny śnieżnej oraz śluzu żądłoskoczka tundrowego. Przeanalizowano proces neutralizacji toksyn i szybką regenerację ran ciętych.',
    'usr-astrid-vinter',
    '',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    '2026-08-22',
    'published',
    'thread-120894719283719',
    'chan-eliksiry-88910',
    'guild-durmstrang-1294',
    'https://discord.com/channels/guild-durmstrang-1294/chan-eliksiry-88910/thread-120894719283719',
    35,
    3,
    '2026-08-22 18:30:00',
    '2026-08-22 19:45:00',
    '2026-08-22 19:50:00'
  );

  // Uczestnicy Lekcji 1
  insertParticipant.run('part-1-1', lesson1Id, 'usr-astrid-stud', 'Astrid Vinter', 'reinhall', 1, 15, 'Wybitna aktywność i perfekcyjne określenie proporcji kory jarzębiny.', 'student');
  insertParticipant.run('part-1-2', lesson1Id, 'usr-erik', 'Erik Nilsen', 'bjornhall', 1, 10, 'Prawidłowe rozpoznanie właściwości bezoaru i aktywny udział w quizie.', 'student');
  insertParticipant.run('part-1-3', lesson1Id, 'usr-freja', 'Freja Lund', 'ravnheim', 1, 10, 'Wzorowa obecność i trafna odpowiedź na pytanie o temperaturę chłodzenia.', 'student');

  // Wiadomości Lekcji 1 (Bogate archiwum wątku)
  const msgs1 = [
    {
      id: 'msg-les1-1',
      discordId: 'dmsg-1001',
      userId: 'usr-astrid-vinter',
      authorName: 'Astrid Vinter',
      authorDisplayName: '',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'reinhall',
      content: 'Rozpoczynamy zajęcia z Eliksirów. Kociołki z białego żelaza na paleniska. Dziś omawiamy stabilizację Eliksiru Wiggenowego w warunkach północnych.',
      timestamp: '2026-08-22 18:32:10',
      orderIndex: 1,
      replyToId: '', replyToAuthor: '', replyToContent: '',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '🔥', count: 5, users: ['Erik Nilsen', 'Freja Lund', 'Valdemar Krag-Hansen'] }, { emoji: '🦌', count: 3, users: ['Astrid Vinter'] }]),
      attachments: '[]',
      isEdited: 0, editHistory: '[]', isDeleted: 0
    },
    {
      id: 'msg-les1-2',
      discordId: 'dmsg-1002',
      userId: 'usr-astrid-vinter',
      authorName: 'Astrid Vinter',
      authorDisplayName: '',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'reinhall',
      content: 'Spójrzcie na rycinę preparatu. Czy ktoś potrafi wskazać, który składnik stabilizuje wywar przed wrzeniem?',
      timestamp: '2026-08-22 18:35:00',
      orderIndex: 2,
      replyToId: '', replyToAuthor: '', replyToContent: '',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '❤️', count: 6, users: ['Astrid Vinter', 'Erik Nilsen', 'Freja Lund'] }, { emoji: '🦌', count: 3, users: ['Astrid Vinter'] }]),
      attachments: JSON.stringify([
        {
          id: 'att-1',
          name: 'wiggenweld_herbs_diagram.png',
          mimeType: 'image/png',
          size: 245100,
          originalUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=800&auto=format&fit=crop&q=80',
          storageUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=800&auto=format&fit=crop&q=80',
          width: 800,
          height: 533,
          author: '',
          messageId: 'dmsg-1002'
        }
      ]),
      isEdited: 0, editHistory: '[]', isDeleted: 0
    },
    {
      id: 'msg-les1-3',
      discordId: 'dmsg-1003',
      userId: 'usr-erik',
      authorName: 'Erik Nilsen',
      authorDisplayName: 'Erik Nilsen (Björnhall)',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'bjornhall',
      content: 'Kora jarzębiny arktycznej, starta na miedzianej tarce pod kątem prostym?',
      timestamp: '2026-08-22 18:37:12',
      orderIndex: 3,
      replyToId: 'dmsg-1002',
      replyToAuthor: '',
      replyToContent: 'Czy ktoś potrafi wskazać, który składnik stabilizuje wywar przed wrzeniem?',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '👍', count: 4, users: ['', 'Freja Lund'] }, { emoji: '🐻', count: 2, users: ['Erik Nilsen'] }]),
      attachments: '[]',
      isEdited: 0, editHistory: '[]', isDeleted: 0
    },
    {
      id: 'msg-les1-4',
      discordId: 'dmsg-1004',
      userId: 'usr-astrid-stud',
      authorName: 'Astrid Vinter (Adept)',
      authorDisplayName: 'Astrid Vinter [Reinhall]',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'reinhall',
      content: 'I dodatkowo śluz żądłoskoczka tundrowego, dodany dokładnie po siódmym obrocie przeciwnie do wskazówek zegara.',
      timestamp: '2026-08-22 18:39:40',
      orderIndex: 4,
      replyToId: 'dmsg-1003',
      replyToAuthor: 'Erik Nilsen',
      replyToContent: 'Kora jarzębiny arktycznej, starta na miedzianej tarce pod kątem prostym?',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '✨', count: 5, users: [''] }, { emoji: '🦌', count: 4, users: ['Astrid Vinter'] }]),
      attachments: '[]',
      isEdited: 0, editHistory: '[]', isDeleted: 0
    },
    {
      id: 'msg-les1-5',
      discordId: 'dmsg-1005',
      userId: 'usr-bot-cytadela',
      authorName: 'TMD Bot',
      authorDisplayName: 'TMD Bot',
      authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      authorHouse: '',
      content: '',
      timestamp: '2026-08-22 18:41:00',
      orderIndex: 5,
      replyToId: '', replyToAuthor: '', replyToContent: '',
      isBot: 1, isSystem: 0, isCommand: 1,
      commandData: JSON.stringify({
        name: '/quiz',
        author: '',
        params: { temat: 'Eliksiry Klasa II', pytania: 1 },
        result: 'Rozpoczęto oficjalny błyskawiczny quiz alchemiczny Katedry.'
      }),
      embeds: JSON.stringify([
        {
          title: '⚗️ QUIZ ELIKSIRÓW — Katedra Alchemii i Warzenia',
          description: 'Który składnik stabilizuje Eliksir Wiggenowy i zapobiega jego gwałtownej krystalizacji w temperaturze poniżej zera?',
          color: '#c59f4e',
          author: { name: 'Katedra Eliksirów Cytadeli', icon_url: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=100&auto=format&fit=crop&q=80' },
          fields: [
            { name: 'Opcja A', value: 'Sproszkowany Pazur Gryfa', inline: true },
            { name: 'Opcja B', value: 'Kora Jarzębiny Arktycznej & Śluz', inline: true },
            { name: 'Opcja C', value: 'Krew Salamandry Ognistej', inline: true }
          ],
          footer: { text: 'Odpowiedz wpisując wybraną opcję • Czas: 120s' },
          timestamp: '2026-08-22T18:41:00.000Z'
        }
      ]),
      reactions: JSON.stringify([{ emoji: '🇧', count: 3, users: ['Astrid Vinter', 'Erik Nilsen', 'Freja Lund'] }]),
      attachments: '[]',
      isEdited: 0, editHistory: '[]', isDeleted: 0
    },
    {
      id: 'msg-les1-6',
      discordId: 'dmsg-1006',
      userId: 'usr-freja',
      authorName: 'Freja Lund',
      authorDisplayName: 'Freja Lund [Ravnheim]',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'ravnheim',
      content: 'Opcja B! Bez kory jarzębiny wywar rozwarstwiłby się przy próbie ostudzenia śniegiem.',
      timestamp: '2026-08-22 18:42:15',
      orderIndex: 6,
      replyToId: 'dmsg-1005',
      replyToAuthor: 'TMD Bot',
      replyToContent: 'QUIZ ELIKSIRÓW: Który składnik stabilizuje Eliksir Wiggenowy...',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '🐦', count: 4, users: ['Freja Lund', 'Valdemar Krag-Hansen'] }, { emoji: '⭐', count: 3, users: [''] }]),
      attachments: '[]',
      isEdited: 0, editHistory: '[]', isDeleted: 0
    },
    {
      id: 'msg-les1-7',
      discordId: 'dmsg-1007',
      userId: 'usr-erik',
      authorName: 'Erik Nilsen',
      authorDisplayName: 'Erik Nilsen [Björnhall]',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'bjornhall',
      content: 'Przepraszam, pomyliłem kociołki.',
      timestamp: '2026-08-22 18:44:00',
      orderIndex: 7,
      replyToId: '', replyToAuthor: '', replyToContent: '',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: '[]',
      attachments: '[]',
      isEdited: 0, editHistory: '[]', isDeleted: 1 // Deleted message demo
    },
    {
      id: 'msg-les1-8',
      discordId: 'dmsg-1008',
      userId: 'usr-astrid-vinter',
      authorName: 'Astrid Vinter',
      authorDisplayName: '',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'reinhall',
      content: 'Znakomicie. Wszyscy wykazali się należytą wiedzą. Wygaszamy paleniska, zlewamy próbki do flakonów z pieczęcią. Lekcja zakończona.',
      timestamp: '2026-08-22 18:48:50',
      orderIndex: 8,
      replyToId: '', replyToAuthor: '', replyToContent: '',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '👏', count: 6, users: ['Astrid Vinter', 'Erik Nilsen', 'Freja Lund'] }, { emoji: '🏰', count: 4, users: [''] }]),
      attachments: '[]',
      isEdited: 1,
      editHistory: JSON.stringify([{ content: 'Wygaszamy paleniska. Lekcja zakończona.', timestamp: '2026-08-22 18:47:00' }]),
      isDeleted: 0
    }
  ];

  for (const m of msgs1) {
    insertMessage.run(
      m.id, lesson1Id, m.discordId, m.userId, m.authorName, m.authorDisplayName,
      m.authorAvatar, m.authorHouse, m.content, m.timestamp, m.orderIndex,
      m.replyToId, m.replyToAuthor, m.replyToContent, m.isBot, m.isSystem,
      m.isCommand, m.commandData, m.embeds, m.reactions, m.attachments,
      m.isEdited, m.editHistory, m.isDeleted
    );
  }

  // Wpisy do Księgi Transakcji Punktowych (Single Source of Truth) dla Lekcji 1
  insertPointTx.run('tx-1-1', 'usr-astrid-stud', 'Astrid Vinter', 'reinhall', 15, 'Eliksiry — Eliksir Wiggenowy', lesson1Id, 'usr-astrid-vinter', '', '2026-08-22', 'Wybitna aktywność', 0, '2026-08-22 19:50:00');
  insertPointTx.run('tx-1-2', 'usr-erik', 'Erik Nilsen', 'bjornhall', 10, 'Eliksiry — Eliksir Wiggenowy', lesson1Id, 'usr-astrid-vinter', '', '2026-08-22', 'Aktywny udział w dyskusji', 0, '2026-08-22 19:50:00');
  insertPointTx.run('tx-1-3', 'usr-freja', 'Freja Lund', 'ravnheim', 10, 'Eliksiry — Eliksir Wiggenowy', lesson1Id, 'usr-astrid-vinter', '', '2026-08-22', 'Prawidłowa odpowiedź w quizie', 0, '2026-08-22 19:50:00');

  // ==================== LEKCJA 2: CZARNA MAGIA - WIĄZANIE CIENI ====================
  const lesson2Id = 'les-czarna-magia-cienie-2026';
  insertLesson.run(
    lesson2Id,
    'czarna-magia',
    'Czarna Magia Północna',
    'Klasa IV',
    'Wiązanie Cieni i Eteryczne Pętanie Eirika',
    'Wprowadzenie do zaawansowanych technik manipulacji materią cienia. Analiza manuskryptu Mistrza Eirika Krwawego Rogu oraz ćwiczenie formowania eterycznych więzów ochronnych w mrozie.',
    'usr-morana',
    '',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    '2026-08-20',
    'published',
    'thread-120993847291028',
    'chan-czarna-magia-99120',
    'guild-durmstrang-1294',
    'https://discord.com/channels/guild-durmstrang-1294/chan-czarna-magia-99120/thread-120993847291028',
    45,
    3,
    '2026-08-20 20:00:00',
    '2026-08-20 21:15:00',
    '2026-08-20 21:20:00'
  );

  insertParticipant.run('part-2-1', lesson2Id, 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', 1, 20, 'Perfekcyjne opanowanie wiązania cieni i odczytanie manuskryptu.', 'student');
  insertParticipant.run('part-2-2', lesson2Id, 'usr-magnus', 'Magnus Blom', 'reinhall', 1, 15, 'Stabilna bariera cieniowa z krwawym rdzeniem.', 'student');
  insertParticipant.run('part-2-3', lesson2Id, 'usr-sigrun', 'Sigrun Lindqvist', 'otergard', 1, 10, 'Skuteczne rozproszenie anomalii lodowej.', 'student');

  const msgs2 = [
    {
      id: 'msg-les2-1',
      discordId: 'dmsg-2001',
      userId: 'usr-morana',
      authorName: 'Morana Vane',
      authorDisplayName: '',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'ravnheim',
      content: 'Gasimy znicze. Niech przemówi Wieża Nocnych Szeptów. Otwórzcie rozdział o Wiązaniu Cieni.',
      timestamp: '2026-08-20 20:02:10',
      orderIndex: 1,
      replyToId: '', replyToAuthor: '', replyToContent: '',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '🐦', count: 6, users: ['Valdemar Krag-Hansen', 'Sigrun Lindqvist'] }, { emoji: '🌑', count: 5, users: ['Magnus Blom'] }]),
      attachments: '[]',
      isEdited: 0, editHistory: '[]', isDeleted: 0
    },
    {
      id: 'msg-les2-2',
      discordId: 'dmsg-2002',
      userId: 'usr-valdemar',
      authorName: 'Valdemar Krag-Hansen',
      authorDisplayName: 'Valdemar [Ravnheim]',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'ravnheim',
      content: 'Profesor Vane, czy przy ujemnym kącie nachylenia różdżki więzy cienia czerpią energię z aury otoczenia?',
      timestamp: '2026-08-20 20:10:45',
      orderIndex: 2,
      replyToId: 'dmsg-2001',
      replyToAuthor: '',
      replyToContent: 'Gasimy znicze. Niech przemówi Wieża Nocnych Szeptów...',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '✨', count: 4, users: [''] }]),
      attachments: '[]',
      isEdited: 0, editHistory: '[]', isDeleted: 0
    }
  ];

  for (const m of msgs2) {
    insertMessage.run(
      m.id, lesson2Id, m.discordId, m.userId, m.authorName, m.authorDisplayName,
      m.authorAvatar, m.authorHouse, m.content, m.timestamp, m.orderIndex,
      m.replyToId, m.replyToAuthor, m.replyToContent, m.isBot, m.isSystem,
      m.isCommand, m.commandData, m.embeds, m.reactions, m.attachments,
      m.isEdited, m.editHistory, m.isDeleted
    );
  }

  insertPointTx.run('tx-2-1', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', 20, 'Czarna Magia — Wiązanie Cieni', lesson2Id, 'usr-morana', '', '2026-08-20', 'Wybitne opanowanie cieni', 0, '2026-08-20 21:20:00');
  insertPointTx.run('tx-2-2', 'usr-magnus', 'Magnus Blom', 'reinhall', 15, 'Czarna Magia — Wiązanie Cieni', lesson2Id, 'usr-morana', '', '2026-08-20', 'Stabilna bariera cieniowa', 0, '2026-08-20 21:20:00');
  insertPointTx.run('tx-2-3', 'usr-sigrun', 'Sigrun Lindqvist', 'otergard', 10, 'Czarna Magia — Wiązanie Cieni', lesson2Id, 'usr-morana', '', '2026-08-20', 'Rozproszenie anomalii', 0, '2026-08-20 21:20:00');

  console.log('[DB] Seeded initial lessons and point transactions.');
}

// ===================== SEED & SYNC SUBJECTS =====================

console.log('[DB] Synchronizing subjects (katedry)...');

const insertSubject = db.prepare(`
  INSERT INTO subjects (id, name, code, icon, category, description, classroom, professor_id, professor_name, banner_url, banner_gradient, syllabus, regulations, class_years, is_active, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

  const updateSubjectClassYears = db.prepare(`
    UPDATE subjects SET class_years = ?, sort_order = ? WHERE id = ?
  `);

  const insertGradeCat = db.prepare(`
    INSERT INTO grade_categories (id, subject_id, name, weight, icon, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertGrade = db.prepare(`
    INSERT INTO grades (id, subject_id, category_id, student_id, student_name, house, grade, grade_label, grade_value, title, comment, professor_id, professor_name, lesson_id, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const subjectsData = [
    // --- KLASA I (Fundamenty Magii) & KLASA I & II ---
    { id: 'zaklecia', name: 'Zaklęcia', code: 'SPELL-103', icon: '✨', category: 'Magia Praktyczna', description: 'Inkantacje manipulacji grawitacją, tworzenie ścieżek świetlnych i transgresja w zamieci.', classroom: 'Korytarz Wichrów', profId: '', profName: '', gradient: 'linear-gradient(135deg, #1a2030 0%, #060810 100%)', classYears: ['Klasa I'], sort: 1 },
    { id: 'transmutacja', name: 'Transmutacja', code: 'TRANS-104', icon: '🔮', category: 'Modyfikacja Materii', description: 'Krystalizacja cieczy, animacja kamiennych obelisków i kowalska transmutacja metali.', classroom: 'Wieża Krystalizacji', profId: '', profName: '', gradient: 'linear-gradient(135deg, #1a1428 0%, #060410 100%)', classYears: ['Klasa I'], sort: 2 },
    { id: 'eliksiry', name: 'Eliksiry', code: 'POT-105', icon: '🧪', category: 'Alchemia & Warzenie', description: 'Sztuka destylacji rzadkich esencji arktycznych, syntezy jadów lodowcowych i uniwersalnych odtrutek.', classroom: 'Laboratorium Lodowych Cieplic', profId: '', profName: '', gradient: 'linear-gradient(135deg, #0e1c30 0%, #04080e 100%)', classYears: ['Klasa I'], sort: 3 },
    { id: 'zielarstwo', name: 'Zielarstwo', code: 'HERB-106', icon: '🌿', category: 'Przyroda Magiczna', description: 'Hodowla mchu świetlistego, lodowej mandragory i korzeni yggdrasila karłowatego.', classroom: 'Szklarnie Wiecznej Zmarzliny', profId: '', profName: '', gradient: 'linear-gradient(135deg, #0e2216 0%, #030805 100%)', classYears: ['Klasa I'], sort: 4 },
    { id: 'magizoologia', name: 'Magizoologia', code: 'BEAST-107', icon: '🐺', category: 'Przyroda Magiczna', description: 'Badanie i oswajanie stworzeń arktycznych: smoków, wilków mroźnych, kelpie z fiordów i trolli górskich.', classroom: 'Wybiegi Skandynawskie i Zakazany Bór', profId: '', profName: '', gradient: 'linear-gradient(135deg, #1a2a1a 0%, #060a06 100%)', classYears: ['Klasa I'], sort: 5 },
    { id: 'obrona-przed-ciemnymi-mocami', name: 'Obrona przed Ciemnymi Mocami', code: 'DEF-108', icon: '🛡️', category: 'Obrona & Przetrwanie', description: 'Neutralizacja klątw, obrona przed istotami cmentarnymi i demonami mrozu.', classroom: 'Sala Skalistych Bastionów', profId: '', profName: '', gradient: 'linear-gradient(135deg, #18202c 0%, #06080e 100%)', classYears: ['Klasa I'], sort: 6 },
    { id: 'historia-magii', name: 'Historia Magii', code: 'HIST-109', icon: '📜', category: 'Historia & Kroniki', description: 'Wielka schizma z 1294 roku, powstanie Cytadeli i historia czterech założycieli.', classroom: 'Wielkie Archiwum Skandzy', profId: '', profName: '', gradient: 'linear-gradient(135deg, #201a10 0%, #060604 100%)', classYears: ['Klasa I'], sort: 7 },
    { id: 'astronomia', name: 'Astronomia', code: 'ASTRO-110', icon: '🌌', category: 'Kosmologia', description: 'Obserwacja koniunkcji ciał niebieskich i pływy zórz jako nośnika energii rytualnej.', classroom: 'Obserwatorium Północnej Iglicy', profId: '', profName: '', gradient: 'linear-gradient(135deg, #101a2c 0%, #04060c 100%)', classYears: ['Klasa I'], sort: 8 },
    { id: 'wrozbiarstwo', name: 'Wróżbiarstwo', code: 'DIV-111', icon: '🦴', category: 'Sztuki Tajemne', description: 'Odczytywanie znaków z rzutów kośćmi völvy, interpretacja dymu palonych ziół arktycznych.', classroom: 'Komnata Trzech Norn', profId: '', profName: '', gradient: 'linear-gradient(135deg, #1e142a 0%, #08040e 100%)', classYears: ['Klasa I'], sort: 9 },
    { id: 'numerologia', name: 'Numerologia', code: 'NUM-112', icon: '📐', category: 'Nauki Ścisłe Magii', description: 'Matematyczne podstawy zaklęć, wagi liczb 3, 9 i 24 w mitologii nordyckiej.', classroom: 'Kancelaria Obliczeń Runicznych', profId: '', profName: '', gradient: 'linear-gradient(135deg, #14182a 0%, #04050c 100%)', classYears: ['Klasa I'], sort: 10 },
    { id: 'starozytne-runy', name: 'Starożytne Runy', code: 'RUNE-113', icon: 'ᚱ', category: 'Języki i Inskrypcje', description: 'Wykrawanie, aktywacja i łączenie prastarych run Futharku Starszego. Wiązanie magii w kamieniu, kości i stali.', classroom: 'Komnata Wyrytych Monolitów', profId: '', profName: '', gradient: 'linear-gradient(135deg, #0a2422 0%, #030808 100%)', classYears: ['Klasa I', 'Klasa II'], sort: 11 },
    { id: 'latanie', name: 'Latanie na Miotle', code: 'FLY-114', icon: '🧹', category: 'Sztuka Bojowa', description: 'Manewry w huraganowym wietrze, loty formacyjne i akrobacje bojowe w fiordach.', classroom: 'Urwisko Jaskółek i Płyta Wiatru', profId: '', profName: '', gradient: 'linear-gradient(135deg, #1a2838 0%, #060a10 100%)', classYears: ['Klasa I'], sort: 12 },
    { id: 'biala-magia', name: 'Biała Magia', code: 'WHITE-102', icon: '🕊️', category: 'Magia Pierwotna', description: 'Leczenie ran magicznych, pieczętowanie pęknięć aury i manipulacja światłem zorzy.', classroom: 'Świątynia Słonecznego Kręgu', profId: '', profName: '', gradient: 'linear-gradient(135deg, #1a1a24 0%, #0a0a10 100%)', classYears: ['Klasa I', 'Klasa II'], sort: 13 },
    { id: 'czarna-magia', name: 'Czarna Magia', code: 'DARK-101', icon: '💀', category: 'Sztuki Zakazane', description: 'Zaawansowane studium pradawnych energii mroku, pętania cieni, klątw rodowych oraz kontrolowanego użycia sił pierwotnych.', classroom: 'Krypta Szeptów (Poziom -3)', profId: '', profName: '', gradient: 'linear-gradient(135deg, #1c132e 0%, #0d0618 100%)', classYears: ['Klasa I', 'Klasa II'], sort: 14 },

    // --- KLASA II (Magia Zaawansowana) ---
    { id: 'klatwy-i-uroki', name: 'Klątwy i Uroki', code: 'DUEL-201', icon: '⚔️', category: 'Sztuka Bojowa', description: 'Zaawansowane techniki klątw ciśnieniowych, przełamywania tarcz wroga i walki taktycznej na mroźnej arenie.', classroom: 'Arena Żelaznego Kręgu', profId: '', profName: '', gradient: 'linear-gradient(135deg, #2c0e0e 0%, #080303 100%)', classYears: ['Klasa II'], sort: 15 },
    { id: 'smokologia', name: 'Smokologia', code: 'DRAG-202', icon: '🐉', category: 'Przyroda Magiczna', description: 'Zaawansowane studium gatunków smoków Północy. Tresura, komunikacja i pozyskiwanie surowców smokowych.', classroom: 'Smocze Urwisko Północy', profId: '', profName: '', gradient: 'linear-gradient(135deg, #2e1808 0%, #0d0602 100%)', classYears: ['Klasa II'], sort: 16 },
    { id: 'rytualistyka', name: 'Rytualistyka', code: 'RITU-203', icon: '🕯️', category: 'Sztuki Tajemne', description: 'Konstruowanie i prowadzenie wieloosobowych rytuałów magicznych opartych na tradycji nordyckiej.', classroom: 'Krąg Kamiennych Gigantów', profId: '', profName: '', gradient: 'linear-gradient(135deg, #281424 0%, #0a0409 100%)', classYears: ['Klasa II'], sort: 17 },
    { id: 'psychologia-magiczna', name: 'Psychologia Magiczna', code: 'PSY-204', icon: '🧠', category: 'Nauki Ścisłe Magii', description: 'Mechanizmy wpływu zaklęć na psychikę — obrona przed Legillimensją, Oklumencja i kontrola umysłu.', classroom: 'Sala Luster Poznania', profId: '', profName: '', gradient: 'linear-gradient(135deg, #1c1830 0%, #06050e 100%)', classYears: ['Klasa II'], sort: 18 },
    { id: 'trucizny', name: 'Trucizny', code: 'TOX-205', icon: '☠️', category: 'Alchemia & Warzenie', description: 'Zaawansowana synteza jadów magicznych, trucizn kontaktowych i opracowywanie uniwersalnych odtrutek.', classroom: 'Laboratorium Czerwonego Dymu', profId: '', profName: '', gradient: 'linear-gradient(135deg, #1e0e24 0%, #060208 100%)', classYears: ['Klasa II'], sort: 19 },
    { id: 'mity-polnocy', name: 'Mity i Legendy', code: 'MYTH-206', icon: '📖', category: 'Historia & Kroniki', description: 'Analiza nordyckiej mitologii jako realnego zapisu historii magicznej: od wojen Asów z Wanami po Ragnarök.', classroom: 'Wielkie Archiwum Skandzy — Sala Sag', profId: '', profName: '', gradient: 'linear-gradient(135deg, #241c10 0%, #080603 100%)', classYears: ['Klasa II'], sort: 20 },
    { id: 'stworzenia-nocy', name: 'Stworzenia Nocy', code: 'NIGHT-207', icon: '🦇', category: 'Przyroda Magiczna', description: 'Istoty manifestujące się nocą lub w nocy polarnej: wampiry lodowe, upiory cieni, Draugr i demony ciemności.', classroom: 'Podziemna Sala Cienia (Poziom -2)', profId: '', profName: '', gradient: 'linear-gradient(135deg, #14141e 0%, #040408 100%)', classYears: ['Klasa II'], sort: 21 }
  ];

  const defaultCategories = [
    { name: 'Prace Domowe', weight: 1.0, icon: '📝', sort: 1 },
    { name: 'Egzaminy', weight: 2.0, icon: '📋', sort: 2 },
    { name: 'Aktywność', weight: 0.5, icon: '🗣️', sort: 3 },
    { name: 'Quizy', weight: 0.8, icon: '⚡', sort: 4 },
    { name: 'Projekty', weight: 1.5, icon: '🏗️', sort: 5 }
  ];

  const defaultSyllabus = `# Plan Nauczania

## Cele Kształcenia
Plan nauczania zostanie opublikowany przez prowadzącego profesora.

## Wymagania Wstępne
Brak specjalnych wymagań — wystarczy oficjalny status adepta Cytadeli Durmstrang.

## Harmonogram
Zajęcia odbywają się zgodnie z harmonogramem Katedry Dydaktycznej.`;

  const defaultRegulations = `# Regulamin Zajęć

1. **Obecność** — wymagana na wszystkich zajęciach. Nieobecność musi być zgłoszona do opiekuna Zakonu.
2. **Punktualność** — spóźnienie powyżej 10 minut traktowane jako nieobecność.
3. **Zachowanie** — adepci zobowiązani są do okazywania szacunku prowadzącemu i współuczniom.
4. **Prace domowe** — oddawane w wyznaczonym terminie. Spóźnienie obniża ocenę o 1 stopień.
5. **Różdżki** — używane wyłącznie za zgodą profesora podczas ćwiczeń praktycznych.
6. **Bezpieczeństwo** — zabrania się samodzielnego eksperymentowania z niebezpiecznymi składnikami bez nadzoru.`;

  for (let i = 0; i < subjectsData.length; i++) {
    const s = subjectsData[i];
    const existing = db.prepare('SELECT id FROM subjects WHERE id = ?').get(s.id);
    if (!existing) {
      insertSubject.run(
        s.id, s.name, s.code, s.icon, s.category, s.description, s.classroom,
        s.profId, s.profName, '', s.gradient, defaultSyllabus, defaultRegulations,
        JSON.stringify(s.classYears),
        1, s.sort
      );

      // Create default grade categories for each new subject
      for (const cat of defaultCategories) {
        const catId = `cat-${s.id}-${cat.sort}`;
        insertGradeCat.run(catId, s.id, cat.name, cat.weight, cat.icon, cat.sort);
      }
    } else {
      db.prepare(`
        UPDATE subjects SET name = ?, code = ?, icon = ?, category = ?, description = ?, classroom = ?,
          professor_id = '', professor_name = '', class_years = ?, sort_order = ?
        WHERE id = ?
      `).run(s.name, s.code, s.icon, s.category, s.description, s.classroom, JSON.stringify(s.classYears), s.sort, s.id);
    }
  }

  // Seed sample grades if none exist
  const gradesCount = db.prepare('SELECT COUNT(*) as count FROM grades').get().count;
  if (false && gradesCount === 0) {
    insertGrade.run('grade-1', 'czarna-magia', 'cat-czarna-magia-1', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', 'W', 'Wybitny (W)', 5, 'Esej: Pieczęć Wstrzymująca', 'Perfekcyjna analiza mechaniki cienia i woli.', 'usr-morana', '', '', '2026-08-18');
    insertGrade.run('grade-2', 'czarna-magia', 'cat-czarna-magia-3', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', 'W', 'Wybitny (W)', 5, 'Aktywność na lekcji: Wiązanie Cieni', 'Wybitna aktywność i opanowanie techniki.', 'usr-morana', '', 'les-czarna-magia-cienie-2026', '2026-08-20');
    insertGrade.run('grade-3', 'eliksiry', 'cat-eliksiry-4', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', 'P', 'Powyżej Oczekiwań (P)', 4, 'Quiz: Eliksir Wiggenowy', 'Trafna odpowiedź na pytanie o stabilizację.', 'usr-astrid-vinter', '', 'les-eliksiry-wiggen-2026', '2026-08-22');
    insertGrade.run('grade-4', 'czarna-magia', 'cat-czarna-magia-1', 'usr-magnus', 'Magnus Blom', 'reinhall', 'P', 'Powyżej Oczekiwań (P)', 4, 'Esej: Bariera Cieniowa', 'Solidna praca z drobnymi niedociągnięciami.', 'usr-morana', '', '', '2026-08-19');
    insertGrade.run('grade-5', 'eliksiry', 'cat-eliksiry-3', 'usr-erik', 'Erik Nilsen', 'bjornhall', 'Z', 'Zadowalający (Z)', 3, 'Aktywność: Eliksir Wiggenowy', 'Prawidłowe rozpoznanie właściwości bezoaru.', 'usr-astrid-vinter', '', 'les-eliksiry-wiggen-2026', '2026-08-22');
    insertGrade.run('grade-6', 'eliksiry', 'cat-eliksiry-3', 'usr-freja', 'Freja Lund', 'ravnheim', 'P', 'Powyżej Oczekiwań (P)', 4, 'Aktywność: Eliksir Wiggenowy', 'Wzorowa odpowiedź w quizie klasowym.', 'usr-astrid-vinter', '', 'les-eliksiry-wiggen-2026', '2026-08-22');
  }

  console.log('[DB] Synchronized all 21 subjects and categories.');

  // ===================== SEED TIMETABLE ENTRIES =====================
  const timetableCount = db.prepare('SELECT COUNT(*) as count FROM timetable_entries').get().count;
  if (false && timetableCount === 0) {
    console.log('[DB] Seeding timetable entries...');
    const insertTT = db.prepare(`
      INSERT INTO timetable_entries (
        id, subject_id, subject_name, subject_code, subject_icon, subject_category,
        day_of_week, day_name, start_time, end_time, classroom,
        professor_id, professor_name, professor_avatar, class_year, house_target,
        topic, notes, status, original_professor_name, substitute_professor_id,
        substitute_professor_name, substitution_reason, cancellation_reason, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const SEED_ENTRIES = [
      // Poniedziałek
      ['tt-mon-1', 'czarna-magia', 'Czarna Magia', 'DARK-101', '💀', 'Sztuki Zakazane', 1, 'Poniedziałek', '08:30', '10:00', 'Krypta Szeptów (Poziom -3)', 'usr-morana', '', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Wiązanie cieni i bariery eteryczne w krypcie', 'Wymagany czarny atrament i rękawice ze skóry salamandry.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-mon-2', 'klatwy-i-uroki', 'Klątwy i Uroki', 'DUEL-201', '⚔️', 'Sztuka Bojowa', 1, 'Poniedziałek', '10:15', '11:45', 'Arena Żelaznego Kręgu', 'usr-gunnar', '', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Tarcza Żelaza i kontrataki w zamieci', 'Obowiązkowe zbroje runiczne i ochrona klatki piersiowej.', 'scheduled', '', '', '', '', '', 1, 2],
      ['tt-mon-3', 'eliksiry', 'Eliksiry', 'POT-105', '🧪', 'Alchemia & Warzenie', 1, 'Poniedziałek', '12:00', '13:30', 'Laboratorium Lodowych Cieplic', 'usr-astrid-vinter', '', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Destylacja esencji mrozu i odtrutki arktyczne', 'Kociołki miedziane lub z lanego żelaza.', 'scheduled', '', '', '', '', '', 1, 3],
      ['tt-mon-4', 'latanie', 'Latanie na Miotle', 'FLY-114', '🧹', 'Sztuka Bojowa', 1, 'Poniedziałek', '14:30', '16:00', 'Urwisko Jaskółek i Płyta Wiatru', '', '', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Nawigacja w szkwałach lodowcowych i loty formacyjne', 'Zajęcia na otwartym urwisku — ciepła odzież runiczna.', 'cancelled', '', '', '', '', 'Huragan śnieżny kategorii IV nad fiordami — zakaz lotów na miotłach.', 1, 4],
      ['tt-mon-5', 'astronomia', 'Astronomia', 'ASTRO-110', '🌌', 'Kosmologia', 1, 'Poniedziałek', '20:00', '21:30', 'Obserwatorium Północnej Iglicy', '', '', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Pomiary spektralne fioletowej zorzy Yggdrasila', 'Lunety mosiężne z filtrem z kryształu górskiego.', 'scheduled', '', '', '', '', '', 1, 5],
      // Wtorek
      ['tt-tue-1', 'starozytne-runy', 'Starożytne Runy', 'RUNE-113', 'ᚱ', 'Języki i Inskrypcje', 2, 'Wtorek', '08:30', '10:00', 'Komnata Wyrytych Monolitów', '', '', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Wykrawanie runy Thurisaz w bazalcie lodowcowym', 'Dłuta z hartowanej stali krasnoludzkiej.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-tue-2', 'transmutacja', 'Transmutacja', 'TRANS-104', '🔮', 'Modyfikacja Materii', 2, 'Wtorek', '10:15', '11:45', 'Wieża Krystalizacji', '', '', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Krystalizacja cieczy w kryształy wiecznego lodu', 'Przygotować fiolki z wodą ze stopionego lodowca Jostedal.', 'substitution', '', 'usr-morana', '', 'Prof. Freja Lindqvist prowadzi badania anomalii krystalicznej w Głębi Niflheimu — zastępstwo objęła Prof. Morana Vane.', '', 1, 2],
      ['tt-tue-3', 'zielarstwo', 'Zielarstwo', 'HERB-106', '🌿', 'Przyroda Magiczna', 2, 'Wtorek', '12:00', '13:30', 'Szklarnie Wiecznej Zmarzliny', '', '', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Zbieranie zarodników mchu świetlistego w temperaturze -20°C', 'Rękawice z ociepleniem runicznym.', 'scheduled', '', '', '', '', '', 1, 3],
      ['tt-tue-4', 'magizoologia', 'Magizoologia', 'BEAST-107', '🐺', 'Przyroda Magiczna', 2, 'Wtorek', '14:30', '16:00', 'Wybiegi Skandynawskie i Zakazany Bór', '', '', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Karmienie i uspokajanie szczeniąt wilków lodowcowych', 'Zakaz używania ostrych zaklęć świetlnych.', 'scheduled', '', '', '', '', '', 1, 4],
      // Środa
      ['tt-wed-1', 'zaklecia', 'Zaklęcia', 'SPELL-103', '✨', 'Magia Praktyczna', 3, 'Środa', '08:30', '10:00', 'Korytarz Wichrów', '', '', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Tworzenie mostów termicznych w gęstej mgle', 'Ćwiczenia precyzyjnej modulacji głosu.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-wed-2', 'smokologia', 'Smokologia', 'DRAG-202', '🐉', 'Przyroda Magiczna', 3, 'Środa', '10:15', '11:45', 'Smocze Urwisko Północy', '', '', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Pozyskiwanie łusek Żelazobrzucha Norweskiego podczas snu', 'Zakaz wydawania dźwięków powyżej 20 decybeli.', 'scheduled', '', '', '', '', '', 1, 2],
      ['tt-wed-3', 'wrozbiarstwo', 'Wróżbiarstwo', 'DIV-111', '🦴', 'Sztuki Tajemne', 3, 'Środa', '12:00', '13:30', 'Komnata Trzech Norn', '', '', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Rzuty kośćmi morsów i interpretacja szeptu norn', 'Kadzidła z szałwii arktycznej przygotowane przez katedrę.', 'substitution', '', 'usr-gunnar', '', 'Prof. Dagmar Vane uczestniczy w Wielkim Wiecu Völv w Uppsala — zastępstwo taktyczne prowadzi Prof. Gunnar Vargson.', '', 1, 3],
      ['tt-wed-4', 'obrona-przed-ciemnymi-mocami', 'Obrona przed Ciemnymi Mocami', 'DEF-108', '🛡️', 'Obrona & Przetrwanie', 3, 'Środa', '14:30', '16:00', 'Sala Skalistych Bastionów', '', '', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Rozpraszanie upiorów lodowych i zaklęcia ochronne aegishjalmur', 'Tarcze runiczne rozdawane przed wejściem.', 'scheduled', '', '', '', '', '', 1, 4],
      // Czwartek
      ['tt-thu-1', 'historia-magii', 'Historia Magii', 'HIST-109', '📜', 'Historia & Kroniki', 4, 'Czwartek', '08:30', '10:00', 'Wielkie Archiwum Skandzy', '', '', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Wielka schizma z 1294 roku i zapieczętowanie Paktu Czterech Bastionów', 'Zapisy na pergaminie cieni.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-thu-2', 'rytualistyka', 'Rytualistyka', 'RITU-203', '🕯️', 'Sztuki Tajemne', 4, 'Czwartek', '10:15', '11:45', 'Krąg Kamiennych Gigantów', '', '', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Formowanie kręgów ochronnych wokół menhirów', 'Zajęcia na dziedzińcu zewnętrznym.', 'scheduled', '', '', '', '', '', 1, 2],
      ['tt-thu-3', 'numerologia', 'Numerologia', 'NUM-112', '📐', 'Nauki Ścisłe Magii', 4, 'Czwartek', '12:00', '13:30', 'Kancelaria Obliczeń Runicznych', '', '', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Macierze 24 run starszego Futharku i obliczanie siły zaklęć', 'Tabliczki woskowe i rysiki.', 'scheduled', '', '', '', '', '', 1, 3],
      ['tt-thu-4', 'psychologia-magiczna', 'Psychologia Magiczna', 'PSY-204', '🧠', 'Nauki Ścisłe Magii', 4, 'Czwartek', '14:30', '16:00', 'Sala Luster Poznania', 'usr-morana', '', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Wznoszenie barier myślowych przed Legillimensją', 'Wymagane pełne skupienie i wyciszenie.', 'scheduled', '', '', '', '', '', 1, 4],
      // Piątek
      ['tt-fri-1', 'biala-magia', 'Biała Magia', 'WHITE-102', '🕊️', 'Magia Pierwotna', 5, 'Piątek', '08:30', '10:00', 'Świątynia Słonecznego Kręgu', '', '', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Pieczętowanie ran magicznych światłem zorzy polarnej', 'Kryształy górskie do skupiania wiązki.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-fri-2', 'trucizny', 'Trucizny', 'TOX-205', '☠️', 'Alchemia & Warzenie', 5, 'Piątek', '10:15', '11:45', 'Laboratorium Czerwonego Dymu', 'usr-astrid-vinter', '', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Synteza jadu lodowej żmii i opracowywanie uniwersalnej odtrutki', 'Izolowane maski runiczne obowiązkowe.', 'cancelled', '', '', '', '', 'Nieszczelność filtru wyciągowego w Laboratorium Czerwonego Dymu — kwarantanna do soboty.', 1, 2],
      ['tt-fri-3', 'klatwy-i-uroki', 'Klątwy i Uroki', 'DUEL-201', '⚔️', 'Sztuka Bojowa', 5, 'Piątek', '14:30', '16:30', 'Arena Żelaznego Kręgu', 'usr-gunnar', '', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', 'Wszyscy', 'all', 'Pojedynki międzyzakonne o Puchar Północy: Reinhall vs Ravnheim', 'Sędziuje Arcymistrzyni Valgerda Storm.', 'scheduled', '', '', '', '', '', 1, 3],
      // Sobota
      ['tt-sat-1', 'starozytne-runy', 'Starożytne Runy', 'RUNE-113', 'ᚱ', 'Języki i Inskrypcje', 6, 'Sobota', '10:00', '13:00', 'Komnata Wyrytych Monolitów', '', '', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Wszyscy', 'all', 'Kucie amuletów i zaklinanie stali na nadchodzące mrozy', 'Konsultacje otwarte dla wszystkich adeptów.', 'scheduled', '', '', '', '', '', 1, 1]
    ];

    for (const row of SEED_ENTRIES) {
      insertTT.run(...row);
    }
    console.log(`[DB] Seeded ${SEED_ENTRIES.length} timetable entries.`);
  }

// ===================== SEED DOMAIN DATA (HOUSES, LOCATIONS, RUNES, CEREMONY, SHOPS, LOTTERY) =====================

{
  const housesCount = db.prepare('SELECT COUNT(*) as c FROM houses').get().c;
  if (housesCount === 0) {
    console.log('[DB] Seeding houses...');
    const ins = db.prepare(`INSERT INTO houses (id, name, full_name, symbol_animal, crest_icon, crest_image, element, founder, colors, gem_name, motto, latin_motto, traits, common_room, relic, head_of_house, prefect, members_count, starting_points, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    ins.run('reinhall','Reinhall','Zakon Reinhall (Ordo Rangiferi)','Renifer Północy (Rangifer)','ᚦ','/crest_stag.jpg','Krew i Wieczna Zmarzlina','Eirik Krwawy Róg (Eiríkr Blóðhorn)',JSON.stringify({primary:'#7a2632',secondary:'#a8384b',border:'rgba(122, 38, 50, 0.6)',glow:'rgba(122, 38, 50, 0.35)',text:'#e8bfc6',gem:'#5a1c25'}),'Rubiny Krwi i Złoty Pył','„Krew nie kłamie, mróz nie wybacza."','Sanguis non mentitur, gelu non parcit.',JSON.stringify(['Wytrwałość','Duma rodowa','Magia krwi','Lojalność paktu','Pradawna tradycja']),'Sala Rodowa Skandzy — wyciosana w litej granitowej skale pod zachodnim skrzydłem, z wiecznym paleniskiem z kości mamuta tundrowego i gobelinami haftowanymi złotą nicią.','Kielich Przymierza Krwi (Blóðkálkr) — naczynie ze srebra i rogu, w którym założyciele pieczętowali Pakt Czterech Koron w 1294 roku.','Prof. Sigrid Hällström','Magnus Blom',63,0,1);
    ins.run('bjornhall','Björnhall','Zakon Björnhall (Ordo Ursi)','Niedźwiedź Jaskiniowy (Ursus Spelaeus)','ᛉ','/crest_bear.jpg','Żelazo i Pęknięta Skala','Torvald Żelaznoręki (Torvaldr Járnhönd)',JSON.stringify({primary:'#35536f',secondary:'#5b8aaf',border:'rgba(53, 83, 111, 0.6)',glow:'rgba(53, 83, 111, 0.35)',text:'#c4d8e8',gem:'#263d52'}),'Okruchy Czarnego Żelaza i Krwawe Granaty','„Pancerz z woli, miecz z wiedzy."','Lorica ex voluntate, gladius ex scientia.',JSON.stringify(['Siła woli','Magia bojowa','Niezłomność','Klątwy niszczące','Dyscyplina wojenna']),'Bastion Żelaza — warowna wieża z widokiem na wzburzony fiord, wyposażona w prywatną arenę pojedynkową, stojaki z runicznymi puklerzami i kowadło alchemiczne.','Puklerz Pękniętego Żelaza (Járnskjöldr) — stalowa tarcza odbijająca najczarniejsze uroki niszczące.','Prof. Gunnar Vargson','Astrid Vargadottir',68,0,2);
    ins.run('ravnheim','Ravnheim','Zakon Ravnheim (Ordo Corvi)','Kruk Mądrości (Corvus Corax)','ᚱ','/crest_raven.jpg','Cień i Astralna Noc','Morana Cień-Krocząca (Morana Skuggaganga)',JSON.stringify({primary:'#42385f',secondary:'#7a6ea0',border:'rgba(66, 56, 95, 0.6)',glow:'rgba(66, 56, 95, 0.35)',text:'#d0c8e2',gem:'#312a47'}),'Ametysty Nocy i Odłamki Obsydianu','„W ciszy cienia kryje się potęga."','In umbrae silentio potestas latet.',JSON.stringify(['Tajemnica','Nekromancja','Wróżbiarstwo z kości','Opanowanie','Astralna intuicja']),'Wieża Nocnych Szeptów — najwyższy punkt Cytadeli, gdzie okna z ciemnego kryształu wychodzą na zorzę polarną, a pod sufitem krążą astralne kruki posłańcze.','Astrolabium Siedmiu Gwiazd (Himinúrfang) — mechanizm pozwalający przepowiadać zaćmienia i ruchy cieni.','Prof. Morana Vane','Valdemar Krag-Hansen',72,0,3);
    ins.run('otergard','Otergard','Zakon Otergard (Ordo Lutrae)','Wydra Polarna (Lutra Borealis)','ᛞ','/crest_otter.jpg','Lodowcowe Wody i Toksyny','Astrid Złotooka (Astrid Gullauga)',JSON.stringify({primary:'#23615b',secondary:'#3aaa9f',border:'rgba(35, 97, 91, 0.6)',glow:'rgba(35, 97, 91, 0.35)',text:'#b4e0da',gem:'#1a4a45'}),'Szmaragdy Fiordu i Akwamaryny','„Płyń pod lodem, uderzaj bez śladu."','Sub glacie natato, sine vestigio percutito.',JSON.stringify(['Spryt alchemiczny','Warzenie toksyn','Transmutacja lodu','Elastyczność','Analityczny umysł']),'Ogrody Lodowych Cieplic — podziemne atrium zasilane podwodnymi gorącymi źródłami fiordu, wypełnione rzadkimi arktycznymi mchami i retortami alchemicznymi.','Alembik Nieskończonej Destylacji (Algildi) — naczynie ze smoczego szkła, potrafiące wyekstrahować esencję z każdego żywiołu.','Prof. Klaus Lindqvist','Sigrun Lindqvist',65,0,4);
    console.log('[DB] Seeded 4 houses.');
  }
}

{
  const locationsCount = db.prepare('SELECT COUNT(*) as c FROM locations').get().c;
  if (locationsCount === 0) {
    console.log('[DB] Seeding locations...');
    const ins = db.prepare('INSERT INTO locations (id, name, nordic_name, floor, x, y, icon, house, type, region, image, short_desc, full_lore, npcs, actions, secret_clue, quests, sort_order, layer_id, marker_type, visibility, state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    for (const loc of SEED_LOCATIONS) {
      ins.run(loc.id, loc.name, loc.nordic_name, loc.floor, loc.x, loc.y, loc.icon, loc.house, loc.type, loc.region, loc.image, loc.short_desc, loc.full_lore, loc.npcs, loc.actions, loc.secret_clue, loc.quests, loc.sort_order, 'fortress', 'location', 'visible', 'available');
    }
    console.log(`[DB] Seeded ${SEED_LOCATIONS.length} locations.`);
  } else {
    // Upewnij się że istniejące lokacje mają layer_id = 'fortress'
    db.prepare(`UPDATE locations SET layer_id = 'fortress' WHERE layer_id IS NULL OR layer_id = ''`).run();
  }
}

// Seed warstw mapy
{
  const layerCount = db.prepare('SELECT COUNT(*) as c FROM map_layers').get().c;
  if (layerCount === 0) {
    console.log('[DB] Seeding map layers...');
    const insLayer = db.prepare(`INSERT INTO map_layers (id, name, slug, parent_id, image_path, default_zoom, default_x, default_y, sort_order) VALUES (?,?,?,?,?,?,?,?,?)`);
    insLayer.run('world', 'Mapa Północy', 'world', null, '/world_map.webp', 0.7, 0, 0, 0);
    insLayer.run('fortress', 'Twierdza Durmstrang', 'fortress', 'world', '/durmstrang_fortress_map.webp', 0.75, 0, 0, 1);
    console.log('[DB] Seeded 2 map layers.');
  }
}

// Seed lokacji mapy świata
{
  // INSERT OR IGNORE — bezpieczne re-seedowanie bez nadpisywania istniejących rekordów
  {
    console.log('[DB] Syncing world map locations (INSERT OR IGNORE)...');
    const insWorld = db.prepare(`
      INSERT OR IGNORE INTO locations
        (id, name, nordic_name, floor, x, y, icon, house, type, region, image,
         short_desc, full_lore, npcs, actions, secret_clue, quests, sort_order,
         layer_id, marker_type, visibility, state, description_short,
         discovery_reward_xp, discovery_reward_skirniry, linked_activity_type)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const upsertWorld = db.prepare(`
      UPDATE locations SET
        quests = ?, full_lore = ?, npcs = ?, actions = ?,
        description_short = ?, discovery_reward_xp = ?, discovery_reward_skirniry = ?
      WHERE id = ? AND (quests = '[]' OR quests IS NULL)
    `);
    let inserted = 0, updated = 0;
    for (let i = 0; i < WORLD_SEED_LOCATIONS.length; i++) {
      const loc = WORLD_SEED_LOCATIONS[i];
      const result = insWorld.run(
        loc.id, loc.name, loc.nordic_name, 0, loc.x, loc.y, loc.icon,
        null, loc.type, loc.region, '', loc.short_desc || '', loc.full_lore || '',
        loc.npcs || '[]', loc.actions || '[]', '', loc.quests || '[]', i,
        'world', loc.marker_type || 'location', loc.visibility || 'visible',
        loc.state || 'available', loc.description_short || '',
        loc.discovery_reward_xp || 10, loc.discovery_reward_skirniry || 5,
        loc.linked_activity_type || ''
      );
      if (result.changes > 0) {
        inserted++;
      } else {
        // Backfill quest data do istniejących rekordów które mają puste questy
        const upd = upsertWorld.run(
          loc.quests || '[]', loc.full_lore || '', loc.npcs || '[]', loc.actions || '[]',
          loc.description_short || '', loc.discovery_reward_xp || 10, loc.discovery_reward_skirniry || 5,
          loc.id
        );
        if (upd.changes > 0) updated++;
      }
    }
    console.log(`[DB] World locations: ${inserted} inserted, ${updated} updated (quest backfill).`);
  }
}

{
  const runesCatCount = db.prepare('SELECT COUNT(*) as c FROM runes_catalog').get().c;
  if (runesCatCount === 0) {
    console.log('[DB] Seeding runes catalog...');
    const ins = db.prepare('INSERT INTO runes_catalog (id, symbol, name, meaning, element, description, default_count, sort_order) VALUES (?,?,?,?,?,?,?,?)');
    ins.run('rune-fehu','ᚠ','Fehu','Bogactwo & Pierwotna Energia','Złoto / Ogień','Runa obfitości i przepływu energii. Otwiera kanały materialne i przyciąga pomyślność w transakcjach na Rynku.',3,1);
    ins.run('rune-ansuz','ᚨ','Ansuz','Mądrość & Głos Przodków','Wiatr / Myśl','Święty znak Odyna i wieszczek północy. Odsłania ukryte znaczenia w zakazanych grimuarach i wzmacnia inkantacje.',2,2);
    ins.run('rune-tiwaz','ᛏ','Tiwaz','Sprawiedliwość & Wola Wojownika','Żelazo / Gwiazda Polarna','Runa przewodnia pojedynków Hólmganga. Zapewnia nieugięty hart ducha i precyzję w rzucaniu tarcz bojowych.',2,3);
    ins.run('rune-algiz','ᛉ','Algiz','Tarcza & Święta Ochrona','Poroże / Aura','Potężny znak ochronny Zakonu Renifera. Odbija uroki manipulacji umysłem i chroni przed klątwami niszczącymi.',3,4);
    ins.run('rune-kaunan','ᚲ','Kaunan (Kenaz)','Płomień Wiedzy & Prześwietlenie','Płomień / Cień','Runa wewnętrznego ognia i transformacji. Rozprasza ciemność i pozwala widzieć to, co zostało ukryte pod lodem.',2,5);
    ins.run('rune-isa','ᛁ','Isa','Wieczny Lód & Zatrzymanie Czasu','Lód / Zmarzlina','Runa bezruchu i skupienia. Zatrzymuje rozprzestrzenianie się toksyn w ciele i zamraża wrogie zaklęcia.',2,6);
    ins.run('rune-raidho','ᚱ','Raidho','Wędrówka & Droga Przeznaczenia','Ścieżka / Rytm','Wytycza bezpieczny szlak przez najgorszą arktyczną zamieć i przyspiesza transgresję magiczną.',2,7);
    ins.run('rune-dagaz','ᛞ','Dagaz','Świt Północy & Przebudzenie Cytadeli','Zorza Polarna / Światło','Najpotężniejszy znak Cytadeli Durmstrang. Symbolizuje równowagę pomiędzy mrokiem a światłem oraz narodziny nowej potęgi.',1,8);
    console.log('[DB] Seeded 8 runes catalog entries.');
  }
}

{
  const formulasCount = db.prepare('SELECT COUNT(*) as c FROM rune_formulas').get().c;
  if (formulasCount === 0) {
    console.log('[DB] Seeding rune formulas...');
    const ins = db.prepare('INSERT INTO rune_formulas (id, name, runes, catalyst, house_bonus, reward_xp, reward_points, reward_currency, lore_reward, description, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    ins.run('formula-blood-shield','Pieczęć Krwawego Przymierza (Blóð-Skjöldr)',JSON.stringify(['rune-algiz','rune-tiwaz']),'Krew Renifera','renifer',180,45,60,'Odkryto zapiskę Eirika Krwawego Rogu o nienaruszalnej tarczy rodowej.','Łączy niezłomną wolę Tiwaz ze świętą ochroną Algiz, tworząc barierę pochłaniającą klątwy uderzeniowe.',1);
    ins.run('formula-shadow-whisper','Wiązanie Cienistego Szeptu (Skugga-Galdr)',JSON.stringify(['rune-ansuz','rune-kaunan']),'Cień Kruka','kruk',200,50,70,'Odblokowano dostęp do Pierwszej Kroniki Wieży Nocnych Szeptów.','Przekształca wiedzę Ansuz i płomień Kaunan w astralny wzrok zdolny odczytywać zatarte inskrypcje w katakumbach.',2);
    ins.run('formula-glacial-transmute','Alembik Wiecznej Zmarzliny (Jökul-Galdr)',JSON.stringify(['rune-isa','rune-fehu']),'Woda Lodowcowa','wydra',190,40,80,'Odblokowano recepturę na Esencję Płynnego Cienia.','Związanie lodu Isa z obfitością Fehu pozwala na krystalizację rzadkich minerałów alchemicznych z fiordu.',3);
    ins.run('formula-iron-fury','Znak Pękniętego Żelaza (Járn-Brot)',JSON.stringify(['rune-tiwaz','rune-kaunan']),'Pył Meteorytowy','niedzwiedz',220,55,65,'Odkryto sekret kowalski Torvalda Żelaznorękiego.','Wojenny splot rozpalający broń i różdżki adepta bojowym płomieniem kruszącym granitowe mury.',4);
    ins.run('formula-aurora-awakening','Święta Fuzja Świtów (Dagaz-Galdr)',JSON.stringify(['rune-dagaz','rune-ansuz','rune-fehu']),'Pył Zorzy Polarnej',null,350,100,150,'ODKRYTO FRAGMENT SERCA POD WIECZNĄ ZMARZLINĄ!','Mistyczna triada przebudzenia Cytadeli. Manifestuje czyste światło zorzy polarnej, zdejmując pradawne pieczęcie.',5);
    console.log('[DB] Seeded 5 rune formulas.');
  }
}

{
  const ceremonyCount = db.prepare('SELECT COUNT(*) as c FROM ceremony_questions').get().c;
  if (ceremonyCount < 8) {
    console.log('[DB] Seeding/updating ceremony questions...');
    db.prepare('DELETE FROM ceremony_options').run();
    db.prepare('DELETE FROM ceremony_questions').run();
    const insQ = db.prepare('INSERT INTO ceremony_questions (id, title, scenario, sort_order) VALUES (?,?,?,?)');
    const insO = db.prepare('INSERT INTO ceremony_options (id, question_id, text, house, reason, sort_order) VALUES (?,?,?,?,?,?)');

    // Tasowanie: każdy zakon pojawia się dokładnie 2× na każdej pozycji (1-4) w 8 pytaniach
    // Q1: reinhall=1, bjornhall=2, ravnheim=3, otergard=4
    insQ.run('cq-1','Próba Lodowego Wichru: Pradawny Manuskrypt','Podczas eksploracji zamarzniętych krypt pod Cytadelą znajdujesz zamkniętą żelazną kasetę z runiczną pieczęcią krwi. Wiesz, że zawiera ona zakazany traktat o manipulacji żywiołami. Co robisz?',1);
    insO.run('co-1-1','cq-1','Nacinasz opuszki palców i skrapiasz pieczęć własną krwią, oddając cześć pradawnym rytuałom.','reinhall','',1);
    insO.run('co-1-2','cq-1','Wypowiadasz bezlitosne zaklęcie kruszące — liczy się potęga i żelazna determinacja, by posiąść wiedzę.','bjornhall','',2);
    insO.run('co-1-3','cq-1','Cierpliwie badasz geometrię run cienia i rozplątujesz astralne sploty zaklęcia w milczeniu nocy.','ravnheim','',3);
    insO.run('co-1-4','cq-1','Smarujesz pieczęć kwasem z arktycznego porostu, rozpuszczając metal bez naruszania struktury pergaminu.','otergard','',4);

    // Q2: otergard=1, ravnheim=2, reinhall=3, bjornhall=4
    insQ.run('cq-2','Próba Paktu: Konflikt na Murach','Podczas nocnej warty na wałach obronnych dostrzegasz intruza przekraczającego barierę fiordu. To adept z innego rodu, który złamał zakaz opuszczania zamku. Jak reagujesz?',2);
    insO.run('co-2-1','cq-2','Oferujesz mu pomoc w zatarciu śladów w zamian za rzadki składnik alchemiczny lub przysługę.','otergard','',1);
    insO.run('co-2-2','cq-2','Śledzisz go w cieniu, by poznać jego prawdziwy motyw — wiedza o jego sekrecie jest cenniejsza niż kara.','ravnheim','',2);
    insO.run('co-2-3','cq-2','Wymagasz od niego przysięgi na honor rodu i odprowadzasz go przed oblicze Opiekuna Zakonu.','reinhall','',3);
    insO.run('co-2-4','cq-2','Wyzywasz go na natychmiastowy pojedynek Hólmganga — słabość na murach musi zostać ukarana siłą.','bjornhall','',4);

    // Q3: bjornhall=1, reinhall=2, otergard=3, ravnheim=4
    insQ.run('cq-3','Próba Ołtarza: Źródło Mocy','Gdybyś miał wybrać jedno mistyczne narzędzie do związania swojej duszy na całe życie w Cytadeli, byłoby to:',3);
    insO.run('co-3-1','cq-3','Runiczny miecz lub różdżka z rdzeniem z kła bazyliszka północy, gotowa do druzgotania barier.','bjornhall','',1);
    insO.run('co-3-2','cq-3','Róg Przodków inkrustowany złotem, przechowujący pamięć i krew dawnych mistrzów.','reinhall','',2);
    insO.run('co-3-3','cq-3','Kryształowa fiola z wiecznie wrzącą esencją, zdolna przemienić ołów w złoto i truciznę w antidotum.','otergard','',3);
    insO.run('co-3-4','cq-3','Zwierciadło z ciemnego obsydianu, ukazujące echa przeszłości i astralne ścieżki zaświatów.','ravnheim','',4);

    // Q4: ravnheim=1, otergard=2, bjornhall=3, reinhall=4
    insQ.run('cq-4','Próba Przesilenia: Pokusa Północy','W Noc Krwawej Zorzy pradawny duch Cytadeli oferuje ci dar w zamian za część twojego wspomnienia. Co wybierzesz?',4);
    insO.run('co-4-1','cq-4','Zdolność czytania w myślach i słyszenia szeptów umarłych.','ravnheim','',1);
    insO.run('co-4-2','cq-4','Sekretną recepturę na Eliksir Wiecznej Młodości i transmutacji.','otergard','',2);
    insO.run('co-4-3','cq-4','Zaklęcie bojowe zdolne zburzyć fortecę jednym uderzeniem różdżki.','bjornhall','',3);
    insO.run('co-4-4','cq-4','Nieugiętą odporność na mróz i ból, godną nieśmiertelnych władców tundry.','reinhall','',4);

    // Q5: reinhall=1, otergard=2, ravnheim=3, bjornhall=4
    insQ.run('cq-5','Próba Wierności: Uczta Jarla','Na uczcie u Jarla dostrzegasz, że obcy gość skrycie dolewa truciznę do pucharu twojego mistrza. Co czynisz?',5);
    insO.run('co-5-1','cq-5','Wstajesz i głośno wskazujesz truciciela palcem, wzywając go do wyjaśnień przed zgromadzonymi.','reinhall','',1);
    insO.run('co-5-2','cq-5','Spokojnie zamieniasz puchary, podmieniając truciznę na nieszkodliwy eliksir z własnej sakwy.','otergard','',2);
    insO.run('co-5-3','cq-5','Syczysz mu do ucha, że widziałeś wszystko i czekasz na jego kolejny ruch, zbierając informacje.','ravnheim','',3);
    insO.run('co-5-4','cq-5','Chwytasz truciciela za kark i wyciągasz go z komnaty — siła jest jedyną mową, którą rozumieją zdrajcy.','bjornhall','',4);

    // Q6: bjornhall=1, ravnheim=2, reinhall=3, otergard=4
    insQ.run('cq-6','Próba Labiryntu: Cień i Iluzja','Zostajesz uwięziony w magicznym labiryncie, który zmienia kształt z każdym krokiem. Jedyne wyjście kryje się za wrotami strzeżonymi przez iluzje twoich lęków. Jak działasz?',6);
    insO.run('co-6-1','cq-6','Uderzasz w ściany labiryntu pełną mocą czarów destrukcji, aż jedna z nich pęka pod twoim naporem.','bjornhall','',1);
    insO.run('co-6-2','cq-6','Zamykasz oczy i rozciągasz zmysły magiczne, szukając subtelnych pęknięć w tkance iluzji.','ravnheim','',2);
    insO.run('co-6-3','cq-6','Konfrontujesz się z każdą iluzją twarzą w twarz — lęki tracą siłę, gdy się przed nimi nie cofa.','reinhall','',3);
    insO.run('co-6-4','cq-6','Analizujesz wzorzec ruchomych korytarzy i szukasz regularności w chaosie, by znaleźć klucz do przejścia.','otergard','',4);

    // Q7: otergard=1, reinhall=2, bjornhall=3, ravnheim=4
    insQ.run('cq-7','Próba Lojalności: Wyznanie Towarzysza','Twój najbliższy towarzysz ze studiów wyznaje ci, że zamierza ukraść zakazany artefakt z Sali Relikwii i zbiec z Cytadeli. Prosi o twoje milczenie. Co robisz?',7);
    insO.run('co-7-1','cq-7','Proponujesz mu alternatywę: razem można zdobyć to, czego szuka, w sposób, który nie skończy się wydaleniem.','otergard','',1);
    insO.run('co-7-2','cq-7','Natychmiast zgłaszasz sprawę Opiekunowi Zakonu — zdrada Cytadeli to zdrada was obu, bez wyjątku.','reinhall','',2);
    insO.run('co-7-3','cq-7','Mówisz mu wprost: albo porzuca ten plan, albo sam pójdziesz do Opiekuna. Nie ma miejsca na wahanie.','bjornhall','',3);
    insO.run('co-7-4','cq-7','Obiecujesz milczenie, ale dyskretnie śledzisz każdy jego krok, by wiedzieć więcej, niż on sądzi.','ravnheim','',4);

    // Q8: ravnheim=1, bjornhall=2, otergard=3, reinhall=4
    insQ.run('cq-8','Próba Gotowości: Przed Ostatnim Egzaminem','Przed ostatnim egzaminem wstępnym dowiadujesz się, że Mistrz Ceremonii celowo przygotował dla ciebie najtrudniejszą wersję próby. Masz godzinę. Co robisz?',8);
    insO.run('co-8-1','cq-8','Szukasz informacji o poprzednich próbach — ktoś, kto przeszedł je wcześniej, musiał zostawić ślady.','ravnheim','',1);
    insO.run('co-8-2','cq-8','Ignorujesz presję i odpoczywasz. Nadchodzące wyzwanie to okazja do pokazania prawdziwej siły — strach to słabość.','bjornhall','',2);
    insO.run('co-8-3','cq-8','Przygotowujesz awaryjny zestaw eliksirów i narzędzi, które mogą okazać się przydatne w nieprzewidzianych sytuacjach.','otergard','',3);
    insO.run('co-8-4','cq-8','Ćwiczysz kluczowe zaklęcia i wzorce runiczne do bólu mięśni — gotowość i dyscyplina to twoja tarcza.','reinhall','',4);

    console.log('[DB] Seeded 8 ceremony questions with 32 options.');
  }
}

{
  const shopsCount = db.prepare('SELECT COUNT(*) as c FROM shops').get().c;
  if (shopsCount === 0) {
    console.log('[DB] Seeding shops...');
    const ins = db.prepare('INSERT INTO shops (id, name, icon, category_slug, description, sort_order) VALUES (?,?,?,?,?,?)');
    ins.run('all','Wszystkie Kramy','🛍️','','Pełny asortyment rynku Kaupangr.',0);
    ins.run('wands-brokkur','Kuźnia Różdżek Brokkura & Oivinda','🪄','wands','Mistrzowskie różdżki nordyckie strugane z cisów cmentarnych, hebanu i arktycznych jesionów.',1);
    ins.run('tailor-robes','Dom Krawiecki Nordyckich Opończy & Szat','🧥','robes','Szaty ceremonialne, opończe podbite wilczym futrem oraz pancerze runiczne.',2);
    ins.run('antiquarian-books','Antykwariat Run i Zakazanych Ksiąg Snorriego','📖','books','Święte kodeksy Futharku, zwoje nekromancji i unikatowe grimuary dawnych mistrzów.',3);
    ins.run('apothecary-potions','Apteka Alchemiczna i Składnica Ziół Północy','🧪','potions','Destylaty z krwi chimery, eliksiry zórz polarnych, kociołki z kutego żelaza i kryształowe fiolki.',4);
    ins.run('armory-equipment','Zbrojownia Północy & Wyposażenie Pojedynkowe','⚔️','equipment','Rękawice pojedynkowe ze skóry mantikory, buty z łusek smoka i pasy eliksirnika.',5);
    ins.run('companions-den','Kram Dzikich Towarzyszy & Chowańców','🦅','companions','Magiczne kruki Hrafn, puchacze śnieżne, lisy polarne oraz lodowe chowańce.',6);
    ins.run('vault-artifacts','Skarbiec Artefaktów i Amuletów Odyna','💍','artifacts','Relikty wczesnego średniowiecza, pierścienie walkirii i kompasy energii magicznej.',7);
    console.log('[DB] Seeded 8 shops.');
  }
}

{
  const futharkCount = db.prepare('SELECT COUNT(*) as c FROM futhark_runes').get().c;
  if (futharkCount === 0) {
    console.log('[DB] Seeding futhark runes...');
    const ins = db.prepare('INSERT INTO futhark_runes (id, rune_char, name, meaning, color, sort_order) VALUES (?,?,?,?,?,?)');
    const runes = [
      ['fehu','ᚠ','Fehu','Bogactwo, złoto i bydło','#c59f4e'],
      ['uruz','ᚢ','Uruz','Siła pierwotna, żubr lodowy','#e58f65'],
      ['thurisaz','ᚦ','Thurisaz','Cierń olbrzyma, burza','#c02b2b'],
      ['ansuz','ᚨ','Ansuz','Głos Odyna, mądrość bogów','#a77de0'],
      ['raidho','ᚱ','Raidho','Wyprawa drakkarem, podróż','#2ec4b6'],
      ['kenaz','ᚲ','Kenaz','Pochodnia, ogień kuźni','#eab308'],
      ['gebo','ᚷ','Gebo','Dar, więź braterstwa','#60a5fa'],
      ['wunjo','ᚹ','Wunjo','Radość i triumf klanu','#34d399'],
      ['hagalaz','ᚺ','Hagalaz','Arktyczny grad, przełamanie','#93c5fd'],
      ['nauthiz','ᚾ','Nauthiz','Przetrwanie w mrozie, wola','#f87171'],
      ['isa','ᛁ','Isa','Wieczny lód, skupienie','#38bdf8'],
      ['jera','ᛃ','Jera','Pomyślny cykl, zbiory','#4ade80'],
      ['eihwaz','ᛇ','Eihwaz','Święty cis, przejście dusz','#818cf8'],
      ['perthro','ᛈ','Perthro','Kości losu, tajemnica Wyrd','#c084fc'],
      ['algiz','ᛉ','Algiz','Rogi renifera, tarcza ochronna','#facc15'],
      ['sowilo','ᛊ','Sowilo','Słoneczne światło zórz','#fb923c'],
      ['tiwaz','ᛏ','Tiwaz','Sprawiedliwość Tyra, honor','#ef4444'],
      ['berkano','ᛒ','Berkano','Pąki brzozy, nowe życie','#a3e635'],
      ['ehwaz','ᛖ','Ehwaz','Wierny wierzchowiec, lojalność','#38bdf8'],
      ['mannaz','ᛗ','Mannaz','Społeczność czarodziejów','#fbbf24'],
      ['laguz','ᛚ','Laguz','Głębiny fiordu, intuicja','#06b6d4'],
      ['ingwaz','ᛜ','Ingwaz','Ziarno mocy, płodność ziemi','#86efac'],
      ['dagaz','ᛞ','Dagaz','Świt polarny, transformacja','#fef08a'],
      ['othala','ᛟ','Othala','Dziedzictwo krwi, Cytadela','#d97706']
    ];
    for (let i = 0; i < runes.length; i++) {
      ins.run(runes[i][0], runes[i][1], runes[i][2], runes[i][3], runes[i][4], i + 1);
    }
    console.log('[DB] Seeded 24 futhark runes.');
  }
}

// ==================== PROLOGUE KIT STORE ITEMS ====================
{
  // Idempotent: seed mandatory kit items if the store is empty
  const kitCount = db.prepare("SELECT COUNT(*) as c FROM store_items WHERE id LIKE 'kit-%'").get().c;
  if (kitCount === 0) {
    console.log('[DB] Seeding prologue kit store items...');
    const ins = db.prepare(`
      INSERT OR IGNORE INTO store_items
        (id, name, category, category_slug, shop_id, shop_name, price, icon, rarity, description, lore, placeholder_type)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    ins.run('kit-rozdzka','Różdżka Uczniowska — Cis i Rdzeń Smoczej Łuski','Różdżki','wands','wands-brokkur','Kuźnia Różdżek Brokkura & Oivinda',55,'🪄','Rzadki','Solidna różdżka uczniowska z drewna cisowego, rdzeniem z łuski smoka północy.','Każdy adept Durmstrangu zaczyna od jednej różdżki. Ta jest godna zarówno pierwszego zaklęcia, jak i ostatniej bitwy.','wand_nordic');
    ins.run('kit-szaty','Szaty Szkolne Durmstrangu (Zestaw Adepta)','Szaty & Opończe','robes','tailor-robes','Dom Krawiecki Nordyckich Opończy & Szat',45,'🧥','Zwykły','Komplet szat ceremonialnych i codziennych — ciemnogranatowe z runicznym haftem Twierdzy.','Szaty adeptów Durmstrangu są skrojone z wełny wzmocnionej ochronną runą Algiz.','robe_dark');
    ins.run('kit-podreczniki','Podstawowe Grimuary i Podręczniki (Komplet)','Grimuary & Księgi','books','antiquarian-books','Antykwariat Run i Zakazanych Ksiąg Snorriego',40,'📚','Zwykły','Zestaw podręczników obowiązkowych dla pierwszorocznych adeptów wszystkich Zakonów.','Wiedza to pierwsza broń czarodzieja. Pierwsza — i często decydująca.','book_grimoire');
    ins.run('kit-kociolek','Kociołek Alchemiczny ze Stali Nordyckiej (Typ III)','Wyposażenie Bojowe','equipment','apothecary-potions','Apteka Alchemiczna i Składnica Ziół Północy',30,'🫕','Zwykły','Kociołek odporny na temperatury aż do wrzenia magmy, z runicznym zabezpieczeniem przed eksplozją.','Bez kociołka żaden eliksir się nie uda. Bez dobrego kociołka — nawet herbata.','cauldron');
    ins.run('kit-fiolki','Zestaw Fiolek Szklanych z Korkowym Uszczelnieniem (×12)','Eliksiry & Toksyny','potions','apothecary-potions','Apteka Alchemiczna i Składnica Ziół Północy',20,'🧪','Zwykły','Dwanaście fiolek ze szkła magicznego, odpornych na większość substancji alchemicznych.','Zestaw startowy dla każdego, kto planuje warzyć, przechowywać lub — co gorsza — rzucać.','potion_vials');
    ins.run('kit-przybory','Przybory Piśmiennicze i Atrament Runiczno-Magiczny','Grimuary & Księgi','books','antiquarian-books','Antykwariat Run i Zakazanych Ksiąg Snorriego',15,'🖊️','Zwykły','Gęsie pióro, zapasowe stalówki i flakonik magicznego atramentu odpornego na zaklęcia usuwania.','Notatki adepta są tak ważne jak jego różdżka — zwłaszcza podczas egzaminów.','supplies_writing');
    console.log('[DB] Seeded 6 prologue kit store items.');
  }
}

// ==================== PROLOGUE KIT SHOPPING LIST ====================
{
  const kitListCount = db.prepare("SELECT COUNT(*) as c FROM shopping_lists WHERE id = 'list-prologue-kit'").get().c;
  if (kitListCount === 0) {
    console.log('[DB] Seeding prologue kit shopping list...');
    db.prepare(`
      INSERT OR IGNORE INTO shopping_lists
        (id, title, slug, subtitle, category, required_item_ids, reward_points, reward_skirnirs, icon, badge, lore)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      'list-prologue-kit',
      'Wyprawka Adepta Durmstrangu',
      'wyprawka-adepta',
      'Obowiązkowy ekwipunek pierwszorocznego adepta',
      'prologue',
      JSON.stringify(['kit-rozdzka','kit-szaty','kit-podreczniki','kit-kociolek','kit-fiolki','kit-przybory']),
      75,
      100,
      '🎒',
      'Gotowy Adept Durmstrangu',
      'Kto kompletuje wyprawkę przed wyruszeniem, nie wraca po nią w trakcie drogi.'
    );
    console.log('[DB] Seeded prologue kit shopping list.');
  }
}

// Salary config into school_config
{
  const salaryKeys = [
    ['salary_lesson_base_rate', '200'],
    ['salary_bonus_high_participation', '50'],
    ['salary_monthly_allowance', '600'],
    ['salary_currency_symbol', 'Skirnirów'],
    ['salary_currency_rune', 'ᛋ']
  ];
  for (const [key, val] of salaryKeys) {
    const existing = db.prepare('SELECT value FROM school_config WHERE key = ?').get(key);
    if (!existing) {
      db.prepare('INSERT INTO school_config (key, value) VALUES (?, ?)').run(key, val);
    }
  }
}

// ===================== HELPER FUNCTIONS =====================
// ===================== SEEDING FOR BANK, STORE, SHOPPING LISTS & LOTTERY =====================

const bankAccountCount = db.prepare('SELECT COUNT(*) as count FROM bank_accounts').get().count;
if (false && bankAccountCount === 0) {
  console.log('[DB] Seeding initial bank accounts and transactions...');

  const insertAccount = db.prepare(`
    INSERT INTO bank_accounts (id, user_id, user_name, vault_number, vault_tier, balance, security_level, rune_seal, guardian, interest_rate, opened_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAccount.run('vault-valdemar', 'usr-valdemar', 'Valdemar Krag-Hansen', 'SKR-782-RAVN', 'Skrytka Adepta Kręgu IV', 340, 'Maksymalny', 'Pieczęć Algiz & Kenaz', 'Górski Troll Granitowy (Brokk)', '2.5% rocznie', '2026-08-01');
  insertAccount.run('vault-morana', 'usr-morana', '', 'SKR-204-PROF', 'Krypta Profesorska Katedry Czarnej Magii', 1450, 'Rada Mistrzów', 'Pieczęć Thurisaz & Eihwaz', 'Zjawa Lodowcowa Strażnika Cieni', '4.0% rocznie', '2026-07-15');
  insertAccount.run('vault-gunnar', 'usr-gunnar', '', 'SKR-205-PROF', 'Zbrojownia Bankowa Ligi Bojowej', 1200, 'Rada Mistrzów', 'Pieczęć Tiwaz & Sowilo', 'Żelazny Golem Północy', '4.0% rocznie', '2026-07-20');
  insertAccount.run('vault-valgerda', 'usr-valgerda', 'Arcymistrzyni Valgerda Storm', 'SKR-001-DIR', 'Najwyższy Skarbiec Dyrekcji Durmstrang', 15400, 'Pakt 1294 (Nienaruszalny)', 'Pierwotna Pieczęć Othala & Dagaz', 'Pradawny Smok Szwedzki Krótkopyski', '6.0% rocznie', '2026-06-01');

  const insertTx = db.prepare(`
    INSERT INTO bank_transactions (id, sender_id, sender_name, recipient_id, recipient_name, amount, type, category, title, note, status, reference_code, date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTx.run('tx-skr-101', 'cytadela-treasury', 'Skarbiec Twierdzy', 'usr-valdemar', 'Valdemar Krag-Hansen', 150, 'inflow', 'stypendium', 'Stypendium Naukowe Katedry Czarnej Magii', 'Nagroda za wzorowe opanowanie wiązania cieni.', 'completed', 'SKR-TX-84920', '2026-08-20 14:30', '2026-08-20 14:30');
  insertTx.run('tx-skr-102', 'usr-valdemar', 'Valdemar Krag-Hansen', 'shop-brokkur', 'Kuźnia Różdżek Brokkura & Oivinda', 280, 'outflow', 'zakup', 'Zakup: Różdżka Cisowa (Wilcze Serce)', 'Płatność na rynku Kaupangr.', 'completed', 'SKR-TX-84711', '2026-08-19 11:15', '2026-08-19 11:15');
  insertTx.run('tx-skr-103', 'cytadela-treasury', 'Skarbiec Twierdzy', 'usr-morana', '', 300, 'inflow', 'pensja', 'Uposażenie Profesorskie — Lekcja: Wiązanie Cieni', 'Automatyczna wypłata honorarium.', 'completed', 'SKR-TX-84602', '2026-08-18 16:45', '2026-08-18 16:45');
  insertTx.run('tx-skr-104', 'cytadela-treasury', 'Skarbiec Twierdzy', 'usr-gunnar', '', 300, 'inflow', 'pensja', 'Uposażenie Profesorskie — Lekcja: Pojedynki na Lodzie', 'Automatyczna wypłata honorarium.', 'completed', 'SKR-TX-84590', '2026-08-17 17:00', '2026-08-17 17:00');
  insertTx.run('tx-skr-105', 'lottery-pool', 'Skandynawska Loteria Odyna', 'usr-valdemar', 'Valdemar Krag-Hansen', 120, 'inflow', 'loteria', 'Wygrana II Stopnia — Losowanie Letniego Przesilenia', 'Trafienie 2 run Futharku: Thurisaz i Algiz.', 'completed', 'SKR-TX-84310', '2026-08-15 20:00', '2026-08-15 20:00');
  insertTx.run('tx-skr-106', 'cytadela-treasury', 'Rada Dyrekcji Twierdzy', 'usr-valdemar', 'Valdemar Krag-Hansen', 100, 'inflow', 'nagroda_wyprawka', 'Nagroda za skompletowanie: Wyprawka Adepta Roku I', 'Premia za pomyślne przygotowanie do roku szkolnego.', 'completed', 'SKR-TX-84102', '2026-08-10 12:00', '2026-08-10 12:00');
}

const storeItemsCount = db.prepare('SELECT COUNT(*) as count FROM store_items').get().count;
if (false && storeItemsCount === 0) {
  console.log('[DB] Seeding store catalog items...');
  const insertItem = db.prepare(`
    INSERT INTO store_items (id, name, category, category_slug, shop_id, shop_name, price, icon, house_exclusive, rarity, description, lore, placeholder_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const SEED_STORE_DATA = [
    ['wand-ebony-dragon', 'Różdżka z Czarnego Hebanu i Włókna Smoka', 'Różdżki', 'wands', 'wands-brokkur', 'Kuźnia Różdżek Brokkura & Oivinda', 380, '🪄', null, 'Epicki', '12 cali, sztywna. Drzewo ścinane podczas zaćmienia księżyca w fiordach. Doskonała do magii bojowej.', 'Wykuta w kuźniach krasnoludzkiego mistrza Brokkura.', 'wand_dark'],
    ['wand-yew-kelpie', 'Różdżka z Cisu i Włosa Kelpie', 'Różdżki', 'wands', 'wands-brokkur', 'Kuźnia Różdżek Brokkura & Oivinda', 350, '🪄', null, 'Rzadki', '11 i 3/4 cala, sprężysta. Posiada naturalne powinowactwo do zaklęć mroku i manipulacji wodą.', 'Cis z cmentarza założycieli Durmstrangu.', 'wand_ancient'],
    ['wand-ash-phoenix', 'Różdżka z Arktycznego Jesionu i Pióra Kruka Północy', 'Różdżki', 'wands', 'wands-brokkur', 'Kuźnia Różdżek Brokkura & Oivinda', 420, '🪄', 'ravnheim', 'Legendarne', '13 cali, nieustępliwa. Przeznaczona dla adeptów wieszczenia i nekromancji.', 'Wyryto na niej trzy runy mądrości Odyna: Ansuz, Kenaz i Perthro.', 'wand_runic'],
    ['wand-bone-bear', 'Różdżka z Kości Morsusa i Ścięgna Niedźwiedzia Jaskiniowego', 'Różdżki', 'wands', 'wands-brokkur', 'Kuźnia Różdżek Brokkura & Oivinda', 390, '🪄', 'bjornhall', 'Epicki', '13 i pół cala, masywna i ciężka. Niezwykle potężna przy zaklęciach uderzeniowych.', 'Zahartowana w ciekłym ołowiu i śniegu.', 'wand_bone'],
    ['robe-fur-durmstrang', 'Opończa z Wilczego Futra i Szkarłatnego Sukna', 'Szaty & Opończe', 'robes', 'tailor-robes', 'Dom Krawiecki Nordyckich Opończy & Szat', 220, '🧥', null, 'Niezbędny', 'Oficjalna, zimowa opończa kadetów Durmstrangu. Podbita gęstym futrem wilka polarnego.', 'Chroni przed mrozem do -40°C.', 'robe_fur'],
    ['robe-reindeer-blood', 'Rytualna Szata Zakonu Renifera', 'Szaty & Opończe', 'robes', 'tailor-robes', 'Dom Krawiecki Nordyckich Opończy & Szat', 310, '🦌', 'reinhall', 'Rzadki', 'Głębokie bordo obszyte starym złotem i kościanymi guzikami z poroża.', 'Tkana na zabytkowych krosnach rodowych w Laponii.', 'robe_reindeer'],
    ['robe-bear-iron', 'Pancerz Kolczy Zakonu Niedźwiedzia', 'Szaty & Opończe', 'robes', 'tailor-robes', 'Dom Krawiecki Nordyckich Opończy & Szat', 340, '🐻', 'bjornhall', 'Rzadki', 'Płaszcz wzmocniony lekkimi pierścieniami z żelaza meteorytowego.', 'Każdy pierścień zahartowany w popiele z pieca bojowego.', 'robe_armor'],
    ['robe-raven-shadow', 'Płaszcz Nocnego Cienia Kruka', 'Szaty & Opończe', 'robes', 'tailor-robes', 'Dom Krawiecki Nordyckich Opończy & Szat', 330, '🦅', 'ravnheim', 'Rzadki', 'Aksamitna czerń z fioletowym połyskiem i srebrnymi haftami gwiazdozbiorów.', 'Przesiąknięty esencją nocy polarnej.', 'robe_shadow'],
    ['robe-otter-aqua', 'Opończa Alchemiczna Zakonu Wydry', 'Szaty & Opończe', 'robes', 'tailor-robes', 'Dom Krawiecki Nordyckich Opończy & Szat', 290, '🦦', 'otergard', 'Rzadki', 'Impregnowana woskiem ze skrzeli kelpie, całkowicie odporna na żrące wyziewy.', 'Wyposażona w 12 wewnętrznych kieszeni na probówki.', 'robe_alchemist'],
    ['book-shadow-grimoire', 'Grimuar Pradawnych Cieni Północy', 'Księgi & Zwoje', 'books', 'antiquarian-books', 'Antykwariat Run i Zakazanych Ksiąg Snorriego', 260, '📖', null, 'Rzadki', 'Oprawiona w skórę lewiatana księga z zapiskami pierwszych mistrzów nekromancji.', 'Strony księgi szepczą w całkowitym mroku.', 'book_shadow'],
    ['book-rune-codex', 'Kodeks Futharku Starszego — Edycja Granitowa', 'Księgi & Zwoje', 'books', 'antiquarian-books', 'Antykwariat Run i Zakazanych Ksiąg Snorriego', 190, '📜', null, 'Niezbędny', 'Najpełniejsze kompendium inskrypcji ochronnych, formuł kowalskich i run bojowych.', 'Zawiera glosy samej Neridy Vulchanovej.', 'book_runic'],
    ['book-forbidden-alchemy', 'Zakazana Alchemia Lodowców', 'Księgi & Zwoje', 'books', 'antiquarian-books', 'Antykwariat Run i Zakazanych Ksiąg Snorriego', 280, '📕', 'otergard', 'Epicki', 'Zawiera 48 tajnych receptur na eliksiry transmutacyjne i jady paralityczne.', 'Egzemplarz odzyskany z zatopionego drakkara.', 'book_alchemy'],
    ['item-cauldron-iron', 'Kociołek z Kutego Żelaza Meteorytowego (Rozmiar 2)', 'Eliksiry & Toksyny', 'potions', 'apothecary-potions', 'Apteka Alchemiczna i Składnica Ziół Północy', 110, '🫕', null, 'Niezbędny', 'Odporny na najwyższe temperatury alchemicznego ognia błękitnego kociołek.', 'Niezbędny element wyprawki każdego adepta.', 'potion_cauldron'],
    ['item-phial-crystal', 'Zestaw 6 Fiolek z Lodowego Kryształu', 'Eliksiry & Toksyny', 'potions', 'apothecary-potions', 'Apteka Alchemiczna i Składnica Ziół Północy', 45, '🧪', null, 'Niezbędny', 'Hermetycznie zamykane fiolki odporne na substancje silnie korodujące.', 'Wytapiane w hutach szkła na Lofotach.', 'potion_phials'],
    ['potion-frost-sight', 'Wyciąg Północnego Widzenia (Fiolka 100ml)', 'Eliksiry & Toksyny', 'potions', 'apothecary-potions', 'Apteka Alchemiczna i Składnica Ziół Północy', 75, '🧪', null, 'Zwykły', 'Pozwala widzieć aurę magiczną i ukryte ślady przez najgęstszą śnieżycę.', 'Sporządzony na bazie oczu sowy śnieżnej.', 'potion_frost'],
    ['potion-berserk-blood', 'Mikstura Szału Żelaznego Niedźwiedzia', 'Eliksiry & Toksyny', 'potions', 'apothecary-potions', 'Apteka Alchemiczna i Składnica Ziół Północy', 130, '🍷', 'bjornhall', 'Rzadki', 'Uodparnia ciało na ból fizyczny i podwaja siłę zaklęć uderzeniowych.', 'Tradycyjny napój bojowy wikingów-czarodziejów.', 'potion_berserk'],
    ['potion-essence-shadow', 'Esencja Płynnego Cienia', 'Eliksiry & Toksyny', 'potions', 'apothecary-potions', 'Apteka Alchemiczna i Składnica Ziół Północy', 150, '🧪', 'ravnheim', 'Epicki', 'Pozwala na bezcielesne przenikanie przez kamienne mury Cytadeli.', 'Destylowana z miazgi grzybów z najgłębszych krypt.', 'potion_shadow'],
    ['item-duel-gauntlets', 'Rękawice Pojedynkowe ze Skóry Mantikory', 'Wyposażenie Bojowe', 'equipment', 'armory-equipment', 'Zbrojownia Północy & Wyposażenie Pojedynkowe', 195, '🧤', null, 'Rzadki', 'Wzmocnione srebrnymi nićmi mankiety absorbujące odbite zaklęcia.', 'Niezbędne w turniejach Hólmganga.', 'equipment_gauntlets'],
    ['item-dragon-boots', 'Buty Wyprawowe z Łusek Szwedzkiego Smoka', 'Wyposażenie Bojowe', 'equipment', 'armory-equipment', 'Zbrojownia Północy & Wyposażenie Pojedynkowe', 240, '🥾', null, 'Epicki', 'Całkowicie nieprzemakalne, odporne na płynną magmę i lód.', 'Uszyte przez mistrzów garbarstwa z Tromsø.', 'equipment_boots'],
    ['item-potion-belt', 'Pas Taktyczny Alchemika na 8 Fiolek', 'Wyposażenie Bojowe', 'equipment', 'armory-equipment', 'Zbrojownia Północy & Wyposażenie Pojedynkowe', 135, '🥋', null, 'Rzadki', 'Wykonany z grubej skóry morsa z amortyzowanymi gniazdami na probówki.', 'Umożliwia błyskawiczne dobycie antidotum.', 'equipment_belt'],
    ['pet-shadow-raven', 'Kruk Północny (Hrafn Posłaniec)', 'Towarzysze', 'companions', 'companions-den', 'Kram Dzikich Towarzyszy & Chowańców', 450, '🦅', null, 'Epicki', 'Inteligentny ptak o czarnym upierzeniu, potrafiący przenosić zakodowane wiadomości.', 'Potomkowie kruków Hugina i Munina.', 'pet_raven'],
    ['pet-polar-fox', 'Lis Polarny ze Śnieżnych Turni', 'Towarzysze', 'companions', 'companions-den', 'Kram Dzikich Towarzyszy & Chowańców', 400, '🦊', null, 'Rzadki', 'Zwinny i bystry kompan o białym futrze. Wykrywa ukryte przejścia.', 'Żywią się jagodami nasyconymi magią zórz.', 'pet_fox'],
    ['pet-ice-owl', 'Puchacz Śnieżny Mroźnego Urwiska', 'Towarzysze', 'companions', 'companions-den', 'Kram Dzikich Towarzyszy & Chowańców', 370, '🦉', null, 'Rzadki', 'Majestatyczny drapieżnik o złotych ślepiach, latający bezszelestnie.', 'Ulubiony towarzysz posłańców dyrekcji.', 'pet_owl'],
    ['pet-wolf-frost', 'Szczenię Wilka Lodowcowego', 'Towarzysze', 'companions', 'companions-den', 'Kram Dzikich Towarzyszy & Chowańców', 590, '🐺', 'bjornhall', 'Legendarne', 'Wierny obrońca o błękitnych ślepiach, którego oddech zamraża wodę.', 'Tradycyjny strażnik prymusów Zakonu Niedźwiedzia.', 'pet_wolf'],
    ['artifact-valkyrie-ring', 'Pierścień Oddechu Walkirii', 'Artefakty & Talizmany', 'artifacts', 'vault-artifacts', 'Skarbiec Artefaktów i Amuletów Odyna', 520, '💍', null, 'Legendarne', 'Srebrny pierścień manifestujący lodową barierę w momencie zaskoczenia.', 'Wykuty we wczesnym średniowieczu.', 'artifact_ring'],
    ['artifact-blood-pendant', 'Amulet Krwawego Porozumienia', 'Artefakty & Talizmany', 'artifacts', 'vault-artifacts', 'Skarbiec Artefaktów i Amuletów Odyna', 360, '📿', 'reinhall', 'Epicki', 'Kropla zakrzepłej krwi pra-renifera oprawiona w surowe złoto.', 'Zwiększa moc zaklęć ochronnych o 25%.', 'artifact_pendant'],
    ['artifact-mercury-compass', 'Kompas Ręcznej Rtęci', 'Artefakty & Talizmany', 'artifacts', 'vault-artifacts', 'Skarbiec Artefaktów i Amuletów Odyna', 240, '🧭', 'otergard', 'Rzadki', 'Wskazuje najbliższe stężenie czystej energii magicznej.', 'Wynaleziony przez alchemika Snorriego w 1604 roku.', 'artifact_compass']
  ];

  for (const item of SEED_STORE_DATA) {
    insertItem.run(...item);
  }
}

const shoppingListsCount = db.prepare('SELECT COUNT(*) as count FROM shopping_lists').get().count;
if (false && shoppingListsCount === 0) {
  console.log('[DB] Seeding shopping lists...');
  const insertList = db.prepare(`
    INSERT INTO shopping_lists (id, title, slug, subtitle, category, required_item_ids, reward_points, reward_skirnirs, icon, badge, lore)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertList.run('list-year1-starter', 'Oficjalna Wyprawka Adepta Roku I', 'year1-starter', 'Niezbędne wyposażenie każdego nowicjusza przekraczającego wrota Durmstrangu.', 'Wyprawki Szkolne', JSON.stringify(['robe-fur-durmstrang', 'book-rune-codex', 'wand-yew-kelpie', 'item-cauldron-iron', 'item-phial-crystal']), 60, 100, '📜', 'Adept Przygotowany', '„Żaden adept nie przekroczy progu Wielkiej Sali bez ciepłego wilczego futra, różdżki i świętego kodeksu runów.”');
  insertList.run('list-alchemy-master', 'Zestaw Młodego Toksykologa i Alchemika', 'alchemy-master', 'Sprzęt laboratoryjny i rzadkie komponenty do warzenia lodowych destylatów.', 'Specjalizacje Naukowe', JSON.stringify(['item-cauldron-iron', 'item-phial-crystal', 'potion-frost-sight', 'book-forbidden-alchemy', 'robe-otter-aqua']), 85, 140, '🧪', 'Mistrz Tyglu Północy', 'Przeznaczony dla adeptów Katedry Eliksirów i Toksyn oraz Zakonu Otergard.');
  insertList.run('list-holmgang-warrior', 'Rynsztunek Bojowy Wojownika Hólmganga', 'holmgang-warrior', 'Komplet ochronny i wzmacniający do starć na lodowej arenie pojedynkowej.', 'Liga Bojowa', JSON.stringify(['wand-ebony-dragon', 'robe-bear-iron', 'potion-berserk-blood', 'artifact-valkyrie-ring', 'item-duel-gauntlets']), 110, 200, '⚔️', 'Szermierz Runiczny', 'Pieczętowany przez Mistrza Broni Gunnara Vargsona.');
  insertList.run('list-shadow-infiltrator', 'Rytualne Wyposażenie Kręgu Cienia & Nekromancji', 'shadow-infiltrator', 'Narzędzia i grimuary dla adeptów badających mroczne anomalie i wiązanie dusz.', 'Czarna Magia', JSON.stringify(['wand-ash-phoenix', 'robe-raven-shadow', 'book-shadow-grimoire', 'potion-essence-shadow', 'artifact-blood-pendant']), 120, 220, '🔮', 'Władca Cieni', 'Księgi i szaty przesiąknięte magią nocy polarnej.');
  insertList.run('list-arctic-explorer', 'Wyprawa na Północne Bezdroża i Fiordy', 'arctic-explorer', 'Zestaw przetrwania w wiecznej zmarzlinie oraz magiczny przewodnik.', 'Eksploracja', JSON.stringify(['robe-fur-durmstrang', 'potion-frost-sight', 'artifact-mercury-compass', 'pet-shadow-raven', 'item-dragon-boots']), 95, 160, '🧭', 'Tropiciel Zórz', 'Dla śmiałków wyruszających badać lodowce Jostedal.');
}

const lotteryRoundsCount = db.prepare('SELECT COUNT(*) as count FROM lottery_rounds').get().count;
if (false && lotteryRoundsCount === 0) {
  console.log('[DB] Seeding lottery rounds and tickets...');
  const insertRound = db.prepare(`
    INSERT INTO lottery_rounds (id, round_number, title, description, ticket_price, jackpot, bonus_house_points, status, end_date, winning_runes, total_tickets_sold, participants_count, winners_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRound.run('round-current', 42, 'Wielkie Losowanie Zorzy Północnej (Nocne Przesilenie)', 'Wybierz 3 runy z prastarego Futharku Starszego. Traf wszystkie 3, aby zdobyć Główny Skarbiec Odyna!', 20, 2850, 100, 'active', '2026-08-30T21:00:00.000Z', '[]', 85, 28, '[]');
  insertRound.run('round-41', 41, 'Święto Ognia Kuźni Brokkura', 'Losowanie na otwarcie jarmarku jesiennego.', 20, 2400, 100, 'completed', '2026-08-15T20:00:00.000Z', JSON.stringify(['thurisaz', 'algiz', 'fehu']), 72, 24, JSON.stringify([
    { tier: 'I Miejsce (3 Runy)', winnerName: 'Einar Lodowy Cień', house: 'ravnheim', prizeSkirnirs: 1440, prizePoints: 100, runes: ['thurisaz', 'algiz', 'fehu'] },
    { tier: 'II Miejsce (2 Runy)', winnerName: 'Valdemar Krag-Hansen', house: 'ravnheim', prizeSkirnirs: 120, prizePoints: 40, runes: ['thurisaz', 'algiz', 'kenaz'] },
    { tier: 'II Miejsce (2 Runy)', winnerName: 'Astrid Reinhall', house: 'reinhall', prizeSkirnirs: 120, prizePoints: 40, runes: ['algiz', 'fehu', 'ansuz'] }
  ]));

  const insertTicket = db.prepare(`
    INSERT INTO lottery_tickets (id, round_id, user_id, user_name, house, chosen_runes, purchased_at, matches_count, prize_won, claimed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTicket.run('ticket-valdemar-1', 'round-current', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', JSON.stringify(['ansuz', 'perthro', 'algiz']), '2026-08-21 16:30', 0, 0, 0);
  insertTicket.run('ticket-valdemar-2', 'round-current', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', JSON.stringify(['fehu', 'sowilo', 'dagaz']), '2026-08-22 10:15', 0, 0, 0);
}

// ===================== SEEDING FOR DOCUMENTS, CMS, EVENTS, ETC. =====================

const documentsCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
if (false && documentsCount === 0) {
  console.log('[DB] Seeding official documents & edicts...');
  const insertDoc = db.prepare(`
    INSERT INTO documents (id, slug, category, category_label, number, title, subtitle, author, author_role, date, seal_type, icon_name, severity, summary, content, tags, is_official, is_pinned, cover_image, rune)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDoc.run(
    'decree-1',
    'dekret-zakaz-magii-cienia-dormitoria',
    'dekrety',
    'Dekret Dyrekcji',
    'I/XIX',
    'Dekret nr I/XIX: O Bezwzględnym Zakazie Rzucania Klątw Cienia w Dormitoriach',
    'Rozporządzenie w sprawie bezpieczeństwa strefy mieszkalnej adeptów',
    'Najwyższa Rada Mistrzów & Dyrekcja TMD',
    'Arcymistrz Dyrekcji',
    '1 września XIX Roku Szkolnego',
    'gold',
    'ShieldAlert',
    'wysoki',
    'Zakaz praktykowania niewerbalnych uroków niszczących oraz ewokacji cieni poza zabezpieczonymi salami ćwiczebnymi.',
    JSON.stringify([
      { type: 'callout', variant: 'danger', title: 'MOC PRAWNA I WYMOGI BEZPIECZEŃSTWA', text: 'Na mocy decyzji Arcymistrza Dyrekcji z dniem 1 września XIX Roku Szkolnego wprowadza się bezwzględny rygor ochronny w skrzydłach mieszkalnych wszystkich czterech Zakonów.' },
      { type: 'heading', text: '§ 1. Zakres Obostrzenia' },
      { type: 'paragraph', text: '1. Zabrania się wszelkich prób rzucania uroków z zakresu Magii Cienia, Klątw Tkankowych, Nekromancji Użytkowej oraz manipulacji temperaturą poniżej -30°C w obrębie Komnat Wspólnych oraz sypialni Zakonów Reinhall, Björnhall, Ravnheim oraz Otergard.' },
      { type: 'paragraph', text: '2. Wszelkie eksperymenty runiczne i transmutacje żywiołów wolno przeprowadzać wyłącznie w Warsztacie Runicznym (Galdrastofa), Laboratoriach Katedry Alchemii lub w obecności uprawnionego Profesora.' },
      { type: 'heading', text: '§ 2. Sankcje Dyscyplinarne' },
      { type: 'list', items: ['Pierwsze naruszenie: Utrata 50 punktów dla macierzystego Zakonu oraz tydzień aresztu w Skalnym Bastionie.', 'Drugie naruszenie: Konfiskata różdżki i artefaktów na okres 14 dni oraz chłosta runiczna pod okiem Strażnika.', 'Trzecie naruszenie: Natychmiastowe postawienie przed Trybunałem Krwi i wydalenie z Cytadeli.'] }
    ]),
    JSON.stringify(['Dekret', 'Dyscyplina', 'Bezpieczeństwo', 'Dormitoria']),
    1,
    1,
    'https://media.discordapp.net/attachments/1540707859296161804/1540995757992054794/cm.jpg?ex=6a8bfba3&is=6a8aaa23&hm=31e7543b85e23f8b4f36c09796dcf210c189092898e91c0be721fbf28fc395c6&=&format=webp',
    'ᚦ'
  );

  insertDoc.run(
    'decree-2',
    'inauguracja-xix-roku-szkolnego',
    'dekrety',
    'Edykt Inauguracyjny',
    'II/XIX',
    'Edykt nr II/XIX: Uroczysta Inauguracja XIX Roku Szkolnego i Otwarcie Kramów Kaupangr',
    'Powołanie nowych Katedr Magii Północy oraz otwarcie Skarbca Odyna',
    'Arcymistrzyni Valgerda Storm',
    'Dyrektor Cytadeli Durmstrang',
    '1 września XIX Roku Szkolnego',
    'gold',
    'Scroll',
    'normalny',
    'Oficjalne ogłoszenie harmonogramu zajęć, przydziału stypendiów w Skirnirach oraz inauguracji Turnieju Żelaznego Kręgu.',
    JSON.stringify([
      { type: 'heading', text: 'Proklamacja Rady Mistrzów' },
      { type: 'paragraph', text: 'Niechaj mróz hartuje wolę adeptów, a ogień wiedzy płonie w sercach wojowników i mędrców. Niniejszym ogłasza się otwarcie bram Twierdzy dla nowego rocznika adeptów.' }
    ]),
    JSON.stringify(['Inauguracja', 'Edykt', 'Dyrekcja', 'XIX Rok']),
    1,
    1,
    'https://media.discordapp.net/attachments/1540707859296161804/1540995756285108254/Harry_Potter_-_Professor_Flitwick_teaches_charms.jpg?ex=6a8bfba2&is=6a8aaa22&hm=2b1a57188e70d57fcae5ffc6d892662319c5d82cabeb42738c7422ca0fa52cbd&=&format=webp',
    'ᛟ'
  );

  insertDoc.run(
    'statut-1',
    'statut-cytadeli-durmstrang',
    'statut',
    'Statut Główny',
    'STATUT-1294',
    'Statut i Wieczny Pakt Cytadeli Durmstrang z Roku 1294',
    'Zbiór fundamentalnych praw, struktura Zakonów i hierarchia Mistrzów',
    'Wielka Rada Założycieli',
    'Rada Założycielska',
    'Pakt 1294 (z nowelizacją 2026)',
    'gold',
    'BookOpen',
    'krytyczny',
    'Fundamentalny kodeks prawny określający prawa i obowiązki każdego mieszkańca Twierdzy Durmstrang.',
    JSON.stringify([
      { type: 'heading', text: 'Rozdział I: Tożsamość i Suwerenność Twierdzy' },
      { type: 'paragraph', text: 'TWIERDZA MAGII DURMSTRANG jest niezależną twierdzą sztuk magicznych, chronioną przez pradawne pieczęcie lodowe i przysięgę czterech Zakonów: Reinhall, Björnhall, Ravnheim oraz Otergard.' }
    ]),
    JSON.stringify(['Statut', 'Pakt 1294', 'Konstytucja', 'Prawo']),
    1,
    1,
    '',
    'ᛗ'
  );

  insertDoc.run(
    'discord-rules-1',
    'kodeks-serwera-discord',
    'regulamin-dc',
    'Regulamin Discorda',
    'DC-RULES',
    'Kodeks i Regulamin Oficjalnego Węzła Discord Twierdzy',
    'Zasady panujące na serwerze społeczności, kanałach RPG i strefach głosowych',
    'Naczelna Administracja TMD',
    'Administrator Techniczny',
    '2026-08-20',
    'silver',
    'MessageSquare',
    'wysoki',
    'Wytyczne dotyczące netykiety, pisania w wątkach lekcyjnych, komend bota oraz zasad Roleplay.',
    JSON.stringify([
      { type: 'heading', text: '1. Zasady Ogólne i Szacunek' },
      { type: 'paragraph', text: 'Na wszystkich kanałach obowiązuje kultura wypowiedzi i poszanowanie innych uczestników społeczności.' },
      { type: 'heading', text: '2. Wątki Lekcyjne i Komendy Bota' },
      { type: 'paragraph', text: 'Podczas trwania oficjalnych lekcji na kanałach katedr obowiązuje bezwzględne podporządkowanie prowadzącemu Profesorowi.' }
    ]),
    JSON.stringify(['Discord', 'Regulamin', 'RPG', 'Zasady']),
    1,
    1,
    '',
    'ᛋ'
  );

  insertDoc.run(
    'games-desc-1',
    'przewodnik-po-zabawach-i-turniejach',
    'zabawy',
    'Księga Gier i Zabaw',
    'GAMES-XIX',
    'Kodeks Gier, Turniejów Bojowych i Wyzwań Cytadeli',
    'Opis mechanik: Hólmgang, Ołtarz Runiczny, Kocioł Alchemiczny i Loteria Odyna',
    'Mistrz Gry & Prefekci Zakonów',
    'Rada Zabaw i Turniejów',
    'XIX Rok Szkolny',
    'bronze',
    'Gamepad2',
    'normalny',
    'Szczegółowy podręcznik zasad zdobywania punktów w minigrach, rzutów kośćmi k20 i nagród w Skirnirach.',
    JSON.stringify([
      { type: 'heading', text: 'I. Pojedynki Hólmgang' },
      { type: 'paragraph', text: 'Pojedynki odbywają się na lodowym ringu. Każdy adept ma prawo wyzwać rywala na ubitej ziemi pod nadzorem Profesora.' }
    ]),
    JSON.stringify(['Gry', 'Zabawy', 'Hólmgang', 'Turnieje']),
    1,
    0,
    '',
    'ᛏ'
  );
}

const bannersCount = db.prepare('SELECT COUNT(*) as count FROM cms_banners').get().count;
if (bannersCount === 0) {
  console.log('[DB] Seeding CMS category banners...');
  const insertBanner = db.prepare(`
    INSERT INTO cms_banners (id, category_name, default_script, theme_color, description, bg_gradient, bg_type, bg_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const SEED_BANNERS = [
    ['eliksiry', 'Eliksiry & Alchemia', 'eliksiry', '#4cc9f0', 'Katedra Eliksirów, destylacja wywarów i alchemia mroźna', 'radial-gradient(circle at 50% 60%, rgba(14, 28, 48, 0.95) 0%, rgba(4, 8, 14, 0.98) 100%)', 'potions', 'https://media.discordapp.net/attachments/1540707859296161804/1541001474392203304/An82NrY.png?ex=6a8c00f5&is=6a8aaf75&hm=9ec70e4e7fd7c7072e45480c16c17962b8f6df5827ce5dd63c971579ac7b124e&=&format=webp&quality=lossless'],
    ['edykty', 'Edykty Dyrekcji', 'edykty dyrekcji', 'var(--gold-ancient)', 'Oficjalne dekrety, inauguracje i zarządzenia Rady Mistrzów', 'radial-gradient(circle at 50% 60%, rgba(38, 28, 12, 0.95) 0%, rgba(6, 6, 8, 0.98) 100%)', 'citadel', 'https://media.discordapp.net/attachments/1540707859296161804/1540995756285108254/Harry_Potter_-_Professor_Flitwick_teaches_charms.jpg?ex=6a8bfba2&is=6a8aaa22&hm=2b1a57188e70d57fcae5ffc6d892662319c5d82cabeb42738c7422ca0fa52cbd&=&format=webp'],
    ['czarna-magia', 'Czarna Magia & Klątwy', 'czarna magia', '#b18cfe', 'Klątwy, pętanie cieni, nekromancja i rytuały północy', 'radial-gradient(circle at 50% 60%, rgba(28, 14, 46, 0.95) 0%, rgba(4, 3, 8, 0.98) 100%)', 'shadow', 'https://media.discordapp.net/attachments/1540707859296161804/1540995757992054794/cm.jpg?ex=6a8bfba3&is=6a8aaa23&hm=31e7543b85e23f8b4f36c09796dcf210c189092898e91c0be721fbf28fc395c6&=&format=webp&width=3072&height=1445'],
    ['liga-bojowa', 'Liga Bojowa & Hólmganga', 'liga bojowa', '#ff5c5c', 'Pojedynki na lodzie, turnieje szermierki i magia defensywna', 'radial-gradient(circle at 50% 60%, rgba(44, 14, 14, 0.95) 0%, rgba(8, 3, 3, 0.98) 100%)', 'duel', 'https://media.discordapp.net/attachments/1540707859296161804/1540995756603867166/B4C34M1Z2_The_Golden_Thread.jpg?ex=6a8bfba2&is=6a8aaa22&hm=e83c10d24847e06a8a473b087794dfc1aa3752fdc9c9b9fa2d2334312baabad4&=&format=webp'],
    ['starozytne-runy', 'Starożytne Runy', 'starozytne runy', '#2ec4b6', 'Wykucie formuł runicznych (Galdr), inskrypcje i monolity', 'radial-gradient(circle at 50% 60%, rgba(10, 36, 34, 0.95) 0%, rgba(3, 8, 8, 0.98) 100%)', 'runes', 'https://media.discordapp.net/attachments/1540707859296161804/1541000968911589447/IMG_0914.jpg?ex=6a8c007d&is=6a8aaefd&hm=95b03e770a59ed2b328d39b07802e7312ec857bbb7acde2adc5980897eb4fda8&=&format=webp'],
    ['astronomia', 'Astronomia & Astromagia', 'astronomia', '#a4c8e1', 'Pomiary zorzy polarnej, pływy eteryczne i przesilenia', 'radial-gradient(circle at 50% 60%, rgba(16, 26, 44, 0.95) 0%, rgba(4, 6, 12, 0.98) 100%)', 'aurora', ''],
    ['oceny', 'Wyniki Ocen & Egzaminy', 'oceny', '#eecf82', 'Wykazy semestralne, certyfikaty biegłości i traktaty', 'radial-gradient(circle at 50% 60%, rgba(32, 26, 16, 0.95) 0%, rgba(6, 6, 6, 0.98) 100%)', 'scrolls', ''],
    ['wieści-zakonne', 'Wieści Zakonne', 'wiesci zakonne', '#c59f4e', 'Komunikaty Zakonów: Reinhall, Björnhall, Ravnheim, Otergard', 'radial-gradient(circle at 50% 60%, rgba(24, 20, 28, 0.95) 0%, rgba(5, 5, 8, 0.98) 100%)', 'houses', ''],
    ['zielarstwo', 'Zielarstwo & Flora Mroźna', 'zielarstwo', '#52b788', 'Krioflora, korzenie mandragory polarnej i szklarnie', 'radial-gradient(circle at 50% 60%, rgba(14, 34, 22, 0.95) 0%, rgba(3, 8, 5, 0.98) 100%)', 'herbs', '']
  ];

  for (const b of SEED_BANNERS) {
    insertBanner.run(...b);
  }
}

const blockGraphicsCount = db.prepare('SELECT COUNT(*) as count FROM cms_block_graphics').get().count;
if (blockGraphicsCount === 0) {
  console.log('[DB] Seeding CMS block graphics...');
  const insertBlock = db.prepare(`
    INSERT INTO cms_block_graphics (id, title, location, rune, default_icon, color, bg_image, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const SEED_BLOCKS = [
    ['identity', 'Karta Tożsamości / Kancelaria', 'Lewy Panel (Góra)', 'ᛟ', 'Shield', 'var(--gold-ancient)', 'https://media.discordapp.net/attachments/1540707859296161804/1540995756285108254/Harry_Potter_-_Professor_Flitwick_teaches_charms.jpg?ex=6a8bfba2&is=6a8aaa22&hm=2b1a57188e70d57fcae5ffc6d892662319c5d82cabeb42738c7422ca0fa52cbd&=&format=webp', 'Nagłówek profilu adepta, logowania i statusu'],
    ['activities', 'Gry & Aktywności RPG', 'Lewy Panel', 'ᛏ', 'Zap', 'var(--gold-ancient)', 'https://media.discordapp.net/attachments/1540707859296161804/1541000126305411072/some-of-my-favorite-pottermore-art-v0-u8isy9ap2hoa1.png?ex=6a8bffb4&is=6a8aae34&hm=d308bdc0d55aeb24dfaf67a2e69d6ecd8474f07d4ef61ff5da75a0f38375d4ca&=&format=webp&quality=lossless', 'Nagłówek sekcji minigier, wyroczni i pojedynków'],
    ['admissions', 'Komisja Rekrutacyjna', 'Lewy Panel', 'ᛉ', 'Sparkles', '#a4c8e1', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80', 'Nagłówek panelu podań i rekrutacji do Cytadeli'],
    ['curriculum', 'Dziś w Cytadeli / Plan Lekcji', 'Lewy Panel', 'ᛇ', 'BookOpen', 'var(--gold-ancient)', 'https://media.discordapp.net/attachments/1540707859296161804/1541001194430795876/iNaw1jc.png?ex=6a8c00b3&is=6a8aaf33&hm=a9f237e182ec99604cc5c7c1c70d4ecc72b7062b4767087a94f1ed8a154ab9a2&=&format=webp&quality=lossless', 'Nagłówek dziennego rozkładu katedr i zajęć'],
    ['ceremony', 'Kamień Przysięgi (Ceremonia)', 'Lewy Panel (Dół)', 'ᛗ', 'Flame', '#ff9e9e', '', 'Nagłówek przydziału do Zakonu i rytuału krwi'],
    ['atmosphere', 'Aura & Atmosfera Cytadeli', 'Prawy Panel (Góra)', 'ᛋ', 'Sparkles', 'var(--gold-ancient)', 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&auto=format&fit=crop&q=80', 'Nagłówek panelu dźwięków ASMR, zorzy i lumos'],
    ['bulletin', 'Edykty & Kronika Twierdzy', 'Prawy Panel', 'ᚱ', 'Radio', '#eecf82', 'https://media.discordapp.net/attachments/1540707859296161804/1541001474392203304/An82NrY.png?ex=6a8c00f5&is=6a8aaf75&hm=9ec70e4e7fd7c7072e45480c16c17962b8f6df5827ce5dd63c971579ac7b124e&=&format=webp&quality=lossless', 'Nagłówek biuletynu informacyjnego i edyktów'],
    ['house_cup', 'Puchar Czterech Zakonów', 'Prawy Panel', 'ᚦ', 'Award', 'var(--gold-ancient)', 'https://media.discordapp.net/attachments/1540707859296161804/1540995756603867166/B4C34M1Z2_The_Golden_Thread.jpg?ex=6a8bfba2&is=6a8aaa22&hm=e83c10d24847e06a8a473b087794dfc1aa3752fdc9c9b9fa2d2334312baabad4&=&format=webp', 'Nagłówek rankingu punktowego domów']
  ];

  for (const blk of SEED_BLOCKS) {
    insertBlock.run(...blk);
  }
}

const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
if (false && eventsCount === 0) {
  console.log('[DB] Seeding calendar events...');
  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, date, type, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertEvent.run('event-yule', 'Święto Przesilenia Zimowego (Yule-Blót)', '21 Grudnia 2026', 'Święto Tradycyjne', 'Najważniejsze święto północy. Rozpalenie Nowego Ognia, uczta dziczyzny z fiordów, śpiewanie pieśni założycieli i całonocne tańce z pochodniami.');
  insertEvent.run('event-duel-cup', 'Wielki Turniej Żelaznego Pazura (Pojedynki)', '10 Października 2026', 'Turniej Bojowy', 'Oficjalne mistrzostwa Cytadeli w szermierce różdżkowej i magii bojowej. Zwycięzca otrzymuje tytuł Mistrza Żelaznego Kręgu.');
  insertEvent.run('event-alch-exp', 'Sympozjum Nocnych Destylacji (Alchemia)', '28 Października 2026', 'Konkurs Naukowy', 'Prezentacja nowatorskich mikstur i trucizn. Nagroda za najstabilniejszy ekstrakt arktyczny.');
  insertEvent.run('event-necromancy-night', 'Czuwanie pod Karmazynową Zorzą', '15 Listopada 2026', 'Rytuał Wiedzy', 'Wspólna medytacja astralna, odczytywanie proroctw z rzutów kośćmi völvy i badanie przepowiedni nadejścia Wiecznej Zimy.');
}

const ravenMsgCount = db.prepare('SELECT COUNT(*) as count FROM raven_messages').get().count;
if (false && ravenMsgCount === 0) {
  console.log('[DB] Seeding initial raven messages...');
  const insertRaven = db.prepare(`
    INSERT INTO raven_messages (id, sender_id, sender_name, sender_role, sender_avatar, recipient, subject, body, read, starred, tag, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRaven.run(
    'msg-1',
    'usr-valgerda',
    'Arcymistrzyni Valgerda Storm',
    'Dyrekcja',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    'Wszyscy Kadeci',
    'Witaj w murach Cytadeli Durmstrang',
    'Niech mróz hartuje twoją wolę, a płomień wiedzy rozświetla najciemniejsze noce. Pamiętaj: w tych murach nie ma miejsca na przeciętność. Odwiedź Katedry i zgłoś się na pierwszą lekcję.',
    0,
    1,
    'edykt',
    '2026-09-01 09:00'
  );

  insertRaven.run(
    'msg-2',
    'usr-morana',
    '',
    'Profesor',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    'Valdemar Krag-Hansen',
    'Zbadanie anomalii w Krypcie Szeptów',
    'Valdemarze, twój ostatni esej o barierach cienia był zadowalający. Oczekuję cię dziś po gaszeniu zniczy w Krypcie Szeptów — omówimy manuskrypt Eirika.',
    1,
    0,
    'zadanie',
    '2026-09-08 18:30'
  );
}


// ==================== ŻELAZNE PIÓRO — SEED DOMYŚLNYCH DZIAŁÓW ====================

const gazetteSectionCount = db.prepare('SELECT COUNT(*) as count FROM gazette_sections').get().count;
if (gazetteSectionCount === 0) {
  console.log('[DB] Seeding gazette sections...');
  const insertSection = db.prepare(`
    INSERT INTO gazette_sections (id, name, icon, sort_order, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);
  const defaultSections = [
    ['sec-aktualnosci', 'Aktualności', '📢', 1],
    ['sec-zycie-twierdzy', 'Życie Twierdzy', '🏰', 2],
    ['sec-zakony', 'Zakony', '🛡️', 3],
    ['sec-z-lekcji', 'Z Lekcji', '📚', 4],
    ['sec-wywiady', 'Wywiady', '🎤', 5],
    ['sec-kroniki', 'Kroniki', '📜', 6],
    ['sec-mity', 'Mity i Legendy', '🐉', 7],
    ['sec-sport', 'Sport i Pojedynki', '⚔️', 8],
    ['sec-kultura', 'Kultura', '🎭', 9],
    ['sec-tworczosc', 'Twórczość Uczniów', '✍️', 10],
    ['sec-plotki', 'Plotki i Sekrety', '🤫', 11],
    ['sec-humor', 'Humor', '😄', 12],
    ['sec-gry', 'Gry i Zabawy', '🎲', 13],
    ['sec-konkursy', 'Konkursy', '🏆', 14],
    ['sec-ogloszenia', 'Ogłoszenia', '📋', 15],
    ['sec-reklamy', 'Reklamy', '🪧', 16],
    ['sec-redakcyjna', 'Od Redakcji', '🖋️', 17]
  ];
  for (const s of defaultSections) {
    insertSection.run(...s);
  }
  console.log('[DB] Seeded 17 gazette sections.');
}

// Seed inaugural gazette issue #1 if no issues exist
const gazetteIssueCount = db.prepare('SELECT COUNT(*) as count FROM gazette_issues').get().count;
if (false && gazetteIssueCount === 0) {
  console.log('[DB] Seeding inaugural gazette issue #1...');
  const issueId = 'issue-inaugural-01';
  
  // 1. Issue
  db.prepare(`
    INSERT INTO gazette_issues (id, number, title, theme, school_year, publication_date, cover_image, description, editor_in_chief_id, editorial_team, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
  `).run(
    issueId,
    1,
    'Przebudzenie Północnych Wichrów',
    'Inauguracja Nowego Roku Magicznego w Cytadeli',
    '2025/2026',
    new Date().toISOString().slice(0, 10),
    '/banner-durmstrang.png',
    'Premierowe wydanie oficjalnego periodyku Twierdzy Durmstrang. Kroniki czterech zakonów, sekrety Galdrastofy, wywiad z Arcymistrzem oraz zagadki runiczne.',
    'usr-director-01',
    JSON.stringify(['Igor Karkarow', 'Viktor Krum', 'Astrid Lindholm', 'Gellert Grindelwald'])
  );

  // 2. Staff
  const insertStaff = db.prepare(`
    INSERT INTO gazette_staff (id, user_id, user_name, gazette_role, issue_id, is_permanent)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  insertStaff.run('staff-01', 'usr-director-01', 'Igor Karkarow', 'editor_in_chief', issueId);
  insertStaff.run('staff-02', 'usr-krum-01', 'Viktor Krum', 'editor', issueId);
  insertStaff.run('staff-03', 'usr-astrid-01', 'Astrid Lindholm', 'illustrator', issueId);
  insertStaff.run('staff-04', 'usr-grindel-01', 'Gellert Grindelwald', 'editor', issueId);

  // 3. Articles
  const insertArticle = db.prepare(`
    INSERT INTO gazette_articles (id, issue_id, title, supertitle, subtitle, lead, content, author_id, author_name, section_id, section_name, featured_quote, status, is_anonymous)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0)
  `);

  insertArticle.run(
    'art-01',
    issueId,
    'Przysięga Północy: Jak Zakony Durmstrangu Kształtują Przyszłych Mistrzów',
    'Z ŻYCIA TWIERDZY',
    'Reinhall, Björnhall, Ravnheim i Otergard w nowym semestrze',
    'W murach skutej lodem Cytadeli zabrzmiał Róg Przeznaczenia. Nowe pokolenie adeptów stanęło przed Kamieniem Przysięgi, by wybrać ścieżkę chwały, lojalności, mądrości lub woli przetrwania.',
    `# Przysięga w Cieniu Północnego Fiordu\n\nKażdego roku, gdy zorza polarna przecina niebo nad Skandynawią, bramy Twierdzy Durmstrang otwierają się dla tych, którzy nie lękają się przekraczać granic poznania. Tutaj nie uczy się magii teoretycznej z bezpiecznych odległości — tu każdy rzucony urok niesie ze sobą ciężar odpowiedzialności i siły charakteru.\n\n## Cztery Filary Durmstrangu\n\nPodział na zakony to nie tylko przynależność do dormitoriów. To odwieczna rywalizacja o dominację w Pucharze Twierdzy:\n\n* **Reinhall** — Strażnicy dumy i nieprzejednanej odwagi, gotowi walczyć w pierwszej linii.\n* **Björnhall** — Niezłomni adepci siły i honoru, których więź braterstwa nie pęka nawet pod najcięższym ciosem.\n* **Ravnheim** — Mistrzowie cienia, kalkulacji i nieznanych arkanów, szukający wiedzy w starożytnych manuskryptach.\n* **Otergard** — Zwinni stratedzy i odkrywcy, mistrzowie alchemii oraz sekretnych ścieżek tundry.\n\nNadchodzące miesiące przyniosą pojedynki, ekspedycje do Lodowych Jaskiń oraz rywalizację o punkty w Dziennikach Lekcyjnych. Niech zwycięży najgodniejszy!`,
    'usr-krum-01',
    'Viktor Krum',
    'sec-zakony',
    'Zakony',
    'Nie każda magia powinna zostać poznana, lecz ten, kto ją opanuje, włada własnym przeznaczeniem.'
  );

  insertArticle.run(
    'art-02',
    issueId,
    'Echa Galdrastofy: Zapomniane Formuły Runiczne Odkryte w Podziemiach',
    'KRONIKI & BADANIA',
    'Przełomowe znalezisko w Dolnych Kryptach Futharku',
    'Podczas prac renowacyjnych w zachodnim skrzydle Twierdzy natrafiono na zamurowaną komnatę runiczną sprzed siedmiu stuleci. Odkryte inskrypcje rzucają nowe światło na dawne techniki kucia ochronnych glifów.',
    `# Tajemnice Starszego Futharku\n\nProfesorowie Katedry Runologii i Magii Północy potwierdzili autentyczność odnalezionych tablic bazaltowych. Zawierają one złożone kombinacje znaków **Thurisaz**, **Algiz** oraz **Sowilo**, splecione w formuły defensywne zdolne odbijać klątwy żywiołów.\n\n## Formuła Tarczy Mroźnego Wichru\n\nWedług wstępnych analiz, pradawni mistrzowie używali kombinacji run do hartowania kling i różdżek w lodowatej wodzie fiordu. Starożytne Runy wkrótce udostępni adeptom wyższych roczników możliwość odtworzenia tych potężnych matryc.\n\n> „Moc run nie leży w ich wyryciu, lecz w woli, która tchnie w nie iskrę prawdy” — podkreśla Mistrz Runiczny Cytadeli.`,
    'usr-grindel-01',
    'Gellert Grindelwald',
    'sec-kroniki',
    'Kroniki',
    'Kamień pamięta każde zaklęcie, które w nim uwięziono.'
  );

  insertArticle.run(
    'art-03',
    issueId,
    'Rozmowa z Dyrekcją: Czego Wymaga Durmstrang w Nadchodzącym Semestrze?',
    'WYWIAD NUMERU',
    'Ekskluzywny wywiad z Arcymistrzem Cytadeli',
    'W zaciszu gabinetu na najwyższej wieży Dyrekcja dzieli się wizją dyscypliny, nowych reguł w pojedynkach i planowanych turniejów międzyzakonnych.',
    `# Wywiad z Gabinetu na Szczycie Baszty\n\n**Żelazne Pióro:** Panie Dyrektorze, co będzie priorytetem w bieżącym roku akademickim?\n\n**Dyrekcja:** Przede wszystkim bezwzględna dyscyplina i wysoki poziom w Dziennikach Lekcyjnych. Zwiększyliśmy rygor punktowy, a każdy adept jest oceniany zarówno za biegłość w zaklęciach bojowych, jak i za wkład w życie swojego Zakonu.\n\n**ŻP:** Jak ocenia Pan zaangażowanie uczniów w Galdrastofę i Puchar Zakonów?\n\n**Dyrekcja:** Z satysfakcją obserwuję powrót do korzeni. Durmstrang nigdy nie był szkołą dla słabych duchowo. Kto szuka łatwej drogi, pomylił twierdze. Tutaj hartujemy charaktery, a Żelazne Pióro ma być zwierciadłem tej niestrudzonej pracy.`,
    'usr-director-01',
    'Igor Karkarow',
    'sec-wywiady',
    'Wywiady',
    'Dyscyplina to fundament, na którym wznosi się potęga.'
  );

  // 4. Pages
  const insertPage = db.prepare(`
    INSERT INTO gazette_pages (id, issue_id, page_number, template, content, sort_order, article_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Page 1: Cover
  insertPage.run('page-01', issueId, 1, 'cover', JSON.stringify({
    title: 'ŻELAZNE PIÓRO',
    subtitle: 'Nr 1 / 2026',
    mainHeadline: 'PRZEBUDZENIE PÓŁNOCNYCH WICHRÓW',
    coverImage: '/banner-durmstrang.png',
    headlines: [
      '✦ Przysięga Północy: Raport z Zakonów',
      '✦ Zapomniane Formuły Runiczne w Galdrastofie',
      '✦ Wywiad z Dyrekcją Twierdzy',
      '✦ Wielka Krzyżówka & Sprawdzian Runiczny'
    ]
  }), 1, '');

  // Page 2: Editorial / Masthead
  insertPage.run('page-02', issueId, 2, 'editorial', JSON.stringify({
    title: 'Stopka Redakcyjna',
    body: 'Żelazne Pióro jest oficjalnym organem prasowym Twierdzy Durmstrang, tworzonym przez adeptów i kadrę profesorską pod patronatem Dyrekcji. Wszystkie teksty podlegają rygorowi rzetelności magicznej.'
  }), 2, '');

  // Page 3: Table of Contents
  insertPage.run('page-03', issueId, 3, 'toc', JSON.stringify({
    title: 'Spis Treści',
    entries: [
      { page: 1, title: 'Okładka Główna' },
      { page: 2, title: 'Od Redakcji & Stopka' },
      { page: 3, title: 'Spis Treści' },
      { page: 4, title: 'Przysięga Północy: Zakony Durmstrangu' },
      { page: 5, title: 'Echa Galdrastofy: Pradawne Runy' },
      { page: 6, title: 'Wywiad z Arcymistrzem Dyrekcji' },
      { page: 7, title: 'Gry, Quiz & Krzyżówka Runiczna' },
      { page: 8, title: 'Ogłoszenia Twierdzy & Kaupangr' }
    ]
  }), 3, '');

  // Page 4: Article 1 (Spread)
  insertPage.run('page-04', issueId, 4, 'article-spread', JSON.stringify({}), 4, 'art-01');

  // Page 5: Article 2 (Photo article)
  insertPage.run('page-05', issueId, 5, 'article-photo', JSON.stringify({
    image: '/banner-durmstrang.png',
    imageCaption: 'Tablica runiczna odkryta w zachodnich kryptach Cytadeli'
  }), 5, 'art-02');

  // Page 6: Article 3 (Interview)
  insertPage.run('page-06', issueId, 6, 'interview', JSON.stringify({
    intervieweeName: 'Arcymistrz Dyrekcji',
    intervieweeImage: ''
  }), 6, 'art-03');

  // Page 7: Games (Quiz & Crossword)
  insertPage.run('page-07', issueId, 7, 'games', JSON.stringify({
    title: 'Wyzwania Umysłu: Quiz i Krzyżówka',
    quizId: 'quiz-inaugural-01',
    crosswordId: 'cw-inaugural-01'
  }), 7, '');

  // Page 8: Announcements & Back cover
  insertPage.run('page-08', issueId, 8, 'announcements', JSON.stringify({
    title: 'EDYKTY I OGŁOSZENIA CYTADELI',
    items: [
      { title: 'Nabór do Redakcji Żelaznego Pióra', text: 'Poszukiwani kronikarze, ilustratorzy i reporterzy terenowi z każdego Zakonu. Zgłoszenia przez formularz na dole strony gazetki.' },
      { title: 'Targowisko Kaupangr Otwarte', text: 'Kupcy z północy uzupełnili zapasy składników alchemicznych, pergaminów oraz runicznych szat ochronnych.' },
      { title: 'Zakaz Wstępu do Lodowego Kanionu po Zmroku', text: 'Edykt Dyrekcji: Naruszenie kordonu ochronnego grozi natychmiastowym odebraniem punktów zakonnych.' }
    ]
  }), 8, '');

  // 5. Quiz
  db.prepare(`
    INSERT INTO gazette_quizzes (id, page_id, issue_id, title, questions, results_messages)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'quiz-inaugural-01',
    'page-07',
    issueId,
    'Sprawdzian Wiedzy o Durmstrangu i Runicznym Futharku',
    JSON.stringify([
      {
        question: 'Który Zakon Durmstrangu słynie z nieugiętej siły, honoru i braterstwa?',
        options: ['Reinhall', 'Björnhall', 'Ravnheim', 'Otergard'],
        correct: 1
      },
      {
        question: 'Jak nazywa się mistyczny warsztat wykuwania run w podziemiach Twierdzy?',
        options: ['Galdrastofa', 'Kaupangr', 'Skirnir', 'Futhark-Hall'],
        correct: 0
      },
      {
        question: 'Jaka runa symbolizuje słońce, triumf i czystą energię magiczną?',
        options: ['Thurisaz', 'Algiz', 'Sowilo', 'Hagalaz'],
        correct: 2
      }
    ]),
    JSON.stringify([
      { minScore: 0, maxScore: 1, message: 'Wymagana pilna lektura Kodeksu w Archiwum Lore!' },
      { minScore: 2, maxScore: 2, message: 'Dobra znajomość Twierdzy! Godny adept Durmstrangu.' },
      { minScore: 3, maxScore: 3, message: 'Arcymistrzowska wiedza! Zasłużyłeś na uznanie swojego Zakonu.' }
    ])
  );

  // 6. Crossword
  db.prepare(`
    INSERT INTO gazette_crosswords (id, page_id, issue_id, title, words, grid_width, grid_height)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'cw-inaugural-01',
    'page-07',
    issueId,
    'Mini-Krzyżówka Cytadeli',
    JSON.stringify([
      { number: 1, clue: 'Nazwa Twierdzy Magii na Północy', answer: 'DURMSTRANG', direction: 'across', row: 0, col: 0 },
      { number: 2, clue: 'Zakon cienia i kruków', answer: 'RAVNHEIM', direction: 'down', row: 0, col: 2 },
      { number: 3, clue: 'Magiczny warsztat runiczny', answer: 'GALDRA', direction: 'across', row: 3, col: 1 }
    ]),
    8,
    8
  );

  console.log('[DB] Seeded inaugural issue #1 with 8 pages, 3 articles, staff, quiz, and crossword.');
}

// ==================== SEED MODUŁU EGZAMINACYJNEGO ====================

const examScaleCount = db.prepare('SELECT COUNT(*) as count FROM exam_grading_scales').get().count;
if (examScaleCount === 0) {
  console.log('[DB] Seeding default exam grading scale...');
  const scaleId = 'scale-durmstrang-standard';
  db.prepare(`
    INSERT INTO exam_grading_scales (id, name, is_default, created_by)
    VALUES (?, ?, 1, 'system')
  `).run(scaleId, 'Oficjalna Skala Twierdzy Durmstrang');

  const insertEntry = db.prepare(`
    INSERT INTO exam_grading_scale_entries (id, scale_id, name, abbreviation, min_percent, max_percent, is_passing, sort_order, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEntry.run('gse-w', scaleId, 'WYBITNY', 'W', 85.0, 100.0, 1, 0, '#eab308');
  insertEntry.run('gse-po', scaleId, 'POWYŻEJ OCZEKIWAŃ', 'PO', 70.0, 84.99, 1, 1, '#38bdf8');
  insertEntry.run('gse-z', scaleId, 'ZADOWALAJĄCY', 'Z', 55.0, 69.99, 1, 2, '#10b981');
  insertEntry.run('gse-n', scaleId, 'NĘDZNY', 'N', 40.0, 54.99, 0, 3, '#f97316');
  insertEntry.run('gse-t', scaleId, 'TROLL', 'T', 0.0, 39.99, 0, 4, '#ef4444');
  console.log('[DB] Seeded standard grading scale entries.');
}

const qCatCount = db.prepare('SELECT COUNT(*) as count FROM question_bank_categories').get().count;
if (qCatCount === 0) {
  console.log('[DB] Seeding question bank categories & questions...');
  const insertCat = db.prepare(`
    INSERT INTO question_bank_categories (id, subject_id, name, parent_id, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCat.run('qcat-cm-teoria', 'czarna-magia', 'Teoria Klątw i Uroków Cienia', '', 1);
  insertCat.run('qcat-cm-praktyka', 'czarna-magia', 'Obrona i Analiza Taktyczna', '', 2);
  insertCat.run('qcat-elik-skladniki', 'eliksiry', 'Składniki i Katalizatory Alchemiczne', '', 1);
  insertCat.run('qcat-runy-futhark', 'starozytne-runy', 'Starszy Futhark i Wiązania', '', 1);

  // Questions seeding
  const insertQ = db.prepare(`
    INSERT INTO questions (id, subject_id, category_id, type, content, explanation, difficulty, tags, media_url, media_type, supplementary_material, correct_short_answers, fill_gaps_answers, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'usr-prof-01')
  `);

  const insertOpt = db.prepare(`
    INSERT INTO question_options (id, question_id, content, is_correct, match_target, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Q1: Single choice
  insertQ.run(
    'q-seed-01', 'czarna-magia', 'qcat-cm-teoria', 'single_choice',
    'Który ze składników odpowiada za stabilizację reakcji w Eliksirze Lodowej Krwi?',
    'Sproszkowany pazur mroźnego trolla zawiera enzymy spowalniające proces krystalizacji.',
    'easy', JSON.stringify(['klasa2', 'teoria', 'eliksiry']), '', '', '',
    '[]', '[]'
  );
  insertOpt.run('qo-01-1', 'q-seed-01', 'Sproszkowany pazur mroźnego trolla', 1, '', 0);
  insertOpt.run('qo-01-2', 'q-seed-01', 'Korzeń asfodelusa', 0, '', 1);
  insertOpt.run('qo-01-3', 'q-seed-01', 'Liść belladonny', 0, '', 2);
  insertOpt.run('qo-01-4', 'q-seed-01', 'Jad żmii rogatej', 0, '', 3);

  // Q2: Multi choice
  insertQ.run(
    'q-seed-02', 'czarna-magia', 'qcat-cm-praktyka', 'multi_choice',
    'Wskaż wszystkie zaklęcia o charakterze defensywnym w kanonie obrony Cytadeli Durmstrang:',
    'Tarcza Pękniętego Żelaza oraz Bariera Cienia to klasyczne formuły defensywne północy.',
    'medium', JSON.stringify(['klasa2', 'praktyka', 'obrona']), '', '', '',
    '[]', '[]'
  );
  insertOpt.run('qo-02-1', 'q-seed-02', 'Tarcza Pękniętego Żelaza (Skjaldmær)', 1, '', 0);
  insertOpt.run('qo-02-2', 'q-seed-02', 'Bariera Cienia (Skuggaskjöldr)', 1, '', 1);
  insertOpt.run('qo-02-3', 'q-seed-02', 'Mrożący Podmuch (Frostbál)', 0, '', 2);
  insertOpt.run('qo-02-4', 'q-seed-02', 'Glif Niewidzialnego Płaszcza (Hula)', 1, '', 3);

  // Q3: True/False
  insertQ.run(
    'q-seed-03', 'czarna-magia', 'qcat-cm-teoria', 'true_false',
    'Klątwa Mroźnego Pętla traci swoją moc po bezpośrednim kontakcie z krwią salamandry ognia.',
    'Salamandra ognia jest naturalnym przeciwieństwem magii mrozu, a jej krew rozprasza wiązania kriogeniczne.',
    'easy', JSON.stringify(['klasa2', 'teoria']), '', '', '',
    '[]', '[]'
  );
  insertOpt.run('qo-03-1', 'q-seed-03', 'PRAWDA', 1, '', 0);
  insertOpt.run('qo-03-2', 'q-seed-03', 'FAŁSZ', 0, '', 1);

  // Q4: Short answer
  insertQ.run(
    'q-seed-04', 'starozytne-runy', 'qcat-runy-futhark', 'short_answer',
    'Jak nazywa się runa symbolizująca ochronę, czujność i kosmiczny ład w Starszym Futharku (kształtem przypominająca poroże łosia)?',
    'Runa Algiz (Elhaz) to fundamentalny glif ochronny Cytadeli.',
    'easy', JSON.stringify(['klasa2', 'runy']), '', '', '',
    JSON.stringify(['Algiz', 'algiz', 'ALGIZ', 'Elhaz', 'elhaz']), '[]'
  );

  // Q5: Practical scenario / Open text
  insertQ.run(
    'q-seed-05', 'czarna-magia', 'qcat-cm-praktyka', 'open_text',
    `SYTUACJA: Podczas przygotowywania eliksiru zawartość kociołka zaczyna gwałtownie wrzeć i wydzielać srebrzysty dym o drażniącym zapachu ozonu.

ZADANIE: Opisz krok po kroku, jak powinien zareagować adept, aby bezpiecznie ugasić reakcję, zabezpieczyć laboratorium i zneutralizować toksyczne opary.`,
    'Kryteria: 1. Natychmiastowe odcięcie ognia runicznego. 2. Wrzucenie sproszkowanego kamienia lodowego. 3. Zaklęcie wentylujące Ventus Obscura. 4. Ewakuacja lub nałożenie maski runicznej.',
    'hard', JSON.stringify(['klasa2', 'praktyka', 'zadanie_otwarte']), '', '', '',
    '[]', '[]'
  );

  // Q6: Matching
  insertQ.run(
    'q-seed-06', 'starozytne-runy', 'qcat-runy-futhark', 'matching',
    'Dopasuj starożytne runy do ich przypisanych żywiołów i znaczeń:',
    'Prawidłowe pary wynikają ze struktury Starszego Futharku.',
    'medium', JSON.stringify(['klasa2', 'runy', 'dopasowanie']), '', '', '',
    '[]', '[]'
  );
  insertOpt.run('qo-06-1', 'q-seed-06', 'Thurisaz (ᚦ)', 0, 'Cierń / Piorun i Siła Olbrzymów', 0);
  insertOpt.run('qo-06-2', 'q-seed-06', 'Sowilo (ᛋ)', 0, 'Słońce / Triumf i Płomień Zwycięstwa', 1);
  insertOpt.run('qo-06-3', 'q-seed-06', 'Hagalaz (ᚺ)', 0, 'Grad / Destrukcja i Transformacja', 2);
  insertOpt.run('qo-06-4', 'q-seed-06', 'Algiz (ᛉ)', 0, 'Łoś / Ochrona i Tarcza Duchowa', 3);

  // Q7: Ordering
  insertQ.run(
    'q-seed-07', 'czarna-magia', 'qcat-cm-praktyka', 'ordering',
    'Ułóż etapy rytuału wykuwania Tarczy Pękniętego Żelaza w prawidłowej kolejności chronologicznej:',
    'Prawidłowa kolejność: Oczyszczenie -> Inskrypcja -> Nasycenie krwią -> Wiązanie -> Hartowanie w fiordzie.',
    'hard', JSON.stringify(['klasa2', 'praktyka', 'kolejnosc']), '', '', '',
    '[]', '[]'
  );
  insertOpt.run('qo-07-1', 'q-seed-07', 'Oczyszczenie powierzchni tablicy bazaltowej płomieniem', 0, '', 0);
  insertOpt.run('qo-07-2', 'q-seed-07', 'Wyrycie glifów Algiz i Thurisaz sztychem z czarnego żelaza', 0, '', 1);
  insertOpt.run('qo-07-3', 'q-seed-07', 'Nasycenie inskrypcji żywicą północną i krwią salamandry', 0, '', 2);
  insertOpt.run('qo-07-4', 'q-seed-07', 'Wypowiedzenie formuły wiążącej Paktu 1294', 0, '', 3);
  insertOpt.run('qo-07-5', 'q-seed-07', 'Zanurzenie i hartowanie matrycy w lodowatych wodach fiordu', 0, '', 4);

  // Q8: Fill gaps
  insertQ.run(
    'q-seed-08', 'czarna-magia', 'qcat-cm-teoria', 'fill_gaps',
    'Do rozproszenia uroków iluzji służy zaklęcie [Aparecium], natomiast glif ochronny [Algiz] odbija energię kinetyczną miotanego pocisku.',
    'Wypełnij luki dokładnymi nazwami formuł.',
    'medium', JSON.stringify(['klasa2', 'luki']), '', '', '',
    '[]', JSON.stringify(['Aparecium', 'Algiz'])
  );

  // Q9: Image choice
  insertQ.run(
    'q-seed-09', 'czarna-magia', 'qcat-cm-praktyka', 'single_choice',
    'Rozpoznaj przedstawiony artefakt obronny ze Skarbca Twierdzy Durmstrang:',
    'Na rycinie widnieje Wieczna Pieczęć Cytadeli Durmstrang wykuta w czarnym żelazie.',
    'easy', JSON.stringify(['klasa2', 'ilustracja']), '/durmstang_hero.webp', 'image', '',
    '[]', '[]'
  );
  insertOpt.run('qo-09-1', 'q-seed-09', 'Pieczęć Twierdzy Durmstrang', 1, '', 0);
  insertOpt.run('qo-09-2', 'q-seed-09', 'Kielich Ognia Skirnirów', 0, '', 1);
  insertOpt.run('qo-09-3', 'q-seed-09', 'Kostur Mistrza Grindelwalda', 0, '', 2);
  insertOpt.run('qo-09-4', 'q-seed-09', 'Amulet Cienia Ravnheimu', 0, '', 3);

  // Q10: Case study / Material
  insertQ.run(
    'q-seed-10', 'czarna-magia', 'qcat-cm-teoria', 'single_choice',
    'Na podstawie analizy Kodeksu Paktu 1294: Jakie konsekwencje niesie złamanie pieczęci ochronnej przed wyznaczonym terminem egzaminacyjnym?',
    'Kodeks jasno określa dyscyplinę: natychmiastowe zerowanie punktów zakonnych i wezwanie przed Radę.',
    'medium', JSON.stringify(['klasa2', 'kodeks']), '', '',
    '„Kto przed uderzeniem dzwonu północy pieczęć złamie lub glif naruszy, ten jako krzywoprzysięzca przed Radą stanie, a jego Zakon utraci pięćdziesiąt punktów chwały.” — Kodeks Paktu 1294, Rozdział VII.',
    '[]', '[]'
  );
  insertOpt.run('qo-10-1', 'q-seed-10', 'Utrata 50 punktów dla Zakonu i wezwanie przed Radę Mistrzów', 1, '', 0);
  insertOpt.run('qo-10-2', 'q-seed-10', 'Jednodniowy areszt w Lochach Lodowych', 0, '', 1);
  insertOpt.run('qo-10-3', 'q-seed-10', 'Tymczasowe zawieszenie w prawach adepta', 0, '', 2);
  insertOpt.run('qo-10-4', 'q-seed-10', 'Brak konsekwencji w przypadku pierwszego incydentu', 0, '', 3);

  console.log('[DB] Seeded 10 versatile exam questions.');
}

const sessionCount = db.prepare('SELECT COUNT(*) as count FROM exam_sessions').get().count;
if (false && sessionCount === 0) {
  console.log('[DB] Seeding initial exam session & exam...');
  const sessionId = 'esess-2026-zimowa';
  db.prepare(`
    INSERT INTO exam_sessions (id, name, school_year, description, start_date, end_date, status, class_years, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 'usr-director-01')
  `).run(
    sessionId,
    'SESJA EGZAMINACYJNA 2026',
    'XIX Rok Szkolny (2026/2027)',
    'Główna Zimowa Sesja Egzaminacyjna Twierdzy Magii Durmstrang. Obejmuje wszystkie roczniki adeptów.',
    '2026-08-01 00:00:00',
    '2026-11-30 23:59:59',
    JSON.stringify(['Klasa I', 'Klasa II', 'Klasa III', 'Klasa IV'])
  );

  const examId = 'exam-dark-arts-2026';
  db.prepare(`
    INSERT INTO exams (
      id, session_id, subject_id, subject_name, title, description,
      professor_id, professor_name, class_year, access_start, access_end,
      time_limit_minutes, end_policy, max_attempts, passing_threshold,
      navigation_mode, shuffle_questions, shuffle_options, results_visibility,
      instructions, grading_scale_id, status, total_points, total_questions, published_at
    ) VALUES (
      ?, ?, 'czarna-magia', 'Czarna Magia', 'Egzamin Końcowy — Czarna Magia Klasa II',
      'Oficjalny sprawdzian wiedzy teoretycznej, runicznej i taktycznej z Czarnej Magii i Obrony przed Czarną Magią.',
      'usr-prof-01', '', 'Klasa II',
      '2026-08-01 00:00:00', '2026-11-30 23:59:59',
      60, 'soft_limit', 1, 40.0,
      'free', 0, 0, 'after_approval',
      'Egzamin obejmuje materiał z zakresu teorii klątw, glifów obronnych oraz analizy praktycznej. Wszelkie próby korzystania z nieautoryzowanych manuskryptów skutkują natychmiastowym przerwaniem podejścia. Odpowiedzi zapisują się automatycznie.',
      'scale-durmstrang-standard', 'published', 100, 10, datetime('now')
    )
  `).run(examId, sessionId);

  // Sections
  const insertSec = db.prepare(`
    INSERT INTO exam_sections (id, exam_id, title, description, instructions, max_points, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertSec.run('sec-01', examId, 'CZĘŚĆ I: Wiedza Podstawowa', 'Sprawdzian definicji i składników', 'Odpowiedz na pytania z zakresu kanonu podstawowego.', 20, 0);
  insertSec.run('sec-02', examId, 'CZĘŚĆ II: Teoria i Glify', 'Znajomość Starszego Futharku i zaklęć', 'Wybierz prawidłowe wiązania runiczne.', 30, 1);
  insertSec.run('sec-03', examId, 'CZĘŚĆ III: Analiza Źródłowa', 'Praca z Kodeksem i rycynami', 'Przeanalizuj dołączone materiały archiwalne.', 20, 2);
  insertSec.run('sec-04', examId, 'CZĘŚĆ IV: Praktyka Bojowa', 'Zadanie sytuacyjne i procedury', 'Opisz krok po kroku postępowanie eliksiryczne.', 30, 3);

  // Link questions to exam
  const insertEq = db.prepare(`
    INSERT INTO exam_questions (id, exam_id, section_id, question_id, points, partial_credit, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertEq.run('eq-01', examId, 'sec-01', 'q-seed-01', 10, 'none', 0);
  insertEq.run('eq-02', examId, 'sec-01', 'q-seed-03', 10, 'none', 1);
  insertEq.run('eq-03', examId, 'sec-02', 'q-seed-02', 10, 'proportional', 2);
  insertEq.run('eq-04', examId, 'sec-02', 'q-seed-04', 10, 'none', 3);
  insertEq.run('eq-05', examId, 'sec-02', 'q-seed-08', 10, 'proportional', 4);
  insertEq.run('eq-06', examId, 'sec-03', 'q-seed-06', 10, 'proportional', 5);
  insertEq.run('eq-07', examId, 'sec-03', 'q-seed-09', 5, 'none', 6);
  insertEq.run('eq-08', examId, 'sec-03', 'q-seed-10', 5, 'none', 7);
  insertEq.run('eq-09', examId, 'sec-04', 'q-seed-07', 10, 'proportional', 8);
  insertEq.run('eq-10', examId, 'sec-04', 'q-seed-05', 20, 'none', 9);

  // Rubric for Q5
  const rubId = 'rub-seed-01';
  db.prepare('INSERT INTO exam_rubrics (id, exam_question_id, title) VALUES (?, ?, ?)').run(rubId, 'eq-10', 'Kryteria oceny zadania praktycznego z eliksirów');
  const insertRc = db.prepare('INSERT INTO exam_rubric_criteria (id, rubric_id, description, points, sort_order) VALUES (?, ?, ?, ?, ?)');
  insertRc.run('rc-01', rubId, 'Rozpoznanie objawów przegrzania katalizatora runicznego', 4, 0);
  insertRc.run('rc-02', rubId, 'Prawidłowe odcięcie źródła ognia i zabezpieczenie naczynia', 6, 1);
  insertRc.run('rc-03', rubId, 'Zastosowanie odpowiedniego neutralizatora chłodzącego (kamień lodowy)', 6, 2);
  insertRc.run('rc-04', rubId, 'Użycie poprawnego zaklęcia wentylacyjnego i procedury BHP', 4, 3);

  console.log('[DB] Seeded inaugural Exam Session 2026 and Czarna Magia Exam.');
}

// ==================== HOMEWORK SEED DATA ====================

const homeworkCount = db.prepare('SELECT COUNT(*) as count FROM homework_assignments').get().count;

if (false && homeworkCount === 0) {
  console.log('[DB] Seeding initial Homework Assignments & Submissions...');

  const insertHw = db.prepare(`
    INSERT OR IGNORE INTO homework_assignments (
      id, title, assignment_number, type, subject_id, subject_name, class_year, school_year,
      lesson_id, lesson_title, professor_id, professor_name, professor_avatar,
      description, instructions, requirements, resources, submission_types,
      publish_date, due_date, allow_late, late_due_date, late_penalty_points,
      revision_allowed, revision_due_date, max_points, grading_type, rubric,
      is_optional, is_group, group_data, is_published, is_archived, is_featured,
      created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const insertSub = db.prepare(`
    INSERT OR IGNORE INTO homework_submissions (
      id, homework_id, student_id, student_name, house, subject_id, subject_name,
      lesson_id, lesson_title, status, current_version, content, word_count,
      attachments, links, submitted_at, is_late, late_duration_seconds,
      grade_score, grade_max, grade_percentage, grade_label, rubric_scores,
      feedback, inline_annotations, revision_reason, revision_due_date,
      house_points_awarded, is_featured, featured_badge, achievement_awarded,
      recorded_to_gradebook, graded_by, graded_at, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const insertVer = db.prepare(`
    INSERT OR IGNORE INTO homework_submission_versions (
      id, submission_id, homework_id, student_id, version_number, content, word_count,
      attachments, links, submitted_at, status, grade_score, grade_label, feedback,
      rubric_scores, inline_annotations, revision_reason, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const insertTpl = db.prepare(`
    INSERT OR IGNORE INTO homework_templates (id, title, category, type, description, instructions, requirements, rubric, submission_types, created_by, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))
  `);

  const insertQc = db.prepare(`
    INSERT OR IGNORE INTO homework_quick_comments (id, professor_id, category, text, created_at)
    VALUES (?,?,?,?,datetime('now'))
  `);

  // --- Quick comments ---
  const quickComments = [
    { cat: 'Merytoryka', txt: 'Rozwiń argumentację w oparciu o teksty źródłowe.' },
    { cat: 'Merytoryka', txt: 'Brakuje odniesienia do materiału z lekcji.' },
    { cat: 'Merytoryka', txt: 'Bardzo dobre uzasadnienie i trafna teza.' },
    { cat: 'Tekst źródłowy', txt: 'Sprawdź wskazany fragment notatki z zajęć.' },
    { cat: 'Runy', txt: 'Znakomita interpretacja glifów i transliteracja.' },
    { cat: 'Forma', txt: 'Zadbaj o właściwą strukturę akapitów i podział logiczny.' },
    { cat: 'Rytuał', txt: 'Precyzyjny opis warunków stabilizacji kręgu magicznego.' },
    { cat: 'Wyróżnienie', txt: 'Wybitna praca badawcza godna publikacji w Kronikach Cytadeli.' }
  ];
  quickComments.forEach((qc, i) => {
    insertQc.run(`qc-${i+1}`, 'usr-astrid-vinter', qc.cat, qc.txt);
  });

  // --- Templates ---
  insertTpl.run(
    'tpl-analiza',
    'Analiza tekstu źródłowego',
    'analiza',
    'analysis',
    'Szablon dedykowany interpretacji fragmentów starych ksiąg, edyktów i traktatów magicznych.',
    'Przeczytaj załączony fragment tekstu źródłowego. Wyodrębnij główne tezy autora, wskaż kontekst historyczny oraz oceń wpływ opisanych praktyk na współczesną magię Północy.',
    JSON.stringify([
      { text: 'Objętość: 300–600 słów' },
      { text: 'Minimum 2 cytaty z tekstu źródłowego z omówieniem' },
      { text: 'Samodzielny wniosek końcowy' }
    ]),
    JSON.stringify([
      { id: 'c1', name: 'Poprawność merytoryczna', maxPoints: 8, description: 'Zgodność z faktami historycznymi i kanonem magii' },
      { id: 'c2', name: 'Analiza tekstu', maxPoints: 6, description: 'Głębokość interpretacji i dobór cytatów' },
      { id: 'c3', name: 'Język i stylistyka', maxPoints: 4, description: 'Poprawność językowa, styl akademicki' },
      { id: 'c4', name: 'Formatowanie i kompozycja', maxPoints: 2, description: 'Akapity, przejrzystość, estetyka' }
    ]),
    JSON.stringify(['text', 'file']),
    'usr-admin'
  );

  insertTpl.run(
    'tpl-esej',
    'Esej filozoficzno-magiczny',
    'esej',
    'essay',
    'Szablon do samodzielnych rozważań nad etyką i granicami sztuk magicznych.',
    'Sformułuj tezę lub hipotezę i przedstaw co najmniej trzy argumenty poparte materiałem z lekcji lub kronik.',
    JSON.stringify([
      { text: 'Objętość: 400–700 słów' },
      { text: 'Wyraźny podział: Wstęp, Rozwinięcie (min. 3 argumenty), Zakończenie' }
    ]),
    JSON.stringify([
      { id: 'c1', name: 'Teza i struktura wywodu', maxPoints: 6, description: 'Jasność tezy i logiczny ciąg argumentacji' },
      { id: 'c2', name: 'Siła argumentacji', maxPoints: 8, description: 'Uzasadnienie, przykłady i wiedza magiczna' },
      { id: 'c3', name: 'Kultura języka', maxPoints: 6, description: 'Bogate słownictwo, styl wypowiedzi' }
    ]),
    JSON.stringify(['text']),
    'usr-admin'
  );

  // --- Homework 1: Czarna Magia - Granice magii krwi ---
  const hw1Id = 'hw-czarna-magia-krwi';
  const hw1Rubric = [
    { id: 'r1', name: 'Poprawność merytoryczna', maxPoints: 8, description: 'Zgodność z kanonem i wiedzą z lekcji o magii krwi' },
    { id: 'r2', name: 'Argumentacja i uzasadnienie', maxPoints: 5, description: 'Logika wywodu i obrona przyjętego stanowiska' },
    { id: 'r3', name: 'Wykorzystanie materiału z lekcji', maxPoints: 4, description: 'Odwołania do terminologii, formuł i kronik' },
    { id: 'r4', name: 'Forma i stylistyka', maxPoints: 3, description: 'Akapity, poprawność językowa, elegancja stylu' }
  ];

  insertHw.run(
    hw1Id,
    'Granice magii krwi',
    3,
    'analysis',
    'czarna-magia',
    'Czarna Magia',
    'Klasa II',
    'XVII Rok Szkolny',
    'les-czarna-magia-4',
    'Magia krwi — podstawy i konsekwencje wiązania',
    'usr-ezra',
    'Prof. Ezra Camhi',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'Szczegółowa analiza ograniczeń etycznych i fizycznych nakładanych przez przymierza krwiste.',
    `Na podstawie materiału z lekcji 4 oraz kroniki Paktu 1294 przygotuj rozprawę analizującą granice bezpiecznego posługiwania się magią krwi w warunkach północnych.

Zwróć szczególną uwagę na:
1. Reakcję esencji życiowej na gwałtowne spadki temperatury.
2. Ryzyko pęknięcia pieczęci więzi przy niekontrolowanym rozproszeniu energii.
3. Stanowisko Rady Cytadeli wobec nieautoryzowanych rytuałów krwi.`,
    JSON.stringify([
      { text: 'Objętość: 300–500 słów' },
      { text: 'Odwołanie do materiału z lekcji 4 i kroniki Paktu' },
      { text: 'Uzasadnienie własnego stanowiska' }
    ]),
    JSON.stringify([
      { id: 'res-1', title: 'Notatka z lekcji 4 — Zasady Magii Krwi', type: 'note', url: '', description: 'Zestawienie formuł ochronnych i stabilizatorów' },
      { id: 'res-2', title: 'Ilustracja pieczęci wiążącej', type: 'image', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', description: 'Rycina geometryczna kręgu bazaltowego' },
      { id: 'res-3', title: 'Fragment Kroniki Paktu 1294 (PDF/Codex)', type: 'document', url: '', description: 'Oficjalny wyciąg z prawodawstwa Durmstrangu' }
    ]),
    JSON.stringify(['text', 'file', 'link']),
    '2026-08-23 12:00',
    '2026-08-28 23:59',
    1,
    '2026-08-30 23:59',
    2,
    1,
    '2026-09-02 23:59',
    20,
    'rubric',
    JSON.stringify(hw1Rubric),
    0,
    0,
    '{}',
    1,
    0,
    1,
    '2026-08-23 12:00:00',
    '2026-08-23 12:00:00'
  );

  // Student Draft for HW1 (Valdemar Lindqvist student)
  insertSub.run(
    'sub-draft-valdemar-hw1',
    hw1Id,
    'usr-valdemar',
    'Valdemar Lindqvist',
    'ravnheim',
    'czarna-magia',
    'Czarna Magia',
    'les-czarna-magia-4',
    'Magia krwi — podstawy i konsekwencje wiązania',
    'draft',
    1,
    `Analiza granic magii krwi w tradycji Północy

Magia krwi od wieków stanowiła jeden z najbardziej rygorystycznie strzeżonych działów sztuk tajemnych w murach Cytadeli Durmstrang. W przeciwieństwie do magii żywiołów, która czerpie energię z otaczającego świata przyrody i zorzy polarnej, magia krwi operuje bezpośrednio na nośniku esencji życiowej samego maga lub podmiotu rytuału.

Zgodnie z naukami przedstawionymi na Lekcji 4, zasadniczym ograniczeniem stosowania tych praktyk w surowym klimacie Północy jest zjawisko krystalizacji eterycznej. Krew jako ciecz biologiczna oraz magiczny rezonator ulega zmianie gęstości, co przy temperaturach poniżej zera wymusza stosowanie stałego podgrzewania runicznego poprzez glif Sowilo lub Kenaz. Brak stabilizacji termicznej prowadzi do natychmiastowego przerwania kanału przepływu i martwicy tkanek.

Kolejnym kluczowym aspektem poruszonym w Kronice Paktu 1294 jest kwestia nieodwracalności więzów krwi. Każdy pakt zawarty w kręgu bazaltowym...`,
    168,
    '[]',
    '[]',
    null,
    0,
    0,
    null,
    20,
    null,
    '',
    '{}',
    '',
    '[]',
    '',
    '',
    0,
    0,
    '',
    '',
    0,
    '',
    null,
    '2026-08-24 16:30:00',
    '2026-08-24 16:45:00'
  );

  // --- Homework 2: Starożytne Runy ---
  const hw2Id = 'hw-starozytne-runy-kaupangr';
  insertHw.run(
    hw2Id,
    'Transliteracja inskrypcji ze stel kamiennych Kaupangr',
    2,
    'practical',
    'starozytne-runy',
    'Starożytne Runy',
    'Klasa II',
    'XVII Rok Szkolny',
    '',
    '',
    'usr-sigurd',
    'Prof. Sigurd Thorn',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'Praktyczne odczytanie i przetłumaczenie run Starszego Futharku z płyty nagrobnej odnalezionej w fiordzie.',
    `Zapoznaj się z ryciną steli runicznej nr IV z Kaupangr.

Zadania do wykonania:
1. Dokonaj pełnej transliteracji tekstu z alfabetu runicznego na alfabet łaciński.
2. Zidentyfikuj ukryte bindruny ochronne i wyjaśnij ich podwójne znaczenie.
3. Podaj interpretację magicznego ostrzeżenia skierowanego do intruzów.`,
    JSON.stringify([
      { text: 'Transliteracja fonetyczna i dosłowne tłumaczenie' },
      { text: 'Omówienie min. 2 bindrun' },
      { text: 'Zwięzły komentarz runologiczny' }
    ]),
    JSON.stringify([
      { id: 'res-r1', title: 'Fotografia steli runicznej Kaupangr IV', type: 'image', url: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=800&auto=format&fit=crop&q=80', description: 'Wysokiej rozdzielczości skan płyty' },
      { id: 'res-r2', title: 'Tabela fonetyczna Starszego Futharku', type: 'document', url: '', description: 'Podręcznik Katedry Runoznawstwa' }
    ]),
    JSON.stringify(['text', 'file']),
    '2026-08-24 08:00',
    '2026-08-30 20:00',
    1,
    '2026-09-01 23:59',
    0,
    1,
    '2026-09-03 23:59',
    20,
    'points',
    '[]',
    0,
    0,
    '{}',
    1,
    0,
    0,
    '2026-08-24 08:00:00',
    '2026-08-24 08:00:00'
  );

  // --- Homework 3: Rytualistyka - Kręgi Ochronne (Submitted & Pending Review) ---
  const hw3Id = 'hw-rytualistyka-kregi';
  insertHw.run(
    hw3Id,
    'Analiza symboliki kręgów ochronnych Północy',
    1,
    'homework',
    'rytualistyka',
    'Rytualistyka i Magia Ceremonialna',
    'Klasa II',
    'XVII Rok Szkolny',
    '',
    '',
    'usr-ezra',
    'Prof. Ezra Camhi',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'Omówienie geometrycznych proporcji w wytyczaniu barier anty-demonicznych.',
    'Przygotuj wypracowanie charakteryzujące strukturę trójwarstwowych kręgów obronnych stosowanych podczas przesileń zimowych.',
    JSON.stringify([
      { text: 'Objętość: 300–450 słów' },
      { text: 'Wyszczególnienie materiałów: kreda runiczna, sól kamienna, pył obsydianowy' }
    ]),
    JSON.stringify([]),
    JSON.stringify(['text']),
    '2026-08-18 10:00',
    '2026-08-24 23:59',
    1,
    '2026-08-26 23:59',
    0,
    1,
    '2026-08-28 23:59',
    20,
    'rubric',
    JSON.stringify([
      { id: 'c1', name: 'Zgodność geometryczna i opis kręgów', maxPoints: 10, description: 'Opis promieni, kątów i symboli węzłowych' },
      { id: 'c2', name: 'Dobór reagentów i nośników', maxPoints: 6, description: 'Uzasadnienie użycia soli, pyłu i srebra' },
      { id: 'c3', name: 'Język i stylistyka', maxPoints: 4, description: 'Klarowność wywodu' }
    ]),
    0,
    0,
    '{}',
    1,
    0,
    0,
    '2026-08-18 10:00:00',
    '2026-08-18 10:00:00'
  );

  // Submission for Rytualistyka by Astrid Vinter (Status: submitted, awaiting review)
  const sub3Astrid = 'sub-ryt-astrid';
  const sub3AstridContent = `Trójwarstwowe kręgi obronne Północy stanowią szczytowe osiągnięcie rytualistyki obronnej Durmstrangu. Ich konstrukcja opiera się na zasadzie potrójnej gradacji oporu:

Warstwa zewnętrzna wykreślana jest gruboziarnistą solą morską zmieszaną z popiołem jarzębinowym, co tworzy pierwszą barierę kinetyczno-eteryczną, pochłaniającą surową agresję istot cienia.

Warstwa środkowa wymaga użycia sproszkowanego obsydianu połączonego ze stopionym woskiem świec wotywnych. W tej warstwie rzeźbione są runy wiążące Algiz i Tiwaz, które przekierowują wrogą wolę w głąb ziemi.

Warstwa wewnętrzna — najbliższa adeptowi — to cienka linia ze sproszkowanego srebra i kredy alabastrowej, zapewniająca absolutną izolację aury maga przed skażeniem rykoszetowym.`;

  insertSub.run(
    sub3Astrid,
    hw3Id,
    'usr-astrid-stud',
    'Astrid Vinter',
    'reinhall',
    'rytualistyka',
    'Rytualistyka i Magia Ceremonialna',
    '',
    '',
    'submitted',
    1,
    sub3AstridContent,
    115,
    '[]',
    '[]',
    '2026-08-24 19:42:15',
    0,
    0,
    null,
    20,
    null,
    '',
    '{}',
    '',
    '[]',
    '',
    '',
    0,
    0,
    '',
    '',
    0,
    '',
    null,
    '2026-08-24 18:20:00',
    '2026-08-24 19:42:15'
  );

  insertVer.run(
    'ver-ryt-astrid-1',
    sub3Astrid,
    hw3Id,
    'usr-astrid-stud',
    1,
    sub3AstridContent,
    115,
    '[]',
    '[]',
    '2026-08-24 19:42:15',
    'submitted',
    null,
    '',
    '',
    '{}',
    '[]',
    '',
    '2026-08-24 19:42:15'
  );

  // Submission for Rytualistyka by Erik Nilsen (Status: submitted)
  insertSub.run(
    'sub-ryt-erik',
    hw3Id,
    'usr-erik',
    'Erik Nilsen',
    'bjornhall',
    'rytualistyka',
    'Rytualistyka i Magia Ceremonialna',
    '',
    '',
    'submitted',
    1,
    'W analizie kręgów obronnych pragnę skupić się na aspekcie wytrzymałości energetycznej i fizycznej tarczy podczas starcia z istotami z tundry. Zastosowanie runy Uruz i Thurisaz podwaja nośność bariery.',
    32,
    '[]',
    '[]',
    '2026-08-24 21:10:00',
    0,
    0,
    null,
    20,
    null,
    '',
    '{}',
    '',
    '[]',
    '',
    '',
    0,
    0,
    '',
    '',
    0,
    '',
    null,
    '2026-08-24 20:00:00',
    '2026-08-24 21:10:00'
  );

  // --- Homework 4: Smokologia (Graded - 18/20 pkt, Wybitny) ---
  const hw4Id = 'hw-smokologia-zmije';
  const hw4Rubric = [
    { id: 'sm1', name: 'Merytoryka i anatomia gadów', maxPoints: 8, description: 'Opis łusek, gruczołów jadowych i odporności na mróz' },
    { id: 'sm2', name: 'Argumentacja i klasyfikacja', maxPoints: 5, description: 'Podział na podgatunki arktyczne' },
    { id: 'sm3', name: 'Wykorzystanie materiałów', maxPoints: 4, description: 'Odwołania do Bestiariusza Północy' },
    { id: 'sm4', name: 'Forma i stylistyka', maxPoints: 3, description: 'Poprawność językowa i struktura' }
  ];

  insertHw.run(
    hw4Id,
    'Klasyfikacja podgatunków żmijów arktycznych',
    4,
    'report',
    'smokologia',
    'Smokologia i Bestie Północy',
    'Klasa II',
    'XVII Rok Szkolny',
    '',
    '',
    'usr-valdemar',
    'Prof. Valdemar Krag-Hansen',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'Kompleksowy raport taksonomiczny dotyczący drakonidów zamieszkujących lodowce Spitsbergenu.',
    'Sporządź szczegółowy raport opisujący różnice morfologiczne pomiędzy Żmijem Szronowym a Błękitnym Smokiem Lodowym.',
    JSON.stringify([
      { text: '350–500 słów' },
      { text: 'Charakterystyka gruczołów lodowego oddechu' },
      { text: 'Środki ostrożności przy pozyskiwaniu łusek' }
    ]),
    JSON.stringify([]),
    JSON.stringify(['text', 'file']),
    '2026-08-10 10:00',
    '2026-08-16 23:59',
    1,
    '2026-08-18 23:59',
    0,
    1,
    '2026-08-20 23:59',
    20,
    'rubric',
    JSON.stringify(hw4Rubric),
    0,
    0,
    '{}',
    1,
    0,
    1,
    '2026-08-10 10:00:00',
    '2026-08-10 10:00:00'
  );

  // Graded submission for Smokologia by Astrid Vinter
  const sub4Content = `RAPORT TAKSONOMICZNY: ŻMIJ SZRONOWY A BŁĘKITNY SMOK LODOWY

Żmij Szronowy (Vipera Glacialis) oraz Błękitny Smok Lodowy (Draco Caeruleus Polaris) stanowią dwa najbardziej wyraziste przykłady adaptacji drakonidów do warunków arktycznych.

1. Morfologia i Pokrywa Ciała:
Żmij Szronowy charakteryzuje się brakiem skrzydeł przednich oraz spłaszczonym, wężowatym ciałem pokrytym transparentnymi łuskami z czystego lodu organicznego. Łuski te działają jak naturalny pancerz odbijający zaklęcia termiczne niskiego rzędu (np. Incendio). Z kolei Smok Błękitny posiada potężne błoniaste skrzydła wzmocnione ścięgnami z białego żelaza, umożliwiające lot w warunkach huraganowych zamieci.

2. Mechanizm Mroźnego Oddechu:
W przeciwieństwie do smoków ziejących ogniem, oba podgatunki posiadają dodatkowy organ — lodowy pęcherz kriogeniczny (Vesica Glacialis), który schładza wdychane powietrze do temperatury -120°C. Reakcja zachodzi w kontakcie ze specjalnym enzymem katalizowanym przez sole mineralne połykane wraz ze śniegiem.

3. Pozyskiwanie Składników Alchemicznych:
Zdejmowanie łusek może odbywać się wyłącznie za pomocą narzędzi z czarnego nefrytu przy zachowaniu absolutnej ciszy mentalnej (Occlumency), aby nie obudzić uśpionej bestii.`;

  const sub4InlineAnnotations = [
    {
      id: 'ann-1',
      textRange: { start: 200, end: 320, text: 'pokrytym transparentnymi łuskami z czystego lodu organicznego' },
      comment: 'Znakomita obserwacja anatomiczna. Warto dodać, że łuski te topnieją dopiero w temperaturze powyżej 400°C.',
      createdAt: '2026-08-17 14:15:00',
      professorName: 'Prof. Valdemar Krag-Hansen'
    }
  ];

  insertSub.run(
    'sub-smok-valdemar',
    hw4Id,
    'usr-valdemar',
    'Valdemar Lindqvist',
    'ravnheim',
    'smokologia',
    'Smokologia i Bestie Północy',
    '',
    '',
    'graded',
    1,
    sub4Content,
    186,
    '[]',
    '[]',
    '2026-08-16 20:15:00',
    0,
    0,
    18,
    20,
    90.0,
    'Wybitny (W)',
    JSON.stringify({ sm1: 8, sm2: 4, sm3: 4, sm4: 2 }),
    'Bardzo dobra analiza materiału. Szczególnie trafnie opisano mechanizm działania pęcherza kriogenicznego oraz procedurę BHP przy pozyskiwaniu łusek.',
    JSON.stringify(sub4InlineAnnotations),
    '',
    '',
    5,
    1,
    '★ Wybitna Praca Badawcza',
    'Mistrz Smokologii',
    1,
    'Prof. Valdemar Krag-Hansen',
    '2026-08-17 14:20:00',
    '2026-08-15 12:00:00',
    '2026-08-17 14:20:00'
  );

  insertVer.run(
    'ver-smok-valdemar-1',
    'sub-smok-valdemar',
    hw4Id,
    'usr-valdemar',
    1,
    sub4Content,
    186,
    '[]',
    '[]',
    '2026-08-16 20:15:00',
    'graded',
    18,
    'Wybitny (W)',
    'Bardzo dobra analiza materiału. Szczególnie trafnie opisano mechanizm działania pęcherza kriogenicznego oraz procedurę BHP przy pozyskiwaniu łusek.',
    JSON.stringify({ sm1: 8, sm2: 4, sm3: 4, sm4: 2 }),
    JSON.stringify(sub4InlineAnnotations),
    '',
    '2026-08-16 20:15:00'
  );

  // --- Homework 5: Eliksiry - Stabilizacja Wiggenowego (Powiązana z lekcją 1) ---
  const hw5Id = 'hw-eliksiry-wiggenowy';
  insertHw.run(
    hw5Id,
    'Stabilizacja Eliksiru Wiggenowego w warunkach arktycznych',
    1,
    'practical',
    'eliksiry',
    'Eliksiry i Destylacja Soli',
    'Klasa II',
    'XVII Rok Szkolny',
    'les-1',
    'Stabilizacja Eliksiru Wiggenowego w warunkach północnych',
    'usr-astrid-vinter',
    '',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    'Krótki protokół laboratoryjny z pierwszej lekcji eliksirów.',
    'Na podstawie dyskusji na lekcji 1 w kociołkach z białego żelaza, opisz procedurę dodawania kory jarzębiny arktycznej i śluzu żądłoskoczka tundrowego.',
    JSON.stringify([
      { text: '150–300 słów' },
      { text: 'Wskazanie temperatury chłodzenia i kąta tarcia' }
    ]),
    JSON.stringify([]),
    JSON.stringify(['text', 'file']),
    '2026-08-22 20:00',
    '2026-08-29 23:59',
    1,
    '2026-08-31 23:59',
    0,
    1,
    '2026-09-02 23:59',
    15,
    'points',
    '[]',
    0,
    0,
    '{}',
    1,
    0,
    0,
    '2026-08-22 20:00:00',
    '2026-08-22 20:00:00'
  );

  console.log('[DB] Seeded comprehensive Homework assignments, submissions, rubrics, and templates.');
}

// ==================== IZBA PAMIĘCI — SEED DANYCH HISTORYCZNYCH ====================

const memoryYearCount = db.prepare('SELECT COUNT(*) as count FROM memory_school_years').get().count;

if (false && memoryYearCount === 0) {
  console.log('[DB] Seeding Izba Pamięci historical archives (XVII, XVI, XV Rok Szkolny)...');

  const insertYear = db.prepare(`
    INSERT INTO memory_school_years (id, year_code, name, term, date_range, start_date, end_date, winning_house, winning_points, headmaster, deputy, best_student, best_professor, highlight_event, student_count, professor_count, status, is_featured, summary, created_at, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // XVII Rok Szkolny (2026/2027)
  insertYear.run(
    'year-xvii', 'XVII', 'XVII Rok Szkolny', 'Semestr Zimowy 2026', '01.09.2026 – 31.10.2026',
    '2026-09-01', '2026-10-31', 'ravnheim', 2458,
    'Arcymistrz Valdemar Krag-Hansen', '',
    'Astrid Vinter', 'Prof. Ezra Camhi',
    'Wielki Turniej Runiczny Trzech Fiordów & Otwarcie Sali Pamięci',
    28, 7, 'published', 1,
    'Zimowy semestr bezdyskusyjnej chwały Zakonu Ravnheim. Przełomowe badania nad runami lodu, rekordowa liczba 24 wydanych dyplomów oraz uroczysta premiera odnowionej Gazetki Żelazne Pióro.',
    '2026-11-01 12:00:00', '2026-11-01 12:00:00'
  );

  // XVI Rok Szkolny (2025/2026)
  insertYear.run(
    'year-xvi', 'XVI', 'XVI Rok Szkolny', 'Semestr Wiosenny 2026', '01.02.2026 – 31.05.2026',
    '2026-02-01', '2026-05-31', 'reinhall', 2189,
    'Arcymistrz Thorvald Vinter', '',
    'Magnus Blom', '',
    'Odkrycie Zapomnianej Krypty Blóðhorn',
    22, 6, 'published', 0,
    'Wiosenny semestr niezłomnej dyscypliny i chwały Zakonu Reinhall. Rekordowe zbiory ziół arktycznych, pomyślna ekspedycja na lodowiec Jotunheim i mistrzostwo w pojedynkach obronnych.',
    '2026-06-01 12:00:00', '2026-06-01 12:00:00'
  );

  // XV Rok Szkolny (2025)
  insertYear.run(
    'year-xv', 'XV', 'XV Rok Szkolny', 'Semestr Zimowy 2025', '01.09.2025 – 31.12.2025',
    '2025-09-01', '2025-12-31', 'bjornhall', 2340,
    'Arcymistrz Thorvald Vinter', '',
    'Einar Solberg', '',
    'Wielki Turniej Żelaznego Niedźwiedzia',
    20, 5, 'published', 0,
    'Jubileuszowy rok potęgi bojowej Zakonu Björnhall. Ponad sto oficjalnych starć na Arenie Północy i ustanowienie nowego rekordu obrony Cytadeli przed szturmem trolli granitowych.',
    '2026-01-02 12:00:00', '2026-01-02 12:00:00'
  );

  // Snapshots osób
  const insertPerson = db.prepare(`
    INSERT INTO memory_person_snapshots (id, school_year_id, user_id, character_name, full_name, avatar, house, role, class_year, final_grade, best_subject, ranking_position, points, honors_count, titles, functions, is_graduate, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPerson.run(
    'per-astrid-xvii', 'year-xvii', 'usr-astrid-vinter', 'Astrid Vinter', 'Astrid Vinter',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    'ravnheim', 'graduate', 'Klasa II', 'Wybitny', 'Starożytne Runy',
    1, 480, 4,
    JSON.stringify(['Prymus XVII Roku Szkolnego', 'Mistrzyni Runicznego Rysu', 'Młodszy Badacz Cytadeli']),
    JSON.stringify(['Stażystka Katedry Run', 'Prefekt Zakonu Ravnheim', 'Korespondent Żelaznego Pióra']),
    1, 'Absolwentka z najwyższą notą w historii Katedry Starożytnych Runów. Praca dyplomowa na temat pieczęci Fehu i Tiwaz.',
    '2026-11-01 12:00:00'
  );

  insertPerson.run(
    'per-magnus-xvii', 'year-xvii', 'usr-magnus', 'Magnus Blom', 'Magnus Blom',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'reinhall', 'student', 'Klasa II', 'Powyżej Oczekiwań', 'Magia Krwi i Obrona',
    2, 420, 2,
    JSON.stringify(['Pierwsza Szpica Reinhall', 'Obrońca Paktu']),
    JSON.stringify(['Herold Cytadeli', 'Prefekt Reinhall']),
    1, 'Wzorowy absolwent, niezastąpiony organizator turniejów i ceremonii paktowych.',
    '2026-11-01 12:00:00'
  );

  insertPerson.run(
    'per-sigrid-xvii', 'year-xvii', 'usr-sigrid', 'Sigrid Lind', 'Sigrid Lind',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'otergard', 'student', 'Klasa I', 'Powyżej Oczekiwań', 'Eliksiry i Toksykologia',
    3, 395, 2,
    JSON.stringify(['Alchemik Lodu', 'Adept Pierwszego Kręgu']),
    JSON.stringify(['Laborant Katedry Eliksirów']),
    0, 'Odkrycie stabilnej receptury destylatu mrozowego.',
    '2026-11-01 12:00:00'
  );

  insertPerson.run(
    'per-einar-xvii', 'year-xvii', 'usr-einar', 'Einar Solberg', 'Einar Solberg',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'bjornhall', 'graduate', 'Klasa II', 'Wybitny', 'Czarna Magia i Klątwy',
    4, 385, 3,
    JSON.stringify(['Mistrz Pojedynków XVII Roku', 'Tarczownik Björnhall']),
    JSON.stringify(['Szermierz Runiczny', 'Prefekt Björnhall']),
    1, 'Zwycięzca wszystkich oficjalnych pojedynków turniejowych semestru zimowego.',
    '2026-11-01 12:00:00'
  );

  insertPerson.run(
    'per-valdemar-xvii', 'year-xvii', 'usr-valdemar', 'Valdemar Krag-Hansen', 'Valdemar Krag-Hansen',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'ravnheim', 'admin', 'Absolwent / Dyrekcja', 'Arcymistrz', 'Wróżbiarstwo i Runy',
    0, 0, 5,
    JSON.stringify(['Arcymistrz Cytadeli', 'Redaktor Naczelny Żelaznego Pióra', 'Kustosz Biblioteki Cieni']),
    JSON.stringify(['Dyrektor Szkoły', 'Opiekun Wieży Nocnych Szeptów']),
    1, 'Kierował Cytadelą w XVII Roku Szkolnym, autor reformy egzaminacyjnej.',
    '2026-11-01 12:00:00'
  );

  // XVI Rok Person Snapshots
  insertPerson.run(
    'per-magnus-xvi', 'year-xvi', 'usr-magnus', 'Magnus Blom', 'Magnus Blom',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'reinhall', 'student', 'Klasa I', 'Wybitny', 'Magia Krwi',
    1, 445, 3,
    JSON.stringify(['Prymus XVI Roku']),
    JSON.stringify(['Prefekt Młodszy']),
    0, 'Znakomity pierwszy rok w Reinhall.',
    '2026-06-01 12:00:00'
  );

  // Staff Snapshots
  const insertStaff = db.prepare(`
    INSERT INTO memory_staff_snapshots (id, school_year_id, user_id, name, avatar, title, role, house, subject_name, department, mentor_name, intern_status, duties_summary, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStaff.run(
    'stf-ezra-xvii', 'year-xvii', 'usr-ezra-camhi', 'Prof. Ezra Camhi',
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80',
    'Profesor Czarnej Magii & Mistrz Klątw Północy', 'professor', 'ravnheim', 'Czarna Magia i Klątwy',
    'Katedra Sztuk Ciemności', '', '', 'Prowadzenie wykładów z klątw niszczących, nadzór nad pojedynkami II Kręgu.', 1, '2026-11-01 12:00:00'
  );

  insertStaff.run(
    'stf-morana-xvii', 'year-xvii', 'usr-morana-vane', '',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    'Profesor Wróżbiarstwa & Opiekun Ravnheim', 'house_head', 'ravnheim', 'Wróżbiarstwo z Kości i Astralne Symbole',
    'Katedra Tajemnic i Wieszczbiarstwa', '', '', 'Zastępca Dyrektora, opieka nad Zakonem Ravnheim.', 2, '2026-11-01 12:00:00'
  );

  insertStaff.run(
    'stf-sigrid-xvii', 'year-xvii', 'usr-sigrid-hallstrom', '',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    'Profesor Eliksirów & Opiekun Reinhall', 'house_head', 'reinhall', 'Eliksiry i Destylacja Soli',
    'Katedra Alchemii i Warzenia', '', '', 'Kierowanie laboratoriami alchemicznymi, opieka nad Reinhall.', 3, '2026-11-01 12:00:00'
  );

  insertStaff.run(
    'stf-gunnar-xvii', 'year-xvii', 'usr-gunnar-vargson', '',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    'Profesor Zaklęć Bojowych & Opiekun Björnhall', 'house_head', 'bjornhall', 'Zaklęcia i Uroki Obronne',
    'Katedra Magii Bojowej', '', '', 'Koordynator obrony murów, opieka nad Zakonem Björnhall.', 4, '2026-11-01 12:00:00'
  );

  insertStaff.run(
    'stf-astrid-intern-xvii', 'year-xvii', 'usr-astrid-vinter', 'Staż. Astrid Vinter',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    'Młodszy Asystent i Stażystka Katedry Run', 'intern', 'ravnheim', 'Starożytne Runy',
    'Katedra Pisma Runicznego', 'Prof. Ezra Camhi', 'hired', 'Ukończyła roczny staż z wynikiem celującym, mianowana pełnoprawnym wykładowcą.', 5, '2026-11-01 12:00:00'
  );

  // Trophies
  const insertTrophy = db.prepare(`
    INSERT INTO memory_trophies (id, school_year_id, house, trophy_type, title, points, house_head, top_scorers, description, icon, image_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTrophy.run(
    'tr-xvii-housecup', 'year-xvii', 'ravnheim', 'house_cup', 'Wielki Puchar Twierdzy Magii XVII Roku',
    2458, '',
    JSON.stringify([
      { name: 'Astrid Vinter', points: 480, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' },
      { name: 'Valdemar Krag-Hansen', points: 390, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
      { name: 'Liv Møller', points: 320, avatar: '' }
    ]),
    'Najbardziej prestiżowe trofeum szkoły zdobyte przez Zakon Kruka z przewagą 269 punktów nad Reinhall.',
    '🏆', '/trophy_gold.jpg', '2026-11-01 12:00:00'
  );

  insertTrophy.run(
    'tr-xvii-dueling', 'year-xvii', 'bjornhall', 'dueling_cup', 'Tarcza Żelaznego Mistrza Pojedynków',
    420, '',
    JSON.stringify([
      { name: 'Einar Solberg', points: 190, avatar: '' },
      { name: 'Torstein Ragnvald', points: 140, avatar: '' }
    ]),
    'Trofeum za bezwzględne zwycięstwo w turnieju pojedynkowym na Arenie Mrozu.',
    '🛡️', '/trophy_iron.jpg', '2026-11-01 12:00:00'
  );

  insertTrophy.run(
    'tr-xvi-housecup', 'year-xvi', 'reinhall', 'house_cup', 'Wielki Puchar Twierdzy Magii XVI Roku',
    2189, '',
    JSON.stringify([
      { name: 'Magnus Blom', points: 445, avatar: '' },
      { name: 'Kari Håkonson', points: 360, avatar: '' }
    ]),
    'Zwycięstwo Zakonu Reinhall po brawurowym finiszu i badaniach w Krypcie Blóðhorn.',
    '🏆', '/trophy_gold.jpg', '2026-06-01 12:00:00'
  );

  insertTrophy.run(
    'tr-xv-housecup', 'year-xv', 'bjornhall', 'house_cup', 'Wielki Puchar Twierdzy Magii XV Roku',
    2340, '',
    JSON.stringify([
      { name: 'Einar Solberg', points: 410, avatar: '' },
      { name: 'Bjorn Ironhide', points: 395, avatar: '' }
    ]),
    'Triumf Zakonu Niedźwiedzia w XV jubileuszowym roku szkoły.',
    '🏆', '/trophy_gold.jpg', '2026-01-02 12:00:00'
  );

  // Certificates (Świadectwa)
  const insertCert = db.prepare(`
    INSERT INTO memory_certificates (id, school_year_id, user_id, student_name, house, class_year, document_number, issue_date, final_evaluation, subjects_grades, exam_results, average_score, authority_name, authority_title, seal_type, visibility, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCert.run(
    'cert-xvii-001', 'year-xvii', 'usr-astrid-vinter', 'Astrid Vinter', 'ravnheim', 'Klasa II',
    'TMD/SW/XVII/001', '2026-10-31', 'Wybitny (Złota Runowa Pieczęć)',
    JSON.stringify([
      { subject: 'Starożytne Runy', grade: '6', gradeLabel: 'Wybitny', examScore: '98%' },
      { subject: 'Czarna Magia i Klątwy', grade: '5', gradeLabel: 'Powyżej Oczekiwań', examScore: '92%' },
      { subject: 'Wróżbiarstwo z Kości', grade: '6', gradeLabel: 'Wybitny', examScore: '100%' },
      { subject: 'Eliksiry i Destylacja Soli', grade: '5', gradeLabel: 'Powyżej Oczekiwań', examScore: '89%' },
      { subject: 'Zaklęcia i Uroki Bojowe', grade: '5', gradeLabel: 'Powyżej Oczekiwań', examScore: '94%' }
    ]),
    JSON.stringify([
      { examName: 'Oficjalny Egzamin Runiczny II Kręgu', score: 98, grade: 'Wybitny' },
      { examName: 'Egzamin Magii Bojowej', score: 92, grade: 'Powyżej Oczekiwań' }
    ]),
    5.4, 'Arcymistrz Valdemar Krag-Hansen', 'Dyrektor Cytadeli Durmstrang', 'silver_raven', 'public', '2026-11-01 12:00:00'
  );

  insertCert.run(
    'cert-xvii-002', 'year-xvii', 'usr-magnus', 'Magnus Blom', 'reinhall', 'Klasa II',
    'TMD/SW/XVII/002', '2026-10-31', 'Powyżej Oczekiwań (Czerwona Pieczęć Rogu)',
    JSON.stringify([
      { subject: 'Magia Krwi i Obrona', grade: '6', gradeLabel: 'Wybitny', examScore: '96%' },
      { subject: 'Zaklęcia Bojowe', grade: '5', gradeLabel: 'Powyżej Oczekiwań', examScore: '88%' },
      { subject: 'Starożytne Runy', grade: '4', gradeLabel: 'Zadowalający', examScore: '78%' },
      { subject: 'Eliksiry', grade: '5', gradeLabel: 'Powyżej Oczekiwań', examScore: '86%' }
    ]),
    JSON.stringify([
      { examName: 'Paktowy Egzamin Obrony Krwi', score: 96, grade: 'Wybitny' }
    ]),
    5.0, 'Arcymistrz Valdemar Krag-Hansen', 'Dyrektor Cytadeli Durmstrang', 'gold_wolf', 'public', '2026-11-01 12:00:00'
  );

  insertCert.run(
    'cert-xvii-003', 'year-xvii', 'usr-einar', 'Einar Solberg', 'bjornhall', 'Klasa II',
    'TMD/SW/XVII/003', '2026-10-31', 'Wybitny w Sztukach Bojowych',
    JSON.stringify([
      { subject: 'Czarna Magia i Pojedynki', grade: '6', gradeLabel: 'Wybitny', examScore: '99%' },
      { subject: 'Zaklęcia Niszczące', grade: '6', gradeLabel: 'Wybitny', examScore: '95%' },
      { subject: 'Starożytne Runy', grade: '4', gradeLabel: 'Zadowalający', examScore: '75%' }
    ]),
    JSON.stringify([
      { examName: 'Egzamin Pojedynkowy Czarnej Magii', score: 99, grade: 'Wybitny' }
    ]),
    5.2, 'Arcymistrz Valdemar Krag-Hansen', 'Dyrektor Cytadeli Durmstrang', 'iron_bear', 'public', '2026-11-01 12:00:00'
  );

  // Diplomas
  const insertDiploma = db.prepare(`
    INSERT INTO memory_diplomas (id, school_year_id, user_id, recipient_name, house, category, title, place, description, issuer, date, badge_icon, image_url, visibility, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDiploma.run(
    'dip-xvii-01', 'year-xvii', 'usr-astrid-vinter', 'Astrid Vinter', 'ravnheim', 'turniej',
    'Wielki Turniej Runiczny Trzech Fiordów', 'I Miejsce',
    'Za bezbłędne odtworzenie prastarego kręgu ochronnego Algiz-Sowilo pod naporem zaklęć mrozowych.',
    'Kancelaria Dyrekcji & Katedra Run', '2026-10-15', 'ᚱ', '', 'public', '2026-11-01 12:00:00'
  );

  insertDiploma.run(
    'dip-xvii-02', 'year-xvii', 'usr-einar', 'Einar Solberg', 'bjornhall', 'turniej',
    'Otwarte Mistrzostwa Pojedynkowe Cytadeli', 'I Miejsce',
    'Zwycięzca turnieju w kategorii Czarnej Magii Bojowej i Klątw Bezpośrednich.',
    'Mistrz Areny Prof. Gunnar Vargson', '2026-10-22', '⚔️', '', 'public', '2026-11-01 12:00:00'
  );

  insertDiploma.run(
    'dip-xvii-03', 'year-xvii', 'usr-magnus', 'Magnus Blom', 'reinhall', 'specjalny',
    'Zasłużony Herold Twierdzy Magii', 'Wyróżnienie Specjalne',
    'Za niezrównaną pieczę nad statutem, heraldyką i organizacją ceremonii paktowych.',
    'Rada Najwyższa Dyrekcji', '2026-10-30', '📜', '', 'public', '2026-11-01 12:00:00'
  );

  insertDiploma.run(
    'dip-xvii-04', 'year-xvii', 'usr-sigrid', 'Sigrid Lind', 'otergard', 'olimpiada',
    'Olimpiada Toksykologii i Eliksirów Arktycznych', 'II Miejsce',
    'Za opracowanie receptury neutralizatora jadu morskich żmij głębinowych.',
    '', '2026-10-18', '🧪', '', 'public', '2026-11-01 12:00:00'
  );

  // Awards (Wyróżnienia)
  const insertAward = db.prepare(`
    INSERT INTO memory_awards (id, school_year_id, user_id, recipient_name, house, award_type, title, description, icon, visibility, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAward.run(
    'aw-xvii-01', 'year-xvii', 'usr-astrid-vinter', 'Astrid Vinter', 'ravnheim', 'uczen_roku',
    'Uczeń Roku XVII', 'Najwyższy wynik punktowy, wzorowe oceny i celujący staż naukowy.',
    '🌟', 'public', '2026-11-01 12:00:00'
  );

  insertAward.run(
    'aw-xvii-02', 'year-xvii', 'usr-ezra-camhi', 'Prof. Ezra Camhi', 'ravnheim', 'profesor_roku',
    'Profesor Roku XVII', 'Plebiscyt uczniów: najwyżej oceniane wykłady, mentoring i rzetelność dziennika.',
    '👑', 'public', '2026-11-01 12:00:00'
  );

  insertAward.run(
    'aw-xvii-03', 'year-xvii', 'usr-einar', 'Einar Solberg', 'bjornhall', 'mistrz_pojedynkow',
    'Mistrz Pojedynków Północy', 'Niepokonany w walkach runicznych semestru zimowego.',
    '⚔️', 'public', '2026-11-01 12:00:00'
  );

  insertAward.run(
    'aw-xvii-04', 'year-xvii', 'usr-magnus', 'Magnus Blom', 'reinhall', 'herold_roku',
    'Złote Pióro Herolda', 'Wzorowa służba ceremonialna i dbałość o kroniki szkolne.',
    '📯', 'public', '2026-11-01 12:00:00'
  );

  // Rankings
  const insertRanking = db.prepare(`
    INSERT INTO memory_rankings (id, school_year_id, ranking_type, standings, snapshot_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertRanking.run(
    'rnk-xvii-students', 'year-xvii', 'students',
    JSON.stringify([
      { rank: 1, name: 'Astrid Vinter', house: 'ravnheim', points: 480, classYear: 'Klasa II', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' },
      { rank: 2, name: 'Magnus Blom', house: 'reinhall', points: 420, classYear: 'Klasa II', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
      { rank: 3, name: 'Sigrid Lind', house: 'otergard', points: 395, classYear: 'Klasa I', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
      { rank: 4, name: 'Einar Solberg', house: 'bjornhall', points: 385, classYear: 'Klasa II', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
      { rank: 5, name: 'Liv Møller', house: 'ravnheim', points: 320, classYear: 'Klasa I', avatar: '' }
    ]),
    '2026-10-31', '2026-11-01 12:00:00'
  );

  insertRanking.run(
    'rnk-xvii-houses', 'year-xvii', 'houses',
    JSON.stringify([
      { rank: 1, house: 'ravnheim', name: 'Ravnheim', points: 2458, cupWon: true, motto: 'W ciszy cienia kryje się potęga.' },
      { rank: 2, house: 'reinhall', name: 'Reinhall', points: 2189, cupWon: false, motto: 'Krew nie kłamie, mróz nie wybacza.' },
      { rank: 3, house: 'bjornhall', name: 'Björnhall', points: 2045, cupWon: false, motto: 'Pancerz z woli, miecz z wiedzy.' },
      { rank: 4, house: 'otergard', name: 'Otergard', points: 1980, cupWon: false, motto: 'Przenikamy każdą szczelinę.' }
    ]),
    '2026-10-31', '2026-11-01 12:00:00'
  );

  insertRanking.run(
    'rnk-xvii-professors', 'year-xvii', 'professors',
    JSON.stringify([
      { rank: 1, name: 'Prof. Ezra Camhi', subject: 'Czarna Magia i Klątwy', lessonsCount: 14, pointsGiven: 720 },
      { rank: 2, name: '', subject: 'Wróżbiarstwo z Kości', lessonsCount: 12, pointsGiven: 640 },
      { rank: 3, name: '', subject: 'Eliksiry', lessonsCount: 11, pointsGiven: 590 },
      { rank: 4, name: '', subject: 'Zaklęcia Bojowe', lessonsCount: 10, pointsGiven: 510 }
    ]),
    '2026-10-31', '2026-11-01 12:00:00'
  );

  // Plebiscites (Lodowe Sople)
  const insertPlebiscite = db.prepare(`
    INSERT INTO memory_plebiscites (id, school_year_id, title, edition, description, categories, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertPlebiscite.run(
    'pleb-xvii', 'year-xvii', 'Lodowe Sople XVII Roku Szkolnego', 'Edycja Zimowa 2026',
    'Oficjalny plebiscyt społeczności Twierdzy Magii Durmstrang, podsumowujący najciekawsze osobowości i wydarzenia semestru.',
    JSON.stringify([
      {
        categoryName: 'Najsympatyczniejszy Profesor',
        winner: 'Prof. Ezra Camhi',
        nominees: ['Prof. Ezra Camhi', '', ''],
        icon: '❄️'
      },
      {
        categoryName: 'Najbardziej Tajemniczy Adept',
        winner: 'Astrid Vinter',
        nominees: ['Astrid Vinter', 'Einar Solberg', 'Liv Møller'],
        icon: '🔮'
      },
      {
        categoryName: 'Mistrz Ciętej Riposty w Karczmie',
        winner: 'Magnus Blom',
        nominees: ['Magnus Blom', '', 'Sigrid Lind'],
        icon: '🍺'
      },
      {
        categoryName: 'Wydarzenie Semestru',
        winner: 'Wielki Turniej Runiczny Trzech Fiordów',
        nominees: ['Wielki Turniej Runiczny', 'Pojedynek w Sali Tronowej', 'Premiera Żelaznego Pióra'],
        icon: '🏆'
      }
    ]),
    '2026-11-01 12:00:00'
  );

  // Chronicle Events
  const insertChronicle = db.prepare(`
    INSERT INTO memory_chronicle_events (id, school_year_id, title, category, date, description, results, linked_diploma_ids, tags, image_url, order_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertChronicle.run(
    'chr-xvii-01', 'year-xvii', 'Inauguracja XVII Roku i Ceremonia Kamienia Przysięgi', 'ceremonia',
    '2026-09-01', 'Rozpoczęcie roku szkolnego, uroczysty przydział nowicjuszy do czterech Zakonów i odnowienie Paktu Północy.',
    JSON.stringify(['28 nowych adeptów złożyło przysięgę wierności Twierdzy']),
    JSON.stringify([]), JSON.stringify(['inauguracja', 'ceremonia', 'przydzial']), '', 1, '2026-11-01 12:00:00'
  );

  insertChronicle.run(
    'chr-xvii-02', 'year-xvii', 'Wielki Turniej Runiczny Trzech Fiordów', 'turniej',
    '2026-10-15', 'Starcie mistrzów runicznych z całego archipelagu. Zadanie polegało na aktywacji starych obelisków w śnieżycy.',
    JSON.stringify(['I Miejsce: Astrid Vinter (Ravnheim)', 'II Miejsce: Sigrid Lind (Otergard)', 'III Miejsce: Magnus Blom (Reinhall)']),
    JSON.stringify(['dip-xvii-01']), JSON.stringify(['turniej', 'runy', 'rywalizacja']), '', 2, '2026-11-01 12:00:00'
  );

  insertChronicle.run(
    'chr-xvii-03', 'year-xvii', 'Wielki Bankiet i Wręczenie Pucharu Twierdzy', 'ceremonia',
    '2026-10-31', 'Zwieńczenie semestru zimowego. Zakon Ravnheim pod wodzą Prof. Morany Vane uroczyście wznosi Puchar XVII Roku.',
    JSON.stringify(['Zdobywca Pucharu: Zakon Ravnheim (2458 pkt)']),
    JSON.stringify([]), JSON.stringify(['puchar', 'bankiet', 'zakonczenie']), '', 3, '2026-11-01 12:00:00'
  );

  // Gazette Snapshots
  const insertGazette = db.prepare(`
    INSERT INTO memory_gazette_snapshots (id, school_year_id, editor_in_chief, editorial_staff, issues_count, issues_links, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertGazette.run(
    'gaz-xvii', 'year-xvii', 'Valdemar Krag-Hansen',
    JSON.stringify([
      { name: 'Valdemar Krag-Hansen', role: 'Redaktor Naczelny', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
      { name: 'Astrid Vinter', role: 'Korektor & Publicysta', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' },
      { name: 'Magnus Blom', role: 'Kronikarz Wydarzeń', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
    ]),
    4,
    JSON.stringify([
      { issueNumber: 1, title: 'Przebudzenie Północy', date: '2026-09-10', linkId: 'iss-1' },
      { issueNumber: 2, title: 'Tajemnice Mroźnych Głębin', date: '2026-09-25', linkId: 'iss-2' },
      { issueNumber: 3, title: 'Turniej Trzech Fiordów', date: '2026-10-16', linkId: 'iss-3' },
      { issueNumber: 4, title: 'Triumf Kruka i Złoty Zmierzch', date: '2026-10-31', linkId: 'iss-4' }
    ]),
    '2026-11-01 12:00:00'
  );

  // Custom Achievements
  const insertCustomAch = db.prepare(`
    INSERT INTO memory_custom_achievements (id, school_year_id, title, recipient_name, house, description, category, date, image_url, icon, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCustomAch.run(
    'ach-xvii-01', 'year-xvii', 'Odkrycie Sekretu Krypty Nocnych Szeptów', 'Astrid Vinter & Valdemar Krag-Hansen', 'ravnheim',
    'Pierwsze od pół wieku odnalezienie zaginionego rękopisu założycielki Morany Skuggaganga.',
    'Odkrycie Historyczne', '2026-10-04', '', '🗝️', '2026-11-01 12:00:00'
  );

  insertCustomAch.run(
    'ach-xvii-02', 'year-xvii', 'Rekord Pojedynków bez Porażki', 'Einar Solberg', 'bjornhall',
    'Ustanowienie rekordu 18 wygranych pojedynków z rzędu w trakcie jednego semestru.',
    'Rekord Bojowy', '2026-10-28', '', '⚡', '2026-11-01 12:00:00'
  );

  console.log('[DB] Successfully seeded Izba Pamięci with comprehensive multi-year history.');
}
}
