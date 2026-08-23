import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'durmstrang.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ===================== MIGRATIONS =====================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT DEFAULT '',
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    status TEXT NOT NULL DEFAULT 'pending',
    house TEXT,
    title TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    department TEXT,
    department_name TEXT,
    default_banner_category TEXT,
    office TEXT,
    specialization TEXT,
    class_year TEXT,
    origin TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    next_level_xp INTEGER DEFAULT 500,
    points INTEGER DEFAULT 20,
    currency INTEGER DEFAULT 150,
    wand TEXT,
    patronus TEXT,
    companion TEXT,
    appearance TEXT,
    backstory TEXT,
    gender TEXT DEFAULT 'czarodziej',
    taught_subject_ids TEXT DEFAULT '[]',
    grades TEXT DEFAULT '[]',
    inventory TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    to_name TEXT NOT NULL,
    from_addr TEXT NOT NULL DEFAULT 'kancelaria@durmstrang.edu',
    from_name TEXT NOT NULL DEFAULT 'Kancelaria Cytadeli Durmstrang',
    subject TEXT NOT NULL,
    date TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'info',
    body TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    content TEXT DEFAULT '',
    author TEXT DEFAULT '',
    author_role TEXT DEFAULT 'admin',
    category TEXT DEFAULT 'edykty',
    pinned INTEGER DEFAULT 0,
    date TEXT DEFAULT (date('now')),
    reactions TEXT DEFAULT '{}',
    comments TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT DEFAULT 'ceremony',
    description TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS pending_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    email TEXT DEFAULT '',
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    department_name TEXT,
    origin TEXT DEFAULT '',
    age TEXT DEFAULT '',
    wand TEXT DEFAULT '',
    patronus TEXT DEFAULT '',
    companion TEXT DEFAULT '',
    appearance TEXT DEFAULT '',
    backstory TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    date_submitted TEXT DEFAULT (date('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    admin TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT DEFAULT ''
  );

  -- ==================== DZIENNIKI LEKCYJNE & SYSTEM PUNKTOW ====================

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    class_year TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT DEFAULT '',
    professor_id TEXT NOT NULL,
    professor_name TEXT NOT NULL,
    professor_avatar TEXT DEFAULT '',
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'ready', 'published', 'archived'
    discord_thread_id TEXT DEFAULT '',
    discord_channel_id TEXT DEFAULT '',
    discord_guild_id TEXT DEFAULT '',
    discord_thread_url TEXT DEFAULT '',
    total_points INTEGER DEFAULT 0,
    participants_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    published_at TEXT
  );

  CREATE TABLE IF NOT EXISTS lesson_messages (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    discord_message_id TEXT NOT NULL,
    discord_user_id TEXT DEFAULT '',
    author_name TEXT NOT NULL,
    author_display_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '',
    author_house TEXT DEFAULT '',
    content TEXT DEFAULT '',
    timestamp TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    reply_to_id TEXT DEFAULT '',
    reply_to_author TEXT DEFAULT '',
    reply_to_content TEXT DEFAULT '',
    is_bot INTEGER DEFAULT 0,
    is_system INTEGER DEFAULT 0,
    is_command INTEGER DEFAULT 0,
    command_data TEXT DEFAULT '{}',
    embeds TEXT DEFAULT '[]',
    reactions TEXT DEFAULT '[]',
    attachments TEXT DEFAULT '[]',
    is_edited INTEGER DEFAULT 0,
    edit_history TEXT DEFAULT '[]',
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lesson_participants (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    student_id TEXT,
    student_name TEXT NOT NULL,
    house TEXT NOT NULL,
    is_present INTEGER DEFAULT 1,
    points_awarded INTEGER DEFAULT 0,
    comment TEXT DEFAULT '',
    role TEXT DEFAULT 'student',
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS point_transactions (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    student_name TEXT NOT NULL,
    house TEXT NOT NULL,
    points INTEGER NOT NULL,
    source TEXT NOT NULL,
    lesson_id TEXT,
    professor_id TEXT,
    professor_name TEXT NOT NULL,
    date TEXT NOT NULL,
    comment TEXT DEFAULT '',
    is_revoked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS point_audit_logs (
    id TEXT PRIMARY KEY,
    point_transaction_id TEXT NOT NULL,
    previous_points INTEGER NOT NULL,
    new_points INTEGER NOT NULL,
    modified_by TEXT NOT NULL,
    reason TEXT NOT NULL,
    lesson_id TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS discord_bot_config (
    id TEXT PRIMARY KEY,
    bot_token TEXT DEFAULT '',
    guild_id TEXT DEFAULT '',
    lessons_channel_id TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    webhook_url TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS school_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- ==================== MODUŁ PRZEDMIOTÓW (KATEDRY) ====================

  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT DEFAULT '',
    icon TEXT DEFAULT '📚',
    category TEXT DEFAULT 'Ogólne',
    description TEXT DEFAULT '',
    classroom TEXT DEFAULT '',
    professor_id TEXT DEFAULT '',
    professor_name TEXT DEFAULT '',
    banner_url TEXT DEFAULT '',
    banner_gradient TEXT DEFAULT '',
    syllabus TEXT DEFAULT '',
    regulations TEXT DEFAULT '',
    class_years TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS grade_categories (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    icon TEXT DEFAULT '📝',
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    house TEXT NOT NULL,
    grade TEXT NOT NULL,
    grade_label TEXT NOT NULL,
    grade_value INTEGER NOT NULL,
    title TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    professor_id TEXT NOT NULL,
    professor_name TEXT NOT NULL,
    lesson_id TEXT DEFAULT '',
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES grade_categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subject_achievements (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    achievement_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '🏆',
    date TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  -- ==================== PLAN LEKCJI & HARMONOGRAM ====================

  CREATE TABLE IF NOT EXISTS timetable_entries (
    id TEXT PRIMARY KEY,
    subject_id TEXT,
    subject_name TEXT NOT NULL,
    subject_code TEXT DEFAULT '',
    subject_icon TEXT DEFAULT '📚',
    subject_category TEXT DEFAULT 'Magia',
    day_of_week INTEGER NOT NULL,
    day_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    classroom TEXT NOT NULL,
    professor_id TEXT DEFAULT '',
    professor_name TEXT NOT NULL,
    professor_avatar TEXT DEFAULT '',
    class_year TEXT NOT NULL DEFAULT 'Klasa I',
    house_target TEXT DEFAULT 'all',
    topic TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'substitution', 'cancelled', 'rescheduled'
    original_professor_name TEXT DEFAULT '',
    substitute_professor_id TEXT DEFAULT '',
    substitute_professor_name TEXT DEFAULT '',
    substitution_reason TEXT DEFAULT '',
    cancellation_reason TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- ==================== BANK CYTADELI (SKÍRNISBANKI) ====================
  CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    user_name TEXT NOT NULL,
    vault_number TEXT NOT NULL,
    vault_tier TEXT DEFAULT 'Skrytka Adepta',
    balance INTEGER DEFAULT 150,
    security_level TEXT DEFAULT 'Maksymalny',
    rune_seal TEXT DEFAULT 'Pieczęć Algiz',
    guardian TEXT DEFAULT 'Górski Troll Granitowy',
    interest_rate TEXT DEFAULT '2.5% rocznie',
    opened_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bank_transactions (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'inflow', 'outflow', 'transfer'
    category TEXT NOT NULL, -- 'stypendium', 'przelew', 'zakup', 'pensja', 'nagroda_wyprawka', 'loteria', 'inne'
    title TEXT NOT NULL,
    note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'rejected'
    reference_code TEXT NOT NULL,
    date TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS teacher_salaries (
    id TEXT PRIMARY KEY,
    professor_id TEXT NOT NULL,
    professor_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    period TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'Budżet Dyrekcji',
    lesson_id TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'paid',
    paid_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (professor_id) REFERENCES users(id)
  );

  -- ==================== RYNEK KAUPANGR & SKLEPY ====================
  CREATE TABLE IF NOT EXISTS store_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    shop_id TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    icon TEXT DEFAULT '📦',
    house_exclusive TEXT,
    rarity TEXT NOT NULL DEFAULT 'Zwykły',
    description TEXT DEFAULT '',
    lore TEXT DEFAULT '',
    placeholder_type TEXT DEFAULT 'artifact_pendant',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shopping_lists (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT DEFAULT '',
    category TEXT NOT NULL,
    required_item_ids TEXT NOT NULL, -- JSON array
    reward_points INTEGER DEFAULT 50,
    reward_skirnirs INTEGER DEFAULT 100,
    icon TEXT DEFAULT '📜',
    badge TEXT DEFAULT 'Wyprawka Ukończona',
    lore TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_shopping_lists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    list_id TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at TEXT,
    points_awarded INTEGER DEFAULT 0,
    skirnirs_awarded INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE
  );

  -- ==================== SKANDYNAWSKA LOTERIA ODYNA ====================
  CREATE TABLE IF NOT EXISTS lottery_rounds (
    id TEXT PRIMARY KEY,
    round_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    ticket_price INTEGER DEFAULT 20,
    jackpot INTEGER DEFAULT 2500,
    bonus_house_points INTEGER DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'drawing', 'completed'
    end_date TEXT NOT NULL,
    winning_runes TEXT DEFAULT '[]', -- JSON array of rune IDs
    total_tickets_sold INTEGER DEFAULT 0,
    participants_count INTEGER DEFAULT 0,
    winners_summary TEXT DEFAULT '[]', -- JSON array
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lottery_tickets (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    house TEXT NOT NULL,
    chosen_runes TEXT NOT NULL, -- JSON array of 3 rune IDs
    purchased_at TEXT DEFAULT (datetime('now')),
    matches_count INTEGER DEFAULT 0,
    prize_won INTEGER DEFAULT 0,
    claimed INTEGER DEFAULT 0,
    FOREIGN KEY (round_id) REFERENCES lottery_rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ===================== SEED DATA =====================

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0) {
  console.log('[DB] Seeding initial users...');

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, email, name, surname, full_name, role, status, house, title, avatar, department, department_name, default_banner_category, office, specialization, class_year, origin, level, xp, next_level_xp, points, currency, wand, patronus, companion, appearance, backstory, taught_subject_ids, grades, inventory, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Valdemar (Student)
  insertUser.run(
    'usr-valdemar', 'valdemar', '123', 'valdemar@nordic.no',
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
      { subjectId: 'czarna-magia', subjectName: 'Czarna Magia i Nekromancja', lessonTitle: 'Wiązanie Cieni', grade: 'Wybitny (W)', professor: 'Prof. Morana Vane' },
      { subjectId: 'starozytne-runy', subjectName: 'Starożytne Runy Północy', lessonTitle: 'Futhark Starszy', grade: 'Powyżej Oczekiwań (P)', professor: 'Prof. Sigrid Hällström' },
      { subjectId: 'klatwy-i-uroki', subjectName: 'Klątwy i Magia Bojowa', lessonTitle: 'Tarcza Żelaza', grade: 'Wybitny (W)', professor: 'Prof. Gunnar Vargson' }
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
    'usr-morana', 'morana', '123', 'morana@durmstrang.edu',
    'Morana', 'Vane', 'Prof. Morana Vane',
    'professor', 'approved', 'ravnheim',
    'Opiekunka Zakonu Ravnheim • Katedra Czarnej Magii',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    'czarna-magia', 'Czarna Magia & Klątwy', 'czarna-magia',
    'Wieża Nocnych Szeptów, Sala Cienia IV',
    'Nekromancja Północna, Pętanie Eteryczne i Wiązanie Cieni',
    null, null, 1, 0, 500, 0, 0, null, null, null, null, null,
    JSON.stringify(['czarna-magia', 'astronomia-i-zorze']),
    '[]', '[]', '2026-07-15'
  );

  // Prof. Gunnar Vargson
  insertUser.run(
    'usr-gunnar', 'gunnar', '123', 'gunnar@durmstrang.edu',
    'Gunnar', 'Vargson', 'Prof. Gunnar Vargson',
    'professor', 'approved', 'bjornhall',
    'Mistrz Szermierki Runicznej • Opiekun Zakonu Björnhall',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'liga-bojowa', 'Liga Bojowa & Hólmganga', 'liga-bojowa',
    'Twierdza Żelaznego Kręgu, Zbrojownia Północy',
    'Magia Bojowa, Tarcze Runiczne i Pojedynki Lodowe',
    null, null, 1, 0, 500, 0, 0, null, null, null, null, null,
    JSON.stringify(['klatwy-i-uroki', 'zielarstwo-i-toksyny']),
    '[]', '[]', '2026-07-20'
  );

  // Prof. Astrid Vinter (Eliksiry)
  insertUser.run(
    'usr-astrid-vinter', 'vinter', '123', 'vinter@durmstrang.edu',
    'Astrid', 'Vinter', 'Prof. Astrid Vinter',
    'professor', 'approved', 'reinhall',
    'Mistrzyni Alchemii i Eliksirów • Katedra Eliksirów',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    'eliksiry', 'Katedra Eliksirów i Warzenia Północy', 'eliksiry',
    'Krypta Kotłów Skandzy, Sala Podziemna II',
    'Eliksiry Uzdrowicielskie, Trucizny Arktyczne i Destylacja Soli',
    null, null, 1, 0, 500, 0, 0, null, null, null, null, null,
    JSON.stringify(['eliksiry-i-destylacja', 'zielarstwo-i-toksyny']),
    '[]', '[]', '2026-07-10'
  );

  // Arcymistrzyni Valgerda Storm
  insertUser.run(
    'usr-valgerda', 'valgerda', '123', 'valgerda@durmstrang.edu',
    'Valgerda', 'Storm', 'Arcymistrzyni Valgerda Storm',
    'admin', 'approved', null,
    'Arcymistrzyni Cytadeli Durmstrang • Strażniczka Paktu 1294',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    'edykty', 'Rada Dyrekcji Cytadeli', 'edykty',
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

// Seed default school config
const configCount = db.prepare('SELECT COUNT(*) as count FROM school_config').get().count;
if (configCount === 0) {
  const insertConfig = db.prepare('INSERT INTO school_config (key, value) VALUES (?, ?)');
  insertConfig.run('school_year', 'XIX Rok Szkolny (2026/2027)');
  insertConfig.run('current_term', 'Semestr Zimowy');
  insertConfig.run('term_start', '2026-08-01');
  insertConfig.run('term_end', '2027-06-30');
  insertConfig.run('base_reinhall_points', '480');
  insertConfig.run('base_bjornhall_points', '520');
  insertConfig.run('base_ravnheim_points', '510');
  insertConfig.run('base_otergard_points', '495');
}

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

// Seed initial lessons and point transactions
const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons').get().count;
if (lessonCount === 0) {
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
    'eliksiry-i-destylacja',
    'Eliksiry i Destylacja Soli',
    'Klasa II',
    'Eliksir Wiggenowy — Stabilizacja i Warzenie Północne',
    'Podczas zajęć adepci poznali arktyczną odmianę Eliksiru Wiggenowego z dodatkiem kory jarzębiny śnieżnej oraz śluzu żądłoskoczka tundrowego. Przeanalizowano proces neutralizacji toksyn i szybką regenerację ran ciętych.',
    'usr-astrid-vinter',
    'Prof. Astrid Vinter',
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
      authorDisplayName: 'Prof. Astrid Vinter',
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
      authorDisplayName: 'Prof. Astrid Vinter',
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
          author: 'Prof. Astrid Vinter',
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
      replyToAuthor: 'Prof. Astrid Vinter',
      replyToContent: 'Czy ktoś potrafi wskazać, który składnik stabilizuje wywar przed wrzeniem?',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '👍', count: 4, users: ['Prof. Astrid Vinter', 'Freja Lund'] }, { emoji: '🐻', count: 2, users: ['Erik Nilsen'] }]),
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
      reactions: JSON.stringify([{ emoji: '✨', count: 5, users: ['Prof. Astrid Vinter'] }, { emoji: '🦌', count: 4, users: ['Astrid Vinter'] }]),
      attachments: '[]',
      isEdited: 0, editHistory: '[]', isDeleted: 0
    },
    {
      id: 'msg-les1-5',
      discordId: 'dmsg-1005',
      userId: 'usr-bot-cytadela',
      authorName: 'Cytadela Bot',
      authorDisplayName: 'Cytadela Bot',
      authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      authorHouse: '',
      content: '',
      timestamp: '2026-08-22 18:41:00',
      orderIndex: 5,
      replyToId: '', replyToAuthor: '', replyToContent: '',
      isBot: 1, isSystem: 0, isCommand: 1,
      commandData: JSON.stringify({
        name: '/quiz',
        author: 'Prof. Astrid Vinter',
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
      replyToAuthor: 'Cytadela Bot',
      replyToContent: 'QUIZ ELIKSIRÓW: Który składnik stabilizuje Eliksir Wiggenowy...',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '🐦', count: 4, users: ['Freja Lund', 'Valdemar Krag-Hansen'] }, { emoji: '⭐', count: 3, users: ['Prof. Astrid Vinter'] }]),
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
      authorDisplayName: 'Prof. Astrid Vinter',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      authorHouse: 'reinhall',
      content: 'Znakomicie. Wszyscy wykazali się należytą wiedzą. Wygaszamy paleniska, zlewamy próbki do flakonów z pieczęcią. Lekcja zakończona.',
      timestamp: '2026-08-22 18:48:50',
      orderIndex: 8,
      replyToId: '', replyToAuthor: '', replyToContent: '',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '👏', count: 6, users: ['Astrid Vinter', 'Erik Nilsen', 'Freja Lund'] }, { emoji: '🏰', count: 4, users: ['Prof. Astrid Vinter'] }]),
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
  insertPointTx.run('tx-1-1', 'usr-astrid-stud', 'Astrid Vinter', 'reinhall', 15, 'Eliksiry — Eliksir Wiggenowy', lesson1Id, 'usr-astrid-vinter', 'Prof. Astrid Vinter', '2026-08-22', 'Wybitna aktywność', 0, '2026-08-22 19:50:00');
  insertPointTx.run('tx-1-2', 'usr-erik', 'Erik Nilsen', 'bjornhall', 10, 'Eliksiry — Eliksir Wiggenowy', lesson1Id, 'usr-astrid-vinter', 'Prof. Astrid Vinter', '2026-08-22', 'Aktywny udział w dyskusji', 0, '2026-08-22 19:50:00');
  insertPointTx.run('tx-1-3', 'usr-freja', 'Freja Lund', 'ravnheim', 10, 'Eliksiry — Eliksir Wiggenowy', lesson1Id, 'usr-astrid-vinter', 'Prof. Astrid Vinter', '2026-08-22', 'Prawidłowa odpowiedź w quizie', 0, '2026-08-22 19:50:00');

  // ==================== LEKCJA 2: CZARNA MAGIA - WIĄZANIE CIENI ====================
  const lesson2Id = 'les-czarna-magia-cienie-2026';
  insertLesson.run(
    lesson2Id,
    'czarna-magia',
    'Czarna Magia i Nekromancja Północna',
    'Klasa IV',
    'Wiązanie Cieni i Eteryczne Pętanie Eirika',
    'Wprowadzenie do zaawansowanych technik manipulacji materią cienia. Analiza manuskryptu Mistrza Eirika Krwawego Rogu oraz ćwiczenie formowania eterycznych więzów ochronnych w mrozie.',
    'usr-morana',
    'Prof. Morana Vane',
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
      authorDisplayName: 'Prof. Morana Vane',
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
      replyToAuthor: 'Prof. Morana Vane',
      replyToContent: 'Gasimy znicze. Niech przemówi Wieża Nocnych Szeptów...',
      isBot: 0, isSystem: 0, isCommand: 0, commandData: '{}',
      embeds: '[]',
      reactions: JSON.stringify([{ emoji: '✨', count: 4, users: ['Prof. Morana Vane'] }]),
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

  insertPointTx.run('tx-2-1', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', 20, 'Czarna Magia — Wiązanie Cieni', lesson2Id, 'usr-morana', 'Prof. Morana Vane', '2026-08-20', 'Wybitne opanowanie cieni', 0, '2026-08-20 21:20:00');
  insertPointTx.run('tx-2-2', 'usr-magnus', 'Magnus Blom', 'reinhall', 15, 'Czarna Magia — Wiązanie Cieni', lesson2Id, 'usr-morana', 'Prof. Morana Vane', '2026-08-20', 'Stabilna bariera cieniowa', 0, '2026-08-20 21:20:00');
  insertPointTx.run('tx-2-3', 'usr-sigrun', 'Sigrun Lindqvist', 'otergard', 10, 'Czarna Magia — Wiązanie Cieni', lesson2Id, 'usr-morana', 'Prof. Morana Vane', '2026-08-20', 'Rozproszenie anomalii', 0, '2026-08-20 21:20:00');

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
    { id: 'zaklecia', name: 'Zaklęcia Użytkowe i Transgresja', code: 'SPELL-103', icon: '✨', category: 'Magia Praktyczna', description: 'Inkantacje manipulacji grawitacją, tworzenie ścieżek świetlnych i transgresja w zamieci.', classroom: 'Korytarz Wichrów', profId: '', profName: 'Prof. Olaf Sörensen', gradient: 'linear-gradient(135deg, #1a2030 0%, #060810 100%)', classYears: ['Klasa I'], sort: 1 },
    { id: 'transmutacja', name: 'Transmutacja i Przemiana Materii', code: 'TRANS-104', icon: '🔮', category: 'Modyfikacja Materii', description: 'Krystalizacja cieczy, animacja kamiennych obelisków i kowalska transmutacja metali.', classroom: 'Wieża Krystalizacji', profId: '', profName: 'Prof. Freja Lindqvist', gradient: 'linear-gradient(135deg, #1a1428 0%, #060410 100%)', classYears: ['Klasa I'], sort: 2 },
    { id: 'eliksiry', name: 'Eliksiry i Toksyny', code: 'POT-105', icon: '🧪', category: 'Alchemia & Warzenie', description: 'Sztuka destylacji rzadkich esencji arktycznych, syntezy jadów lodowcowych i uniwersalnych odtrutek.', classroom: 'Laboratorium Lodowych Cieplic', profId: 'usr-astrid-vinter', profName: 'Prof. Astrid Vinter', gradient: 'linear-gradient(135deg, #0e1c30 0%, #04080e 100%)', classYears: ['Klasa I'], sort: 3 },
    { id: 'zielarstwo', name: 'Zielarstwo Mrozoodporne', code: 'HERB-106', icon: '🌿', category: 'Przyroda Magiczna', description: 'Hodowla mchu świetlistego, lodowej mandragory i korzeni yggdrasila karłowatego.', classroom: 'Szklarnie Wiecznej Zmarzliny', profId: '', profName: 'Prof. Birgit Thorsen', gradient: 'linear-gradient(135deg, #0e2216 0%, #030805 100%)', classYears: ['Klasa I'], sort: 4 },
    { id: 'magizoologia', name: 'Magizoologia Północy', code: 'BEAST-107', icon: '🐺', category: 'Przyroda Magiczna', description: 'Badanie i oswajanie stworzeń arktycznych: smoków, wilków mroźnych, kelpie z fiordów i trolli górskich.', classroom: 'Wybiegi Skandynawskie i Zakazany Bór', profId: '', profName: 'Prof. Astrid Helle', gradient: 'linear-gradient(135deg, #1a2a1a 0%, #060a06 100%)', classYears: ['Klasa I'], sort: 5 },
    { id: 'obrona-przed-ciemnymi-mocami', name: 'Obrona Przed Ciemnymi Mocami', code: 'DEF-108', icon: '🛡️', category: 'Obrona & Przetrwanie', description: 'Neutralizacja klątw, obrona przed istotami cmentarnymi i demonami mrozu.', classroom: 'Sala Skalistych Bastionów', profId: '', profName: 'Prof. Viktor Storm', gradient: 'linear-gradient(135deg, #18202c 0%, #06080e 100%)', classYears: ['Klasa I'], sort: 6 },
    { id: 'historia-magii', name: 'Historia Magii i Wojen Północy', code: 'HIST-109', icon: '📜', category: 'Historia & Kroniki', description: 'Wielka schizma z 1294 roku, powstanie Cytadeli i historia czterech założycieli.', classroom: 'Wielkie Archiwum Skandzy', profId: '', profName: 'Prof. Torben Ebbesen', gradient: 'linear-gradient(135deg, #201a10 0%, #060604 100%)', classYears: ['Klasa I'], sort: 7 },
    { id: 'astronomia', name: 'Astronomia i Zorze Polarne', code: 'ASTRO-110', icon: '🌌', category: 'Kosmologia', description: 'Obserwacja koniunkcji ciał niebieskich i pływy zórz jako nośnika energii rytualnej.', classroom: 'Obserwatorium Północnej Iglicy', profId: '', profName: 'Prof. Stellan Nyström', gradient: 'linear-gradient(135deg, #101a2c 0%, #04060c 100%)', classYears: ['Klasa I'], sort: 8 },
    { id: 'wrozbiarstwo', name: 'Wróżbiarstwo z Kości i Dymu', code: 'DIV-111', icon: '🦴', category: 'Sztuki Tajemne', description: 'Odczytywanie znaków z rzutów kośćmi völvy, interpretacja dymu palonych ziół arktycznych.', classroom: 'Komnata Trzech Norn', profId: '', profName: 'Prof. Dagmar Vane', gradient: 'linear-gradient(135deg, #1e142a 0%, #08040e 100%)', classYears: ['Klasa I'], sort: 9 },
    { id: 'numerologia', name: 'Numerologia Runiczna i Arithmancja', code: 'NUM-112', icon: '📐', category: 'Nauki Ścisłe Magii', description: 'Matematyczne podstawy zaklęć, wagi liczb 3, 9 i 24 w mitologii nordyckiej.', classroom: 'Kancelaria Obliczeń Runicznych', profId: '', profName: 'Prof. Henrik Lind', gradient: 'linear-gradient(135deg, #14182a 0%, #04050c 100%)', classYears: ['Klasa I'], sort: 10 },
    { id: 'starozytne-runy', name: 'Starożytne Runy Północy', code: 'RUNE-113', icon: 'ᚱ', category: 'Języki i Inskrypcje', description: 'Wykrawanie, aktywacja i łączenie prastarych run Futharku Starszego. Wiązanie magii w kamieniu, kości i stali.', classroom: 'Komnata Wyrytych Monolitów', profId: '', profName: 'Prof. Sigrid Hällström', gradient: 'linear-gradient(135deg, #0a2422 0%, #030808 100%)', classYears: ['Klasa I', 'Klasa II'], sort: 11 },
    { id: 'latanie', name: 'Latanie Bojowe i Nawigacja Powietrzna', code: 'FLY-114', icon: '🧹', category: 'Sztuka Bojowa', description: 'Manewry w huraganowym wietrze, loty formacyjne i akrobacje bojowe w fiordach.', classroom: 'Urwisko Jaskółek i Płyta Wiatru', profId: '', profName: 'Prof. Janusz Karkov', gradient: 'linear-gradient(135deg, #1a2838 0%, #060a10 100%)', classYears: ['Klasa I'], sort: 12 },
    { id: 'biala-magia', name: 'Biała Magia i Rytuały Przenikania', code: 'WHITE-102', icon: '🕊️', category: 'Magia Pierwotna', description: 'Leczenie ran magicznych, pieczętowanie pęknięć aury i manipulacja światłem zorzy.', classroom: 'Świątynia Słonecznego Kręgu', profId: '', profName: 'Prof. Helga Lind', gradient: 'linear-gradient(135deg, #1a1a24 0%, #0a0a10 100%)', classYears: ['Klasa I', 'Klasa II'], sort: 13 },
    { id: 'czarna-magia', name: 'Czarna Magia', code: 'DARK-101', icon: '💀', category: 'Sztuki Zakazane', description: 'Zaawansowane studium pradawnych energii mroku, pętania cieni, klątw rodowych oraz kontrolowanego użycia sił pierwotnych.', classroom: 'Krypta Szeptów (Poziom -3)', profId: 'usr-morana', profName: 'Prof. Morana Vane', gradient: 'linear-gradient(135deg, #1c132e 0%, #0d0618 100%)', classYears: ['Klasa I', 'Klasa II'], sort: 14 },

    // --- KLASA II (Magia Zaawansowana) ---
    { id: 'klatwy-i-uroki', name: 'Klątwy i Uroki', code: 'DUEL-201', icon: '⚔️', category: 'Sztuka Bojowa', description: 'Zaawansowane techniki klątw ciśnieniowych, przełamywania tarcz wroga i walki taktycznej na mroźnej arenie.', classroom: 'Arena Żelaznego Kręgu', profId: 'usr-gunnar', profName: 'Prof. Gunnar Vargson', gradient: 'linear-gradient(135deg, #2c0e0e 0%, #080303 100%)', classYears: ['Klasa II'], sort: 15 },
    { id: 'smokologia', name: 'Smokologia i Drakologia Północna', code: 'DRAG-202', icon: '🐉', category: 'Przyroda Magiczna', description: 'Zaawansowane studium gatunków smoków Północy. Tresura, komunikacja i pozyskiwanie surowców smokowych.', classroom: 'Smocze Urwisko Północy', profId: '', profName: 'Prof. Astrid Helle', gradient: 'linear-gradient(135deg, #2e1808 0%, #0d0602 100%)', classYears: ['Klasa II'], sort: 16 },
    { id: 'rytualistyka', name: 'Rytualistyka Północna', code: 'RITU-203', icon: '🕯️', category: 'Sztuki Tajemne', description: 'Konstruowanie i prowadzenie wieloosobowych rytuałów magicznych opartych na tradycji nordyckiej.', classroom: 'Krąg Kamiennych Gigantów', profId: '', profName: 'Prof. Dagmar Vane', gradient: 'linear-gradient(135deg, #281424 0%, #0a0409 100%)', classYears: ['Klasa II'], sort: 17 },
    { id: 'psychologia-magiczna', name: 'Psychologia Magiczna', code: 'PSY-204', icon: '🧠', category: 'Nauki Ścisłe Magii', description: 'Mechanizmy wpływu zaklęć na psychikę — obrona przed Legillimensją, Oklumencja i kontrola umysłu.', classroom: 'Sala Luster Poznania', profId: 'usr-morana', profName: 'Prof. Morana Vane', gradient: 'linear-gradient(135deg, #1c1830 0%, #06050e 100%)', classYears: ['Klasa II'], sort: 18 },
    { id: 'trucizny', name: 'Trucizny i Kontrtoksyny', code: 'TOX-205', icon: '☠️', category: 'Alchemia & Warzenie', description: 'Zaawansowana synteza jadów magicznych, trucizn kontaktowych i opracowywanie uniwersalnych odtrutek.', classroom: 'Laboratorium Czerwonego Dymu', profId: 'usr-astrid-vinter', profName: 'Prof. Astrid Vinter', gradient: 'linear-gradient(135deg, #1e0e24 0%, #060208 100%)', classYears: ['Klasa II'], sort: 19 },
    { id: 'mity-polnocy', name: 'Mity i Legendy Północy', code: 'MYTH-206', icon: '📖', category: 'Historia & Kroniki', description: 'Analiza nordyckiej mitologii jako realnego zapisu historii magicznej: od wojen Asów z Wanami po Ragnarök.', classroom: 'Wielkie Archiwum Skandzy — Sala Sag', profId: '', profName: 'Prof. Torben Ebbesen', gradient: 'linear-gradient(135deg, #241c10 0%, #080603 100%)', classYears: ['Klasa II'], sort: 20 },
    { id: 'stworzenia-nocy', name: 'Stworzenia Nocy', code: 'NIGHT-207', icon: '🦇', category: 'Przyroda Magiczna', description: 'Istoty manifestujące się nocą lub w nocy polarnej: wampiry lodowe, upiory cieni, Draugr i demony ciemności.', classroom: 'Podziemna Sala Cienia (Poziom -2)', profId: '', profName: 'Prof. Viktor Storm', gradient: 'linear-gradient(135deg, #14141e 0%, #040408 100%)', classYears: ['Klasa II'], sort: 21 }
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
      updateSubjectClassYears.run(JSON.stringify(s.classYears), s.sort, s.id);
    }
  }

  // Seed sample grades if none exist
  const gradesCount = db.prepare('SELECT COUNT(*) as count FROM grades').get().count;
  if (gradesCount === 0) {
    insertGrade.run('grade-1', 'czarna-magia', 'cat-czarna-magia-1', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', 'W', 'Wybitny (W)', 5, 'Esej: Pieczęć Wstrzymująca', 'Perfekcyjna analiza mechaniki cienia i woli.', 'usr-morana', 'Prof. Morana Vane', '', '2026-08-18');
    insertGrade.run('grade-2', 'czarna-magia', 'cat-czarna-magia-3', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', 'W', 'Wybitny (W)', 5, 'Aktywność na lekcji: Wiązanie Cieni', 'Wybitna aktywność i opanowanie techniki.', 'usr-morana', 'Prof. Morana Vane', 'les-czarna-magia-cienie-2026', '2026-08-20');
    insertGrade.run('grade-3', 'eliksiry', 'cat-eliksiry-4', 'usr-valdemar', 'Valdemar Krag-Hansen', 'ravnheim', 'P', 'Powyżej Oczekiwań (P)', 4, 'Quiz: Eliksir Wiggenowy', 'Trafna odpowiedź na pytanie o stabilizację.', 'usr-astrid-vinter', 'Prof. Astrid Vinter', 'les-eliksiry-wiggen-2026', '2026-08-22');
    insertGrade.run('grade-4', 'czarna-magia', 'cat-czarna-magia-1', 'usr-magnus', 'Magnus Blom', 'reinhall', 'P', 'Powyżej Oczekiwań (P)', 4, 'Esej: Bariera Cieniowa', 'Solidna praca z drobnymi niedociągnięciami.', 'usr-morana', 'Prof. Morana Vane', '', '2026-08-19');
    insertGrade.run('grade-5', 'eliksiry', 'cat-eliksiry-3', 'usr-erik', 'Erik Nilsen', 'bjornhall', 'Z', 'Zadowalający (Z)', 3, 'Aktywność: Eliksir Wiggenowy', 'Prawidłowe rozpoznanie właściwości bezoaru.', 'usr-astrid-vinter', 'Prof. Astrid Vinter', 'les-eliksiry-wiggen-2026', '2026-08-22');
    insertGrade.run('grade-6', 'eliksiry', 'cat-eliksiry-3', 'usr-freja', 'Freja Lund', 'ravnheim', 'P', 'Powyżej Oczekiwań (P)', 4, 'Aktywność: Eliksir Wiggenowy', 'Wzorowa odpowiedź w quizie klasowym.', 'usr-astrid-vinter', 'Prof. Astrid Vinter', 'les-eliksiry-wiggen-2026', '2026-08-22');
  }

  console.log('[DB] Synchronized all 21 subjects and categories.');

  // ===================== SEED TIMETABLE ENTRIES =====================
  const timetableCount = db.prepare('SELECT COUNT(*) as count FROM timetable_entries').get().count;
  if (timetableCount === 0) {
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
      ['tt-mon-1', 'czarna-magia', 'Czarna Magia i Nekromancja', 'DARK-101', '💀', 'Sztuki Zakazane', 1, 'Poniedziałek', '08:30', '10:00', 'Krypta Szeptów (Poziom -3)', 'usr-morana', 'Prof. Morana Vane', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Wiązanie cieni i bariery eteryczne w krypcie', 'Wymagany czarny atrament i rękawice ze skóry salamandry.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-mon-2', 'klatwy-i-uroki', 'Klątwy i Uroki', 'DUEL-201', '⚔️', 'Sztuka Bojowa', 1, 'Poniedziałek', '10:15', '11:45', 'Arena Żelaznego Kręgu', 'usr-gunnar', 'Prof. Gunnar Vargson', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Tarcza Żelaza i kontrataki w zamieci', 'Obowiązkowe zbroje runiczne i ochrona klatki piersiowej.', 'scheduled', '', '', '', '', '', 1, 2],
      ['tt-mon-3', 'eliksiry', 'Eliksiry i Toksyny', 'POT-105', '🧪', 'Alchemia & Warzenie', 1, 'Poniedziałek', '12:00', '13:30', 'Laboratorium Lodowych Cieplic', 'usr-astrid-vinter', 'Prof. Astrid Vinter', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Destylacja esencji mrozu i odtrutki arktyczne', 'Kociołki miedziane lub z lanego żelaza.', 'scheduled', '', '', '', '', '', 1, 3],
      ['tt-mon-4', 'latanie', 'Latanie Bojowe i Nawigacja Powietrzna', 'FLY-114', '🧹', 'Sztuka Bojowa', 1, 'Poniedziałek', '14:30', '16:00', 'Urwisko Jaskółek i Płyta Wiatru', '', 'Prof. Janusz Karkov', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Nawigacja w szkwałach lodowcowych i loty formacyjne', 'Zajęcia na otwartym urwisku — ciepła odzież runiczna.', 'cancelled', 'Prof. Janusz Karkov', '', '', '', 'Huragan śnieżny kategorii IV nad fiordami — zakaz lotów na miotłach.', 1, 4],
      ['tt-mon-5', 'astronomia', 'Astronomia i Zorze Polarne', 'ASTRO-110', '🌌', 'Kosmologia', 1, 'Poniedziałek', '20:00', '21:30', 'Obserwatorium Północnej Iglicy', '', 'Prof. Stellan Nyström', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Pomiary spektralne fioletowej zorzy Yggdrasila', 'Lunety mosiężne z filtrem z kryształu górskiego.', 'scheduled', '', '', '', '', '', 1, 5],
      // Wtorek
      ['tt-tue-1', 'starozytne-runy', 'Starożytne Runy Północy', 'RUNE-113', 'ᚱ', 'Języki i Inskrypcje', 2, 'Wtorek', '08:30', '10:00', 'Komnata Wyrytych Monolitów', '', 'Prof. Sigrid Hällström', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Wykrawanie runy Thurisaz w bazalcie lodowcowym', 'Dłuta z hartowanej stali krasnoludzkiej.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-tue-2', 'transmutacja', 'Transmutacja i Przemiana Materii', 'TRANS-104', '🔮', 'Modyfikacja Materii', 2, 'Wtorek', '10:15', '11:45', 'Wieża Krystalizacji', '', 'Prof. Freja Lindqvist', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Krystalizacja cieczy w kryształy wiecznego lodu', 'Przygotować fiolki z wodą ze stopionego lodowca Jostedal.', 'substitution', 'Prof. Freja Lindqvist', 'usr-morana', 'Prof. Morana Vane', 'Prof. Freja Lindqvist prowadzi badania anomalii krystalicznej w Głębi Niflheimu — zastępstwo objęła Prof. Morana Vane.', '', 1, 2],
      ['tt-tue-3', 'zielarstwo', 'Zielarstwo Mrozoodporne', 'HERB-106', '🌿', 'Przyroda Magiczna', 2, 'Wtorek', '12:00', '13:30', 'Szklarnie Wiecznej Zmarzliny', '', 'Prof. Birgit Thorsen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Zbieranie zarodników mchu świetlistego w temperaturze -20°C', 'Rękawice z ociepleniem runicznym.', 'scheduled', '', '', '', '', '', 1, 3],
      ['tt-tue-4', 'magizoologia', 'Magizoologia Północy', 'BEAST-107', '🐺', 'Przyroda Magiczna', 2, 'Wtorek', '14:30', '16:00', 'Wybiegi Skandynawskie i Zakazany Bór', '', 'Prof. Astrid Helle', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Karmienie i uspokajanie szczeniąt wilków lodowcowych', 'Zakaz używania ostrych zaklęć świetlnych.', 'scheduled', '', '', '', '', '', 1, 4],
      // Środa
      ['tt-wed-1', 'zaklecia', 'Zaklęcia Użytkowe i Transgresja', 'SPELL-103', '✨', 'Magia Praktyczna', 3, 'Środa', '08:30', '10:00', 'Korytarz Wichrów', '', 'Prof. Olaf Sörensen', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Tworzenie mostów termicznych w gęstej mgle', 'Ćwiczenia precyzyjnej modulacji głosu.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-wed-2', 'smokologia', 'Smokologia i Drakologia Północna', 'DRAG-202', '🐉', 'Przyroda Magiczna', 3, 'Środa', '10:15', '11:45', 'Smocze Urwisko Północy', '', 'Prof. Astrid Helle', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Pozyskiwanie łusek Żelazobrzucha Norweskiego podczas snu', 'Zakaz wydawania dźwięków powyżej 20 decybeli.', 'scheduled', '', '', '', '', '', 1, 2],
      ['tt-wed-3', 'wrozbiarstwo', 'Wróżbiarstwo z Kości i Dymu', 'DIV-111', '🦴', 'Sztuki Tajemne', 3, 'Środa', '12:00', '13:30', 'Komnata Trzech Norn', '', 'Prof. Dagmar Vane', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Rzuty kośćmi morsów i interpretacja szeptu norn', 'Kadzidła z szałwii arktycznej przygotowane przez katedrę.', 'substitution', 'Prof. Dagmar Vane', 'usr-gunnar', 'Prof. Gunnar Vargson', 'Prof. Dagmar Vane uczestniczy w Wielkim Wiecu Völv w Uppsala — zastępstwo taktyczne prowadzi Prof. Gunnar Vargson.', '', 1, 3],
      ['tt-wed-4', 'obrona-przed-ciemnymi-mocami', 'Obrona Przed Ciemnymi Mocami', 'DEF-108', '🛡️', 'Obrona & Przetrwanie', 3, 'Środa', '14:30', '16:00', 'Sala Skalistych Bastionów', '', 'Prof. Viktor Storm', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Rozpraszanie upiorów lodowych i zaklęcia ochronne aegishjalmur', 'Tarcze runiczne rozdawane przed wejściem.', 'scheduled', '', '', '', '', '', 1, 4],
      // Czwartek
      ['tt-thu-1', 'historia-magii', 'Historia Magii i Wojen Północy', 'HIST-109', '📜', 'Historia & Kroniki', 4, 'Czwartek', '08:30', '10:00', 'Wielkie Archiwum Skandzy', '', 'Prof. Torben Ebbesen', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Wielka schizma z 1294 roku i zapieczętowanie Paktu Czterech Bastionów', 'Zapisy na pergaminie cieni.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-thu-2', 'rytualistyka', 'Rytualistyka Północna', 'RITU-203', '🕯️', 'Sztuki Tajemne', 4, 'Czwartek', '10:15', '11:45', 'Krąg Kamiennych Gigantów', '', 'Prof. Dagmar Vane', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Formowanie kręgów ochronnych wokół menhirów', 'Zajęcia na dziedzińcu zewnętrznym.', 'scheduled', '', '', '', '', '', 1, 2],
      ['tt-thu-3', 'numerologia', 'Numerologia Runiczna i Arithmancja', 'NUM-112', '📐', 'Nauki Ścisłe Magii', 4, 'Czwartek', '12:00', '13:30', 'Kancelaria Obliczeń Runicznych', '', 'Prof. Henrik Lind', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Macierze 24 run starszego Futharku i obliczanie siły zaklęć', 'Tabliczki woskowe i rysiki.', 'scheduled', '', '', '', '', '', 1, 3],
      ['tt-thu-4', 'psychologia-magiczna', 'Psychologia Magiczna i Oklumencja', 'PSY-204', '🧠', 'Nauki Ścisłe Magii', 4, 'Czwartek', '14:30', '16:00', 'Sala Luster Poznania', 'usr-morana', 'Prof. Morana Vane', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Wznoszenie barier myślowych przed Legillimensją', 'Wymagane pełne skupienie i wyciszenie.', 'scheduled', '', '', '', '', '', 1, 4],
      // Piątek
      ['tt-fri-1', 'biala-magia', 'Biała Magia i Rytuały Przenikania', 'WHITE-102', '🕊️', 'Magia Pierwotna', 5, 'Piątek', '08:30', '10:00', 'Świątynia Słonecznego Kręgu', '', 'Prof. Helga Lind', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80', 'Klasa I', 'all', 'Pieczętowanie ran magicznych światłem zorzy polarnej', 'Kryształy górskie do skupiania wiązki.', 'scheduled', '', '', '', '', '', 1, 1],
      ['tt-fri-2', 'trucizny', 'Trucizny i Kontrtoksyny', 'TOX-205', '☠️', 'Alchemia & Warzenie', 5, 'Piątek', '10:15', '11:45', 'Laboratorium Czerwonego Dymu', 'usr-astrid-vinter', 'Prof. Astrid Vinter', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80', 'Klasa II', 'all', 'Synteza jadu lodowej żmii i opracowywanie uniwersalnej odtrutki', 'Izolowane maski runiczne obowiązkowe.', 'cancelled', 'Prof. Astrid Vinter', '', '', '', 'Nieszczelność filtru wyciągowego w Laboratorium Czerwonego Dymu — kwarantanna do soboty.', 1, 2],
      ['tt-fri-3', 'klatwy-i-uroki', 'Liga Bojowa i Hólmganga', 'DUEL-201', '⚔️', 'Sztuka Bojowa', 5, 'Piątek', '14:30', '16:30', 'Arena Żelaznego Kręgu', 'usr-gunnar', 'Prof. Gunnar Vargson', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', 'Wszyscy', 'all', 'Pojedynki międzyzakonne o Puchar Północy: Reinhall vs Ravnheim', 'Sędziuje Arcymistrzyni Valgerda Storm.', 'scheduled', '', '', '', '', '', 1, 3],
      // Sobota
      ['tt-sat-1', 'starozytne-runy', 'Warsztat Runiczny (Galdrastofa)', 'RUNE-113', 'ᚱ', 'Języki i Inskrypcje', 6, 'Sobota', '10:00', '13:00', 'Komnata Wyrytych Monolitów', '', 'Prof. Sigrid Hällström', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80', 'Wszyscy', 'all', 'Kucie amuletów i zaklinanie stali na nadchodzące mrozy', 'Konsultacje otwarte dla wszystkich adeptów.', 'scheduled', '', '', '', '', '', 1, 1]
    ];

    for (const row of SEED_ENTRIES) {
      insertTT.run(...row);
    }
    console.log(`[DB] Seeded ${SEED_ENTRIES.length} timetable entries.`);
  }

// ===================== HELPER FUNCTIONS =====================

export function dbUserToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    email: row.email || '',
    name: row.name,
    surname: row.surname,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    house: row.house,
    title: row.title || '',
    avatar: row.avatar || '',
    department: row.department,
    departmentName: row.department_name,
    defaultBannerCategory: row.default_banner_category,
    office: row.office,
    specialization: row.specialization,
    classYear: row.class_year,
    origin: row.origin,
    level: row.level || 1,
    xp: row.xp || 0,
    nextLevelXp: row.next_level_xp || 500,
    points: row.points || 0,
    currency: row.currency || 0,
    wand: row.wand,
    patronus: row.patronus,
    companion: row.companion,
    appearance: row.appearance,
    backstory: row.backstory,
    gender: row.gender || 'czarodziej',
    taughtSubjectIds: JSON.parse(row.taught_subject_ids || '[]'),
    grades: JSON.parse(row.grades || '[]'),
    inventory: JSON.parse(row.inventory || '[]'),
    createdAt: row.created_at
  };
}

export function dbEmailToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    toEmail: row.to_email,
    toName: row.to_name,
    from: row.from_addr,
    fromName: row.from_name,
    subject: row.subject,
    date: row.date,
    read: !!row.read,
    type: row.type,
    body: row.body
  };
}

export function dbNewsToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    author: row.author,
    authorRole: row.author_role,
    category: row.category,
    pinned: !!row.pinned,
    date: row.date,
    reactions: JSON.parse(row.reactions || '{}'),
    comments: JSON.parse(row.comments || '[]')
  };
}

export function dbAppToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email || '',
    name: row.name,
    surname: row.surname,
    role: row.role,
    departmentName: row.department_name,
    origin: row.origin,
    age: row.age,
    wand: row.wand,
    patronus: row.patronus,
    companion: row.companion,
    appearance: row.appearance,
    backstory: row.backstory,
    status: row.status,
    dateSubmitted: row.date_submitted
  };
}

export function dbLessonToFrontend(row, messages = [], participants = []) {
  if (!row) return null;
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    classYear: row.class_year,
    topic: row.topic,
    description: row.description || '',
    professorId: row.professor_id,
    professorName: row.professor_name,
    professorAvatar: row.professor_avatar || '',
    date: row.date,
    status: row.status,
    discordThreadId: row.discord_thread_id || '',
    discordChannelId: row.discord_channel_id || '',
    discordGuildId: row.discord_guild_id || '',
    discordThreadUrl: row.discord_thread_url || '',
    totalPoints: row.total_points || 0,
    participantsCount: row.participants_count || participants.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    messages: messages.map(dbMessageToFrontend),
    participants: participants.map(dbParticipantToFrontend)
  };
}

export function dbMessageToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    lessonId: row.lesson_id,
    discordMessageId: row.discord_message_id,
    discordUserId: row.discord_user_id || '',
    authorName: row.author_name,
    authorDisplayName: row.author_display_name,
    authorAvatar: row.author_avatar || '',
    authorHouse: row.author_house || '',
    content: row.content || '',
    timestamp: row.timestamp,
    orderIndex: row.order_index || 0,
    replyToId: row.reply_to_id || '',
    replyToAuthor: row.reply_to_author || '',
    replyToContent: row.reply_to_content || '',
    isBot: !!row.is_bot,
    isSystem: !!row.is_system,
    isCommand: !!row.is_command,
    commandData: JSON.parse(row.command_data || '{}'),
    embeds: JSON.parse(row.embeds || '[]'),
    reactions: JSON.parse(row.reactions || '[]'),
    attachments: JSON.parse(row.attachments || '[]'),
    isEdited: !!row.is_edited,
    editHistory: JSON.parse(row.edit_history || '[]'),
    isDeleted: !!row.is_deleted
  };
}

export function dbParticipantToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    lessonId: row.lesson_id,
    studentId: row.student_id || '',
    studentName: row.student_name,
    house: row.house,
    isPresent: !!row.is_present,
    pointsAwarded: row.points_awarded || 0,
    comment: row.comment || '',
    role: row.role || 'student'
  };
}

export function dbPointTxToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id || '',
    studentName: row.student_name,
    house: row.house,
    points: row.points,
    source: row.source,
    lessonId: row.lesson_id || '',
    professorId: row.professor_id || '',
    professorName: row.professor_name,
    date: row.date,
    comment: row.comment || '',
    isRevoked: !!row.is_revoked,
    createdAt: row.created_at
  };
}

export function dbGradeCategoryToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    weight: row.weight ?? 1.0,
    icon: row.icon || '📝',
    sortOrder: row.sort_order || 0
  };
}

export function dbGradeToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    subjectId: row.subject_id,
    categoryId: row.category_id,
    categoryName: row.category_name || '',
    categoryIcon: row.category_icon || '📝',
    studentId: row.student_id,
    studentName: row.student_name,
    house: row.house,
    grade: row.grade,
    gradeLabel: row.grade_label,
    gradeValue: row.grade_value,
    title: row.title || '',
    comment: row.comment || '',
    professorId: row.professor_id,
    professorName: row.professor_name,
    lessonId: row.lesson_id || '',
    date: row.date,
    createdAt: row.created_at
  };
}

