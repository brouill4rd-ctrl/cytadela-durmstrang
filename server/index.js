import 'dotenv/config';
import express from 'express';
import compression from 'compression';
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
import externistRoutes from './routes/externist.js';
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
import wandFencingRoutes from './routes/wandFencing.js';
import { discordBot } from './discordBot.js';
import { initPointsService, recalculateAllUserPoints, backfillSchoolYear } from './services/pointsService.js';
import { initSkirnirService, recalculateAllBalances } from './services/skirnirService.js';
import { initDungeonEscapeService } from './services/dungeonEscapeService.js';
import { initRunicDuelService } from './services/runicDuelService.js';
import { initBestiaryService } from './services/bestiaryService.js';
import { isCorsOriginAllowed, parseCorsOrigins } from './config/security.js';
import { rateLimit } from './middleware/rateLimit.js';

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
const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Allowed CORS origins
const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

// Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  next();
});
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    callback(null, isCorsOriginAllowed(origin, allowedOrigins));
  },
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 2000, scope: 'global' }));

// Static files for uploads (lesson images, attachments)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  dotfiles: 'deny',
  fallthrough: false,
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    if (/\.(?:jpe?g|png|gif|webp|avif|svg)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath).replaceAll('"', '')}"`);
    }
  }
}));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, scope: 'auth-login' }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, scope: 'auth-register' }));
app.use('/api/auth/password-recovery', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, scope: 'password-recovery' }));
app.use('/api/homework/upload', rateLimit({ windowMs: 60 * 60 * 1000, max: 20, scope: 'homework-upload' }));
app.use('/api/discord/upload-attachment', rateLimit({ windowMs: 60 * 60 * 1000, max: 20, scope: 'discord-upload' }));
app.use('/api/gazette/analytics', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, scope: 'gazette-analytics' }));
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
app.use('/api/externist', externistRoutes);
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
app.use('/api/minigames/wand-fencing', wandFencingRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Production: Serve React frontend build from dist folder
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        // Vite hashes asset filenames — safe to cache immutably for a year
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

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
  console.log('  ║  🏰 TWIERDZA MAGII DURMSTRANG — DZIENNIKI LEKCYJNE & API    ║');
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
