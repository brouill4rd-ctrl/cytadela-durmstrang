import db from './connection.js';

export function dbUserToFrontend(row) {
  if (!row) return null;
  const isStudent = row.role === 'student';
  return {
    id: row.id,
    username: row.username,
    email: row.email || '',
    name: row.name,
    surname: row.surname,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    house: isStudent ? row.house : null,
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
    signaturePng: row.signature_png || '',
    discordId: row.discord_id || '',
    discordUsername: row.discord_username || '',
    discordAvatar: row.discord_avatar || '',
    discordRoles: JSON.parse(row.discord_roles || '[]'),
    discordVerifiedAt: row.discord_verified_at || '',
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
    body: row.body,
    htmlBody: row.html_body || '',
    deliveryId: row.delivery_id || ''
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
    authorId: row.author_id || '',
    authorRole: row.author_role,
    authorSignature: row.author_signature || '',
    category: row.category,
    categoryKey: row.category_key || row.category || 'edykty',
    bannerCustomText: row.banner_custom_text || '',
    waxSeal: row.wax_seal || 'gold',
    house: row.house || '',
    tags: (() => { try { return JSON.parse(row.tags || '[]'); } catch { return []; } })(),
    readTime: row.read_time || '',
    subjectId: row.subject_id || '',
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
    professorAvatar: (() => {
      if (row.professor_id) {
        const prof = db.prepare('SELECT avatar FROM users WHERE id = ?').get(row.professor_id);
        if (prof?.avatar) return prof.avatar;
      }
      return row.professor_avatar || '';
    })(),
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
    sourceType: row.source_type || 'LEGACY',
    sourceId: row.source_id || '',
    lessonId: row.lesson_id || '',
    professorId: row.professor_id || '',
    professorName: row.professor_name,
    actorId: row.actor_id || '',
    actorName: row.actor_name || '',
    date: row.date,
    comment: row.comment || '',
    isRevoked: !!row.is_revoked,
    schoolYear: row.school_year || '',
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
    sortOrder: row.sort_order || 0,
    homeworkId: row.homework_id || null
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

export function getSubjectProfessors(subjectId) {
  return db.prepare(`
    SELECT tsa.id as assignment_id, tsa.role, tsa.school_year, tsa.assigned_at, tsa.status,
           u.id, u.full_name, u.avatar, u.department_name, u.specialization
    FROM teacher_subject_assignments tsa
    JOIN users u ON u.id = tsa.professor_id
    WHERE tsa.subject_id = ? AND tsa.status = 'active'
    ORDER BY CASE tsa.role WHEN 'primary' THEN 0 WHEN 'assistant' THEN 1 ELSE 2 END
  `).all(subjectId);
}

export function getProfessorSubjects(professorId) {
  return db.prepare(`
    SELECT tsa.id as assignment_id, tsa.role, tsa.school_year, tsa.assigned_at, tsa.status,
           s.id, s.name, s.code, s.icon, s.category, s.class_years
    FROM teacher_subject_assignments tsa
    JOIN subjects s ON s.id = tsa.subject_id
    WHERE tsa.professor_id = ? AND tsa.status = 'active'
    ORDER BY s.sort_order
  `).all(professorId);
}

export function isProfessorOfSubject(professorId, subjectId) {
  return !!db.prepare(`
    SELECT 1 FROM teacher_subject_assignments
    WHERE professor_id = ? AND subject_id = ? AND status = 'active'
    UNION
    SELECT 1 FROM subjects
    WHERE id = ? AND professor_id = ?
  `).get(professorId, subjectId, subjectId, professorId);
}

export function dbSubjectToFrontend(row, categories = [], grades = [], recentLessons = [], stats = {}) {
  if (!row) return null;
  const professors = getSubjectProfessors(row.id);
  return {
    id: row.id,
    name: row.name,
    code: row.code || '',
    icon: row.icon || '📚',
    category: row.category || 'Ogólne',
    description: row.description || '',
    classroom: row.classroom || '',
    discordChannelId: row.discord_channel_id || '',
    professorId: row.professor_id || '',
    professorName: row.professor_name || '',
    professors: professors.map(p => ({
      id: p.id,
      fullName: p.full_name,
      avatar: p.avatar || '',
      role: p.role,
      departmentName: p.department_name || '',
      specialization: p.specialization || ''
    })),
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
  // House rankings are always built exclusively from ledger transactions.
  const baseReinhall = 0;
  const baseBjornhall = 0;
  const baseRavnheim = 0;
  const baseOtergard = 0;

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
      crestIcon: 'ᚦ',
      color: '#7a2632',
      secondaryColor: '#a8384b',
      basePoints: includeBase ? baseReinhall : 0,
      lessonPoints: earnedMap.reinhall,
      totalPoints: (includeBase ? baseReinhall : 0) + earnedMap.reinhall,
      txCount: txCountMap.reinhall,
      momentum: momentumMap.reinhall
    },
    {
      houseKey: 'bjornhall',
      name: 'Björnhall',
      crestIcon: 'ᛉ',
      color: '#35536f',
      secondaryColor: '#5b8aaf',
      basePoints: includeBase ? baseBjornhall : 0,
      lessonPoints: earnedMap.bjornhall,
      totalPoints: (includeBase ? baseBjornhall : 0) + earnedMap.bjornhall,
      txCount: txCountMap.bjornhall,
      momentum: momentumMap.bjornhall
    },
    {
      houseKey: 'ravnheim',
      name: 'Ravnheim',
      crestIcon: 'ᚱ',
      color: '#42385f',
      secondaryColor: '#7a6ea0',
      basePoints: includeBase ? baseRavnheim : 0,
      lessonPoints: earnedMap.ravnheim,
      totalPoints: (includeBase ? baseRavnheim : 0) + earnedMap.ravnheim,
      txCount: txCountMap.ravnheim,
      momentum: momentumMap.ravnheim
    },
    {
      houseKey: 'otergard',
      name: 'Otergard',
      crestIcon: 'ᛞ',
      color: '#23615b',
      secondaryColor: '#3aaa9f',
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
    imageUrl: row.image_url || '',
    image: row.image_url || '',
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
// ===================== FRONTEND MAPPERS =====================

export function dbDocumentToFrontend(row) {
  if (!row) return null;
  let parsedContent = row.content;
  let parsedTags = [];
  try {
    parsedContent = JSON.parse(row.content);
  } catch (_) {}
  try {
    parsedTags = JSON.parse(row.tags || '[]');
  } catch (_) {}

  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    categoryLabel: row.category_label || row.category,
    number: row.number || '',
    title: row.title,
    subtitle: row.subtitle || '',
    author: row.author || '',
    authorRole: row.author_role || 'Dyrekcja Cytadeli',
    date: row.date || '',
    sealType: row.seal_type || 'gold',
    iconName: row.icon_name || 'ShieldAlert',
    severity: row.severity || 'normalny',
    summary: row.summary || '',
    content: parsedContent,
    tags: parsedTags,
    isOfficial: Boolean(row.is_official),
    isPinned: Boolean(row.is_pinned),
    coverImage: row.cover_image || '',
    rune: row.rune || 'ᛟ',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function dbCmsBannerToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    categoryName: row.category_name,
    defaultScript: row.default_script || row.category_name.toLowerCase(),
    themeColor: row.theme_color || 'var(--gold-ancient)',
    description: row.description || '',
    bgGradient: row.bg_gradient || '',
    bgType: row.bg_type || 'citadel',
    bgImage: row.bg_image || ''
  };
}

export function dbCmsBlockGraphicToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    location: row.location || 'Panel Boczny',
    rune: row.rune || 'ᛟ',
    defaultIcon: row.default_icon || 'Shield',
    color: row.color || 'var(--gold-ancient)',
    bgImage: row.bg_image || '',
    description: row.description || ''
  };
}

export function dbEventToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    type: row.type || 'ceremony',
    description: row.description || ''
  };
}