export function dbSubjectAchievementToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    subjectId: row.subject_id,
    studentId: row.student_id,
    studentName: row.student_name,
    achievementType: row.achievement_type,
    title: row.title,
    description: row.description || '',
    icon: row.icon || '🏆',
    date: row.date
  };
}

export function dbSubjectToFrontend(row, categories = [], grades = [], recentLessons = [], stats = {}) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    code: row.code || '',
    icon: row.icon || '📚',
    category: row.category || 'Ogólne',
    description: row.description || '',
    classroom: row.classroom || '',
    professorId: row.professor_id || '',
    professorName: row.professor_name || '',
    bannerUrl: row.banner_url || '',
    bannerGradient: row.banner_gradient || '',
    syllabus: row.syllabus || '',
    regulations: row.regulations || '',
    classYears: JSON.parse(row.class_years || '["Klasa I", "Klasa II", "Klasa III", "Klasa IV"]'),
    isActive: !!row.is_active,
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categories: categories.map(dbGradeCategoryToFrontend),
    grades: grades.map(dbGradeToFrontend),
    recentLessons: recentLessons,
    stats: stats
  };
}

export function dbTimetableEntryToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    subjectId: row.subject_id || '',
    subjectName: row.subject_name,
    subjectCode: row.subject_code || '',
    subjectIcon: row.subject_icon || '📚',
    subjectCategory: row.subject_category || 'Magia',
    dayOfWeek: row.day_of_week,
    dayName: row.day_name,
    startTime: row.start_time,
    endTime: row.end_time,
    classroom: row.classroom,
    professorId: row.professor_id || '',
    professorName: row.professor_name,
    professorAvatar: row.professor_avatar || '',
    classYear: row.class_year || 'Klasa I',
    houseTarget: row.house_target || 'all',
    topic: row.topic || '',
    notes: row.notes || '',
    status: row.status || 'scheduled',
    originalProfessorName: row.original_professor_name || '',
    substituteProfessorId: row.substitute_professor_id || '',
    substituteProfessorName: row.substitute_professor_name || '',
    substitutionReason: row.substitution_reason || '',
    cancellationReason: row.cancellation_reason || '',
    isActive: !!row.is_active,
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ===================== RANKING CALCULATION (SINGLE SOURCE OF TRUTH) =====================

