/**
 * Jednorazowy skrypt rejestracji slash commands w Discord API.
 * Uruchom: node server/register-commands.js
 * Wymaga DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID w .env
 */

import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder, ChannelType } from 'discord.js';

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error('❌ Brak DISCORD_BOT_TOKEN lub DISCORD_CLIENT_ID w .env');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('powitaj')
    .setDescription('Wysyła oficjalne powitanie Cytadeli Durmstrang z runiczną grafiką na kanale')
    .addUserOption(opt => opt.setName('adept').setDescription('Wskaż adepta do powitania').setRequired(false))
    .addChannelOption(opt => opt.setName('kanal').setDescription('Kanał docelowy').setRequired(false)),

  new SlashCommandBuilder()
    .setName('lekcja')
    .setDescription('Zarządzanie sesją lekcyjną w wątku Cytadeli Durmstrang')
    .addSubcommand(sub =>
      sub.setName('rozpocznij')
        .setDescription('Rozpoczyna oficjalną sesję lekcyjną w wątku')
        .addStringOption(opt => opt.setName('przedmiot').setDescription('Nazwa Katedry / Przedmiotu').setRequired(true))
        .addStringOption(opt => opt.setName('klasa').setDescription('Klasa (np. Klasa I)').setRequired(true))
        .addStringOption(opt => opt.setName('temat').setDescription('Temat lekcji').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('zakoncz')
        .setDescription('Kończy lekcję, archiwizuje wątek i tworzy szkic Dziennika')
    ),

  new SlashCommandBuilder()
    .setName('eksport')
    .setDescription('Eksportuje cały wątek Discord do Dziennika na portalu Cytadeli')
    .addChannelOption(opt =>
      opt.setName('watek')
        .setDescription('Wątek Discord do eksportu (wpisz # i wybierz z listy)')
        .setRequired(true)
        .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
    ),

  new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Uruchomienie błyskawicznego pytania quizowego Katedry')
    .addStringOption(opt => opt.setName('pytanie').setDescription('Treść pytania').setRequired(true))
    .addStringOption(opt => opt.setName('opcja_a').setDescription('Wariant A').setRequired(true))
    .addStringOption(opt => opt.setName('opcja_b').setDescription('Wariant B').setRequired(true))
    .addStringOption(opt => opt.setName('opcja_c').setDescription('Wariant C').setRequired(false)),

  new SlashCommandBuilder()
    .setName('pytanie')
    .setDescription('Zadanie oficjalnego pytania do sali z pulą punktów')
    .addStringOption(opt => opt.setName('tresc').setDescription('Treść pytania').setRequired(true))
    .addIntegerOption(opt => opt.setName('punkty').setDescription('Liczba punktów').setRequired(false)),

  new SlashCommandBuilder()
    .setName('zaklecie')
    .setDescription('Manifestacja zaklęcia lub formuły runicznej')
    .addStringOption(opt => opt.setName('formula').setDescription('Inkantacja lub formuła runiczna').setRequired(true)),

  new SlashCommandBuilder()
    .setName('losowanie')
    .setDescription('Losowanie adepta do odpowiedzi')
    .addStringOption(opt =>
      opt.setName('zakon')
        .setDescription('Ogranicz do konkretnego Zakonu')
        .addChoices(
          { name: '🦌 Reinhall', value: 'reinhall' },
          { name: '🐻 Björnhall', value: 'bjornhall' },
          { name: '🐦 Ravnheim', value: 'ravnheim' },
          { name: '🦦 Otergard', value: 'otergard' }
        )
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('weryfikuj')
    .setDescription('Weryfikacja tożsamości kodem z portalu Cytadeli Durmstrang')
    .addStringOption(opt => opt.setName('kod').setDescription('Runiczny kod weryfikacyjny (np. DURM-XXXX)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('synchronizuj')
    .setDescription('Ponowna synchronizacja ról i pseudonimu z profilem w Cytadeli'),

  new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Wyświetla kartę adepta, Zakon, rangę i punkty z Cytadeli Durmstrang'),

  new SlashCommandBuilder()
    .setName('odlacz')
    .setDescription('Odłącza powiązane konto Discord od profilu w Cytadeli'),
];

const rest = new REST({ version: '10' }).setToken(token);
const body = commands.map(c => c.toJSON());

try {
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
    console.log(`✅ Zarejestrowano ${commands.length} komend na serwerze (natychmiast aktywne).`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log(`✅ Zarejestrowano ${commands.length} komend globalnie (może czekać do 1h).`);
  }
} catch (err) {
  console.error('❌ Błąd rejestracji:', err.message);
  process.exit(1);
}