export function dbHomeworkAssignmentToFrontend(row, stats = null) {
  if (!row) return null;
  let requirements = [];
  let resources = [];
  let submissionTypes = ['text'];
  let rubric = [];
  let groupData = {};

  try { requirements = JSON.parse(row.requirements || '[]'); } catch (_) {}
  try { resources = JSON.parse(row.resources || '[]'); } catch (_) {}
  try { submissionTypes = JSON.parse(row.submission_types || '["text"]'); } catch (_) {}
  try { rubric = JSON.parse(row.rubric || '[]'); } catch (_) {}
  try { groupData = JSON.parse(row.group_data || '{}'); } catch (_) {}

  return {
    id: row.id,
    title: row.title,
    assignmentNumber: row.assignment_number || 1,
    type: row.type || 'homework',
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    classYear: row.class_year,
    schoolYear: row.school_year || 'XVII Rok Szkolny',
    lessonId: row.lesson_id || '',
    lessonTitle: row.lesson_title || '',
    professorId: row.professor_id,
    professorName: row.professor_name,
    professorAvatar: row.professor_avatar || '',
    description: row.description || '',
    instructions: row.instructions || '',
    requirements,
    resources,
    submissionTypes,
    publishDate: row.publish_date,
    dueDate: row.due_date,
    allowLate: !!row.allow_late,
    lateDueDate: row.late_due_date || '',
    latePenaltyPoints: row.late_penalty_points || 0,
    revisionAllowed: !!row.revision_allowed,
    revisionDueDate: row.revision_due_date || '',
    maxPoints: row.max_points || 20,
    gradingType: row.grading_type || 'points',
    gradingScaleId: row.grading_scale_id || '',
    rubric,
    isOptional: !!row.is_optional,
    isGroup: !!row.is_group,
    groupData,
    isPublished: !!row.is_published,
    isArchived: !!row.is_archived,
    isFeatured: !!row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stats: stats || undefined
  };
}

