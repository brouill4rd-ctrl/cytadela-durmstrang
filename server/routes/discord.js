import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { dbLessonToFrontend, dbMessageToFrontend, dbParticipantToFrontend, dbRoleMappingToFrontend, dbVerificationToFrontend, dbUserToFrontend, isProfessorOfSubject } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { discordBot, neridaDiscordBot, questDiscordBot, sendWelcomeToGuild } from '../discordBot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'lessons');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer storage for lesson attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${cleanName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']);
    const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowedMime.has(file.mimetype) || !allowedExt.has(ext)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
    }
    cb(null, true);
  }
});

const router = express.Router();

const getDiscordInviteUrl = () => {
  const configuredUrl = (process.env.DISCORD_INVITE_URL || '').trim();
  if (!configuredUrl) return null;

  try {
    const inviteUrl = new URL(configuredUrl);
    const allowedHosts = new Set(['discord.gg', 'discord.com', 'www.discord.com']);
    if (inviteUrl.protocol !== 'https:' || !allowedHosts.has(inviteUrl.hostname.toLowerCase())) return null;
    return inviteUrl.toString();
  } catch {
    return null;
  }
};

// Active in-memory session tracking for live threads
let activeSessions = new Map();

// Public recruitment gateway. The invitation remains server-configured so it can
// be rotated without rebuilding the portal and is never duplicated in the UI.
router.get('/invite', (_req, res) => {
  const inviteUrl = getDiscordInviteUrl();
  if (!inviteUrl) {
    return res.status(503).send('Zaproszenie do Twierdzy nie zostało jeszcze skonfigurowane.');
  }

  return res.redirect(302, inviteUrl);
});

// GET /api/discord/status - Status bota i aktywnych sesji
router.get('/status', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const botConfig = db.prepare('SELECT * FROM discord_bot_config LIMIT 1').get() || {
      id: 'bot-default',
      is_active: 1,
      guild_id: '112233445566778899',
      lessons_channel_id: '998877665544332211',
      welcome_channel_id: '',
      welcome_enabled: 1
    };

    const activeList = Array.from(activeSessions.values());

    res.json({
      botActive: !!botConfig.is_active,
      questBotConnected: questDiscordBot.isReady,
      neridaConnected: neridaDiscordBot.isReady,
      guildId: botConfig.guild_id,
      lessonsChannelId: botConfig.lessons_channel_id,
      welcomeChannelId: botConfig.welcome_channel_id || '',
      welcomeEnabled: botConfig.welcome_enabled !== 0,
      activeSessionsCount: activeList.length,
      activeSessions: activeList
    });
  } catch (err) {
    console.error('[API /discord/status] Błąd statusu:', err);
    res.status(500).json({ error: 'Błąd sprawdzania statusu bota.' });
  }
});

// POST /api/discord/config - Zaktualizuj konfigurację bota (Admin)
router.post('/config', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { botToken, guildId, lessonsChannelId, welcomeChannelId, welcomeEnabled, isActive } = req.body;
    db.prepare(`
      UPDATE discord_bot_config 
      SET bot_token = COALESCE(?, bot_token),
          guild_id = COALESCE(?, guild_id),
          lessons_channel_id = COALESCE(?, lessons_channel_id),
          welcome_channel_id = COALESCE(?, welcome_channel_id),
          welcome_enabled = COALESCE(?, welcome_enabled),
          is_active = COALESCE(?, is_active),
          updated_at = datetime('now')
      WHERE id = 'bot-default'
    `).run(
      botToken || null,
      guildId || null,
      lessonsChannelId || null,
      welcomeChannelId !== undefined ? welcomeChannelId : null,
      welcomeEnabled !== undefined ? (welcomeEnabled ? 1 : 0) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null
    );

    res.json({ success: true, message: 'Zaktualizowano konfigurację bota Discord.' });
  } catch (err) {
    console.error('[API /discord/config] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się zapisać konfiguracji bota.' });
  }
});

