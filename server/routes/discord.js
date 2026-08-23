import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { dbLessonToFrontend, dbMessageToFrontend, dbParticipantToFrontend } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

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
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

const router = express.Router();

// Active in-memory session tracking for live threads
let activeSessions = new Map();

// GET /api/discord/status - Status bota i aktywnych sesji
router.get('/status', (req, res) => {
  try {
    const botConfig = db.prepare('SELECT * FROM discord_bot_config LIMIT 1').get() || {
      id: 'bot-default',
      is_active: 1,
      guild_id: '112233445566778899',
      lessons_channel_id: '998877665544332211'
    };

    const activeList = Array.from(activeSessions.values());

    res.json({
      botActive: !!botConfig.is_active,
      guildId: botConfig.guild_id,
      lessonsChannelId: botConfig.lessons_channel_id,
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
    const { botToken, guildId, lessonsChannelId, isActive } = req.body;
    db.prepare(`
      UPDATE discord_bot_config 
      SET bot_token = COALESCE(?, bot_token),
          guild_id = COALESCE(?, guild_id),
          lessons_channel_id = COALESCE(?, lessons_channel_id),
          is_active = COALESCE(?, is_active),
          updated_at = datetime('now')
      WHERE id = 'bot-default'
    `).run(botToken || null, guildId || null, lessonsChannelId || null, isActive !== undefined ? (isActive ? 1 : 0) : null);

    res.json({ success: true, message: 'Zaktualizowano konfigurację bota Discord.' });
  } catch (err) {
    console.error('[API /discord/config] Błąd:', err);
    res.status(500).json({ error: 'Nie udało się zapisać konfiguracji bota.' });
  }
});

// POST /api/discord/start-lesson - Komenda: /lekcja rozpocznij
router.post('/start-lesson', (req, res) => {
  try {
    const {
      threadId = `thread-${Date.now()}`,
      threadName = 'Wątek Lekcji',
      channelId = 'chan-lekcje-1',
      guildId = 'guild-durmstrang-1294',
      professorName = 'Prof. Astrid Vinter',
      professorId = 'usr-astrid-vinter',
      professorAvatar = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      subjectId = 'eliksiry',
      subjectName = 'Eliksiry i Destylacja Soli',
      classYear = 'Klasa II',
      topic = 'Właściwości Eliksiru Wiggenowego'
    } = req.body;

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
      authorName: 'Cytadela Bot',
      authorDisplayName: 'Cytadela Bot [SYSTEM]',
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
          footer: { text: 'Cytadela Durmstrang • Rejestrator Wątków Dydaktycznych' },
          timestamp: new Date().toISOString()
        }
      ],
      reactions: [{ emoji: '🔥', count: 1, users: ['Cytadela Bot'] }],
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
router.post('/post-message', (req, res) => {
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

    let session = activeSessions.get(threadId);
    if (!session) {
      // Auto create or grab first active session
      if (activeSessions.size > 0) {
        session = activeSessions.values().next().value;
      } else {
        // Create an active fallback session
        session = {
          lessonId: `les-${Date.now()}`,
          threadId: threadId || `thread-live-${Date.now()}`,
          threadName: 'Wątek Dydaktyczny',
          channelId: 'chan-lekcje',
          guildId: 'guild-durmstrang-1294',
          threadUrl: 'https://discord.com/channels/guild-durmstrang-1294/chan-lekcje/thread',
          professorName: 'Prof. Astrid Vinter',
          professorId: 'usr-astrid-vinter',
          professorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
          subjectId: 'eliksiry',
          subjectName: 'Eliksiry i Destylacja Soli',
          classYear: 'Klasa II',
          topic: 'Zajęcia Praktyczne',
          startedAt: new Date().toISOString(),
          messages: [],
          participants: new Map()
        };
        activeSessions.set(session.threadId, session);
      }
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
router.post('/upload-attachment', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak przesłanego pliku.' });
    }

    const { authorName = 'Adept', originalUrl = '' } = req.body;
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
router.post('/end-lesson', (req, res) => {
  try {
    const { threadId } = req.body;

    let session = activeSessions.get(threadId);
    if (!session && activeSessions.size > 0) {
      session = activeSessions.values().next().value;
    }

    if (!session) {
      return res.status(400).json({
        error: 'Nie znaleziono aktywnej sesji lekcyjnej dla podanego wątku.'
      });
    }

    // 1. Create lesson in SQLite database with status 'draft'
    const lessonId = session.lessonId;
    const participantsList = Array.from(session.participants.values());

    // If no participants were tracked dynamically, seed defaults
    if (participantsList.length === 0) {
      participantsList.push(
        { studentId: 'usr-valdemar', studentName: 'Valdemar Krag-Hansen', house: 'ravnheim', isPresent: true, pointsAwarded: 15, comment: 'Udział w dyskusji', role: 'student' },
        { studentId: 'usr-erik', studentName: 'Erik Nilsen', house: 'bjornhall', isPresent: true, pointsAwarded: 10, comment: 'Aktywny udział', role: 'student' },
        { studentId: 'usr-astrid-stud', studentName: 'Astrid Vinter', house: 'reinhall', isPresent: true, pointsAwarded: 10, comment: 'Prawidłowe odpowiedzi', role: 'student' }
      );
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

export default router;