export function dbHomeworkSubmissionToFrontend(row, versions = [], exception = null) {
  if (!row) return null;
  let attachments = [];
  let links = [];
  let rubricScores = {};
  let inlineAnnotations = [];

  try { attachments = JSON.parse(row.attachments || '[]'); } catch (_) {}
  try { links = JSON.parse(row.links || '[]'); } catch (_) {}
  try { rubricScores = JSON.parse(row.rubric_scores || '{}'); } catch (_) {}
  try { inlineAnnotations = JSON.parse(row.inline_annotations || '[]'); } catch (_) {}

  return {
    id: row.id,
    homeworkId: row.homework_id,
    studentId: row.student_id,
    studentName: row.student_name,
    house: row.house,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    lessonId: row.lesson_id || '',
    lessonTitle: row.lesson_title || '',
    status: row.status,
    currentVersion: row.current_version || 1,
    content: row.content || '',
    wordCount: row.word_count || 0,
    attachments,
    links,
    submittedAt: row.submitted_at,
    isLate: !!row.is_late,
    lateDurationSeconds: row.late_duration_seconds || 0,
    gradeScore: row.grade_score !== null && row.grade_score !== undefined ? row.grade_score : null,
    gradeMax: row.grade_max || 20,
    gradePercentage: row.grade_percentage !== null && row.grade_percentage !== undefined ? row.grade_percentage : null,
    gradeLabel: row.grade_label || '',
    rubricScores,
    feedback: row.feedback || '',
    inlineAnnotations,
    revisionReason: row.revision_reason || '',
    revisionDueDate: row.revision_due_date || '',
    housePointsAwarded: row.house_points_awarded || 0,
    isFeatured: !!row.is_featured,
    featuredBadge: row.featured_badge || '',
    achievementAwarded: row.achievement_awarded || '',
    recordedToGradebook: !!row.recorded_to_gradebook,
    gradedBy: row.graded_by || '',
    gradedAt: row.graded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    versions: versions.map(dbHomeworkVersionToFrontend),
    exception: exception ? dbHomeworkExceptionToFrontend(exception) : null
  };
}

export function dbHomeworkToFrontend(row) {
  return dbHomeworkSubmissionToFrontend(row);
}

export function dbHomeworkVersionToFrontend(row) {
  if (!row) return null;
  let attachments = [];
  let links = [];
  let rubricScores = {};
  let inlineAnnotations = [];

  try { attachments = JSON.parse(row.attachments || '[]'); } catch (_) {}
  try { links = JSON.parse(row.links || '[]'); } catch (_) {}
  try { rubricScores = JSON.parse(row.rubric_scores || '{}'); } catch (_) {}
  try { inlineAnnotations = JSON.parse(row.inline_annotations || '[]'); } catch (_) {}

  return {
    id: row.id,
    submissionId: row.submission_id,
    homeworkId: row.homework_id,
    studentId: row.student_id,
    versionNumber: row.version_number,
    content: row.content || '',
    wordCount: row.word_count || 0,
    attachments,
    links,
    submittedAt: row.submitted_at,
    status: row.status,
    gradeScore: row.grade_score,
    gradeLabel: row.grade_label || '',
    feedback: row.feedback || '',
    rubricScores,
    inlineAnnotations,
    revisionReason: row.revision_reason || '',
    createdAt: row.created_at
  };
}