// POST /api/discord/test-welcome - Wyślij testowe powitanie na Discord (Admin)
router.post('/test-welcome', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    if (!discordBot?.client || !discordBot.isReady) {
      return res.status(503).json({ error: 'Nerida nie jest aktualnie połączona z serwerem Discord.' });
    }

    const { channelId } = req.body;
    const guild = discordBot.client.guilds.cache.first();
    if (!guild) {
      return res.status(404).json({ error: 'Bot nie znajduje się na żadnym serwerze Discord.' });
    }

    let targetChannel = null;
    if (channelId) {
      targetChannel = guild.channels.cache.get(channelId);
    }

    const sent = await sendWelcomeToGuild(guild, null, targetChannel);
    if (!sent) {
      return res.status(500).json({ error: 'Nie udało się wysłać powitania (sprawdź uprawnienia bota).' });
    }

    res.json({ success: true, message: `Wysłano oficjalne powitanie na kanał #${sent.channel?.name || 'Discord'}` });
  } catch (err) {
    console.error('[API /discord/test-welcome] Błąd:', err);
    res.status(500).json({ error: err.message || 'Błąd wysyłania powitania.' });
  }
});

// POST /api/discord/start-lesson - Komenda: /lekcja rozpocznij
router.post('/start-lesson', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const {
      threadId = `thread-${Date.now()}`,
      threadName = 'Wątek Lekcji',
      channelId = 'chan-lekcje-1',
      guildId = 'guild-durmstrang-1294',
      professorAvatar = '',
      subjectId = 'eliksiry',
      subjectName = 'Eliksiry',
      classYear = 'Klasa II',
      topic = 'Właściwości Eliksiru Wiggenowego'
    } = req.body;
    const professorName = req.user.fullName;
    const professorId = req.user.id;
    if (req.user.role === 'professor' && !isProfessorOfSubject(req.user.id, subjectId)) {
      return res.status(403).json({ error: 'Możesz symulować wyłącznie lekcje własnego przedmiotu.' });
    }

    const lessonId = `les-${Date.now()}`;
    const threadUrl = `https://discord.com/channels/${guildId}/${channelId}/${threadId}`;

    // Create session
    const session = {
      lessonId,
      threadId,
      threadName,
      channelId,
      guildId,
      threadUrl,
      professorName,
      professorId,
      professorAvatar,
      subjectId,
      subjectName,
      classYear,
      topic,
      startedAt: new Date().toISOString(),
      messages: [],
      participants: new Map()
    };

    activeSessions.set(threadId, session);

    // Initial system start message in the thread
    const startMsg = {
      id: `msg-${Date.now()}-init`,
      discordMessageId: `dmsg-${Date.now()}-0`,
      discordUserId: 'bot-cytadela',
      authorName: 'TMD Bot',
      authorDisplayName: 'TMD Bot [SYSTEM]',
      authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      authorHouse: '',
      content: `📖 **ROZPOCZĘTO SESJĘ LEKCYJNĄ CYTADELI DURMSTRANG**\n\n**Przedmiot:** ${subjectName}\n**Klasa:** ${classYear}\n**Prowadzący:** ${professorName}\n**Temat:** ${topic}\n\n*Wszystkie wypowiedzi, załączniki, embedy i reakcje w tym wątku są automatycznie archiwizowane.*`,
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      orderIndex: 1,
      replyToId: '',
      replyToAuthor: '',
      replyToContent: '',
      isBot: true,
      isSystem: true,
      isCommand: false,
      commandData: {},
      embeds: [
        {
          title: `🏰 Rozpoczęto lekcję: ${topic}`,
          description: `Zajęcia prowadzone przez ${professorName} w Katedrze: ${subjectName}.`,
          color: '#c59f4e',
          footer: { text: 'TWIERDZA MAGII DURMSTRANG • Rejestrator Wątków Dydaktycznych' },
          timestamp: new Date().toISOString()
        }
      ],
      reactions: [{ emoji: '🔥', count: 1, users: ['TMD Bot'] }],
      attachments: []
    };

    session.messages.push(startMsg);

    res.json({
      success: true,
      message: `Rozpoczęto sesję lekcyjną w wątku #${threadName}.`,
      session: {
        lessonId,
        threadId,
        threadName,
        subjectName,
        classYear,
        topic,
        professorName,
        startedAt: session.startedAt,
        messagesCount: session.messages.length
      }
    });
  } catch (err) {
    console.error('[API /discord/start-lesson] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się rozpocząć sesji lekcyjnej.' });
  }
});

