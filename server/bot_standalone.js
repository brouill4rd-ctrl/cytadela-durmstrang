/**
 * Samodzielny runner obu botów Discord bez uruchamiania serwera HTTP.
 * Podział odpowiedzialności znajduje się w discordBot.js.
 */
import 'dotenv/config';
import { discordBot } from './discordBot.js';

console.log('===========================================================');
console.log('  TWIERDZA MAGII DURMSTRANG — BOT QUESTÓW + NERIDA');
console.log('===========================================================');

await discordBot.initialize();

const shutdown = (signal) => {
  console.log(`\n[Discord] Odebrano ${signal}. Zatrzymywanie obu botów...`);
  discordBot.stop();
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