export function dbHomeworkExceptionToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    homeworkId: row.homework_id,
    studentId: row.student_id,
    studentName: row.student_name,
    customDueDate: row.custom_due_date,
    extraTimeHours: row.extra_time_hours || 0,
    isExempt: !!row.is_exempt,
    allowResubmission: !!row.allow_resubmission,
    reason: row.reason || '',
    createdBy: row.created_by || '',
    createdAt: row.created_at
  };
}

export function dbHomeworkTemplateToFrontend(row) {
  if (!row) return null;
  let requirements = [];
  let rubric = [];
  let submissionTypes = ['text'];
  try { requirements = JSON.parse(row.requirements || '[]'); } catch (_) {}
  try { rubric = JSON.parse(row.rubric || '[]'); } catch (_) {}
  try { submissionTypes = JSON.parse(row.submission_types || '["text"]'); } catch (_) {}

  return {
    id: row.id,
    title: row.title,
    category: row.category || 'ogólny',
    type: row.type || 'homework',
    description: row.description || '',
    instructions: row.instructions || '',
    requirements,
    rubric,
    submissionTypes,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

export function dbHomeworkQuickCommentToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    professorId: row.professor_id,
    category: row.category || 'ogólne',
    text: row.text,
    createdAt: row.created_at
  };
}

export function dbCraftedFormulaToFrontend(row) {
  if (!row) return null;
  let parsedRunes = [];
  try {
    parsedRunes = JSON.parse(row.runes || '[]');
  } catch (_) {}
  return {
    id: row.id,
    userId: row.user_id,
    formulaId: row.formula_id,
    name: row.name,
    type: row.type,
    catalyst: row.catalyst,
    runes: parsedRunes,
    rewardPoints: row.reward_points,
    rewardCurrency: row.reward_currency,
    craftedAt: row.crafted_at
  };
}

export function dbHouseToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name,
    symbolAnimal: row.symbol_animal,
    crestIcon: row.crest_icon,
    crestImage: row.crest_image,
    element: row.element,
    founder: row.founder,
    colors: JSON.parse(row.colors || '{}'),
    gemName: row.gem_name,
    motto: row.motto,
    latinMotto: row.latin_motto,
    traits: JSON.parse(row.traits || '[]'),
    commonRoom: row.common_room,
    relic: row.relic,
    headOfHouse: row.head_of_house,
    prefect: row.prefect,
    membersCount: row.members_count,
    startingPoints: row.starting_points
  };
}

export function dbLocationToFrontend(row, opts = {}) {
  if (!row) return null;
  const base = {
    id: row.id,
    name: row.name,
    nordicName: row.nordic_name,
    floor: row.floor,
    x: row.x,
    y: row.y,
    icon: row.icon,
    house: row.house,
    type: row.type,
    region: row.region,
    image: row.image,
    shortDesc: row.short_desc,
    fullLore: row.full_lore,
    npcs: JSON.parse(row.npcs || '[]'),
    actions: JSON.parse(row.actions || '[]'),
    secretClue: row.secret_clue,
    quests: JSON.parse(row.quests || '[]'),
    // Nowe pola systemu mapy
    layerId: row.layer_id || 'fortress',
    markerType: row.marker_type || 'location',
    visibility: row.visibility || 'visible',
    state: row.state || 'available',
    unlockCondition: row.unlock_condition || '',
    linkedActivityType: row.linked_activity_type || '',
    linkedActivityId: row.linked_activity_id || '',
    questChainId: row.quest_chain_id || '',
    availableFrom: row.available_from || '',
    availableUntil: row.available_until || '',
    discoveryRewardXp: row.discovery_reward_xp || 0,
    discoveryRewardSkirniry: row.discovery_reward_skirniry || 0,
    minLevel: row.min_level || 0,
    requiredOrder: row.required_order || '',
    descriptionShort: row.description_short || '',
  };
  // W trybie publicznym ukrywamy szczegóły nieodkrytych lokacji
  if (opts.redactHidden && row.visibility === 'hidden') {
    return { id: base.id, x: base.x, y: base.y, layerId: base.layerId, visibility: 'hidden', userState: 'undiscovered' };
  }
  return base;
}

export function dbRuneCatalogToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    meaning: row.meaning,
    element: row.element,
    description: row.description,
    count: row.default_count
  };
}