// POST /api/discord/post-message - Dodaj wiadomość do aktywnej sesji lekcyjnej
router.post('/post-message', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const {
      threadId,
      discordMessageId = `dmsg-${Date.now()}`,
      discordUserId = `usr-${Date.now()}`,
      authorName = 'Adept',
      authorDisplayName = 'Adept',
      authorAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      authorHouse = 'ravnheim',
      content = '',
      replyToId = '',
      replyToAuthor = '',
      replyToContent = '',
      isBot = false,
      isSystem = false,
      isCommand = false,
      commandData = {},
      embeds = [],
      reactions = [],
      attachments = []
    } = req.body;

    const session = activeSessions.get(threadId);
    if (!session) {
      return res.status(404).json({
        error: `Brak aktywnej sesji lekcyjnej dla wątku "${threadId}". Uruchom najpierw /lekcja rozpocznij.`
      });
    }
    if (req.user.role !== 'admin' && session.professorId !== req.user.id) {
      return res.status(403).json({ error: 'Nie możesz modyfikować sesji innego profesora.' });
    }

    const newMsg = {
      id: `msg-${Date.now()}-${session.messages.length + 1}`,
      discordMessageId,
      discordUserId,
      authorName,
      authorDisplayName: authorDisplayName || authorName,
      authorAvatar,
      authorHouse: (authorHouse || '').toLowerCase(),
      content,
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      orderIndex: session.messages.length + 1,
      replyToId,
      replyToAuthor,
      replyToContent,
      isBot: !!isBot,
      isSystem: !!isSystem,
      isCommand: !!isCommand,
      commandData,
      embeds,
      reactions,
      attachments,
      isEdited: false,
      editHistory: [],
      isDeleted: false
    };

    session.messages.push(newMsg);

    // Track participant if it's a real user (not system bot)
    if (!isBot && !isSystem) {
      if (!session.participants.has(authorName)) {
        session.participants.set(authorName, {
          studentId: discordUserId,
          studentName: authorName,
          house: (authorHouse || 'ravnheim').toLowerCase(),
          isPresent: true,
          pointsAwarded: 10,
          comment: 'Aktywny udział w wątku Discord',
          role: 'student'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Wiadomość zarchiwizowana w sesji lekcyjnej.',
      messageData: newMsg,
      totalMessagesInThread: session.messages.length
    });
  } catch (err) {
    console.error('[API /discord/post-message] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się dodać wiadomości do sesji.' });
  }
});

// POST /api/discord/upload-attachment - Zapisz fizyczny plik załącznika (zdjęcie, PDF, etc.)
router.post('/upload-attachment', requireAuth, requireRole('admin', 'professor'), upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak przesłanego pliku.' });
    }

    const { originalUrl = '' } = req.body;
    const authorName = req.user.fullName;
    const fileUrl = `/uploads/lessons/${req.file.filename}`;

    const attachment = {
      id: `att-${Date.now()}`,
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      originalUrl: originalUrl || fileUrl,
      storageUrl: fileUrl,
      width: req.file.mimetype.startsWith('image/') ? 800 : null,
      height: req.file.mimetype.startsWith('image/') ? 600 : null,
      author: authorName
    };

    res.json({
      success: true,
      attachment
    });
  } catch (err) {
    console.error('[API /discord/upload-attachment] Błąd uploadu:', err);
    res.status(500).json({ error: 'Błąd zapisu załącznika.' });
  }
});

