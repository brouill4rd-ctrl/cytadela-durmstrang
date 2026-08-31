/**
 * Usuwa komendy slash wybranej aplikacji Discord.
 *
 * Użycie:
 *   node server/clear-discord-commands.js quest
 *   node server/clear-discord-commands.js nerida
 *   node server/clear-discord-commands.js all
 */
import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const target = String(process.argv[2] || '').trim().toLowerCase();
const allowedTargets = new Set(['quest', 'nerida', 'all']);

if (!allowedTargets.has(target)) {
  console.error('Podaj bota do wyczyszczenia: quest, nerida albo all.');
  console.error('Przykład: node server/clear-discord-commands.js quest');
  process.exit(1);
}

const guildId = String(process.env.DISCORD_GUILD_ID || '').trim();
const bots = [
  {
    key: 'quest',
    name: 'Bot Questów Durmstrang',
    token: String(process.env.DISCORD_BOT_TOKEN || '').trim(),
    clientId: String(process.env.DISCORD_CLIENT_ID || '').trim()
  },
  {
    key: 'nerida',
    name: 'Nerida Vulchanova',
    token: String(process.env.NERIDA_DISCORD_BOT_TOKEN || process.env.DISCORD_NERIDA_BOT_TOKEN || '').trim(),
    clientId: String(process.env.NERIDA_DISCORD_CLIENT_ID || process.env.DISCORD_NERIDA_CLIENT_ID || '').trim()
  }
];

const selectedBots = target === 'all'
  ? bots
  : bots.filter(bot => bot.key === target);

let failed = false;

for (const bot of selectedBots) {
  if (!bot.token || !bot.clientId) {
    console.error(`❌ [${bot.name}] Brak tokenu lub Client ID w pliku .env.`);
    failed = true;
    continue;
  }

  try {
    const rest = new REST({ version: '10' }).setToken(bot.token);

    await rest.put(Routes.applicationCommands(bot.clientId), { body: [] });
    console.log(`✅ [${bot.name}] Usunięto komendy globalne.`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(bot.clientId, guildId), { body: [] });
      console.log(`✅ [${bot.name}] Usunięto komendy z serwera ${guildId}.`);
    } else {
      console.warn(`⚠️ [${bot.name}] Brak DISCORD_GUILD_ID — nie wyczyszczono komend serwerowych.`);
    }
  } catch (error) {
    console.error(`❌ [${bot.name}] Nie udało się wyczyścić komend: ${error.message}`);
    failed = true;
  }
}

if (failed) process.exitCode = 1;