export function dbRuneFormulaToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    runes: JSON.parse(row.runes || '[]'),
    catalyst: row.catalyst,
    houseBonus: row.house_bonus,
    rewardXp: row.reward_xp,
    rewardPoints: row.reward_points,
    rewardCurrency: row.reward_currency,
    loreReward: row.lore_reward,
    description: row.description
  };
}

export function dbCeremonyQuestionToFrontend(row, options = []) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    scenario: row.scenario,
    options: options.map(o => ({
      text: o.text,
      house: o.house,
      reason: o.reason
    }))
  };
}

export function dbShopToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    categorySlug: row.category_slug,
    description: row.description
  };
}

export function dbFutharkRuneToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    rune: row.rune_char,
    name: row.name,
    meaning: row.meaning,
    color: row.color
  };
}

export function dbSecretToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    secretId: row.secret_id,
    discoveredAt: row.discovered_at
  };
}

export function dbCompletedQuestToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    questId: row.quest_id,
    questTitle: row.quest_title,
    locationId: row.location_id,
    locationName: row.location_name,
    rewardPoints: row.reward_points,
    rewardXp: row.reward_xp,
    rewardGalleons: row.reward_galleons,
    rewardItem: row.reward_item,
    completedAt: row.completed_at
  };
}

export function dbRavenMessageToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    sender: row.sender_name,
    senderRole: row.sender_role,
    senderAvatar: row.sender_avatar,
    recipient: row.recipient,
    to: row.recipient,
    subject: row.subject,
    body: row.body,
    read: Boolean(row.read),
    starred: Boolean(row.starred),
    tag: row.tag || 'posłaniec',
    date: row.date
  };
}


export function dbRoleMappingToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    internalKey: row.internal_key,
    roleLabel: row.role_label,
    discordRoleId: row.discord_role_id || '',
    discordRoleName: row.discord_role_name || '',
    color: row.color || '#c59f4e',
    autoAssign: Boolean(row.auto_assign),
    createdAt: row.created_at
  };
}

export function dbVerificationToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    userId: row.user_id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    house: row.house,
    classYear: row.class_year,
    status: row.status,
    discordUserId: row.discord_user_id || '',
    discordUsername: row.discord_username || '',
    assignedRoles: JSON.parse(row.assigned_roles || '[]'),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    verifiedAt: row.verified_at
  };
}

// ==================== ŻELAZNE PIÓRO — KONWERTERY ====================

export function dbGazetteIssueToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    number: row.number,
    title: row.title || '',
    theme: row.theme || '',
    schoolYear: row.school_year || '',
    publicationDate: row.publication_date || '',
    coverImage: row.cover_image || '',
    description: row.description || '',
    editorInChiefId: row.editor_in_chief_id || '',
    editorialTeam: JSON.parse(row.editorial_team || '[]'),
    status: row.status || 'draft',
    stats: JSON.parse(row.stats || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function dbGazetteArticleToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    issueId: row.issue_id || '',
    title: row.title,
    supertitle: row.supertitle || '',
    subtitle: row.subtitle || '',
    lead: row.lead || '',
    content: row.content || '',
    authorId: row.author_id || '',
    authorName: row.author_name || '',
    coauthorId: row.coauthor_id || '',
    coauthorName: row.coauthor_name || '',
    sectionId: row.section_id || '',
    sectionName: row.section_name || '',
    featuredImage: row.featured_image || '',
    additionalImages: JSON.parse(row.additional_images || '[]'),
    featuredQuote: row.featured_quote || '',
    sources: row.sources || '',
    editorialNote: row.editorial_note || '',
    status: row.status || 'idea',
    isAnonymous: Boolean(row.is_anonymous),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function dbGazettePageToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    issueId: row.issue_id,
    pageNumber: row.page_number,
    template: row.template || 'article-single',
    content: JSON.parse(row.content || '{}'),
    backgroundImage: row.background_image || '',
    backgroundColor: row.background_color || '',
    articleId: row.article_id || '',
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at
  };
}

export function dbGazetteSectionToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '📰',
    sortOrder: row.sort_order || 0,
    editorId: row.editor_id || '',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at
  };
}

export function dbGazetteStaffToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || '',
    gazetteRole: row.gazette_role || 'editor',
    issueId: row.issue_id || '',
    isPermanent: Boolean(row.is_permanent),
    createdAt: row.created_at
  };
}