// POST /api/discord/end-lesson - Komenda: /lekcja zakoncz (generuje szkic i link do panelu)
router.post('/end-lesson', requireAuth, requireRole('admin', 'professor'), (req, res) => {
  try {
    const { threadId } = req.body;
    const professorId = req.user.id;

    const session = activeSessions.get(threadId);
    if (!session) {
      return res.status(404).json({
        error: `Nie znaleziono aktywnej sesji lekcyjnej dla wątku "${threadId}".`
      });
    }

    if (req.user.role !== 'admin' && session.professorId && professorId !== session.professorId) {
      return res.status(403).json({
        error: 'Tylko profesor, który rozpoczął tę lekcję, może ją zakończyć.'
      });
    }

    // 1. Create lesson in SQLite database with status 'draft'
    const lessonId = session.lessonId;
    const participantsList = Array.from(session.participants.values());

    // If no participants were tracked dynamically, seed defaults
    if (participantsList.length === 0) {
      // No default participants — real session data required
    }

    const insertLesson = db.prepare(`
      INSERT INTO lessons (id, subject_id, subject_name, class_year, topic, description, professor_id, professor_name, professor_avatar, date, status, discord_thread_id, discord_channel_id, discord_guild_id, discord_thread_url, total_points, participants_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, 0, ?, datetime('now'), datetime('now'))
    `);

    insertLesson.run(
      lessonId,
      session.subjectId,
      session.subjectName,
      session.classYear,
      session.topic,
      `Zapis sesji lekcyjnej przeprowadzonej w wątku Discord #${session.threadName}. Uczestniczyło ${participantsList.length} adeptów.`,
      session.professorId,
      session.professorName,
      session.professorAvatar,
      new Date().toISOString().split('T')[0],
      session.threadId,
      session.channelId,
      session.guildId,
      session.threadUrl,
      participantsList.length
    );

    // 2. Insert participants into lesson_participants
    const insertPart = db.prepare(`
      INSERT INTO lesson_participants (id, lesson_id, student_id, student_name, house, is_present, points_awarded, comment, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of participantsList) {
      insertPart.run(
        `part-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        lessonId,
        p.studentId || null,
        p.studentName,
        p.house.toLowerCase(),
        p.isPresent ? 1 : 0,
        p.pointsAwarded || 0,
        p.comment || '',
        p.role || 'student'
      );
    }

    // 3. Insert messages into lesson_messages
    const insertMsg = db.prepare(`
      INSERT INTO lesson_messages (id, lesson_id, discord_message_id, discord_user_id, author_name, author_display_name, author_avatar, author_house, content, timestamp, order_index, reply_to_id, reply_to_author, reply_to_content, is_bot, is_system, is_command, command_data, embeds, reactions, attachments, is_edited, edit_history, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let totalAttachmentsCount = 0;
    session.messages.forEach((m, idx) => {
      const atts = m.attachments || [];
      totalAttachmentsCount += atts.length;

      insertMsg.run(
        m.id || `msg-${lessonId}-${idx + 1}`,
        lessonId,
        m.discordMessageId || `dmsg-${Date.now()}-${idx}`,
        m.discordUserId || '',
        m.authorName || 'Użytkownik',
        m.authorDisplayName || m.authorName,
        m.authorAvatar || '',
        (m.authorHouse || '').toLowerCase(),
        m.content || '',
        m.timestamp || new Date().toLocaleTimeString('pl-PL'),
        idx + 1,
        m.replyToId || '',
        m.replyToAuthor || '',
        m.replyToContent || '',
        m.isBot ? 1 : 0,
        m.isSystem ? 1 : 0,
        m.isCommand ? 1 : 0,
        JSON.stringify(m.commandData || {}),
        JSON.stringify(m.embeds || []),
        JSON.stringify(m.reactions || []),
        JSON.stringify(atts),
        m.isEdited ? 1 : 0,
        JSON.stringify(m.editHistory || []),
        m.isDeleted ? 1 : 0
      );
    });

    // Remove active session
    activeSessions.delete(session.threadId);

    const professorPanelUrl = `/dzienniki/edytor/${lessonId}`;

    const summaryEmbed = {
      title: '📖 LEKCJA ZAKOŃCZONA — Dziennik Przygotowany',
      subject: session.subjectName,
      classYear: session.classYear,
      topic: session.topic,
      stats: {
        participantsCount: participantsList.length,
        messagesCount: session.messages.length,
        attachmentsCount: totalAttachmentsCount
      },
      professorPanelUrl,
      lessonId
    };

    res.json({
      success: true,
      message: 'Lekcja zakończona. Wątek został zarchiwizowany, a szkic dziennika wygenerowany.',
      lessonId,
      summary: summaryEmbed
    });
  } catch (err) {
    console.error('[API /discord/end-lesson] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się zakończyć sesji i utworzyć szkicu dziennika.' });
  }
});

// ==================== DISCORD VERIFICATION & ROLE MANAGEMENT ====================

// Helper function to generate unique code (e.g. DURM-7K8P9)
function generateVerificationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DURM-${randomPart}`;
}

// Helper function to resolve target roles for a given user
export function resolveRolesForUser(user) {
  const mappings = db.prepare('SELECT * FROM discord_role_mappings WHERE auto_assign = 1').all();
  const matched = [];

  // 1. General verified role
  const verifiedMap = mappings.find(m => m.internal_key === 'verified');
  if (verifiedMap) matched.push(verifiedMap);

  // 2. House role (only for students — kadra/dyrekcja do not belong to Zakons)
  if (user.house && user.role === 'student') {
    const houseKey = user.house.toLowerCase();
    const houseMap = mappings.find(m => m.category === 'house' && m.internal_key === houseKey);
    if (houseMap) matched.push(houseMap);
  }

  // 3. User rank / role
  if (user.role) {
    const roleKey = user.role.toLowerCase();
    const roleMap = mappings.find(m => m.category === 'role' && m.internal_key === roleKey);
    if (roleMap) matched.push(roleMap);
  }

  // 4. Class Year (only for students)
  if (user.role === 'student' && (user.class_year || user.classYear)) {
    const cy = (user.class_year || user.classYear).toLowerCase();
    let classKey = '';
    if (cy.includes('1') || /klasa\s*i(?!i)/i.test(cy)) classKey = 'klasa_1';
    else if (cy.includes('2') || /klasa\s*ii(?!i)/i.test(cy)) classKey = 'klasa_2';
    else if (cy.includes('3') || /klasa\s*iii/i.test(cy)) classKey = 'klasa_3';
    else if (cy.includes('4') || /klasa\s*iv/i.test(cy)) classKey = 'klasa_4';

    if (classKey) {
      const classMap = mappings.find(m => m.category === 'class_year' && m.internal_key === classKey);
      if (classMap) matched.push(classMap);
    }
  }

  return matched;
}

// POST /api/discord/verification/generate - Wygeneruj kod dla zalogowanego adepta
router.post('/verification/generate', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const force = !!req.body.force;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie istnieje w bazie Cytadeli.' });
    }

    // Sprawdź czy jest już aktywny niewygasły kod (tylko gdy nie wymuszono nowego)
    if (!force) {
      const existing = db.prepare(`
        SELECT * FROM discord_verifications
        WHERE user_id = ? AND status = 'pending' AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ORDER BY created_at DESC LIMIT 1
      `).get(userId);

      if (existing) {
        return res.json({
          success: true,
          code: existing.code,
          expiresAt: existing.expires_at,
          message: 'Aktywny kod weryfikacyjny został pobrany.',
          verification: dbVerificationToFrontend(existing)
        });
      }
    }

    // Unieważnij poprzednie oczekujące kody
    db.prepare("UPDATE discord_verifications SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'").run(userId);

    // Wygeneruj nowy kod ważny 20 minut
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const id = `verif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    db.prepare(`
      INSERT INTO discord_verifications (id, code, user_id, username, full_name, role, house, class_year, status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      id,
      code,
      user.id,
      user.username,
      user.full_name,
      user.role,
      user.role === 'student' ? (user.house || '') : '',
      user.role === 'student' ? (user.class_year || '') : '',
      expiresAt
    );

    const newVerif = db.prepare('SELECT * FROM discord_verifications WHERE id = ?').get(id);

    res.json({
      success: true,
      code,
      expiresAt,
      message: 'Wygenerowano nowy runiczny kod weryfikacyjny.',
      verification: dbVerificationToFrontend(newVerif)
    });
  } catch (err) {
    console.error('[API /discord/verification/generate] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się wygenerować kodu weryfikacyjnego.' });
  }
});

