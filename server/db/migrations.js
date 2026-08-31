import db from './connection.js';

export function runMigrations() {
// ===================== MIGRATIONS =====================

try {
  const subCols = db.pragma('table_info(homework_submissions)');
  if (subCols.length > 0 && !subCols.some(c => c.name === 'homework_id')) {
    db.exec('DROP TABLE IF EXISTS homework_submissions;');
  }
} catch (_) {}

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
    session_version INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (date('now'))
  );

  -- Osobisty Pas Adepta. Cel jest identyfikatorem z zamkniętego rejestru,
  -- nigdy dowolnym adresem URL.
  CREATE TABLE IF NOT EXISTS user_pinned_shortcuts (
    user_id TEXT NOT NULL,
    slot INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 4),
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, slot),
    UNIQUE (user_id, target_type, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

  CREATE TABLE IF NOT EXISTS transactional_email_deliveries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('account_created', 'account_approved')),
    recipient_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    provider_message_id TEXT DEFAULT '',
    last_error TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_attempt_at TEXT,
    sent_at TEXT,
    UNIQUE (user_id, email_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transactional_email_status
    ON transactional_email_deliveries(status, created_at);

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_password_reset_user
    ON password_reset_tokens(user_id, expires_at);

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

  CREATE TABLE IF NOT EXISTS news_user_reactions (
    news_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('admiration', 'honor')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (news_id, user_id, reaction_type),
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

  CREATE TABLE IF NOT EXISTS character_prologues (
    user_id TEXT PRIMARY KEY,
    stage TEXT NOT NULL DEFAULT 'LETTER_PENDING',
    completed INTEGER NOT NULL DEFAULT 0,
    accepted_at TEXT,
    arrived_at TEXT,
    world_snapshot TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS prologue_choices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    scene TEXT NOT NULL,
    choice_id TEXT NOT NULL,
    story_tag TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, scene),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS character_history_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    snapshot TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, event_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS secret_lineages (
    id TEXT PRIMARY KEY,
    admin_title TEXT NOT NULL,
    public_title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS character_lineages (
    user_id TEXT NOT NULL,
    lineage_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DORMANT',
    discovery INTEGER NOT NULL DEFAULT 0,
    discovered_text TEXT DEFAULT '',
    admin_notes TEXT DEFAULT '',
    PRIMARY KEY(user_id, lineage_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lineage_id) REFERENCES secret_lineages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wand_resonance_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    source_key TEXT NOT NULL,
    affinity TEXT NOT NULL,
    narrative TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, source_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

  CREATE TABLE IF NOT EXISTS discord_verifications (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    house TEXT,
    class_year TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    discord_user_id TEXT DEFAULT '',
    discord_username TEXT DEFAULT '',
    assigned_roles TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    verified_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS discord_role_mappings (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    internal_key TEXT UNIQUE NOT NULL,
    role_label TEXT NOT NULL,
    discord_role_id TEXT DEFAULT '',
    discord_role_name TEXT NOT NULL,
    color TEXT DEFAULT '#c59f4e',
    auto_assign INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
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
    image_url TEXT DEFAULT '',
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

  CREATE UNIQUE INDEX IF NOT EXISTS idx_lottery_one_active_round
    ON lottery_rounds(status) WHERE status = 'active';

  -- ==================== DOKUMENTY, DEKRETY, STATUT & KODEX ====================
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT DEFAULT '',
    number TEXT DEFAULT '',
    title TEXT NOT NULL,
    subtitle TEXT DEFAULT '',
    author TEXT DEFAULT '',
    author_role TEXT DEFAULT 'Dyrekcja Cytadeli',
    date TEXT DEFAULT (date('now')),
    seal_type TEXT DEFAULT 'gold',
    icon_name TEXT DEFAULT 'ShieldAlert',
    severity TEXT DEFAULT 'normalny',
    summary TEXT DEFAULT '',
    content TEXT NOT NULL DEFAULT '[]',
    tags TEXT DEFAULT '[]',
    is_official INTEGER DEFAULT 1,
    is_pinned INTEGER DEFAULT 0,
    cover_image TEXT DEFAULT '',
    rune TEXT DEFAULT 'ᛟ',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- ==================== CMS BANERY I GRAFIKI BLOKÓW ====================
  CREATE TABLE IF NOT EXISTS cms_banners (
    id TEXT PRIMARY KEY,
    category_name TEXT NOT NULL,
    default_script TEXT DEFAULT '',
    theme_color TEXT DEFAULT 'var(--gold-ancient)',
    description TEXT DEFAULT '',
    bg_gradient TEXT DEFAULT '',
    bg_type TEXT DEFAULT 'citadel',
    bg_image TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cms_block_graphics (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    location TEXT DEFAULT 'Panel Boczny',
    rune TEXT DEFAULT 'ᛟ',
    default_icon TEXT DEFAULT 'Shield',
    color TEXT DEFAULT 'var(--gold-ancient)',
    bg_image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- ==================== SIDE QUESTY MAPY I TAJEMNICE ====================
  CREATE TABLE IF NOT EXISTS completed_quests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    quest_title TEXT NOT NULL,
    location_id TEXT DEFAULT '',
    location_name TEXT DEFAULT '',
    reward_points INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    reward_galleons INTEGER DEFAULT 0,
    reward_item TEXT DEFAULT '',
    completed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS expedition_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    date_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    score INTEGER DEFAULT 0,
    reward_points INTEGER DEFAULT 0,
    reward_skirnirs INTEGER DEFAULT 0,
    reward_item TEXT DEFAULT '',
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, destination_id, date_key)
  );

  CREATE INDEX IF NOT EXISTS idx_expedition_attempts_daily
    ON expedition_attempts(user_id, date_key);

  CREATE TABLE IF NOT EXISTS discovered_secrets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    secret_id TEXT NOT NULL,
    discovered_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- ==================== WARSZTAT RUNICZNY I ALCHEMIA ====================
  CREATE TABLE IF NOT EXISTS crafted_formulas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    formula_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Bojowa / Ochronna',
    catalyst TEXT DEFAULT '',
    runes TEXT DEFAULT '[]',
    reward_points INTEGER DEFAULT 15,
    reward_currency INTEGER DEFAULT 20,
    crafted_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_completed_quests_user_quest
    ON completed_quests(user_id, quest_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_discovered_secrets_user_secret
    ON discovered_secrets(user_id, secret_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_crafted_formulas_user_formula
    ON crafted_formulas(user_id, formula_id);

  -- ==================== ZADANIA DOMOWE I WYPRACOWANIA (TMD SYSTEM) ====================
  CREATE TABLE IF NOT EXISTS homework_assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    assignment_number INTEGER DEFAULT 1,
    type TEXT DEFAULT 'homework',
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    class_year TEXT NOT NULL,
    school_year TEXT NOT NULL DEFAULT 'XVII Rok Szkolny',
    lesson_id TEXT DEFAULT '',
    lesson_title TEXT DEFAULT '',
    professor_id TEXT NOT NULL,
    professor_name TEXT NOT NULL,
    professor_avatar TEXT DEFAULT '',
    description TEXT DEFAULT '',
    instructions TEXT DEFAULT '',
    requirements TEXT DEFAULT '[]',
    resources TEXT DEFAULT '[]',
    submission_types TEXT DEFAULT '["text"]',
    publish_date TEXT,
    due_date TEXT NOT NULL,
    allow_late INTEGER DEFAULT 1,
    late_due_date TEXT DEFAULT '',
    late_penalty_points INTEGER DEFAULT 0,
    revision_allowed INTEGER DEFAULT 1,
    revision_due_date TEXT DEFAULT '',
    max_points INTEGER DEFAULT 20,
    grading_type TEXT DEFAULT 'points',
    grading_scale_id TEXT DEFAULT '',
    rubric TEXT DEFAULT '[]',
    is_optional INTEGER DEFAULT 0,
    is_group INTEGER DEFAULT 0,
    group_data TEXT DEFAULT '{}',
    is_published INTEGER DEFAULT 1,
    is_archived INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS homework_submissions (
    id TEXT PRIMARY KEY,
    homework_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    house TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    lesson_id TEXT DEFAULT '',
    lesson_title TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    current_version INTEGER DEFAULT 1,
    content TEXT DEFAULT '',
    word_count INTEGER DEFAULT 0,
    attachments TEXT DEFAULT '[]',
    links TEXT DEFAULT '[]',
    submitted_at TEXT,
    is_late INTEGER DEFAULT 0,
    late_duration_seconds INTEGER DEFAULT 0,
    grade_score REAL,
    grade_max REAL DEFAULT 20,
    grade_percentage REAL,
    grade_label TEXT DEFAULT '',
    rubric_scores TEXT DEFAULT '{}',
    feedback TEXT DEFAULT '',
    inline_annotations TEXT DEFAULT '[]',
    revision_reason TEXT DEFAULT '',
    revision_due_date TEXT DEFAULT '',
    house_points_awarded INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    featured_badge TEXT DEFAULT '',
    achievement_awarded TEXT DEFAULT '',
    recorded_to_gradebook INTEGER DEFAULT 0,
    graded_by TEXT DEFAULT '',
    graded_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS homework_submission_versions (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    homework_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    attachments TEXT DEFAULT '[]',
    links TEXT DEFAULT '[]',
    submitted_at TEXT NOT NULL,
    status TEXT NOT NULL,
    grade_score REAL,
    grade_label TEXT DEFAULT '',
    feedback TEXT DEFAULT '',
    rubric_scores TEXT DEFAULT '{}',
    inline_annotations TEXT DEFAULT '[]',
    revision_reason TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (submission_id) REFERENCES homework_submissions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS homework_exceptions (
    id TEXT PRIMARY KEY,
    homework_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    custom_due_date TEXT,
    extra_time_hours INTEGER DEFAULT 0,
    is_exempt INTEGER DEFAULT 0,
    allow_resubmission INTEGER DEFAULT 1,
    reason TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (homework_id) REFERENCES homework_assignments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS homework_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'ogólny',
    type TEXT DEFAULT 'homework',
    description TEXT DEFAULT '',
    instructions TEXT DEFAULT '',
    requirements TEXT DEFAULT '[]',
    rubric TEXT DEFAULT '[]',
    submission_types TEXT DEFAULT '["text"]',
    created_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS homework_quick_comments (
    id TEXT PRIMARY KEY,
    professor_id TEXT NOT NULL,
    category TEXT DEFAULT 'ogólne',
    text TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS homework_audit_logs (
    id TEXT PRIMARY KEY,
    homework_id TEXT DEFAULT '',
    submission_id TEXT DEFAULT '',
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- ==================== EKSTERNISTYCZNE ZALICZENIA ====================
  CREATE TABLE IF NOT EXISTS externist_applications (
    id TEXT PRIMARY KEY,
    student_id INTEGER NOT NULL,
    student_name TEXT NOT NULL,
    house TEXT DEFAULT '',
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    motivation TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    professor_id INTEGER,
    professor_name TEXT DEFAULT '',
    requirements_type TEXT DEFAULT '',
    requirements_note TEXT DEFAULT '',
    homework_assignment_id TEXT DEFAULT '',
    decision_note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    decided_at TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- ==================== KRUCZA POCZTA I WIADOMOŚCI ====================
  CREATE TABLE IF NOT EXISTS raven_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT DEFAULT '',
    sender_name TEXT NOT NULL,
    sender_role TEXT DEFAULT 'Adept',
    sender_avatar TEXT DEFAULT '',
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    starred INTEGER DEFAULT 0,
    tag TEXT DEFAULT 'posłaniec',
    date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS raven_message_user_state (
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    starred INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES raven_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- ==================== ŻELAZNE PIÓRO — INTERAKTYWNA GAZETKA SZKOLNA ====================

  CREATE TABLE IF NOT EXISTS gazette_sections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📰',
    sort_order INTEGER DEFAULT 0,
    editor_id TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gazette_issues (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    theme TEXT DEFAULT '',
    school_year TEXT DEFAULT '',
    publication_date TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    editor_in_chief_id TEXT DEFAULT '',
    editorial_team TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft',
    stats TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gazette_articles (
    id TEXT PRIMARY KEY,
    issue_id TEXT DEFAULT '',
    title TEXT NOT NULL,
    supertitle TEXT DEFAULT '',
    subtitle TEXT DEFAULT '',
    lead TEXT DEFAULT '',
    content TEXT DEFAULT '',
    author_id TEXT DEFAULT '',
    author_name TEXT DEFAULT '',
    coauthor_id TEXT DEFAULT '',
    coauthor_name TEXT DEFAULT '',
    section_id TEXT DEFAULT '',
    section_name TEXT DEFAULT '',
    featured_image TEXT DEFAULT '',
    additional_images TEXT DEFAULT '[]',
    featured_quote TEXT DEFAULT '',
    sources TEXT DEFAULT '',
    editorial_note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'idea',
    is_anonymous INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gazette_comments (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    author_id TEXT DEFAULT '',
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_editorial INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (article_id) REFERENCES gazette_articles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS gazette_pages (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL,
    page_number INTEGER NOT NULL DEFAULT 1,
    template TEXT NOT NULL DEFAULT 'article-single',
    content TEXT DEFAULT '{}',
    background_image TEXT DEFAULT '',
    background_color TEXT DEFAULT '',
    article_id TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (issue_id) REFERENCES gazette_issues(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS gazette_staff (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT '',
    gazette_role TEXT NOT NULL DEFAULT 'editor',
    issue_id TEXT DEFAULT '',
    is_permanent INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gazette_quizzes (
    id TEXT PRIMARY KEY,
    page_id TEXT DEFAULT '',
    issue_id TEXT DEFAULT '',
    title TEXT NOT NULL DEFAULT 'Quiz',
    questions TEXT DEFAULT '[]',
    results_messages TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gazette_crosswords (
    id TEXT PRIMARY KEY,
    page_id TEXT DEFAULT '',
    issue_id TEXT DEFAULT '',
    title TEXT NOT NULL DEFAULT 'Krzyżówka',
    words TEXT DEFAULT '[]',
    grid_width INTEGER DEFAULT 10,
    grid_height INTEGER DEFAULT 10,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gazette_submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'article',
    title TEXT NOT NULL DEFAULT '',
    content TEXT DEFAULT '',
    attachments TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    reviewer_id TEXT DEFAULT '',
    reviewer_note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gazette_analytics (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    action TEXT NOT NULL DEFAULT 'view',
    page_number INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gazette_secrets (
    id TEXT PRIMARY KEY,
    page_id TEXT DEFAULT '',
    issue_id TEXT DEFAULT '',
    trigger_type TEXT DEFAULT 'click',
    trigger_target TEXT DEFAULT '',
    secret_content TEXT DEFAULT '',
    secret_type TEXT DEFAULT 'message',
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- ==================== MODUŁ EGZAMINACYJNY CYTADELI ====================

  -- Skale ocen egzaminacyjnych
  CREATE TABLE IF NOT EXISTS exam_grading_scales (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exam_grading_scale_entries (
    id TEXT PRIMARY KEY,
    scale_id TEXT NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT DEFAULT '',
    min_percent REAL NOT NULL,
    max_percent REAL NOT NULL,
    is_passing INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    color TEXT DEFAULT '',
    FOREIGN KEY (scale_id) REFERENCES exam_grading_scales(id) ON DELETE CASCADE
  );

  -- Sesje egzaminacyjne
  CREATE TABLE IF NOT EXISTS exam_sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    school_year TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    class_years TEXT DEFAULT '[]',
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Bank pytań — kategorie
  CREATE TABLE IF NOT EXISTS question_bank_categories (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_id TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Pytania w banku
  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    category_id TEXT DEFAULT '',
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    explanation TEXT DEFAULT '',
    difficulty TEXT DEFAULT 'medium',
    tags TEXT DEFAULT '[]',
    media_url TEXT DEFAULT '',
    media_type TEXT DEFAULT '',
    supplementary_material TEXT DEFAULT '',
    correct_short_answers TEXT DEFAULT '[]',
    fill_gaps_answers TEXT DEFAULT '[]',
    is_archived INTEGER DEFAULT 0,
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Opcje odpowiedzi
  CREATE TABLE IF NOT EXISTS question_options (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_correct INTEGER DEFAULT 0,
    match_target TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  );

  -- Egzaminy
  CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    professor_id TEXT NOT NULL,
    professor_name TEXT NOT NULL,
    class_year TEXT NOT NULL,
    access_start TEXT,
    access_end TEXT,
    time_limit_minutes INTEGER DEFAULT 60,
    end_policy TEXT DEFAULT 'soft_limit',
    max_attempts INTEGER DEFAULT 1,
    passing_threshold REAL DEFAULT 40.0,
    navigation_mode TEXT DEFAULT 'free',
    shuffle_questions INTEGER DEFAULT 0,
    shuffle_options INTEGER DEFAULT 0,
    use_random_pool INTEGER DEFAULT 0,
    random_easy INTEGER DEFAULT 0,
    random_medium INTEGER DEFAULT 0,
    random_hard INTEGER DEFAULT 0,
    random_very_hard INTEGER DEFAULT 0,
    results_visibility TEXT DEFAULT 'after_approval',
    results_publish_date TEXT DEFAULT '',
    show_answers_after INTEGER DEFAULT 0,
    show_points_after INTEGER DEFAULT 1,
    show_correct_answers INTEGER DEFAULT 0,
    show_comments INTEGER DEFAULT 1,
    instructions TEXT DEFAULT '',
    grading_scale_id TEXT DEFAULT '',
    status TEXT DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    is_locked INTEGER DEFAULT 0,
    template_id TEXT DEFAULT '',
    total_points INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    published_at TEXT DEFAULT '',
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id)
  );

  -- Sekcje egzaminu
  CREATE TABLE IF NOT EXISTS exam_sections (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    instructions TEXT DEFAULT '',
    max_points INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  -- Pytania przypisane do egzaminu
  CREATE TABLE IF NOT EXISTS exam_questions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    section_id TEXT DEFAULT '',
    question_id TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    partial_credit TEXT DEFAULT 'none',
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  -- Rubryki oceniania
  CREATE TABLE IF NOT EXISTS exam_rubrics (
    id TEXT PRIMARY KEY,
    exam_question_id TEXT NOT NULL,
    title TEXT DEFAULT '',
    FOREIGN KEY (exam_question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exam_rubric_criteria (
    id TEXT PRIMARY KEY,
    rubric_id TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (rubric_id) REFERENCES exam_rubrics(id) ON DELETE CASCADE
  );

  -- Podejścia uczniów
  CREATE TABLE IF NOT EXISTS exam_attempts (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'in_progress',
    started_at TEXT NOT NULL,
    submitted_at TEXT DEFAULT '',
    time_expires_at TEXT NOT NULL,
    question_set TEXT DEFAULT '[]',
    question_order TEXT DEFAULT '[]',
    options_order TEXT DEFAULT '{}',
    auto_score INTEGER DEFAULT 0,
    manual_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    percentage REAL DEFAULT 0,
    grade_name TEXT DEFAULT '',
    is_passing INTEGER DEFAULT 0,
    flagged_questions TEXT DEFAULT '[]',
    navigation_mode TEXT DEFAULT 'free',
    professor_comment TEXT DEFAULT '',
    is_final INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  -- Odpowiedzi uczniów
  CREATE TABLE IF NOT EXISTS attempt_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL,
    exam_question_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer_text TEXT DEFAULT '',
    selected_options TEXT DEFAULT '[]',
    matching_pairs TEXT DEFAULT '{}',
    ordering TEXT DEFAULT '[]',
    fill_gaps TEXT DEFAULT '[]',
    is_auto_graded INTEGER DEFAULT 0,
    auto_score INTEGER DEFAULT 0,
    manual_score INTEGER,
    final_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    professor_comment TEXT DEFAULT '',
    rubric_scores TEXT DEFAULT '{}',
    is_flagged INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
  );

  -- Autosave odpowiedzi
  CREATE TABLE IF NOT EXISTS attempt_answer_autosaves (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL,
    exam_question_id TEXT NOT NULL,
    answer_data TEXT NOT NULL DEFAULT '{}',
    saved_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
  );

  -- Wyjątki dla uczniów
  CREATE TABLE IF NOT EXISTS exam_exceptions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    exception_type TEXT NOT NULL,
    extra_minutes INTEGER DEFAULT 0,
    custom_access_end TEXT DEFAULT '',
    extra_attempts INTEGER DEFAULT 0,
    reason TEXT DEFAULT '',
    granted_by TEXT NOT NULL,
    granted_by_name TEXT DEFAULT '',
    granted_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  -- Szablony egzaminów
  CREATE TABLE IF NOT EXISTS exam_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject_id TEXT DEFAULT '',
    description TEXT DEFAULT '',
    config TEXT NOT NULL DEFAULT '{}',
    sections TEXT DEFAULT '[]',
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Log audytowy egzaminów
  CREATE TABLE IF NOT EXISTS exam_audit_log (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    detail TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}'
  );

  -- Zdarzenia techniczne podejść
  CREATE TABLE IF NOT EXISTS exam_attempt_events (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT DEFAULT '{}',
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
  );

  -- ==================== IZBA PAMIĘCI (ARCHIWUM & SALA CHWAŁY) ====================

  CREATE TABLE IF NOT EXISTS memory_school_years (
    id TEXT PRIMARY KEY,
    year_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    term TEXT DEFAULT '',
    date_range TEXT DEFAULT '',
    start_date TEXT DEFAULT '',
    end_date TEXT DEFAULT '',
    winning_house TEXT DEFAULT '',
    winning_points INTEGER DEFAULT 0,
    headmaster TEXT DEFAULT '',
    deputy TEXT DEFAULT '',
    best_student TEXT DEFAULT '',
    best_professor TEXT DEFAULT '',
    highlight_event TEXT DEFAULT '',
    student_count INTEGER DEFAULT 0,
    professor_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published'
    is_featured INTEGER DEFAULT 0,
    summary TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    published_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS memory_person_snapshots (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    character_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    house TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student', -- 'student', 'graduate', 'professor', 'intern', 'admin', 'herald', 'editor'
    class_year TEXT DEFAULT 'Klasa I',
    final_grade TEXT DEFAULT '',
    best_subject TEXT DEFAULT '',
    ranking_position INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    honors_count INTEGER DEFAULT 0,
    titles TEXT DEFAULT '[]', -- JSON array
    functions TEXT DEFAULT '[]', -- JSON array
    is_graduate INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_staff_snapshots (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    title TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'professor', -- 'professor', 'intern', 'mentor', 'headmaster', 'deputy', 'herald', 'warden', 'house_head'
    house TEXT DEFAULT '',
    subject_name TEXT DEFAULT '',
    department TEXT DEFAULT '',
    mentor_name TEXT DEFAULT '',
    intern_status TEXT DEFAULT '', -- 'completed', 'in_progress', 'hired'
    duties_summary TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_trophies (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    house TEXT NOT NULL,
    trophy_type TEXT NOT NULL DEFAULT 'house_cup', -- 'house_cup', 'tournament_cup', 'dueling_cup', 'special'
    title TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    house_head TEXT DEFAULT '',
    top_scorers TEXT DEFAULT '[]', -- JSON array
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '🏆',
    image_url TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_certificates (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    student_name TEXT NOT NULL,
    house TEXT NOT NULL,
    class_year TEXT NOT NULL DEFAULT 'Klasa II',
    document_number TEXT UNIQUE NOT NULL,
    issue_date TEXT NOT NULL,
    final_evaluation TEXT DEFAULT 'Wybitny',
    subjects_grades TEXT DEFAULT '[]', -- JSON array of { subject, grade, gradeLabel, examScore }
    exam_results TEXT DEFAULT '[]', -- JSON array
    average_score REAL DEFAULT 5.0,
    authority_name TEXT DEFAULT 'Arcymistrz Valdemar Krag-Hansen',
    authority_title TEXT DEFAULT 'Dyrektor Cytadeli Durmstrang',
    seal_type TEXT DEFAULT 'gold_wolf',
    visibility TEXT DEFAULT 'public', -- 'public', 'students', 'staff', 'admin'
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_diplomas (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    recipient_name TEXT NOT NULL,
    house TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'turniej', -- 'turniej', 'olimpiada', 'przedmiotowy', 'aktywnosc', 'specjalny'
    title TEXT NOT NULL,
    place TEXT DEFAULT 'I',
    description TEXT DEFAULT '',
    issuer TEXT DEFAULT 'Dyrekcja Cytadeli Durmstrang',
    date TEXT NOT NULL,
    badge_icon TEXT DEFAULT '📜',
    image_url TEXT DEFAULT '',
    visibility TEXT DEFAULT 'public',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_awards (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    recipient_name TEXT NOT NULL,
    house TEXT NOT NULL,
    award_type TEXT NOT NULL, -- 'uczen_roku', 'profesor_roku', 'najaktywniejszy', 'mistrz_pojedynkow', 'herold_roku', 'redaktor_roku', 'specjalne'
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '⭐',
    visibility TEXT DEFAULT 'public',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_rankings (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    ranking_type TEXT NOT NULL, -- 'students', 'professors', 'interns', 'staff', 'houses'
    standings TEXT NOT NULL DEFAULT '[]', -- JSON array of ranking items
    snapshot_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_plebiscites (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    title TEXT NOT NULL,
    edition TEXT DEFAULT '',
    description TEXT DEFAULT '',
    categories TEXT NOT NULL DEFAULT '[]', -- JSON array of { categoryName, winner, nominees, icon }
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_chronicle_events (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'wydarzenie', -- 'turniej', 'ceremonia', 'pojedynki', 'wyprawa', 'edykt', 'zabawa', 'odkrycie'
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    results TEXT DEFAULT '[]', -- JSON array of winners / results
    linked_diploma_ids TEXT DEFAULT '[]', -- JSON array
    tags TEXT DEFAULT '[]', -- JSON array
    image_url TEXT DEFAULT '',
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_gazette_snapshots (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    editor_in_chief TEXT NOT NULL,
    editorial_staff TEXT DEFAULT '[]', -- JSON array of { name, role, avatar }
    issues_count INTEGER DEFAULT 0,
    issues_links TEXT DEFAULT '[]', -- JSON array of { issueNumber, title, date, linkId }
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_custom_achievements (
    id TEXT PRIMARY KEY,
    school_year_id TEXT NOT NULL,
    title TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    house TEXT DEFAULT '',
    description TEXT NOT NULL,
    category TEXT DEFAULT 'Zasługa dla Twierdzy',
    date TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    icon TEXT DEFAULT '🛡️',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (school_year_id) REFERENCES memory_school_years(id) ON DELETE CASCADE
  );

  -- ==================== IZBA PRZYJĘĆ I USPRAWIEDLIWIEŃ ====================

  CREATE TABLE IF NOT EXISTS absence_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    house TEXT DEFAULT '',
    class_year TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'post_factum', -- 'planned' | 'post_factum'
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    reason TEXT NOT NULL,
    extra_info TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'cancelled' | 'invalid'
    review_comment TEXT DEFAULT '',
    reviewed_by TEXT DEFAULT '',
    reviewed_by_name TEXT DEFAULT '',
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT DEFAULT '',
    school_year TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS absence_request_lessons (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    lesson_id TEXT DEFAULT '',
    timetable_entry_id TEXT DEFAULT '',
    subject_id TEXT DEFAULT '',
    subject_name TEXT DEFAULT '',
    professor_id TEXT DEFAULT '',
    professor_name TEXT DEFAULT '',
    lesson_date TEXT DEFAULT '',
    lesson_start TEXT DEFAULT '',
    lesson_end TEXT DEFAULT '',
    participant_id TEXT DEFAULT '',
    FOREIGN KEY (request_id) REFERENCES absence_requests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS absence_audit_logs (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (request_id) REFERENCES absence_requests(id) ON DELETE CASCADE
  );

  -- ==================== DANE DOMENOWE (ZAKONY, LOKACJE, RUNY, CEREMONIA, SKLEPY, LOTERIA) ====================

  CREATE TABLE IF NOT EXISTS houses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT DEFAULT '',
    symbol_animal TEXT DEFAULT '',
    crest_icon TEXT DEFAULT '',
    crest_image TEXT DEFAULT '',
    element TEXT DEFAULT '',
    founder TEXT DEFAULT '',
    colors TEXT DEFAULT '{}',
    gem_name TEXT DEFAULT '',
    motto TEXT DEFAULT '',
    latin_motto TEXT DEFAULT '',
    traits TEXT DEFAULT '[]',
    common_room TEXT DEFAULT '',
    relic TEXT DEFAULT '',
    head_of_house TEXT DEFAULT '',
    prefect TEXT DEFAULT '',
    members_count INTEGER DEFAULT 0,
    starting_points INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nordic_name TEXT DEFAULT '',
    floor INTEGER DEFAULT 0,
    x REAL DEFAULT 50,
    y REAL DEFAULT 50,
    icon TEXT DEFAULT '📍',
    house TEXT,
    type TEXT DEFAULT '',
    region TEXT DEFAULT '',
    image TEXT DEFAULT '',
    short_desc TEXT DEFAULT '',
    full_lore TEXT DEFAULT '',
    npcs TEXT DEFAULT '[]',
    actions TEXT DEFAULT '[]',
    secret_clue TEXT DEFAULT '',
    quests TEXT DEFAULT '[]',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS runes_catalog (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    meaning TEXT DEFAULT '',
    element TEXT DEFAULT '',
    description TEXT DEFAULT '',
    default_count INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS rune_formulas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    runes TEXT DEFAULT '[]',
    catalyst TEXT DEFAULT '',
    house_bonus TEXT,
    reward_xp INTEGER DEFAULT 0,
    reward_points INTEGER DEFAULT 0,
    reward_currency INTEGER DEFAULT 0,
    lore_reward TEXT DEFAULT '',
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ceremony_questions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    scenario TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ceremony_options (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    text TEXT NOT NULL,
    house TEXT NOT NULL,
    reason TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES ceremony_questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🛍️',
    category_slug TEXT DEFAULT '',
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS futhark_runes (
    id TEXT PRIMARY KEY,
    rune_char TEXT NOT NULL,
    name TEXT NOT NULL,
    meaning TEXT DEFAULT '',
    color TEXT DEFAULT '#c59f4e',
    sort_order INTEGER DEFAULT 0
  );
`);

// ===================== MAPA ŚWIATA — NOWE TABELE =====================

db.exec(`
  CREATE TABLE IF NOT EXISTS map_layers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id TEXT REFERENCES map_layers(id),
    image_path TEXT DEFAULT '',
    default_zoom REAL DEFAULT 0.7,
    default_x REAL DEFAULT 0,
    default_y REAL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_map_discoveries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    discovered_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, location_id)
  );

  CREATE TABLE IF NOT EXISTS user_map_tracking (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migracja: nowe kolumny w tabeli locations
{
  const locCols = db.pragma('table_info(locations)').map(c => c.name);
  const toAdd = [
    ['layer_id',                  "TEXT DEFAULT 'fortress'"],
    ['marker_type',               "TEXT DEFAULT 'location'"],
    ['visibility',                "TEXT DEFAULT 'visible'"],
    ['state',                     "TEXT DEFAULT 'available'"],
    ['unlock_condition',          "TEXT DEFAULT ''"],
    ['linked_activity_type',      "TEXT DEFAULT ''"],
    ['linked_activity_id',        "TEXT DEFAULT ''"],
    ['quest_chain_id',            "TEXT DEFAULT ''"],
    ['available_from',            "TEXT DEFAULT ''"],
    ['available_until',           "TEXT DEFAULT ''"],
    ['discovery_reward_xp',       'INTEGER DEFAULT 0'],
    ['discovery_reward_skirniry', 'INTEGER DEFAULT 0'],
    ['min_level',                 'INTEGER DEFAULT 0'],
    ['required_order',            "TEXT DEFAULT ''"],
    ['description_short',         "TEXT DEFAULT ''"],
  ];
  for (const [col, def] of toAdd) {
    if (!locCols.includes(col)) {
      try {
        db.exec(`ALTER TABLE locations ADD COLUMN ${col} ${def};`);
        console.log(`[DB] Migration: dodano kolumnę ${col} do locations`);
      } catch (e) {
        console.warn(`[DB] Migration locations.${col}:`, e.message);
      }
    }
  }
}

// ===================== MIGRATIONS — IZBA PRZYJĘĆ ====================

try {
  const partCols = db.pragma('table_info(lesson_participants)');
  if (partCols.length > 0 && !partCols.some(c => c.name === 'excuse_status')) {
    db.exec(`ALTER TABLE lesson_participants ADD COLUMN excuse_status TEXT DEFAULT NULL;`);
    db.exec(`ALTER TABLE lesson_participants ADD COLUMN excuse_request_id TEXT DEFAULT '';`);
    console.log('[DB] Migration: added excuse_status, excuse_request_id to lesson_participants');
  }
} catch (e) {
  console.warn('[DB] Migration excuse_status:', e.message);
}

// Ensure school_config has default absence deadline
try {
  const existing = db.prepare(`SELECT value FROM school_config WHERE key = 'absenceExcuseDeadlineDays'`).get();
  if (!existing) {
    db.prepare(`INSERT INTO school_config (key, value) VALUES ('absenceExcuseDeadlineDays', '7')`).run();
  }
} catch (_) {}

// Migration: professor subject applications table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS professor_subject_applications (
      id TEXT PRIMARY KEY,
      professor_id TEXT NOT NULL,
      professor_name TEXT NOT NULL,
      professor_avatar TEXT DEFAULT '',
      subject_id TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      class_year TEXT NOT NULL DEFAULT 'Klasa I',
      note TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      review_comment TEXT DEFAULT '',
      reviewed_by TEXT DEFAULT '',
      reviewed_at TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
} catch (e) {
  console.warn('[DB] Migration professor_subject_applications:', e.message);
}

// Ensure enrollment_open config key exists
try {
  const eo = db.prepare(`SELECT value FROM school_config WHERE key = 'enrollment_open'`).get();
  if (!eo) db.prepare(`INSERT INTO school_config (key, value) VALUES ('enrollment_open', '0')`).run();
} catch (_) {}
try {
  const en = db.prepare(`SELECT value FROM school_config WHERE key = 'enrollment_note'`).get();
  if (!en) db.prepare(`INSERT INTO school_config (key, value) VALUES ('enrollment_note', '')`).run();
} catch (_) {}

// Migration: teacher_subject_assignments — M:N join table (single source of truth)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
      id TEXT PRIMARY KEY,
      professor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'primary',
      school_year TEXT NOT NULL DEFAULT 'XIX Rok Szkolny (2026/2027)',
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      assigned_by TEXT DEFAULT '',
      UNIQUE(professor_id, subject_id, school_year)
    );
  `);

  // Migrate existing data from the three parallel systems into this table
  const assignmentCount = db.prepare('SELECT COUNT(*) as c FROM teacher_subject_assignments').get().c;
  if (assignmentCount === 0) {
    const schoolYear = db.prepare("SELECT value FROM school_config WHERE key = 'school_year'").get()?.value || 'XIX Rok Szkolny (2026/2027)';
    const migrateAssignments = db.transaction(() => {
      const seenPairs = new Set();

      // Source 1: subjects.professor_id (where not empty)
      const subjectsWithProf = db.prepare(`SELECT id, professor_id FROM subjects WHERE professor_id IS NOT NULL AND professor_id != ''`).all();
      for (const s of subjectsWithProf) {
        const key = `${s.professor_id}::${s.id}`;
        if (!seenPairs.has(key)) {
          seenPairs.add(key);
          db.prepare(`INSERT OR IGNORE INTO teacher_subject_assignments (id, professor_id, subject_id, role, school_year, status) VALUES (?, ?, ?, 'primary', ?, 'active')`)
            .run(`tsa-${s.professor_id}-${s.id}`, s.professor_id, s.id, schoolYear);
        }
      }

      // Source 2: users.taught_subject_ids JSON arrays
      const profsWithIds = db.prepare(`SELECT id, taught_subject_ids FROM users WHERE role IN ('professor','admin') AND taught_subject_ids != '[]' AND taught_subject_ids IS NOT NULL`).all();
      for (const p of profsWithIds) {
        let ids = [];
        try { ids = JSON.parse(p.taught_subject_ids || '[]'); } catch {}
        for (const subjectId of ids) {
          const subjectExists = db.prepare('SELECT id FROM subjects WHERE id = ?').get(subjectId);
          if (!subjectExists) continue;
          const key = `${p.id}::${subjectId}`;
          if (!seenPairs.has(key)) {
            seenPairs.add(key);
            db.prepare(`INSERT OR IGNORE INTO teacher_subject_assignments (id, professor_id, subject_id, role, school_year, status) VALUES (?, ?, ?, 'primary', ?, 'active')`)
              .run(`tsa-${p.id}-${subjectId}`, p.id, subjectId, schoolYear);
          }
        }
      }

      // Source 3: approved professor_subject_applications
      const approvedApps = db.prepare(`SELECT professor_id, subject_id FROM professor_subject_applications WHERE status = 'approved'`).all();
      for (const a of approvedApps) {
        const key = `${a.professor_id}::${a.subject_id}`;
        if (!seenPairs.has(key)) {
          seenPairs.add(key);
          db.prepare(`INSERT OR IGNORE INTO teacher_subject_assignments (id, professor_id, subject_id, role, school_year, status) VALUES (?, ?, ?, 'primary', ?, 'active')`)
            .run(`tsa-${a.professor_id}-${a.subject_id}`, a.professor_id, a.subject_id, schoolYear);
        }
      }

      console.log(`[DB] Migration: created ${seenPairs.size} teacher_subject_assignments from existing data`);
    });
    migrateAssignments();
  }
} catch (e) {
  console.warn('[DB] Migration teacher_subject_assignments:', e.message);
}

// ── Połów w Zamarzniętym Fjordzie ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS fishing_sessions (
    id               TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    date_key         TEXT NOT NULL,
    mode             TEXT NOT NULL DEFAULT 'reward',
    status           TEXT NOT NULL DEFAULT 'in_progress',
    score            INTEGER NOT NULL DEFAULT 0,
    casts_completed  INTEGER NOT NULL DEFAULT 0,
    catches_count    INTEGER NOT NULL DEFAULT 0,
    escapes_count    INTEGER NOT NULL DEFAULT 0,
    perfect_hooks    INTEGER NOT NULL DEFAULT 0,
    perfect_reels    INTEGER NOT NULL DEFAULT 0,
    reward_points    INTEGER NOT NULL DEFAULT 0,
    reward_skirnirs  INTEGER NOT NULL DEFAULT 0,
    reward_loot_id   TEXT NOT NULL DEFAULT '',
    reward_message   TEXT NOT NULL DEFAULT '',
    started_at       TEXT NOT NULL DEFAULT (datetime('now')),
    last_active_at   TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at     TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fishing_casts (
    id             TEXT PRIMARY KEY,
    session_id     TEXT NOT NULL,
    cast_index     INTEGER NOT NULL,
    bait_id        TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'started',
    hook_grade     TEXT NOT NULL DEFAULT '',
    hook_points    INTEGER NOT NULL DEFAULT 0,
    reel_results   TEXT NOT NULL DEFAULT '["miss","miss","miss"]',
    reel_points    INTEGER NOT NULL DEFAULT 0,
    cast_score     INTEGER NOT NULL DEFAULT 0,
    loot_id        TEXT NOT NULL DEFAULT '',
    loot_rarity    TEXT NOT NULL DEFAULT '',
    started_at     TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at   TEXT,
    FOREIGN KEY (session_id) REFERENCES fishing_sessions(id) ON DELETE CASCADE,
    UNIQUE (session_id, cast_index)
  );

  CREATE INDEX IF NOT EXISTS idx_fishing_sessions_user_date
    ON fishing_sessions(user_id, date_key, mode);
  CREATE INDEX IF NOT EXISTS idx_fishing_sessions_active
    ON fishing_sessions(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_fishing_casts_session
    ON fishing_casts(session_id, cast_index);
`);

// ── Hnefatafl Magów ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS hnefatafl_runs (
    run_id          TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    mode            TEXT NOT NULL DEFAULT 'ai',
    difficulty      TEXT NOT NULL DEFAULT 'uczen',
    player_side     TEXT NOT NULL DEFAULT 'defenders',
    ai_seed         INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'started',
    winner          TEXT,
    end_reason      TEXT,
    move_count      INTEGER NOT NULL DEFAULT 0,
    move_log        TEXT,
    reward_points   INTEGER NOT NULL DEFAULT 0,
    reward_skirnirs INTEGER NOT NULL DEFAULT 0,
    reward_eligible INTEGER NOT NULL DEFAULT 0,
    reward_reason   TEXT,
    rewarded        INTEGER NOT NULL DEFAULT 0,
    date_warsaw     TEXT NOT NULL,
    started_at      TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at    TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_hfatafl_user_date
    ON hnefatafl_runs(user_id, date_warsaw);
`);

// ── Runiczna Strzelnica ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS shooting_range_runs (
    run_id      TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    score       INTEGER NOT NULL DEFAULT 0,
    hits        INTEGER NOT NULL DEFAULT 0,
    misses      INTEGER NOT NULL DEFAULT 0,
    traps       INTEGER NOT NULL DEFAULT 0,
    max_combo   INTEGER NOT NULL DEFAULT 1,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    rewarded    INTEGER NOT NULL DEFAULT 0,
    house_points INTEGER NOT NULL DEFAULT 0,
    skirniry    INTEGER NOT NULL DEFAULT 0,
    date_warsaw TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_srr_user_date
    ON shooting_range_runs(user_id, date_warsaw);
`);

// ===================== MIGRACJA: SILNIK QUESTÓW =====================
// Tabele tworzone przez initQuestService — tutaj tylko quest_id w tracking

try {
  const trackCols = db.pragma('table_info(user_map_tracking)').map(c => c.name);
  if (!trackCols.includes('quest_id')) {
    db.exec('ALTER TABLE user_map_tracking ADD COLUMN quest_id TEXT DEFAULT NULL;');
    console.log('[DB] Migration: dodano quest_id do user_map_tracking');
  }
} catch (e) {
  console.warn('[DB] Migration user_map_tracking.quest_id:', e.message);
}

// ===================== MIGRACJA: EKSPEDYCJE NA MAPIE =====================
// Podpina 3 ekspedycje do właściwych lokacji (idempotentne — sprawdza przed zapisem)
{
  const expeditionLinks = [
    { id: 'wl-fiord',      type: 'expedition', activityId: 'drakkar_graveyard' },
    { id: 'wl-jotunskogg', type: 'expedition', activityId: 'shadow_forest' },
    { id: 'wl-frostfang',  type: 'expedition', activityId: 'jotun_caves' },
  ];
  for (const link of expeditionLinks) {
    const loc = db.prepare("SELECT linked_activity_type FROM locations WHERE id = ?").get(link.id);
    if (loc && (!loc.linked_activity_type || loc.linked_activity_type === '')) {
      db.prepare("UPDATE locations SET linked_activity_type = ?, linked_activity_id = ? WHERE id = ?")
        .run(link.type, link.activityId, link.id);
      console.log(`[DB] Migration: podpięto ekspedycję ${link.activityId} do lokacji ${link.id}`);
    }
  }
}

// ===================== MIGRACJA: ZAMARZNIĘTY OGRÓD — WARUNEK ODBLOKOWANIA =====================
// Ustaw warunek odblokowania lokacji przez ukończenie łańcucha Jötunskógu
{
  const ogrod = db.prepare("SELECT id, unlock_condition FROM locations WHERE id = 'wl-hidden-ogrod'").get();
  if (ogrod && (!ogrod.unlock_condition || ogrod.unlock_condition === '')) {
    const condition = JSON.stringify({ type: 'quest_completed', id: 'jot-q4-krag' });
    db.prepare("UPDATE locations SET unlock_condition = ?, state = 'locked', visibility = 'hidden' WHERE id = 'wl-hidden-ogrod'")
      .run(condition);
    console.log('[DB] Migration: ustawiono warunek odblokowania Zamarzniętego Ogrodu');
  }
}
}