export function dbGazetteSubmissionToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    type: row.type || 'article',
    title: row.title || '',
    content: row.content || '',
    attachments: JSON.parse(row.attachments || '[]'),
    status: row.status || 'pending',
    reviewerId: row.reviewer_id || '',
    reviewerNote: row.reviewer_note || '',
    createdAt: row.created_at
  };
}
// ==================== EXAM MODULE FRONTEND HELPERS ====================

export function dbExamSessionToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    schoolYear: row.school_year,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    classYears: (() => { try { return JSON.parse(row.class_years || '[]'); } catch { return []; } })(),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function dbExamToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    title: row.title,
    description: row.description,
    professorId: row.professor_id,
    professorName: row.professor_name,
    classYear: row.class_year,
    accessStart: row.access_start,
    accessEnd: row.access_end,
    timeLimitMinutes: row.time_limit_minutes,
    endPolicy: row.end_policy,
    maxAttempts: row.max_attempts,
    passingThreshold: row.passing_threshold,
    navigationMode: row.navigation_mode,
    shuffleQuestions: !!row.shuffle_questions,
    shuffleOptions: !!row.shuffle_options,
    useRandomPool: !!row.use_random_pool,
    randomEasy: row.random_easy,
    randomMedium: row.random_medium,
    randomHard: row.random_hard,
    randomVeryHard: row.random_very_hard,
    resultsVisibility: row.results_visibility,
    resultsPublishDate: row.results_publish_date,
    showAnswersAfter: !!row.show_answers_after,
    showPointsAfter: !!row.show_points_after,
    showCorrectAnswers: !!row.show_correct_answers,
    showComments: !!row.show_comments,
    instructions: row.instructions,
    gradingScaleId: row.grading_scale_id,
    status: row.status,
    version: row.version,
    isLocked: !!row.is_locked,
    templateId: row.template_id,
    totalPoints: row.total_points,
    totalQuestions: row.total_questions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at
  };
}

export function dbExamSectionToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    examId: row.exam_id,
    title: row.title,
    description: row.description,
    instructions: row.instructions,
    maxPoints: row.max_points,
    sortOrder: row.sort_order
  };
}

export function dbQuestionToFrontend(row, options = []) {
  if (!row) return null;
  return {
    id: row.id,
    subjectId: row.subject_id,
    categoryId: row.category_id,
    type: row.type,
    content: row.content,
    explanation: row.explanation,
    difficulty: row.difficulty,
    tags: (() => { try { return JSON.parse(row.tags || '[]'); } catch { return []; } })(),
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    supplementaryMaterial: row.supplementary_material,
    correctShortAnswers: (() => { try { return JSON.parse(row.correct_short_answers || '[]'); } catch { return []; } })(),
    fillGapsAnswers: (() => { try { return JSON.parse(row.fill_gaps_answers || '[]'); } catch { return []; } })(),
    isArchived: !!row.is_archived,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    options: options.map(o => ({
      id: o.id,
      content: o.content,
      isCorrect: !!o.is_correct,
      matchTarget: o.match_target,
      sortOrder: o.sort_order
    }))
  };
}

export function dbQuestionForStudentFrontend(row, options = [], shuffledOptionOrder = null) {
  if (!row) return null;
  let mappedOptions = options.map(o => ({
    id: o.id,
    content: o.content,
    sortOrder: o.sort_order
  }));
  if (shuffledOptionOrder) {
    const orderMap = new Map(shuffledOptionOrder.map((id, idx) => [id, idx]));
    mappedOptions.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  }
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    supplementaryMaterial: row.supplementary_material,
    options: mappedOptions
  };
}