// GET /api/discord/verification/status - Status połączenia i aktywny kod
router.get('/verification/status', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika.' });

    const activeVerification = db.prepare(`
      SELECT * FROM discord_verifications 
      WHERE user_id = ? AND status = 'pending' AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      ORDER BY created_at DESC LIMIT 1
    `).get(userId);

    const lastCompleted = db.prepare(`
      SELECT * FROM discord_verifications 
      WHERE user_id = ? AND status = 'verified'
      ORDER BY verified_at DESC LIMIT 1
    `).get(userId);

    const isConnected = Boolean(user.discord_id);
    const assignedRoles = JSON.parse(user.discord_roles || '[]');
    const expectedRoles = resolveRolesForUser(user).map(r => r.role_label || r.discord_role_name);

    res.json({
      isConnected,
      discordId: user.discord_id || '',
      discordUsername: user.discord_username || '',
      discordAvatar: user.discord_avatar || '',
      discordVerifiedAt: user.discord_verified_at || '',
      assignedRoles,
      expectedRoles,
      activeCode: activeVerification ? activeVerification.code : null,
      activeCodeExpiresAt: activeVerification ? activeVerification.expires_at : null,
      verification: activeVerification ? dbVerificationToFrontend(activeVerification) : (lastCompleted ? dbVerificationToFrontend(lastCompleted) : null)
    });
  } catch (err) {
    console.error('[API /discord/verification/status] Błąd:', err);
    res.status(500).json({ error: 'Błąd pobierania statusu weryfikacji.' });
  }
});