export function calculateHouseRankings(period = 'overall') {
  // Base starting points from configuration
  const baseReinhall = parseInt(db.prepare("SELECT value FROM school_config WHERE key = 'base_reinhall_points'").get()?.value || '480', 10);
  const baseBjornhall = parseInt(db.prepare("SELECT value FROM school_config WHERE key = 'base_bjornhall_points'").get()?.value || '520', 10);
  const baseRavnheim = parseInt(db.prepare("SELECT value FROM school_config WHERE key = 'base_ravnheim_points'").get()?.value || '510', 10);
  const baseOtergard = parseInt(db.prepare("SELECT value FROM school_config WHERE key = 'base_otergard_points'").get()?.value || '495', 10);

  let dateFilter = '';
  const now = new Date();

  if (period === 'weekly') {
    // Last 7 days
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    dateFilter = `AND date >= '${weekAgo}'`;
  } else if (period === 'monthly') {
    // Current month (YYYY-MM)
    const monthStart = now.toISOString().slice(0, 7) + '-01';
    dateFilter = `AND date >= '${monthStart}'`;
  } else if (period === 'school_year') {
    const termStart = db.prepare("SELECT value FROM school_config WHERE key = 'term_start'").get()?.value || '2026-08-01';
    dateFilter = `AND date >= '${termStart}'`;
  }

  // Aggregate earned points per house strictly from validated non-revoked point transactions
  const rows = db.prepare(`
    SELECT house, SUM(points) as earned_points, COUNT(*) as tx_count
    FROM point_transactions
    WHERE is_revoked = 0 ${dateFilter}
    GROUP BY house
  `).all();

  const earnedMap = {
    reinhall: 0,
    bjornhall: 0,
    ravnheim: 0,
    otergard: 0
  };

  const txCountMap = {
    reinhall: 0,
    bjornhall: 0,
    ravnheim: 0,
    otergard: 0
  };

  for (const r of rows) {
    const h = (r.house || '').toLowerCase();
    if (earnedMap[h] !== undefined) {
      earnedMap[h] = r.earned_points || 0;
      txCountMap[h] = r.tx_count || 0;
    }
  }

  // Calculate recent momentum (points added in the last 48h)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const momentumRows = db.prepare(`
    SELECT house, SUM(points) as momentum
    FROM point_transactions
    WHERE is_revoked = 0 AND date >= '${twoDaysAgo}'
    GROUP BY house
  `).all();

  const momentumMap = { reinhall: 0, bjornhall: 0, ravnheim: 0, otergard: 0 };
  for (const m of momentumRows) {
    const h = (m.house || '').toLowerCase();
    if (momentumMap[h] !== undefined) {
      momentumMap[h] = m.momentum || 0;
    }
  }

  const includeBase = (period === 'overall' || period === 'school_year');

  const ranking = [
    {
      houseKey: 'reinhall',
      name: 'Reinhall',
      crestIcon: '🦌',
      color: '#7a1818',
      secondaryColor: '#c59f4e',
      basePoints: includeBase ? baseReinhall : 0,
      lessonPoints: earnedMap.reinhall,
      totalPoints: (includeBase ? baseReinhall : 0) + earnedMap.reinhall,
      txCount: txCountMap.reinhall,
      momentum: momentumMap.reinhall
    },
    {
      houseKey: 'bjornhall',
      name: 'Björnhall',
      crestIcon: '🐻',
      color: '#202530',
      secondaryColor: '#c02b2b',
      basePoints: includeBase ? baseBjornhall : 0,
      lessonPoints: earnedMap.bjornhall,
      totalPoints: (includeBase ? baseBjornhall : 0) + earnedMap.bjornhall,
      txCount: txCountMap.bjornhall,
      momentum: momentumMap.bjornhall
    },
    {
      houseKey: 'ravnheim',
      name: 'Ravnheim',
      crestIcon: '🐦',
      color: '#1c132e',
      secondaryColor: '#a77de0',
      basePoints: includeBase ? baseRavnheim : 0,
      lessonPoints: earnedMap.ravnheim,
      totalPoints: (includeBase ? baseRavnheim : 0) + earnedMap.ravnheim,
      txCount: txCountMap.ravnheim,
      momentum: momentumMap.ravnheim
    },
    {
      houseKey: 'otergard',
      name: 'Otergard',
      crestIcon: '🦦',
      color: '#0d2d33',
      secondaryColor: '#2ec4b6',
      basePoints: includeBase ? baseOtergard : 0,
      lessonPoints: earnedMap.otergard,
      totalPoints: (includeBase ? baseOtergard : 0) + earnedMap.otergard,
      txCount: txCountMap.otergard,
      momentum: momentumMap.otergard
    }
  ];

  // Sort descending by totalPoints
  ranking.sort((a, b) => b.totalPoints - a.totalPoints);

  // Assign position ranks
  ranking.forEach((h, index) => {
    h.rank = index + 1;
  });

  return {
    period,
    schoolYear: db.prepare("SELECT value FROM school_config WHERE key = 'school_year'").get()?.value || 'XIX Rok Szkolny',
    term: db.prepare("SELECT value FROM school_config WHERE key = 'current_term'").get()?.value || 'Semestr Zimowy',
    standings: ranking,
    totalPointsDistributed: Object.values(earnedMap).reduce((a, b) => a + b, 0),
    leader: ranking[0] || null,
    generatedAt: new Date().toISOString()
  };
}

// ===================== BANK & MARKET & LOTTERY CONVERTERS & HELPERS =====================

export function dbBankAccountToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    vaultNumber: row.vault_number,
    vaultTier: row.vault_tier,
    balance: row.balance || 0,
    securityLevel: row.security_level || 'Maksymalny',
    runeSeal: row.rune_seal || 'Pieczęć Algiz',
    guardian: row.guardian || 'Górski Troll Granitowy',
    interestRate: row.interest_rate || '2.5% rocznie',
    openedAt: row.opened_at
  };
}

export function dbBankTransactionToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    recipientId: row.recipient_id,
    recipientName: row.recipient_name,
    amount: row.amount,
    type: row.type,
    category: row.category,
    title: row.title,
    note: row.note || '',
    status: row.status,
    referenceCode: row.reference_code,
    date: row.date,
    createdAt: row.created_at
  };
}

export function dbTeacherSalaryToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    professorId: row.professor_id,
    professorName: row.professor_name,
    amount: row.amount,
    period: row.period,
    source: row.source,
    lessonId: row.lesson_id || '',
    status: row.status,
    paidAt: row.paid_at
  };
}

export function dbStoreItemToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categorySlug: row.category_slug,
    shopId: row.shop_id,
    shopName: row.shop_name,
    price: row.price,
    icon: row.icon || '📦',
    houseExclusive: row.house_exclusive || null,
    rarity: row.rarity || 'Zwykły',
    description: row.description || '',
    lore: row.lore || '',
    placeholderType: row.placeholder_type || 'artifact_pendant',
    createdAt: row.created_at
  };
}

export function dbShoppingListToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle || '',
    category: row.category,
    requiredItemIds: JSON.parse(row.required_item_ids || '[]'),
    rewardPoints: row.reward_points || 50,
    rewardSkirnirs: row.reward_skirnirs || 100,
    icon: row.icon || '📜',
    badge: row.badge || 'Wyprawka Ukończona',
    lore: row.lore || ''
  };
}

export function dbLotteryRoundToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    roundNumber: row.round_number,
    title: row.title,
    description: row.description || '',
    ticketPrice: row.ticket_price || 20,
    jackpot: row.jackpot || 2500,
    bonusHousePoints: row.bonus_house_points || 100,
    status: row.status,
    endDate: row.end_date,
    winningRunes: JSON.parse(row.winning_runes || '[]'),
    totalTicketsSold: row.total_tickets_sold || 0,
    participantsCount: row.participants_count || 0,
    winnersSummary: JSON.parse(row.winners_summary || '[]'),
    createdAt: row.created_at
  };
}

export function dbLotteryTicketToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    roundId: row.round_id,
    userId: row.user_id,
    userName: row.user_name,
    house: row.house,
    chosenRunes: JSON.parse(row.chosen_runes || '[]'),
    purchasedAt: row.purchased_at,
    matchesCount: row.matches_count || 0,
    prizeWon: row.prize_won || 0,
    claimed: !!row.claimed
  };
}

// ===================== SEEDING FOR BANK, STORE, SHOPPING LISTS & LOTTERY =====================

const bankAccountCount = db.prepare('SELECT COUNT(*) as count FROM bank_accounts').get().count;
if (bankAccountCount === 0) {
  console.log('[DB] Seeding initial bank accounts and transactions...');

  const insertAccount = db.prepare(`
    INSERT INTO bank_accounts (id, user_id, user_name, vault_number, vault_tier, balance, security_level, rune_seal, guardian, interest_rate, opened_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAccount.run('vault-valdemar', 'usr-valdemar', 'Valdemar Krag-Hansen', 'SKR-782-RAVN', 'Skrytka Adepta Kręgu IV', 340, 'Maksymalny', 'Pieczęć Algiz & Kenaz', 'Górski Troll Granitowy (Brokk)', '2.5% rocznie', '2026-08-01');
  insertAccount.run('vault-morana', 'usr-morana', 'Prof. Morana Vane', 'SKR-204-PROF', 'Krypta Profesorska Katedry Czarnej Magii', 1450, 'Rada Mistrzów', 'Pieczęć Thurisaz & Eihwaz', 'Zjawa Lodowcowa Strażnika Cieni', '4.0% rocznie', '2026-07-15');
  insertAccount.run('vault-gunnar', 'usr-gunnar', 'Prof. Gunnar Vargson', 'SKR-205-PROF', 'Zbrojownia Bankowa Ligi Bojowej', 1200, 'Rada Mistrzów', 'Pieczęć Tiwaz & Sowilo', 'Żelazny Golem Północy', '4.0% rocznie', '2026-07-20');
  insertAccount.run('vault-valgerda', 'usr-valgerda', 'Arcymistrzyni Valgerda Storm', 'SKR-001-DIR', 'Najwyższy Skarbiec Dyrekcji Durmstrang', 15400, 'Pakt 1294 (Nienaruszalny)', 'Pierwotna Pieczęć Othala & Dagaz', 'Pradawny Smok Szwedzki Krótkopyski', '6.0% rocznie', '2026-06-01');

  const insertTx = db.prepare(`
    INSERT INTO bank_transactions (id, sender_id, sender_name, recipient_id, recipient_name, amount, type, category, title, note, status, reference_code, date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTx.run('tx-skr-101', 'cytadela-treasury', 'Skarbiec Główny Cytadeli', 'usr-valdemar', 'Valdemar Krag-Hansen', 150, 'inflow', 'stypendium', 'Stypendium Naukowe Katedry Czarnej Magii', 'Nagroda za wzorowe opanowanie wiązania cieni.', 'completed', 'SKR-TX-84920', '2026-08-20 14:30', '2026-08-20 14:30');
  insertTx.run('tx-skr-102', 'usr-valdemar', 'Valdemar Krag-Hansen', 'shop-brokkur', 'Kuźnia Różdżek Brokkura & Oivinda', 280, 'outflow', 'zakup', 'Zakup: Różdżka Cisowa (Wilcze Serce)', 'Płatność na rynku Kaupangr.', 'completed', 'SKR-TX-84711', '2026-08-19 11:15', '2026-08-19 11:15');
  insertTx.run('tx-skr-103', 'cytadela-treasury', 'Skarbiec Główny Cytadeli', 'usr-morana', 'Prof. Morana Vane', 300, 'inflow', 'pensja', 'Uposażenie Profesorskie — Lekcja: Wiązanie Cieni', 'Automatyczna wypłata honorarium.', 'completed', 'SKR-TX-84602', '2026-08-18 16:45', '2026-08-18 16:45');
  insertTx.run('tx-skr-104', 'cytadela-treasury', 'Skarbiec Główny Cytadeli', 'usr-gunnar', 'Prof. Gunnar Vargson', 300, 'inflow', 'pensja', 'Uposażenie Profesorskie — Lekcja: Pojedynki na Lodzie', 'Automatyczna wypłata honorarium.', 'completed', 'SKR-TX-84590', '2026-08-17 17:00', '2026-08-17 17:00');
  insertTx.run('tx-skr-105', 'lottery-pool', 'Skandynawska Loteria Odyna', 'usr-valdemar', 'Valdemar Krag-Hansen', 120, 'inflow', 'loteria', 'Wygrana II Stopnia — Losowanie Letniego Przesilenia', 'Trafienie 2 run Futharku: Thurisaz i Algiz.', 'completed', 'SKR-TX-84310', '2026-08-15 20:00', '2026-08-15 20:00');
  insertTx.run('tx-skr-106', 'cytadela-treasury', 'Rada Dyrekcji Cytadeli', 'usr-valdemar', 'Valdemar Krag-Hansen', 100, 'inflow', 'nagroda_wyprawka', 'Nagroda za skompletowanie: Wyprawka Adepta Roku I', 'Premia za pomyślne przygotowanie do roku szkolnego.', 'completed', 'SKR-TX-84102', '2026-08-10 12:00', '2026-08-10 12:00');
}

const storeItemsCount = db.prepare('SELECT COUNT(*) as count FROM store_items').get().count;
if (storeItemsCount === 0) {
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
if (shoppingListsCount === 0) {
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
if (lotteryRoundsCount === 0) {
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

try {
  db.exec("ALTER TABLE users ADD COLUMN gender TEXT DEFAULT 'czarodziej'");
} catch (_) {}

export default db;