export function dbExamAttemptToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    examId: row.exam_id,
    studentId: row.student_id,
    studentName: row.student_name,
    attemptNumber: row.attempt_number,
    status: row.status,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    timeExpiresAt: row.time_expires_at,
    questionSet: (() => { try { return JSON.parse(row.question_set || '[]'); } catch { return []; } })(),
    questionOrder: (() => { try { return JSON.parse(row.question_order || '[]'); } catch { return []; } })(),
    optionsOrder: (() => { try { return JSON.parse(row.options_order || '{}'); } catch { return {}; } })(),
    autoScore: row.auto_score,
    manualScore: row.manual_score,
    totalScore: row.total_score,
    maxScore: row.max_score,
    percentage: row.percentage,
    gradeName: row.grade_name,
    isPassing: !!row.is_passing,
    flaggedQuestions: (() => { try { return JSON.parse(row.flagged_questions || '[]'); } catch { return []; } })(),
    navigationMode: row.navigation_mode,
    professorComment: row.professor_comment,
    isFinal: !!row.is_final,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function dbAttemptAnswerToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    attemptId: row.attempt_id,
    examQuestionId: row.exam_question_id,
    questionId: row.question_id,
    answerText: row.answer_text,
    selectedOptions: (() => { try { return JSON.parse(row.selected_options || '[]'); } catch { return []; } })(),
    matchingPairs: (() => { try { return JSON.parse(row.matching_pairs || '{}'); } catch { return {}; } })(),
    ordering: (() => { try { return JSON.parse(row.ordering || '[]'); } catch { return []; } })(),
    fillGaps: (() => { try { return JSON.parse(row.fill_gaps || '[]'); } catch { return []; } })(),
    isAutoGraded: !!row.is_auto_graded,
    autoScore: row.auto_score,
    manualScore: row.manual_score,
    finalScore: row.final_score,
    maxScore: row.max_score,
    professorComment: row.professor_comment,
    rubricScores: (() => { try { return JSON.parse(row.rubric_scores || '{}'); } catch { return {}; } })(),
    isFlagged: !!row.is_flagged,
    updatedAt: row.updated_at
  };
}

export function dbExamGradingScaleToFrontend(row, entries = []) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    isDefault: !!row.is_default,
    createdBy: row.created_by,
    createdAt: row.created_at,
    entries: entries.map(e => ({
      id: e.id,
      name: e.name,
      abbreviation: e.abbreviation,
      minPercent: e.min_percent,
      maxPercent: e.max_percent,
      isPassing: !!e.is_passing,
      sortOrder: e.sort_order,
      color: e.color
    }))
  };
}
// ==================== IZBA PAMIĘCI FRONTEND HELPERS ====================

export function dbMemoryYearToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    yearCode: row.year_code,
    name: row.name,
    term: row.term,
    dateRange: row.date_range,
    startDate: row.start_date,
    endDate: row.end_date,
    winningHouse: row.winning_house,
    winningPoints: row.winning_points,
    headmaster: row.headmaster,
    deputy: row.deputy,
    bestStudent: row.best_student,
    bestProfessor: row.best_professor,
    highlightEvent: row.highlight_event,
    studentCount: row.student_count,
    professorCount: row.professor_count,
    status: row.status,
    isFeatured: !!row.is_featured,
    summary: row.summary,
    createdAt: row.created_at,
    publishedAt: row.published_at
  };
}

export function dbMemoryPersonToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    userId: row.user_id,
    characterName: row.character_name,
    fullName: row.full_name,
    avatar: row.avatar,
    house: row.house,
    role: row.role,
    classYear: row.class_year,
    finalGrade: row.final_grade,
    bestSubject: row.best_subject,
    rankingPosition: row.ranking_position,
    points: row.points,
    honorsCount: row.honors_count,
    titles: (() => { try { return JSON.parse(row.titles || '[]'); } catch { return []; } })(),
    functions: (() => { try { return JSON.parse(row.functions || '[]'); } catch { return []; } })(),
    isGraduate: !!row.is_graduate,
    notes: row.notes,
    createdAt: row.created_at
  };
}

export function dbMemoryStaffToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    userId: row.user_id,
    name: row.name,
    avatar: row.avatar,
    title: row.title,
    role: row.role,
    house: row.house,
    subjectName: row.subject_name,
    department: row.department,
    mentorName: row.mentor_name,
    internStatus: row.intern_status,
    dutiesSummary: row.duties_summary,
    sortOrder: row.sort_order,
    createdAt: row.created_at
  };
}

export function dbMemoryTrophyToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    house: row.house,
    trophyType: row.trophy_type,
    title: row.title,
    points: row.points,
    houseHead: row.house_head,
    topScorers: (() => { try { return JSON.parse(row.top_scorers || '[]'); } catch { return []; } })(),
    description: row.description,
    icon: row.icon,
    imageUrl: row.image_url,
    createdAt: row.created_at
  };
}