// POST /api/discord/verification/verify-manual - Ręczna / symulowana weryfikacja (działa dla bota i testów w UI)
router.post('/verification/verify-manual', requireAuth, (req, res) => {
  try {
    const { code, discordUserId = '112233445566778899', discordUsername = 'Adept#1294', discordAvatar = '' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Wymagany jest kod weryfikacyjny (np. DURM-XXXX).' });
    }

    const cleanCode = code.trim().toUpperCase();
    const verif = db.prepare(`
      SELECT * FROM discord_verifications 
      WHERE code = ? AND status = 'pending' AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    `).get(cleanCode);

    if (!verif) {
      return res.status(404).json({ error: 'Nieprawidłowy, wykorzystany lub przedawniony kod weryfikacyjny.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(verif.user_id);
    if (!user) {
      return res.status(404).json({ error: 'Nie znaleziono adepta powiązanego z tym kodem.' });
    }
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Kod należy do innego użytkownika.' });
    }

    const rolesToAssign = resolveRolesForUser(user);
    const assignedRoleNames = rolesToAssign.map(r => r.discord_role_name || r.role_label);

    const now = new Date().toISOString();

    // 1. Zaktualizuj użytkownika
    db.prepare(`
      UPDATE users 
      SET discord_id = ?, discord_username = ?, discord_avatar = ?, discord_roles = ?, discord_verified_at = ?
      WHERE id = ?
    `).run(
      discordUserId,
      discordUsername,
      discordAvatar || user.avatar || '',
      JSON.stringify(assignedRoleNames),
      now,
      user.id
    );

    // 2. Zaktualizuj rekord weryfikacji
    db.prepare(`
      UPDATE discord_verifications 
      SET status = 'verified', discord_user_id = ?, discord_username = ?, assigned_roles = ?, verified_at = ?
      WHERE id = ?
    `).run(
      discordUserId,
      discordUsername,
      JSON.stringify(assignedRoleNames),
      now,
      verif.id
    );

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

    res.json({
      success: true,
      message: `Konto ${user.full_name} zostało pomyślnie powiązane z kontem Discord ${discordUsername}!`,
      user: dbUserToFrontend(updatedUser),
      assignedRoles: assignedRoleNames,
      rolesResolved: rolesToAssign.map(dbRoleMappingToFrontend)
    });
  } catch (err) {
    console.error('[API /discord/verification/verify-manual] Błąd:', err);
    res.status(500).json({ error: 'Wystąpił błąd podczas weryfikacji tożsamości.' });
  }
});

// POST /api/discord/verification/unlink - Odłączenie konta Discord
router.post('/verification/unlink', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    db.prepare(`
      UPDATE users 
      SET discord_id = '', discord_username = '', discord_avatar = '', discord_roles = '[]', discord_verified_at = ''
      WHERE id = ?
    `).run(userId);

    db.prepare("UPDATE discord_verifications SET status = 'cancelled' WHERE user_id = ?").run(userId);

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: 'Konto Discord zostało pomyślnie odłączone.',
      user: dbUserToFrontend(updatedUser)
    });
  } catch (err) {
    console.error('[API /discord/verification/unlink] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się odłączyć konta Discord.' });
  }
});

