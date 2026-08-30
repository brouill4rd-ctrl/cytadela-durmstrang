/**
 * Jednorazowa rejestracja komend obu aplikacji Discord.
 * Bot questów otrzymuje pusty zestaw komend, a Nerida wszystkie komendy szkolne.
 */
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { neridaDiscordBot, questDiscordBot } from './discordBot.js';

const registrations = [
  {
    bot: questDiscordBot,
    token: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID
  },
  {
    bot: neridaDiscordBot,
    token: process.env.NERIDA_DISCORD_BOT_TOKEN || process.env.DISCORD_NERIDA_BOT_TOKEN,
    clientId: process.env.NERIDA_DISCORD_CLIENT_ID || process.env.DISCORD_NERIDA_CLIENT_ID
  }
];

let registeredBots = 0;

for (const { bot, token, clientId } of registrations) {
  if (!token || !clientId) {
    console.warn(`⚠️ [${bot.name}] Pominięto — brak tokenu lub Client ID.`);
    continue;
  }

  try {
    const commands = bot.getSlashCommands().map(command => command.toJSON());
    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`✅ [${bot.name}] Zarejestrowano ${commands.length} komend globalnych.`);
    registeredBots += 1;
  } catch (error) {
    console.error(`❌ [${bot.name}] Błąd rejestracji:`, error.message);
    process.exitCode = 1;
  }
}

if (registeredBots === 0) {
  console.error('❌ Nie znaleziono kompletnej konfiguracji żadnego bota.');
  process.exitCode = 1;
}
