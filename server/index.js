import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './db.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import emailsRoutes from './routes/emails.js';
import newsRoutes from './routes/news.js';
import adminRoutes from './routes/admin.js';
import lessonsRoutes from './routes/lessons.js';
import discordRoutes from './routes/discord.js';
import subjectsRoutes from './routes/subjects.js';
import timetableRoutes from './routes/timetable.js';
import bankRoutes from './routes/bank.js';
import marketRoutes from './routes/market.js';
import lotteryRoutes from './routes/lottery.js';
import documentsRoutes from './routes/documents.js';
import cmsRoutes from './routes/cms.js';
import eventsRoutes from './routes/events.js';
import questsRoutes from './routes/quests.js';
import secretsRoutes from './routes/secrets.js';
import workshopRoutes from './routes/workshop.js';
import homeworkRoutes from './routes/homework.js';
import ravenRoutes from './routes/raven.js';
import gazetteRoutes from './routes/gazette.js';
import examsRoutes from './routes/exams.js';
import memoryRoutes from './routes/memory.js';
import worldRoutes from './routes/world.js';
import prologueRoutes from './routes/prologue.js';
import beltRoutes from './routes/belt.js';
import ordersRoutes from './routes/orders.js';
import absencesRoutes from './routes/absences.js';
import enrollmentsRoutes from './routes/enrollments.js';
import emailPreviewRoutes from './routes/emailPreview.js';
import housesRoutes from './routes/houses.js';
import locationsRoutes from './routes/locations.js';
import ceremonyRoutes from './routes/ceremony.js';
import oracleRoutes from './routes/oracle.js';
import shootingRangeRoutes from './routes/shootingRange.js';
import dungeonEscapeRoutes from './routes/dungeonEscape.js';
import hnefataflRoutes from './routes/hnefatafl.js';
import runicDuelsRoutes from './routes/runicDuels.js';
import fishingRoutes from './routes/fishing.js';
import bestiaryRoutes from './routes/bestiary.js';
import { discordBot } from './discordBot.js';
import { initPointsService, recalculateAllUserPoints, backfillSchoolYear } from './services/pointsService.js';
import { initSkirnirService, recalculateAllBalances } from './services/skirnirService.js';
import { initDungeonEscapeService } from './services/dungeonEscapeService.js';
import { initRunicDuelService } from './services/runicDuelService.js';
import { initBestiaryService } from './services/bestiaryService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize central ledger services (runs migrations)
initPointsService(db);
initSkirnirService(db);
initDungeonEscapeService(db);
initRunicDuelService(db);
initBestiaryService(db);

// Sync caches with ledger (source of truth)
backfillSchoolYear();
recalculateAllUserPoints();
recalculateAllBalances();
const distPath = path.join(__dirname, '..', 'dist');
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Allowed CORS origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173', 'http://localhost:3000'];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for local networks
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static files for uploads (lesson images, attachments)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/quests', questsRoutes);
app.use('/api/secrets', secretsRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/raven', ravenRoutes);
app.use('/api/gazette', gazetteRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/world', worldRoutes);
app.use('/api/prologue', prologueRoutes);
app.use('/api/belt', beltRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/absences', absencesRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/email-preview', emailPreviewRoutes);
app.use('/api/houses', housesRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/ceremony', ceremonyRoutes);
app.use('/api/oracle', oracleRoutes);
app.use('/api/shooting-range', shootingRangeRoutes);
app.use('/api/dungeon-escape', dungeonEscapeRoutes);
app.use('/api/hnefatafl', hnefataflRoutes);
app.use('/api/runic-duels', runicDuelsRoutes);
app.use('/api/fishing', fishingRoutes);
app.use('/api/bestiary', bestiaryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Cytadela Durmstrang — Backend API & Lesson Journals System',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Production: Serve React frontend build from dist folder
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback for client-side routing (HTML5 history)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Initialize Discord Bot
discordBot.initialize().catch(err => {
  console.warn('[Discord Bot] Błąd inicjalizacji:', err.message);
});

// Start server
const server = app.listen(PORT, () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════════════════════╗');
  console.log('  ║  🏰 CYTADELA DURMSTRANG — DZIENNIKI LEKCYJNE & API    ║');
  console.log('  ║                                                        ║');
  console.log(`  ║  API:      http://localhost:${PORT}/api                   ║`);
  console.log(`  ║  UPLOADS:  http://localhost:${PORT}/uploads               ║`);
  console.log('  ║  DB:       server/durmstrang.db (SQLite)               ║');
  console.log('  ║  DISCORD:  Rejestrator Wątków & Slash Commands         ║');
  console.log(`  ║  FRONTEND: ${fs.existsSync(distPath) ? 'Serwowany z dist/ (Produkcja)' : 'Vite Dev (http://localhost:5173)'}      ║`);
  console.log('  ╚════════════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Otrzymano sygnał ${signal}. Bezpieczne zamykanie serwera...`);
  try {
    discordBot.stop();
  } catch (_) {}

  server.close(() => {
    try {
      db.close();
      console.log('[SQLite] Połączenie z bazą danych zamknięte bezpiecznie.');
    } catch (_) {}
    console.log('[Server] Proces zakończony pomyślnie.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