// POST /api/discord/verification/resync - Ponowna synchronizacja ról
router.post('/verification/resync', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });

    if (!user.discord_id) {
      return res.status(400).json({ error: 'Użytkownik nie ma powiązanego konta Discord.' });
    }

    const rolesToAssign = resolveRolesForUser(user);
    const assignedRoleNames = rolesToAssign.map(r => r.discord_role_name || r.role_label);

    db.prepare('UPDATE users SET discord_roles = ? WHERE id = ?').run(
      JSON.stringify(assignedRoleNames),
      user.id
    );

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

    res.json({
      success: true,
      message: 'Role zostały pomyślnie zsynchronizowane z profilem Cytadeli.',
      user: dbUserToFrontend(updatedUser),
      assignedRoles: assignedRoleNames
    });
  } catch (err) {
    console.error('[API /discord/verification/resync] Błąd:', err);
    res.status(500).json({ error: 'Błąd synchronizacji ról Discord.' });
  }
});

// GET /api/discord/role-mappings - Pobierz mapowania ról
router.get('/role-mappings', (req, res) => {
  try {
    const mappings = db.prepare('SELECT * FROM discord_role_mappings ORDER BY category, internal_key').all();
    res.json(mappings.map(dbRoleMappingToFrontend));
  } catch (err) {
    console.error('[API /discord/role-mappings] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się pobrać mapowania ról Discord.' });
  }
});

// POST /api/discord/role-mappings - Zaktualizuj mapowania ról (Admin)
router.post('/role-mappings', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { mappings } = req.body;
    if (!Array.isArray(mappings)) {
      return res.status(400).json({ error: 'Wymagana jest tablica mapowań ról.' });
    }

    const updateStmt = db.prepare(`
      UPDATE discord_role_mappings 
      SET discord_role_id = ?, discord_role_name = ?, color = ?, auto_assign = ?
      WHERE id = ? OR internal_key = ?
    `);

    const updateTx = db.transaction((list) => {
      for (const m of list) {
        updateStmt.run(
          m.discordRoleId || '',
          m.discordRoleName || '',
          m.color || '#c59f4e',
          m.autoAssign ? 1 : 0,
          m.id || '',
          m.internalKey || ''
        );
      }
    });

    updateTx(mappings);

    const fresh = db.prepare('SELECT * FROM discord_role_mappings ORDER BY category, internal_key').all();
    res.json({ success: true, message: 'Zaktualizowano mapowania ról Discord.', mappings: fresh.map(dbRoleMappingToFrontend) });
  } catch (err) {
    console.error('[API POST /discord/role-mappings] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się zapisać mapowań ról.' });
  }
});

// GET /api/discord/verifications - Lista weryfikacji (Admin)
router.get('/verifications', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM discord_verifications ORDER BY created_at DESC LIMIT 100').all();
    res.json(list.map(dbVerificationToFrontend));
  } catch (err) {
    console.error('[API /discord/verifications] Błąd:', err);
    res.status(500).json({ error: 'Błąd pobierania historii weryfikacji.' });
  }
});

export default router;