export function dbMemoryCertificateToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    userId: row.user_id,
    studentName: row.student_name,
    house: row.house,
    classYear: row.class_year,
    documentNumber: row.document_number,
    issueDate: row.issue_date,
    finalEvaluation: row.final_evaluation,
    subjectsGrades: (() => { try { return JSON.parse(row.subjects_grades || '[]'); } catch { return []; } })(),
    examResults: (() => { try { return JSON.parse(row.exam_results || '[]'); } catch { return []; } })(),
    averageScore: row.average_score,
    authorityName: row.authority_name,
    authorityTitle: row.authority_title,
    sealType: row.seal_type,
    visibility: row.visibility,
    createdAt: row.created_at
  };
}

export function dbMemoryDiplomaToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    userId: row.user_id,
    recipientName: row.recipient_name,
    house: row.house,
    category: row.category,
    title: row.title,
    place: row.place,
    description: row.description,
    issuer: row.issuer,
    date: row.date,
    badgeIcon: row.badge_icon,
    imageUrl: row.image_url,
    visibility: row.visibility,
    createdAt: row.created_at
  };
}

export function dbMemoryAwardToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    userId: row.user_id,
    recipientName: row.recipient_name,
    house: row.house,
    awardType: row.award_type,
    title: row.title,
    description: row.description,
    icon: row.icon,
    visibility: row.visibility,
    createdAt: row.created_at
  };
}

export function dbMemoryRankingToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    rankingType: row.ranking_type,
    standings: (() => { try { return JSON.parse(row.standings || '[]'); } catch { return []; } })(),
    snapshotDate: row.snapshot_date,
    createdAt: row.created_at
  };
}

export function dbMemoryPlebisciteToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    title: row.title,
    edition: row.edition,
    description: row.description,
    categories: (() => { try { return JSON.parse(row.categories || '[]'); } catch { return []; } })(),
    createdAt: row.created_at
  };
}

export function dbMemoryChronicleToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    title: row.title,
    category: row.category,
    date: row.date,
    description: row.description,
    results: (() => { try { return JSON.parse(row.results || '[]'); } catch { return []; } })(),
    linkedDiplomaIds: (() => { try { return JSON.parse(row.linked_diploma_ids || '[]'); } catch { return []; } })(),
    tags: (() => { try { return JSON.parse(row.tags || '[]'); } catch { return []; } })(),
    imageUrl: row.image_url,
    orderIndex: row.order_index,
    createdAt: row.created_at
  };
}

export function dbMemoryGazetteToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    editorInChief: row.editor_in_chief,
    editorialStaff: (() => { try { return JSON.parse(row.editorial_staff || '[]'); } catch { return []; } })(),
    issuesCount: row.issues_count,
    issuesLinks: (() => { try { return JSON.parse(row.issues_links || '[]'); } catch { return []; } })(),
    createdAt: row.created_at
  };
}

export function dbMemoryCustomAchievementToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolYearId: row.school_year_id,
    title: row.title,
    recipientName: row.recipient_name,
    house: row.house,
    description: row.description,
    category: row.category,
    date: row.date,
    imageUrl: row.image_url,
    icon: row.icon,
    createdAt: row.created_at
  };
}

// ==================== IZBA PRZYJĘĆ — SERIALIZERS ====================

export function dbAbsenceRequestToFrontend(row, lessons = []) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    house: row.house || '',
    classYear: row.class_year || '',
    type: row.type,
    startAt: row.start_at,
    endAt: row.end_at,
    reason: row.reason,
    extraInfo: row.extra_info || '',
    status: row.status,
    reviewComment: row.review_comment || '',
    reviewedBy: row.reviewed_by || '',
    reviewedByName: row.reviewed_by_name || '',
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at || '',
    schoolYear: row.school_year || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lessons
  };
}

export function dbAbsenceRequestLessonToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    requestId: row.request_id,
    lessonId: row.lesson_id || '',
    timetableEntryId: row.timetable_entry_id || '',
    subjectId: row.subject_id || '',
    subjectName: row.subject_name || '',
    professorId: row.professor_id || '',
    professorName: row.professor_name || '',
    lessonDate: row.lesson_date || '',
    lessonStart: row.lesson_start || '',
    lessonEnd: row.lesson_end || '',
    participantId: row.participant_id || ''
  };
}

export function dbParticipantToFrontendWithExcuse(row) {
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
    role: row.role || 'student',
    excuseStatus: row.excuse_status || null,
    excuseRequestId: row.excuse_request_id || ''
  };
}
