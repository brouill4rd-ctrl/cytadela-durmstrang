/**
 * TWIERDZA MAGII DURMSTRANG — OFICJALNY BOT DISCORD (DISCORD.JS v14)
 * 
 * Służy do prowadzenia lekcji na żywo na serwerze Discord Cytadeli:
 * 1. Slash commands: /lekcja rozpocznij, /lekcja zakoncz, /quiz, /pytanie, /zaklecie, /losowanie
 * 2. Archiwizacja wiadomości w wątku, autorów, domów, odpowiedzi (reply-to)
 * 3. Automatyczne pobieranie załączników (grafik, rycin) na serwer do /uploads/lessons/
 * 4. Zapisywanie szkicu dziennika (DRAFT) w SQLite durmstrang.db
 * 5. Generowanie interaktywnego podsumowania na Discordzie z linkiem do panelu profesora
 */

import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { getQuestState, submitAction, submitNarrative, approveNarrative, rejectNarrative } from './services/questService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import db from './db.js';
import { normalizeSubjectId, normalizeClassYear } from './utils.js';
import { executeLocationAction, submitLocationNarrative, approveLocationNarrative, rejectLocationNarrative } from './services/locationActionService.js';
import { buildLocationActionDefinition } from './seed/locationActionDefinitions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'lessons');

const ARXYMISTRZOW_ROLE_ID = '1540710122005733376';
const TMD_GUILD_ID = '1540707857656193104';

const DIFFICULTY_COLOR = { 'Łatwy': 0x22c55e, 'Średni': 0xf59e0b, 'Trudny': 0xf87171, 'Legendarny': 0xa78bfa, 'Arcymistrzowski': 0xa78bfa };

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Mapa aktywnych sesji lekcyjnych (threadId -> lessonSession)
export const activeLessonSessions = new Map();

// Pomocnicza funkcja pobierania załącznika z Discord CDN na lokalny dysk serwera
async function downloadDiscordAttachment(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(UPLOADS_DIR, filename);
    const fileStream = fs.createWriteStream(filePath);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(`/uploads/lessons/${filename}`);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

// Pomocnicza funkcja tworząca bogate powitanie z nordycką grafiką i przyciskami
export function buildWelcomePayload(member = null, guild = null) {
  const assetsDir = path.join(__dirname, 'assets');
  const bannerFile = path.join(assetsDir, 'durmstrang_welcome_banner.jpg');
  const crestFile = path.join(assetsDir, 'tmd_herb.png');

  const files = [];
  let hasBanner = false;
  let hasCrest = false;

  if (fs.existsSync(bannerFile)) {
    files.push(new AttachmentBuilder(bannerFile, { name: 'durmstrang_welcome_banner.jpg' }));
    hasBanner = true;
  }
  if (fs.existsSync(crestFile)) {
    files.push(new AttachmentBuilder(crestFile, { name: 'tmd_herb.png' }));
    hasCrest = true;
  }

  const memberMention = member ? (member.id ? `<@${member.id}>` : `${member}`) : 'młody adepcie';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const embed = new EmbedBuilder()
    .setColor(0xC59F4E)
    .setTitle('❄️ WITAJ W MURACH CYTADELI DURMSTRANG! 🏰')
    .setDescription(
      `> *„W krainie wiecznej zmarzliny, północnych wiatrów i pradawnych runów — siła woli i dyscyplina kształtują prawdziwych czarodziejów.”*\n\n` +
      `Niechaj północne zorze rozświetlą Twoją drogę, **${memberMention}**! Twoje przybycie na Archipelag Północy zostało odnotowane w Rocznikach Twierdzy.\n\n` +
      `Przekraczasz żelazną bramę jednej z najstarszych i najbardziej potężnych akademii magii na świecie.`
    )
    .addFields(
      {
        name: '📜 1. PIERWSZY KROK — WERYFIKACJA TOŻSAMOŚCI',
        value: 
          `Aby odblokować komnaty Katedr, barwy Zakonu i dziennik:\n` +
          `1️⃣ Zaloguj się na **[Portalu Cytadeli Durmstrang](${frontendUrl})**.\n` +
          `2️⃣ Przejdź do zakładki **Profil** i kliknij **„Połącz konto Discord”**.\n` +
          `3️⃣ Wpisz na serwerze komendę: \`/weryfikuj kod:DURM-XXXX\`\n` +
          `*(Twój Zakon, szaty, klasa i pseudonim zostaną nadane automatycznie!)*`,
        inline: false
      },
      {
        name: '🏛️ 2. CZTERY WIELKIE ZAKONY PÓŁNOCY',
        value:
          `• **🦌 Reinhall** — Spadkobiercy Jelenia *(Tradycja, Rzemiosło, Honor)*\n` +
          `• **🐻 Björnhall** — Bractwo Niedźwiedzia *(Siła, Męstwo, Wytrwałość)*\n` +
          `• **🐦 Ravnheim** — Mistrzowie Kruka *(Mądrość, Intelekt, Runy)*\n` +
          `• **🦦 Otergard** — Przymierze Wydry *(Spryt, Pasja, Zwinność)*`,
        inline: false
      },
      {
        name: '⚔️ 3. LEKCJE, RYTUAŁY I DZIENNIKI',
        value:
          `Bierz udział w lekcjach prowadzonych na żywo przez Profesorów, rzucaj zaklęcia, zdobywaj punkty i Skirniry dla swojego Domu oraz zgłębiaj prastare tajemnice!`,
        inline: false
      }
    )
    .setFooter({
      text: 'Virtus • Disciplina • Potestas | Oficjalny Bot Cytadeli Durmstrang',
      iconURL: hasCrest ? 'attachment://tmd_herb.png' : undefined
    })
    .setTimestamp();

  if (hasCrest) {
    embed.setThumbnail('attachment://tmd_herb.png');
    embed.setAuthor({
      name: 'TWIERDZA MAGII DURMSTRANG • BRAMA GŁÓWNA',
      iconURL: 'attachment://tmd_herb.png'
    });
  } else {
    embed.setAuthor({
      name: 'TWIERDZA MAGII DURMSTRANG • BRAMA GŁÓWNA'
    });
  }

  if (hasBanner) {
    embed.setImage('attachment://durmstrang_welcome_banner.jpg');
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('welcome_btn_verify_help')
      .setLabel('Jak się zweryfikować?')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📜'),
    new ButtonBuilder()
      .setCustomId('welcome_btn_houses_info')
      .setLabel('Zakony Cytadeli')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏛️'),
    new ButtonBuilder()
      .setCustomId('welcome_btn_rules_info')
      .setLabel('Kodeks Północy')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🛡️'),
    new ButtonBuilder()
      .setLabel('Portal Adepta')
      .setStyle(ButtonStyle.Link)
      .setURL(frontendUrl)
      .setEmoji('🌐')
  );

  return {
    content: member ? `❄️ **Wrota Cytadeli otwierają się przed nowym adeptem:** ${memberMention}` : `❄️ **Wrota Cytadeli Durmstrang stają otworem!**`,
    embeds: [embed],
    components: [row],
    files
  };
}

// Funkcja wysyłająca oficjalne powitanie na odpowiedni kanał serwera
export async function sendWelcomeToGuild(guild, member = null, specificChannel = null) {
  if (!guild) return null;

  let targetChannel = specificChannel;

  if (!targetChannel) {
    // 1. Sprawdź konfigurację z bazy
    const config = db.prepare('SELECT welcome_channel_id, welcome_enabled FROM discord_bot_config LIMIT 1').get();
    if (config && config.welcome_enabled === 0) {
      console.log('[Discord Bot] Powitania są wyłączone w konfiguracji.');
      return null;
    }
    if (config?.welcome_channel_id) {
      targetChannel = guild.channels.cache.get(config.welcome_channel_id);
    }
  }

  // 2. Automatyczne wykrycie kanału powitań po nazwach
  if (!targetChannel) {
    const welcomeKeywords = ['witamy', 'powitania', 'welcome', 'powitanie', 'dziedziniec', 'brama-glowna', 'brama', 'weryfikacja', 'ogólny', 'ogolny', 'general'];
    targetChannel = guild.channels.cache.find(ch => 
      ch.isTextBased() && welcomeKeywords.some(kw => ch.name.toLowerCase().includes(kw))
    );
  }

  // 3. Fallback: System channel lub pierwszy dostępny kanał tekstowy
  if (!targetChannel) {
    targetChannel = guild.systemChannel || guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(guild.members.me)?.has('SendMessages'));
  }

  if (!targetChannel) {
    console.warn('[Discord Bot] Nie odnaleziono odpowiedniego kanału tekstowego do wysłania powitania.');
    return null;
  }

  const payload = buildWelcomePayload(member, guild);
  const sent = await targetChannel.send(payload);
  console.log(`🏰 [Discord Bot] Wysłano oficjalne powitanie dla ${member ? (member.user?.tag || member.displayName || member.id) : 'nowych adeptów'} na kanale #${targetChannel.name}`);
  return sent;
}

function normalizeDiscordChannelName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function discordFieldValue(value, fallback = '—') {
  const text = String(value || '').trim() || fallback;
  return text.slice(0, 1024);
}

function getWarsawDateContext(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Warsaw',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value])
  );
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const utcDay = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  return {
    dateKey,
    dayOfWeek: utcDay === 0 ? 7 : utcDay,
    minutesSinceMidnight: Number(parts.hour) * 60 + Number(parts.minute)
  };
}

function parseDailyPostTime(value = '07:00') {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) return 7 * 60;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return 7 * 60;
  return hour * 60 + minute;
}

function resolveClassroomChannel(entry, guild) {
  // Bezpośrednie ID kanału z DB (priorytet nad fuzzy-matchem)
  if (entry.subject_id) {
    const subjectRow = db.prepare('SELECT discord_channel_id FROM subjects WHERE id = ?').get(entry.subject_id);
    const directId = subjectRow?.discord_channel_id;
    if (directId) {
      const direct = guild.channels.cache.get(directId);
      if (direct?.isTextBased?.()) return direct;
    }
  }

  const classroom = String(entry.classroom || '').trim();
  const explicitMention = /<#(\d+)>/.exec(classroom);
  if (explicitMention) return guild.channels.cache.get(explicitMention[1]) || null;

  const discordUrlChannel = /discord(?:app)?\.com\/channels\/\d+\/(\d+)/i.exec(classroom);
  if (discordUrlChannel) return guild.channels.cache.get(discordUrlChannel[1]) || null;

  const classroomName = normalizeDiscordChannelName(classroom);
  const subjectId = normalizeDiscordChannelName(entry.subject_id);
  const subjectName = normalizeDiscordChannelName(entry.subject_name);
  let bestMatch = null;
  let bestScore = 0;

  guild.channels.cache.forEach(candidate => {
    if (!candidate?.isTextBased?.() || typeof candidate.send !== 'function') return;
    const channelName = normalizeDiscordChannelName(candidate.name);
    let score = 0;
    if (classroomName && channelName === classroomName) score = 100;
    else if (classroomName && classroomName.length >= 6 && (channelName.includes(classroomName) || classroomName.includes(channelName))) score = 90;
    else if (subjectId && channelName === subjectId) score = 80;
    else if (subjectName && channelName === subjectName) score = 75;
    else if (subjectId && subjectId.length >= 5 && channelName.includes(subjectId)) score = 65;
    else if (subjectName && subjectName.length >= 5 && channelName.includes(subjectName)) score = 60;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  });

  return bestMatch;
}

function formatTimetableEntry(entry, guild) {
  const status = String(entry.status || 'scheduled').toLowerCase();
  const classroomChannel = resolveClassroomChannel(entry, guild);
  const classroom = discordFieldValue(entry.classroom, 'Sala nieprzypisana');
  const classroomDisplay = classroomChannel ? `${classroom} • <#${classroomChannel.id}>` : classroom;
  const professor = entry.resolved_professor_name || entry.professor_name || 'Nieprzypisany';
  const substitute = entry.resolved_substitute_professor_name || entry.substitute_professor_name;
  const originalProfessor = entry.original_professor_name || professor;
  const classYear = entry.class_year || 'Wszyscy';
  const topicLine = entry.topic ? `\n📖 **Temat:** ${entry.topic}` : '';

  if (status === 'cancelled') {
    return [
      '❌ **ZAJĘCIA ODWOŁANE**',
      `👤 **Nauczyciel:** ${originalProfessor}`,
      `🏛️ **Sala:** ${classroomDisplay}`,
      `🎓 **Klasa:** ${classYear}`,
      entry.cancellation_reason ? `📝 **Powód:** ${entry.cancellation_reason}` : ''
    ].filter(Boolean).join('\n');
  }

  if (status === 'substitution') {
    return [
      `🔄 **Zastępstwo:** ${substitute || 'Nauczyciel zastępujący nieprzypisany'}`,
      `↪️ **Za:** ${originalProfessor}`,
      `🏛️ **Sala:** ${classroomDisplay}`,
      `🎓 **Klasa:** ${classYear}`,
      entry.substitution_reason ? `📝 **Informacja:** ${entry.substitution_reason}` : '',
      topicLine.trim()
    ].filter(Boolean).join('\n');
  }

  return [
    `👤 **Nauczyciel:** ${professor}`,
    `🏛️ **Sala:** ${classroomDisplay}`,
    `🎓 **Klasa:** ${classYear}`,
    topicLine.trim()
  ].filter(Boolean).join('\n');
}

export function buildDailyTimetablePayload(entries = [], { dateKey, dayName, guild } = {}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const displayDate = new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const chunks = safeEntries.length > 0
    ? Array.from({ length: Math.ceil(safeEntries.length / 5) }, (_, index) => safeEntries.slice(index * 5, index * 5 + 5))
    : [[]];

  const embeds = chunks.map((chunk, index) => {
    const embed = new EmbedBuilder()
      .setColor(0xC59F4E)
      .setTitle(index === 0 ? `📅 PLAN LEKCJI • ${String(dayName || '').toUpperCase()}` : `📅 PLAN LEKCJI • ciąg dalszy (${index + 1})`)
      .setFooter({ text: `Twierdza Magii Durmstrang • ${displayDate} • czas Europe/Warsaw` })
      .setTimestamp();

    if (chunk.length === 0) {
      embed.setDescription(`Na **${displayDate}** nie zaplanowano żadnych zajęć.`);
    } else {
      embed.setDescription(`Zajęcia na **${displayDate}**. Kliknij oznaczenie kanału przy sali, aby przejść na Discordzie.`);
      embed.addFields(chunk.map(entry => ({
        name: discordFieldValue(`${entry.subject_icon || '📚'} ${entry.start_time}–${entry.end_time} • ${entry.subject_name}`, 'Zajęcia').slice(0, 256),
        value: discordFieldValue(formatTimetableEntry(entry, guild)).slice(0, 700),
        inline: false
      })));
    }
    return embed;
  });

  const frontendUrl = String(process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const components = /^https?:\/\//i.test(frontendUrl)
    ? [new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Otwórz pełny plan na stronie')
          .setStyle(ButtonStyle.Link)
          .setURL(`${frontendUrl}/#/plan`)
          .setEmoji('📜')
      )]
    : [];

  return { embeds, components, allowedMentions: { parse: [] } };
}

export function buildRecruitmentNotificationPayload(application = {}) {
  const isProfessor = application.role === 'professor';
  const houseNames = {
    reinhall: 'Reinhall',
    bjornhall: 'Björnhall',
    ravnheim: 'Ravnheim',
    otergard: 'Otergard'
  };
  const submittedAt = application.submittedAt ? new Date(application.submittedAt) : new Date();
  const timestamp = Number.isNaN(submittedAt.getTime()) ? new Date() : submittedAt;
  const unixTimestamp = Math.floor(timestamp.getTime() / 1000);
  const subjects = Array.isArray(application.requestedSubjects)
    ? application.requestedSubjects.filter(Boolean).join(', ')
    : application.requestedSubjects;

  const embed = new EmbedBuilder()
    .setColor(isProfessor ? 0x7C3AED : 0x2563EB)
    .setTitle(isProfessor ? '🧙 NOWE PODANIE PROFESORSKIE' : '📜 NOWE PODANIE UCZNIOWSKIE')
    .setDescription(
      `Do Kancelarii Rekrutacji wpłynęło nowe podanie na stanowisko **${isProfessor ? 'profesora' : 'ucznia'}**.\n` +
      `Złożono: <t:${unixTimestamp}:F> • <t:${unixTimestamp}:R>`
    )
    .addFields(
      { name: 'Kandydat', value: discordFieldValue(application.fullName), inline: true },
      { name: 'Login', value: discordFieldValue(application.username ? `\`${application.username}\`` : ''), inline: true },
      { name: 'E-mail', value: discordFieldValue(application.email), inline: true },
      { name: 'Pochodzenie', value: discordFieldValue(application.origin), inline: true },
      { name: 'Wiek', value: discordFieldValue(application.age), inline: true }
    );

  if (isProfessor) {
    embed.addFields(
      { name: 'Katedra', value: discordFieldValue(application.departmentName), inline: true },
      { name: 'Wybrane przedmioty', value: discordFieldValue(subjects || application.departmentName), inline: false },
      { name: 'Specjalizacja', value: discordFieldValue(application.specialization), inline: false },
      { name: 'Gabinet', value: discordFieldValue(application.office), inline: true }
    );
  } else {
    embed.addFields(
      { name: 'Zakon', value: discordFieldValue(houseNames[String(application.house || '').toLowerCase()] || application.house), inline: true },
      { name: 'Klasa', value: discordFieldValue(application.classYear), inline: true }
    );
  }

  embed
    .setFooter({ text: `Kancelaria Rekrutacji • ID: ${application.applicationId || 'brak'}` })
    .setTimestamp(timestamp);

  const frontendUrl = String(process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const components = /^https?:\/\//i.test(frontendUrl)
    ? [new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Otwórz panel podań')
          .setStyle(ButtonStyle.Link)
          .setURL(`${frontendUrl}/#/admin`)
          .setEmoji('🏰')
      )]
    : [];

  return { embeds: [embed], components, allowedMentions: { parse: [] } };
}

export class DurmstrangDiscordBot {
  constructor({ role = 'utility', name = 'Discord Bot' } = {}) {
    this.role = role;
    this.name = name;
    const isQuestBot = role === 'quest';
    this.token = isQuestBot
      ? (process.env.DISCORD_BOT_TOKEN || '')
      : (process.env.NERIDA_DISCORD_BOT_TOKEN || process.env.DISCORD_NERIDA_BOT_TOKEN || '');
    this.clientId = isQuestBot
      ? (process.env.DISCORD_CLIENT_ID || '')
      : (process.env.NERIDA_DISCORD_CLIENT_ID || process.env.DISCORD_NERIDA_CLIENT_ID || '');
    this.client = null;
    this.isReady = false;
    this.timetableScheduler = null;
    this.timetableCheckInProgress = false;
  }

  // Definicje komend Slash
  getSlashCommands() {
    if (this.role === 'quest') return [];
    return [
      new SlashCommandBuilder()
        .setName('powitaj')
        .setDescription('Wysyła oficjalne powitanie Cytadeli Durmstrang z runiczną grafiką na kanale')
        .addUserOption(opt => opt.setName('adept').setDescription('Wskaż adepta, którego chcesz uroczyście powitać').setRequired(false))
        .addChannelOption(opt => opt.setName('kanal').setDescription('Wskaż kanał, na którym ma pojawić się powitanie').setRequired(false)),

      new SlashCommandBuilder()
        .setName('lekcja')
        .setDescription('Zarządzanie sesją lekcyjną w wątku Cytadeli Durmstrang')
        .addSubcommand(sub =>
          sub.setName('rozpocznij')
            .setDescription('Rozpoczyna oficjalną sesję lekcyjną w wątku')
            .addStringOption(opt => opt.setName('przedmiot').setDescription('Nazwa Katedry / Przedmiotu (np. Eliksiry)').setRequired(true))
            .addStringOption(opt => opt.setName('klasa').setDescription('Klasa (np. Klasa I, Klasa II)').setRequired(true))
            .addStringOption(opt => opt.setName('temat').setDescription('Temat lekcji').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('zakoncz')
            .setDescription('Kończy lekcję, archiwizuje wątek i tworzy szkic Dziennika')
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
        .addStringOption(opt => opt.setName('tresc').setDescription('Treść pytania do adeptów').setRequired(true))
        .addIntegerOption(opt => opt.setName('punkty').setDescription('Liczba punktów dla Zakonu za odpowiedź').setRequired(false)),

      new SlashCommandBuilder()
        .setName('zaklecie')
        .setDescription('Manifestacja zaklęcia lub formuły runicznej')
        .addStringOption(opt => opt.setName('formula').setDescription('Inkantacja lub formuła runiczna').setRequired(true)),

      new SlashCommandBuilder()
        .setName('losowanie')
        .setDescription('Losowanie adepta do odpowiedzi')
        .addStringOption(opt =>
          opt.setName('zakon')
            .setDescription('Ogranicz losowanie do konkretnego Zakonu')
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
        .setDescription('Weryfikacja tożsamości adepta/profesora kodem z portalu Cytadeli Durmstrang')
        .addStringOption(opt =>
          opt.setName('kod')
            .setDescription('Runiczny kod weryfikacyjny wygenerowany w profilu (np. DURM-XXXX)')
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName('synchronizuj')
        .setDescription('Ponowna synchronizacja ról i pseudonimu z Twoim profilem w Cytadeli'),

      new SlashCommandBuilder()
        .setName('profil')
        .setDescription('Wyświetla kartę adepta, Zakon, rangę i punkty z Cytadeli Durmstrang'),

      new SlashCommandBuilder()
        .setName('odlacz')
        .setDescription('Odłącza powiązane konto Discord od profilu w Cytadeli'),

      new SlashCommandBuilder()
        .setName('pamiec')
        .setDescription('Przeglądanie oficjalnej Izby Pamięci i archiwum Twierdzy Magii Durmstrang')
        .addSubcommand(sub =>
          sub.setName('osoba')
            .setDescription('Wyświetla historyczne dossier i osiągnięcia postaci w Izbie Pamięci')
            .addStringOption(opt => opt.setName('nazwa').setDescription('Imię i nazwisko lub nick postaci').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('zakon')
            .setDescription('Wyświetla gablotę historyczną, puchary i rekordy danego Zakonu')
            .addStringOption(opt =>
              opt.setName('zakon')
                .setDescription('Wybierz Zakon')
                .addChoices(
                  { name: '🦌 Reinhall', value: 'reinhall' },
                  { name: '🐻 Björnhall', value: 'bjornhall' },
                  { name: '🐦 Ravnheim', value: 'ravnheim' },
                  { name: '🦦 Otergard', value: 'otergard' }
                )
                .setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('rok')
            .setDescription('Podsumowanie wybranego historycznego roku szkolnego')
            .addStringOption(opt => opt.setName('rok').setDescription('Kod roku (np. XVII, XVI, XV)').setRequired(true))
        )
        .addSubcommand(sub =>
          sub.setName('puchar')
            .setDescription('Wyświetla Salę Pucharów i ostatnich zdobywców Pucharu Twierdzy')
        ),

      new SlashCommandBuilder()
        .setName('eksport')
        .setDescription('Eksportuje cały wątek Discord do Dziennika na portalu Cytadeli')
        .addChannelOption(opt =>
          opt.setName('watek')
            .setDescription('Wątek Discord do eksportu (wpisz # i wybierz z listy)')
            .setRequired(true)
            .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
        )
    ];
  }

  // Inicjalizacja klienta Discord
  async initialize() {
    // 1. Sprawdź konfigurację w bazie SQLite lub zmiennych środowiskowych
    const config = db.prepare('SELECT * FROM discord_bot_config LIMIT 1').get();
    if (this.role === 'quest' && config && config.bot_token && config.bot_token !== 'BOT_TOKEN_DISCORD_DURMSTRANG_SECRET') {
      this.token = config.bot_token;
      this.clientId = config.client_id;
    }

    if (!this.token || this.token === 'BOT_TOKEN_DISCORD_DURMSTRANG_SECRET') {
      console.log('------------------------------------------------------------------');
      console.log(`🤖 [${this.name}] Status: NIEPODŁĄCZONY / API SYMULATOR`);
      console.log('💡 Aby podłączyć bota bezpośrednio do swojego serwera Discord:');
      console.log(this.role === 'quest'
        ? '   Ustaw DISCORD_BOT_TOKEN i DISCORD_CLIENT_ID w .env lub w Panelu Admina.'
        : '   Ustaw NERIDA_DISCORD_BOT_TOKEN i NERIDA_DISCORD_CLIENT_ID w .env.');
      console.log('   Symulator sesji w aplikacji działa natywnie bez zewnętrznego bota!');
      console.log('------------------------------------------------------------------');
      return;
    }

    try {
      const intents = this.role === 'quest'
        ? [GatewayIntentBits.Guilds]
        : [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildMembers
          ];
      this.client = new Client({ intents });

      this.registerEventHandlers();
      await this.client.login(this.token);
      this.isReady = true;
      console.log(`🏰 [${this.name}] Pomyślnie zalogowano jako: ${this.client.user.tag}`);
      if (this.role === 'utility') this.startDailyTimetableScheduler();

      // Rejestracja Slash Commands w Discord API
      if (this.clientId) {
        const rest = new REST({ version: '10' }).setToken(this.token);
        const commandsJson = this.getSlashCommands().map(c => c.toJSON());
        const guildId = process.env.DISCORD_GUILD_ID || config?.guild_id || this.client.guilds.cache.first()?.id;

        if (guildId) {
          // Usuń pozostałości globalne, a następnie ustaw jeden, natychmiastowy
          // zestaw komend serwerowych. Dzięki temu Discord nie pokazuje duplikatów.
          await rest.put(Routes.applicationCommands(this.clientId), { body: [] });
          await rest.put(Routes.applicationGuildCommands(this.clientId, guildId), { body: commandsJson });
          console.log(`⚡ [${this.name}] Ustawiono ${commandsJson.length} komend na serwerze ${guildId}; wyczyszczono komendy globalne.`);
        } else {
          await rest.put(Routes.applicationCommands(this.clientId), { body: commandsJson });
          console.log(`⚡ [${this.name}] Ustawiono ${commandsJson.length} komend globalnych.`);
        }
      }
    } catch (err) {
      console.error(`❌ [${this.name}] Błąd logowania bota Discord:`, err.message);
    }
  }

  // Rejestracja zdarzeń Discord.js
  registerEventHandlers() {
    if (!this.client) return;

    // 1. Obsługa Slash Commands
    this.client.on('error', (err) => {
      console.warn('[Discord Bot Client Warning]', err.message);
    });

    this.client.on('interactionCreate', async (interaction) => {
      // Obsługa interaktywnych przycisków w powitaniu
      if (interaction.isButton()) {
        try {
          if (this.role === 'quest') {
            await this._handleQuestButton(interaction).catch(err => {
              console.warn('[Quest Button Error]', err.message);
              return false;
            });
            return;
          }

          const { customId } = interaction;
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

          if (customId === 'welcome_btn_verify_help') {
            const helpEmbed = new EmbedBuilder()
              .setTitle('📜 PRZEWODNIK: WERYFIKACJA TOŻSAMOŚCI ADEPTA')
              .setDescription(
                `Połączenie konta Discord z Portalem Cytadeli Durmstrang pozwala na automatyczne nadanie barw Zakonnych, klasy, tytułu oraz synchronizację punktów i ocen.\n\n` +
                `**KROK PO KROKU:**\n` +
                `1️⃣ Otwórz stronę **[Cytadeli Durmstrang](${frontendUrl})** w przeglądarce.\n` +
                `2️⃣ Zaloguj się na swoje konto adepta lub profesora.\n` +
                `3️⃣ Przejdź do zakładki **Profil** (ikona w prawym górnym rogu lub w menu).\n` +
                `4️⃣ W sekcji **"Integracja z Discordem"** kliknij **"Połącz konto Discord"**.\n` +
                `5️⃣ System wygeneruje unikalny 20-minutowy kod runiczny (np. \`DURM-7842\`).\n` +
                `6️⃣ Wpisz na dowolnym kanale tego serwera:\n` +
                `\`\`\`\n/weryfikuj kod:DURM-XXXX\n\`\`\`\n` +
                `✨ Bot natychmiast nada Ci barwy Twojego Zakonu, rangę, szaty i ustawi oficjalny pseudonim!`
              )
              .setColor(0xC59F4E)
              .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • System Tożsamości Runicznej' });

            await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
            return;
          }

          if (customId === 'welcome_btn_houses_info') {
            const housesEmbed = new EmbedBuilder()
              .setTitle('🏛️ CZTERY WIELKIE ZAKONY CYTADELI DURMSTRANG')
              .setDescription(`Każdy adept przyjęty w mury twierdzy trafia pod pieczę jednego z czterech prastarych Zakonów Północy:`)
              .addFields(
                {
                  name: '🦌 ZAKON REINHALL (Złoto & Czerń)',
                  value: '• **Totem**: Dumny Północny Jeleń\n• **Dewiza**: *Honor, Tradycja, Rzemiosło i Niezłomność*\n• **Domena**: Alchemia, Transmutacja, Starożytne Rytuały i Mistrzostwo Formuł.',
                  inline: false
                },
                {
                  name: '🐻 ZAKON BJÖRNHALL (Morski Turkus & Stal)',
                  value: '• **Totem**: Polarny Niedźwiedź\n• **Dewiza**: *Siła, Męstwo, Odwaga i Dyscyplina Bojowa*\n• **Domena**: Obrona przed Czarną Magią, Pojedynki Czarodziejów, Hartowanie Ducha.',
                  inline: false
                },
                {
                  name: '🐦 ZAKON RAVNHEIM (Mistyczny Fiolet & Srebro)',
                  value: '• **Totem**: Kruk Północy\n• **Dewiza**: *Mądrość, Intelekt, Przenikliwość i Tajemnica*\n• **Domena**: Starożytne Runy, Wróżbiarstwo, Astronomia, Odszyfrowywanie Przeklętych Ksiąg.',
                  inline: false
                },
                {
                  name: '🦦 ZAKON OTERGARD (Karmazyn & Miedź)',
                  value: '• **Totem**: Zwinna Wydra\n• **Dewiza**: *Spryt, Zwinność, Pasja i Elastyczność*\n• **Domena**: Zielarstwo Arktyczne, Opieka nad Magicznymi Stworzeniami, Fortele.',
                  inline: false
                }
              )
              .setColor(0x2EC4B6)
              .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Cztery Totemy Północy' });

            await interaction.reply({ embeds: [housesEmbed], ephemeral: true });
            return;
          }

          if (customId === 'welcome_btn_rules_info') {
            const rulesEmbed = new EmbedBuilder()
              .setTitle('🛡️ KODEKS PÓŁNOCY — ETYKIETA I PRAWA CYTADELI')
              .setDescription(
                `W murach Durmstrangu panuje żelazny porządek i bezwzględna dyscyplina:\n\n` +
                `⚔️ **I. Posłuszeństwo i Etykieta Magiczna**\n` +
                `Słowo Profesorów i Rady Arcymistrzów jest prawem. W komnatach lekcyjnych zachowujemy ciszę i skupienie podczas inkantacji.\n\n` +
                `📖 **II. Praca na Rzecz Zakonu**\n` +
                `Punkty zdobyte w lekcjach i pojedynkach trafiają do Skarbca Twojego Domu. Nieposłuszeństwo i łamanie regulaminu skutkuje karami punktowymi.\n\n` +
                `⚡ **III. Używanie Zaklęć i Rytuałów**\n` +
                `Zaklęcia rzucamy w wyznaczonych salach ćwiczeń oraz w wątkach lekcyjnych. Zakaz niekontrolowanego rzucania uroków na korytarzach.\n\n` +
                `❄️ **IV. Szacunek dla Dziedzictwa Północy**\n` +
                `Wszyscy adepci tworzą jedną brać. Dbaj o wysoki poziom klimatu i szacunek wobec innych czarodziejów.`
              )
              .setColor(0xE63946)
              .setFooter({ text: 'Virtus • Disciplina • Potestas' });

            await interaction.reply({ embeds: [rulesEmbed], ephemeral: true });
            return;
          }

        } catch (err) {
          console.warn('[Discord Button Error]', err.message);
        }
        return;
      }

      // Obsługa modali questowych
      if (interaction.isModalSubmit()) {
        if (this.role !== 'quest') return;
        try {
          await this._handleQuestModalSubmit(interaction);
        } catch (err) {
          console.warn('[Quest Modal Error]', err.message);
        }
        return;
      }

      if (!interaction.isChatInputCommand()) return;
      if (this.role !== 'utility') return;

      try {
        const { commandName } = interaction;

        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferReply({ ephemeral: ['lekcja', 'eksport'].includes(commandName) }).catch(() => {});
        }

        // /powitaj
        if (commandName === 'powitaj') {
          const targetUser = interaction.options.getUser('adept');
          const targetChannelOption = interaction.options.getChannel('kanal');
          
          let targetMember = null;
          if (targetUser && interaction.guild) {
            try {
              targetMember = await interaction.guild.members.fetch(targetUser.id);
            } catch (_) {
              targetMember = targetUser;
            }
          } else if (!targetUser) {
            targetMember = interaction.member;
          }

          const targetChannel = targetChannelOption || interaction.channel;
          
          if (targetChannel.id !== interaction.channel.id) {
            await interaction.editReply(`🏰 Wysłano oficjalne powitanie na kanał <#${targetChannel.id}>!`);
            await sendWelcomeToGuild(interaction.guild, targetMember, targetChannel);
          } else {
            const payload = buildWelcomePayload(targetMember, interaction.guild);
            await interaction.editReply(payload);
          }
          return;
        }

        // /lekcja
        if (commandName === 'lekcja') {
          const sub = interaction.options.getSubcommand();

          if (sub === 'rozpocznij') {
            const przedmiot = interaction.options.getString('przedmiot');
            const klasa = interaction.options.getString('klasa');
            const temat = interaction.options.getString('temat');
            const threadId = interaction.channel.id;
            const professorName = interaction.member?.displayName || interaction.user.username;

            const subjectId = normalizeSubjectId(przedmiot);
            const classYear = normalizeClassYear(klasa);

            // Sprawdź czy dla tego wątku istnieje już aktywny szkic
            let existingLesson = db.prepare("SELECT id FROM lessons WHERE discord_thread_id = ? AND status = 'draft' ORDER BY created_at DESC LIMIT 1").get(threadId);
            let lessonId = existingLesson ? existingLesson.id : `les-discord-${Date.now()}`;

            if (existingLesson) {
              db.prepare(`
                UPDATE lessons SET subject_id = ?, subject_name = ?, class_year = ?, topic = ?, professor_id = ?, professor_name = ?, updated_at = datetime('now')
                WHERE id = ?
              `).run(subjectId, przedmiot, classYear, temat, interaction.user.id, professorName, lessonId);
            } else {
              db.prepare(`
                INSERT INTO lessons (id, discord_thread_id, subject_id, subject_name, class_year, topic, description, professor_id, professor_name, date, status, total_points)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0)
              `).run(
                lessonId,
                threadId,
                subjectId,
                przedmiot,
                classYear,
                temat,
                `Lekcja prowadzona w wątku #${interaction.channel.name || 'Discord'}.`,
                interaction.user.id,
                professorName,
                new Date().toISOString().split('T')[0]
              );
            }

            activeLessonSessions.set(threadId, {
              lessonId, threadId, subjectName: przedmiot, classYear, topic: temat,
              professorName, professorId: interaction.user.id, startTime: new Date().toISOString()
            });

            const publicEmbed = new EmbedBuilder()
              .setTitle('📖 TWIERDZA MAGII DURMSTRANG — ROZPOCZĘTO SESJĘ LEKCYJNĄ')
              .setDescription(`Oficjalny wątek lekcyjny Katedry został otwarty i jest archiwizowany.`)
              .addFields(
                { name: '🏛️ Katedra / Przedmiot', value: przedmiot, inline: true },
                { name: '📜 Klasa', value: classYear, inline: true },
                { name: '🧙‍♂️ Prowadzący', value: professorName, inline: true },
                { name: '✨ Temat Zajęć', value: `**${temat}**` }
              )
              .setColor(0xC59F4E)
              .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Archiwum Wątków Lekcyjnych' });

            await interaction.channel.send({ embeds: [publicEmbed] });

            await interaction.editReply({
              content: `✅ **Sesja lekcyjna rozpoczęta!**\nWątek jest teraz archiwizowany — wiadomości uczestników zapisują się automatycznie.\n\nZakończ zajęcia komendą \`/lekcja zakoncz\`.`
            });
          }

          if (sub === 'zakoncz') {
            const threadId = interaction.channel.id;

            const activeSession = activeLessonSessions.get(threadId);
            if (activeSession && activeSession.professorId && activeSession.professorId !== interaction.user.id) {
              await interaction.editReply('⛔ **Brak uprawnień.** Tylko profesor, który rozpoczął tę lekcję, może ją zakończyć.');
              return;
            }

            const lesson = db.prepare("SELECT * FROM lessons WHERE discord_thread_id = ? AND status = 'draft' ORDER BY created_at DESC LIMIT 1").get(threadId);

            if (!lesson) {
              await interaction.editReply('⚠️ Nie odnaleziono aktywnej sesji lekcyjnej w tym wątku. Uruchom najpierw `/lekcja rozpocznij`.');
              return;
            }

            const participants = db.prepare('SELECT COUNT(*) as count FROM lesson_participants WHERE lesson_id = ?').get(lesson.id);
            const messagesCount = db.prepare('SELECT COUNT(*) as count FROM lesson_messages WHERE lesson_id = ?').get(lesson.id);

            activeLessonSessions.delete(threadId);

            const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

            const publicSummaryEmbed = new EmbedBuilder()
              .setTitle('📜 SESJA LEKCYJNA ZAKOŃCZONA')
              .setDescription(`Zajęcia z **${lesson.subject_name}** zostały zakończone. Zapis wątku jest gotowy.`)
              .addFields(
                { name: 'Temat', value: lesson.topic, inline: false },
                { name: 'Wiadomości', value: `${messagesCount?.count || 0}`, inline: true },
                { name: 'Uczestnicy', value: `${participants?.count || 0}`, inline: true }
              )
              .setColor(0x10B981)
              .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Archiwum Wątków Lekcyjnych' });

            await interaction.channel.send({ embeds: [publicSummaryEmbed] });

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('Otwórz Dziennik — Panel Profesora')
                .setStyle(ButtonStyle.Link)
                .setURL(`${frontendUrl}/#/dzienniki/edytor/${lesson.id}`)
                .setEmoji('📖')
            );

            await interaction.editReply({
              content: `✅ **Lekcja zakończona!** Szkic dziennika oczekuje na weryfikację obecności i przyznanie punktów.\n**Uczestnicy:** ${participants?.count || 0} | **Wiadomości:** ${messagesCount?.count || 0}`,
              components: [row]
            });
          }
        }

        // /eksport
        if (commandName === 'eksport') {
          const targetChannel = interaction.options.getChannel('watek');
          if (!targetChannel) {
            await interaction.editReply('⚠️ Nie wskazano wątku do eksportu.');
            return;
          }

          let thread;
          try {
            thread = await interaction.guild.channels.fetch(targetChannel.id);
          } catch (e) {
            await interaction.editReply('⚠️ Nie udało się uzyskać dostępu do wskazanego wątku.');
            return;
          }

          // Paginowany fetch pełnej historii wątku
          let allMessages = [];
          let before;
          while (true) {
            const opts = { limit: 100 };
            if (before) opts.before = before;
            let batch;
            try {
              batch = await thread.messages.fetch(opts);
            } catch (e) {
              console.error('[/eksport] Błąd pobierania wiadomości:', e);
              break;
            }
            if (batch.size === 0) break;
            allMessages.push(...batch.values());
            before = batch.last()?.id;
            if (batch.size < 100) break;
          }
          allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

          // Znajdź lub utwórz rekord lekcji
          let lesson = db.prepare('SELECT * FROM lessons WHERE discord_thread_id = ? ORDER BY created_at DESC LIMIT 1').get(thread.id);
          if (!lesson) {
            const lessonId = `les-discord-export-${Date.now()}`;
            const channelName = thread.name || 'Wątek Discord';
            const professorName = interaction.member?.displayName || interaction.user.username;
            // Użyj portalu ID (nie Discord ID) żeby uprawnienia działały poprawnie
            const portalUser = db.prepare('SELECT id FROM users WHERE discord_id = ?').get(interaction.user.id);
            const professorPortalId = portalUser?.id || interaction.user.id;
            const profSubjectRow = professorPortalId
              ? (db.prepare(`SELECT subject_id FROM teacher_subject_assignments WHERE professor_id = ? AND status = 'active' LIMIT 1`).get(professorPortalId)
                 || db.prepare(`SELECT id as subject_id FROM subjects WHERE professor_id = ? LIMIT 1`).get(professorPortalId))
              : null;
            const resolvedSubjectId = profSubjectRow?.subject_id || 'inne';
            const resolvedSubjectName = resolvedSubjectId !== 'inne'
              ? (db.prepare('SELECT name FROM subjects WHERE id = ?').get(resolvedSubjectId)?.name || 'Wątek Discord')
              : 'Wątek Discord';
            db.prepare(`
              INSERT INTO lessons (id, discord_thread_id, subject_id, subject_name, class_year, topic, description, professor_id, professor_name, date, status, total_points)
              VALUES (?, ?, ?, ?, 'Klasa I', ?, ?, ?, ?, ?, 'draft', 0)
            `).run(
              lessonId, thread.id, resolvedSubjectId, resolvedSubjectName, channelName,
              `Wyeksportowany wątek Discord: #${channelName}`,
              professorPortalId, professorName,
              new Date().toISOString().split('T')[0]
            );
            lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
          }

          const guild = thread.guild;
          const existingCheck = db.prepare('SELECT id FROM lesson_messages WHERE discord_message_id = ?');
          const insertMsg = db.prepare(`
            INSERT INTO lesson_messages (
              id, lesson_id, discord_message_id, discord_user_id, author_name, author_display_name, author_avatar, author_house,
              content, timestamp, order_index, reply_to_id, reply_to_author, reply_to_content, is_bot, is_system, is_command, command_data, embeds, reactions, attachments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
          `);

          let newCount = 0;
          for (let i = 0; i < allMessages.length; i++) {
            const msg = allMessages[i];
            if (existingCheck.get(msg.id)) continue;

            let userHouse = '';
            if (!msg.author.bot) {
              let member = msg.member;
              if (!member) {
                try { member = await guild.members.fetch(msg.author.id); } catch (_) {}
              }
              const memberRoles = member?.roles?.cache?.map(r => r.name.toLowerCase()) || [];
              if (memberRoles.some(r => r.includes('bjorn') || r.includes('niedźwiedź'))) userHouse = 'bjornhall';
              else if (memberRoles.some(r => r.includes('ravn') || r.includes('kruk'))) userHouse = 'ravnheim';
              else if (memberRoles.some(r => r.includes('oter') || r.includes('wydra'))) userHouse = 'otergard';
              else if (memberRoles.some(r => r.includes('rein') || r.includes('jeleń'))) userHouse = 'reinhall';
              if (!userHouse) {
                const dbUser = db.prepare('SELECT house FROM users WHERE discord_id = ?').get(msg.author.id);
                if (dbUser?.house) userHouse = dbUser.house.toLowerCase();
              }
            }

            const localAttachments = [];
            for (const att of msg.attachments.values()) {
              try {
                const ext = path.extname(att.name) || '.png';
                const localFileName = `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
                const storageUrl = await downloadDiscordAttachment(att.url, localFileName);
                localAttachments.push({ id: `att-${Date.now()}`, name: att.name, mimeType: att.contentType || 'image/png', size: att.size, originalUrl: att.url, storageUrl, author: msg.member?.displayName || msg.author.username });
              } catch (_) {}
            }

            const formattedEmbeds = (msg.embeds || []).map(e => ({
              title: resolveMentions(e.title || '', guild),
              description: resolveMentions(e.description || '', guild),
              color: e.hexColor || '#E5C158',
              author: e.author ? { name: e.author.name || '', icon_url: e.author.iconURL || '' } : null,
              fields: (e.fields || []).map(f => ({ name: f.name || '', value: f.value || '', inline: !!f.inline })),
              footer: e.footer ? { text: e.footer.text || '' } : null,
              thumbnail: e.thumbnail ? { url: e.thumbnail.url } : null,
              image: e.image ? { url: e.image.url } : null,
              timestamp: e.timestamp || null
            }));

            const formattedReactions = [...msg.reactions.cache.values()].map(r => ({
              emoji: r.emoji.name || r.emoji.id,
              count: r.count
            }));

            const isBot = msg.author.bot ? 1 : 0;
            let isCommand = 0, commandData = '{}';
            if (msg.interactionMetadata || msg.interaction) {
              isCommand = 1;
              const meta = msg.interactionMetadata || msg.interaction;
              commandData = JSON.stringify({ name: meta.name || meta.commandName || '', author: meta.user?.username || msg.author.username });
            }

            try {
              insertMsg.run(
                `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                lesson.id, msg.id, msg.author.id,
                msg.author.username,
                msg.member?.displayName || msg.author.username,
                msg.author.displayAvatarURL?.() || '',
                userHouse,
                resolveMentions(msg.content || '', guild),
                new Date(msg.createdTimestamp).toISOString(),
                i,
                msg.reference?.messageId || '', '', '',
                isBot, isCommand, commandData,
                JSON.stringify(formattedEmbeds),
                JSON.stringify(formattedReactions),
                JSON.stringify(localAttachments)
              );
              newCount++;
            } catch (_) {}

            if (!msg.author.bot) {
              const isProfessor = lesson.professor_id === msg.author.id ||
                db.prepare('SELECT id FROM users WHERE id = ? AND discord_id = ?').get(lesson.professor_id, msg.author.id);
              if (!isProfessor) {
                const existingPart = db.prepare('SELECT id FROM lesson_participants WHERE lesson_id = ? AND student_id = ?').get(lesson.id, msg.author.id);
                if (!existingPart) {
                  try {
                    db.prepare(`INSERT INTO lesson_participants (id, lesson_id, student_id, student_name, house, is_present, points_awarded, comment) VALUES (?, ?, ?, ?, ?, 1, 10, 'Aktywny udział w wątku')`).run(
                      `part-${Date.now()}-${msg.author.id}`, lesson.id, msg.author.id,
                      msg.member?.displayName || msg.author.username, userHouse
                    );
                  } catch (_) {}
                }
              }
            }
          }
          const totalMsgs = db.prepare('SELECT COUNT(*) as c FROM lesson_messages WHERE lesson_id = ?').get(lesson.id);
          const totalParts = db.prepare('SELECT COUNT(*) as c FROM lesson_participants WHERE lesson_id = ?').get(lesson.id);
          const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

          const exportRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Otwórz Dziennik — Panel Profesora')
              .setStyle(ButtonStyle.Link)
              .setURL(`${frontendUrl}/#/dzienniki/edytor/${lesson.id}`)
              .setEmoji('📖')
          );

          await interaction.editReply({
            content: `✅ **Eksport wątku <#${thread.id}> zakończony!**\n📨 **${newCount}** nowych wiadomości zarchiwizowanych (łącznie: ${totalMsgs?.c || 0})\n👥 **${totalParts?.c || 0}** uczestników`,
            components: [exportRow]
          });
          return;
        }

        // /quiz
        if (commandName === 'quiz') {
          const q = interaction.options.getString('pytanie');
          const a = interaction.options.getString('opcja_a');
          const b = interaction.options.getString('opcja_b');
          const c = interaction.options.getString('opcja_c');

          const quizEmbed = new EmbedBuilder()
            .setTitle('⚗️ BŁYSKAWICZNY QUIZ KATEDRY')
            .setDescription(`**${q}**`)
            .addFields(
              { name: '🇦 Opcja A', value: a, inline: true },
              { name: '🇧 Opcja B', value: b, inline: true }
            )
            .setColor(0xC59F4E);

          if (c) quizEmbed.addFields({ name: '🇨 Opcja C', value: c, inline: true });

          await interaction.editReply({ embeds: [quizEmbed] });
        }

        // /pytanie
        if (commandName === 'pytanie') {
          const tresc = interaction.options.getString('tresc');
          const pts = interaction.options.getInteger('punkty') || 10;

          const qEmbed = new EmbedBuilder()
            .setTitle('❓ PYTANIE MAGISTERSKIE')
            .setDescription(tresc)
            .setFooter({ text: `Nagroda: +${pts} punktów dla Zakonu pierwszej poprawnej odpowiedzi!` })
            .setColor(0x2EC4B6);

          await interaction.editReply({ embeds: [qEmbed] });
        }

        // /zaklecie
        if (commandName === 'zaklecie') {
          const formula = interaction.options.getString('formula');
          await interaction.editReply(`⚡ *„${formula}”* — chłodne powietrze faluje, a na ścianach komnaty rozbłyskują blade nordyckie runy.`);
        }

        // /losowanie
        if (commandName === 'losowanie') {
          const zakon = interaction.options.getString('zakon');
          const houseNames = { reinhall: '🦌 Reinhall', bjornhall: '🐻 Björnhall', ravnheim: '🐦 Ravnheim', otergard: '🦦 Otergard' };
          const label = zakon ? `z Zakonu ${houseNames[zakon] || zakon}` : 'spośród wszystkich obecnych adeptów';
          await interaction.editReply(`🎲 *Kielich Przeznaczenia krąży w powietrzu...* Wylosowano adepta ${label}!`);
        }

        // ==================== OBSŁUGA WERYFIKACJI I ZARZĄDZANIA ROLAMI ====================

        // /weryfikuj
        if (commandName === 'weryfikuj') {
          const rawCode = interaction.options.getString('kod') || '';
          const cleanCode = rawCode.trim().toUpperCase();

          const verif = db.prepare(`
            SELECT * FROM discord_verifications 
            WHERE code = ? AND status = 'pending' AND expires_at > datetime('now')
          `).get(cleanCode);

          if (!verif) {
            const errEmbed = new EmbedBuilder()
              .setTitle('❌ BŁĄD WERYFIKACJI TOŻSAMOŚCI')
              .setDescription(`Podany kod **${cleanCode}** jest nieprawidłowy, został już wykorzystany lub jego czas ważności wygasł.\n\n👉 **Jak połączyć konto?**\n1. Zaloguj się w portalu Cytadeli Durmstrang.\n2. Przejdź do zakładki **Profil** i kliknij **Połącz konto Discord**.\n3. Skopiuj nowy, 20-minutowy kod runiczny i wpisz go ponownie tutaj.`)
              .setColor(0xEF4444)
              .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • System Weryfikacji Adeptów' });

            await interaction.editReply({ embeds: [errEmbed] });
            return;
          }

          const user = db.prepare('SELECT * FROM users WHERE id = ?').get(verif.user_id);
          if (!user) {
            await interaction.editReply('⚠️ Nie odnaleziono adepta powiązanego z tym kodem w księgach Cytadeli.');
            return;
          }

          // Nadanie ról na serwerze Discord
          const assignedRoleNames = [];
          const guild = interaction.guild;
          let member = interaction.member;

          if (guild) {
            if (!member?.roles?.add) {
              try {
                member = await guild.members.fetch(interaction.user.id);
              } catch (_) {}
            }

            const mappings = db.prepare('SELECT * FROM discord_role_mappings WHERE auto_assign = 1').all();
            let guildRoles = guild.roles.cache;
            try {
              guildRoles = await guild.roles.fetch();
            } catch (_) {}

            const getOrCreateRole = async (mapping) => {
              if (mapping.discord_role_id) {
                const byId = guildRoles.get(mapping.discord_role_id);
                if (byId) return byId;
              }
              const targetName = (mapping.discord_role_name || mapping.role_label || '').toLowerCase();
              const cleanTarget = targetName.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

              const existing = guildRoles.find(r => {
                const rName = r.name.toLowerCase();
                const rClean = rName.replace(/[^\p{L}\p{N}]/gu, '');
                return rName === targetName || (cleanTarget && rClean.includes(cleanTarget)) || (cleanTarget && cleanTarget.includes(rClean));
              });

              if (existing) return existing;

              // Jeśli rola nie istnieje, spróbuj ją automatycznie utworzyć z odpowiednim kolorem
              try {
                const created = await guild.roles.create({
                  name: mapping.discord_role_name || mapping.role_label,
                  color: mapping.color || '#c59f4e',
                  reason: 'Automatyczne utworzenie roli przez bota Cytadeli Durmstrang'
                });
                guildRoles.set(created.id, created);
                return created;
              } catch (err) {
                console.warn('[Discord Role Auto-Create Warning]', err.message);
                return null;
              }
            };

            const rolesToAdd = [];

            // 1. Rola ogólna (Zweryfikowany)
            const verifiedMap = mappings.find(m => m.internal_key === 'verified');
            if (verifiedMap) {
              const r = await getOrCreateRole(verifiedMap);
              if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
              else { assignedRoleNames.push(verifiedMap.discord_role_name); }
            }

            // 2. Rola Zakonu (tylko uczniowie)
            if (user.role === 'student' && user.house) {
              const houseMap = mappings.find(m => m.category === 'house' && m.internal_key === user.house.toLowerCase());
              if (houseMap) {
                const r = await getOrCreateRole(houseMap);
                if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
                else { assignedRoleNames.push(houseMap.discord_role_name); }
              }
            }

            // 3. Rola Rangi
            if (user.role) {
              const roleMap = mappings.find(m => m.category === 'role' && m.internal_key === user.role.toLowerCase());
              if (roleMap) {
                const r = await getOrCreateRole(roleMap);
                if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
                else { assignedRoleNames.push(roleMap.discord_role_name); }
              }
            }

            // 4. Rola Klasy (tylko uczniowie)
            if (user.role === 'student' && user.class_year) {
              const cy = user.class_year.toLowerCase();
              let classKey = '';
              if (cy.includes('1') || /klasa\s*i(?!i)/i.test(cy)) classKey = 'klasa_1';
              else if (cy.includes('2') || /klasa\s*ii(?!i)/i.test(cy)) classKey = 'klasa_2';
              else if (cy.includes('3') || /klasa\s*iii/i.test(cy)) classKey = 'klasa_3';
              else if (cy.includes('4') || /klasa\s*iv/i.test(cy)) classKey = 'klasa_4';

              if (classKey) {
                const classMap = mappings.find(m => m.category === 'class_year' && m.internal_key === classKey);
                if (classMap) {
                  const r = await getOrCreateRole(classMap);
                  if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
                  else { assignedRoleNames.push(classMap.discord_role_name); }
                }
              }
            }

            // Dodaj role do użytkownika na serwerze
            if (member && rolesToAdd.length > 0) {
              try {
                await member.roles.add(rolesToAdd);
              } catch (roleErr) {
                console.warn('[Discord Bot] Błąd nadawania ról:', roleErr.message);
              }
            }

            // Zmień nick jeśli bot posiada uprawnienia
            try {
              if (member && user.full_name && member.manageable) {
                await member.setNickname(user.full_name);
              }
            } catch (_) {}
          }

          const now = new Date().toISOString();

          // Zaktualizuj bazę danych
          db.prepare(`
            UPDATE users 
            SET discord_id = ?, discord_username = ?, discord_avatar = ?, discord_roles = ?, discord_verified_at = ?
            WHERE id = ?
          `).run(
            interaction.user.id,
            interaction.user.tag || interaction.user.username,
            interaction.user.displayAvatarURL(),
            JSON.stringify(assignedRoleNames),
            now,
            user.id
          );

          db.prepare(`
            UPDATE discord_verifications 
            SET status = 'verified', discord_user_id = ?, discord_username = ?, assigned_roles = ?, verified_at = ?
            WHERE id = ?
          `).run(
            interaction.user.id,
            interaction.user.tag || interaction.user.username,
            JSON.stringify(assignedRoleNames),
            now,
            verif.id
          );

          const houseColors = {
            reinhall: 0xC59F4E,
            bjornhall: 0x2EC4B6,
            ravnheim: 0xA855F7,
            otergard: 0xE63946
          };
          const houseNames = {
            reinhall: '🦌 Zakon Reinhall (Jeleń)',
            bjornhall: '🐻 Zakon Björnhall (Niedźwiedź)',
            ravnheim: '🐦 Zakon Ravnheim (Kruk)',
            otergard: '🦦 Zakon Otergard (Wydra)'
          };

          const roleDisplay = user.role === 'admin' ? '⚡ Rada Arcymistrzów' : user.role === 'professor' ? '🧙‍♂️ Profesor Katedry' : user.role === 'prefect' ? '🛡️ Strażnik Zakonu' : '📜 Adept';
          const classOrKadra = user.role === 'student' ? (user.class_year || 'Klasa I') : 'Kadra Katedr';
          const houseDisplay = user.role === 'student' ? (houseNames[user.house?.toLowerCase()] || user.house || 'Nieprzydzielony') : 'Kadra (Poza Zakonami)';

          const successEmbed = new EmbedBuilder()
            .setTitle('🏰 TOŻSAMOŚĆ POTWIERDZONA — TWIERDZA MAGII DURMSTRANG')
            .setDescription(`Witaj w murach Cytadeli, **${user.full_name}**! Twoje konto Discord zostało pomyślnie powiązane z Twoją kartą w Wiecznej Księdze Paktu.`)
            .addFields(
              { name: '👤 Adept / Czarodziej', value: `**${user.full_name}** (\`@${user.username}\`)`, inline: true },
              { name: '🏛️ Zakon', value: houseDisplay, inline: true },
              { name: '📜 Status & Klasa', value: `${roleDisplay} • ${classOrKadra}`, inline: true },
              { name: '✨ Nadane Role Discord', value: assignedRoleNames.length > 0 ? assignedRoleNames.map(r => `• \`${r}\``).join('\n') : '• `Zweryfikowany Adept`' },
              { name: '💰 Skarbiec', value: `🪙 **${user.currency || 0}** Skirnirów | 🏆 **${user.points || 0}** Punktów`, inline: true }
            )
            .setColor(user.role === 'student' ? (houseColors[user.house?.toLowerCase()] || 0xC59F4E) : 0xC59F4E)
            .setThumbnail(user.avatar || interaction.user.displayAvatarURL())
            .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Weryfikacja zakończona sukcesem' })
            .setTimestamp();

          await interaction.editReply({ embeds: [successEmbed] });
        }

        // /synchronizuj
        if (commandName === 'synchronizuj') {
          const user = db.prepare('SELECT * FROM users WHERE discord_id = ?').get(interaction.user.id);
          if (!user) {
            await interaction.editReply('⚠️ Twoje konto Discord nie jest jeszcze powiązane z Cytadelą. Użyj najpierw komendy `/weryfikuj kod: [TWÓJ_KOD]`.');
            return;
          }

          const assignedRoleNames = [];
          const guild = interaction.guild;
          let member = interaction.member;

          if (guild) {
            if (!member?.roles?.add) {
              try { member = await guild.members.fetch(interaction.user.id); } catch (_) {}
            }

            const mappings = db.prepare('SELECT * FROM discord_role_mappings WHERE auto_assign = 1').all();
            let guildRoles = guild.roles.cache;
            try { guildRoles = await guild.roles.fetch(); } catch (_) {}

            const findRole = (mapping) => {
              if (mapping.discord_role_id) {
                const byId = guildRoles.get(mapping.discord_role_id);
                if (byId) return byId;
              }
              const targetName = (mapping.discord_role_name || mapping.role_label || '').toLowerCase();
              const cleanTarget = targetName.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

              return guildRoles.find(r => {
                const rName = r.name.toLowerCase();
                const rClean = rName.replace(/[^\p{L}\p{N}]/gu, '');
                return rName === targetName || (cleanTarget && rClean.includes(cleanTarget)) || (cleanTarget && cleanTarget.includes(rClean));
              });
            };

            const rolesToAdd = [];
            const verifiedMap = mappings.find(m => m.internal_key === 'verified');
            if (verifiedMap) {
              const r = findRole(verifiedMap);
              if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
            }
            if (user.role === 'student' && user.house) {
              const houseMap = mappings.find(m => m.category === 'house' && m.internal_key === user.house.toLowerCase());
              if (houseMap) {
                const r = findRole(houseMap);
                if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
              }
            }
            if (user.role) {
              const roleMap = mappings.find(m => m.category === 'role' && m.internal_key === user.role.toLowerCase());
              if (roleMap) {
                const r = findRole(roleMap);
                if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
              }
            }
            if (user.role === 'student' && user.class_year) {
              const cy = user.class_year.toLowerCase();
              let classKey = '';
              if (cy.includes('1') || /klasa\s*i(?!i)/i.test(cy)) classKey = 'klasa_1';
              else if (cy.includes('2') || /klasa\s*ii(?!i)/i.test(cy)) classKey = 'klasa_2';
              else if (cy.includes('3') || /klasa\s*iii/i.test(cy)) classKey = 'klasa_3';
              else if (cy.includes('4') || /klasa\s*iv/i.test(cy)) classKey = 'klasa_4';

              if (classKey) {
                const classMap = mappings.find(m => m.category === 'class_year' && m.internal_key === classKey);
                if (classMap) {
                  const r = findRole(classMap);
                  if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
                }
              }
            }

            if (member && rolesToAdd.length > 0) {
              try { await member.roles.add(rolesToAdd); } catch (_) {}
            }
            try {
              if (member && user.full_name && member.manageable) {
                await member.setNickname(user.full_name);
              }
            } catch (_) {}
          }

          db.prepare('UPDATE users SET discord_roles = ?, discord_avatar = ? WHERE id = ?').run(
            JSON.stringify(assignedRoleNames),
            interaction.user.displayAvatarURL(),
            user.id
          );

          const syncEmbed = new EmbedBuilder()
            .setTitle('🔄 ROLE ZSYNCHRONIZOWANE')
            .setDescription(`Zaktualizowano role i dane dla adepta **${user.full_name}** zgodnie z bieżącym stanem w portalu Cytadeli.`)
            .setColor(0x10B981)
            .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Synchronizacja Tożsamości' });

          await interaction.editReply({ embeds: [syncEmbed] });
        }

        // /profil
        if (commandName === 'profil') {
          const user = db.prepare('SELECT * FROM users WHERE discord_id = ?').get(interaction.user.id);
          if (!user) {
            await interaction.editReply('⚠️ Nie odnaleziono profilu powiązanego z Twoim kontem Discord. Użyj `/weryfikuj kod: [KOD]`, aby połączyć konto.');
            return;
          }

          const houseNames = {
            reinhall: '🦌 Reinhall',
            bjornhall: '🐻 Björnhall',
            ravnheim: '🐦 Ravnheim',
            otergard: '🦦 Otergard'
          };
          const houseColors = {
            reinhall: 0xC59F4E,
            bjornhall: 0x2EC4B6,
            ravnheim: 0xA855F7,
            otergard: 0xE63946
          };

          const pEmbed = new EmbedBuilder()
            .setTitle(`📜 KARTA POSTACI — ${user.full_name.toUpperCase()}`)
            .setDescription(user.backstory ? `*„${user.backstory.slice(0, 150)}...”*` : 'Adept Północy w Cytadeli Durmstrang.')
            .addFields(
              { name: '🏛️ Zakon', value: houseNames[user.house?.toLowerCase()] || user.house || 'Brak', inline: true },
              { name: '📜 Klasa / Rola', value: `${user.class_year || 'Brak'} (${user.role})`, inline: true },
              { name: '🏆 Punkty Zakonne', value: `${user.points || 0} pkt`, inline: true },
              { name: '🪙 Skarbiec', value: `${user.currency || 0} Skirnirów`, inline: true },
              { name: '🪄 Różdżka', value: user.wand || 'Standardowa jesionowa', inline: true },
              { name: '✨ Patronus', value: user.patronus || 'Niematerialny', inline: true }
            )
            .setColor(houseColors[user.house?.toLowerCase()] || 0xC59F4E)
            .setThumbnail(user.avatar || interaction.user.displayAvatarURL())
            .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Portal Dzienników i Magii' });

          await interaction.editReply({ embeds: [pEmbed] });
        }

        // /odlacz
        if (commandName === 'odlacz') {
          const user = db.prepare('SELECT * FROM users WHERE discord_id = ?').get(interaction.user.id);
          if (!user) {
            await interaction.editReply('ℹ️ Twoje konto Discord nie jest aktualnie powiązane z żadnym profilem w Cytadeli.');
            return;
          }

          db.prepare("UPDATE users SET discord_id = '', discord_username = '', discord_avatar = '', discord_roles = '[]', discord_verified_at = '' WHERE id = ?").run(user.id);
          db.prepare("UPDATE discord_verifications SET status = 'cancelled' WHERE user_id = ?").run(user.id);

          await interaction.editReply(`🔓 Pomyślnie odłączono konto Discord od profilu **${user.full_name}**.`);
        }

        // /pamiec (Izba Pamięci)
        if (commandName === 'pamiec') {
          const sub = interaction.options.getSubcommand();
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

          const houseNames = {
            reinhall: '🦌 Reinhall',
            bjornhall: '🐻 Björnhall',
            ravnheim: '🐦 Ravnheim',
            otergard: '🦦 Otergard'
          };
          const houseColors = {
            reinhall: 0xC59F4E,
            bjornhall: 0x2EC4B6,
            ravnheim: 0xA855F7,
            otergard: 0xE63946
          };

          if (sub === 'osoba') {
            const nazwa = interaction.options.getString('nazwa');
            const clean = nazwa.trim().toLowerCase();

            const person = db.prepare(`
              SELECT p.*, y.name as year_name, y.year_code
              FROM memory_person_snapshots p
              JOIN memory_school_years y ON p.school_year_id = y.id
              WHERE (LOWER(p.character_name) LIKE ? OR LOWER(p.full_name) LIKE ?) AND y.status = 'published'
              ORDER BY y.start_date DESC LIMIT 1
            `).get(`%${clean}%`, `%${clean}%`);

            if (!person) {
              await interaction.editReply(`⚠️ Nie odnaleziono wpisów w Izbie Pamięci dla postaci: **${nazwa}**.`);
              return;
            }

            const certsCount = db.prepare(`SELECT COUNT(*) as count FROM memory_certificates WHERE LOWER(student_name) LIKE ?`).get(`%${clean}%`).count;
            const diplCount = db.prepare(`SELECT COUNT(*) as count FROM memory_diplomas WHERE LOWER(recipient_name) LIKE ?`).get(`%${clean}%`).count;
            const awardsCount = db.prepare(`SELECT COUNT(*) as count FROM memory_awards WHERE LOWER(recipient_name) LIKE ?`).get(`%${clean}%`).count;

            const memEmbed = new EmbedBuilder()
              .setTitle(`🏛️ IZBA PAMIĘCI — ${person.character_name.toUpperCase()}`)
              .setDescription(`*„To, co zapisano w murach Twierdzy, nie zostaje zapomniane.”*`)
              .addFields(
                { name: '🏛️ Ostatni Zakon', value: houseNames[person.house?.toLowerCase()] || person.house, inline: true },
                { name: '📜 Rola & Klasa', value: `${person.is_graduate ? '🎓 Absolwent' : 'Adept'} • ${person.class_year}`, inline: true },
                { name: '🏆 Wynik w ${person.year_name}', value: `#${person.ranking_position} (${person.points} pkt)`, inline: true },
                { name: '📜 Świadectwa & Dyplomy', value: `📜 **${certsCount}** Świadectw | 🎖️ **${diplCount}** Dyplomów | ⭐ **${awardsCount}** Wyróżnień`, inline: false },
                { name: '⭐ Najlepszy Przedmiot', value: person.best_subject || 'Brak danych', inline: true },
                { name: '✨ Ocena Końcowa', value: person.final_grade || 'Powyżej Oczekiwań', inline: true }
              )
              .setColor(houseColors[person.house?.toLowerCase()] || 0xC59F4E)
              .setThumbnail(person.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100')
              .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Izba Pamięci' });

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('Otwórz Dossier w Izbie Pamięci')
                .setStyle(ButtonStyle.Link)
                .setURL(`${frontendUrl}/#izba-pamieci/osoba/${encodeURIComponent(person.character_name)}`)
            );

            await interaction.editReply({ embeds: [memEmbed], components: [row] });
          }

          if (sub === 'zakon') {
            const hKey = interaction.options.getString('zakon');
            const hName = houseNames[hKey] || hKey;

            const trophies = db.prepare(`
              SELECT t.*, y.name as year_name
              FROM memory_trophies t
              JOIN memory_school_years y ON t.school_year_id = y.id
              WHERE t.house = ? AND y.status = 'published'
            `).all(hKey);

            const houseCupsCount = trophies.filter(t => t.trophy_type === 'house_cup').length;
            const bestYear = db.prepare(`SELECT * FROM memory_school_years WHERE winning_house = ? ORDER BY winning_points DESC LIMIT 1`).get(hKey);
            const latestWin = db.prepare(`SELECT * FROM memory_school_years WHERE winning_house = ? ORDER BY start_date DESC LIMIT 1`).get(hKey);

            const zEmbed = new EmbedBuilder()
              .setTitle(`🏛️ GABLOTA ZAKONU — ${hName.toUpperCase()}`)
              .setDescription(`Historyczne osiągnięcia i Puchar Twierdzy Magii w Izbie Pamięci.`)
              .addFields(
                { name: '🏆 Zdobyte Puchary Twierdzy', value: `**${houseCupsCount}** Pucharów`, inline: true },
                { name: '⚡ Rekord Punktowy', value: bestYear ? `**${bestYear.winning_points} pkt** (${bestYear.name})` : 'Brak danych', inline: true },
                { name: '🌟 Ostatni Triumf', value: latestWin ? `**${latestWin.name}**` : 'Oczekuje na zwycięstwo', inline: true }
              )
              .setColor(houseColors[hKey] || 0xC59F4E)
              .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Sala Pucharów' });

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('Otwórz Gablotę Zakonu')
                .setStyle(ButtonStyle.Link)
                .setURL(`${frontendUrl}/#izba-pamieci/zakon/${hKey}`)
            );

            await interaction.editReply({ embeds: [zEmbed], components: [row] });
          }

          if (sub === 'rok') {
            const rCode = interaction.options.getString('rok').trim().toUpperCase();
            const year = db.prepare(`SELECT * FROM memory_school_years WHERE (UPPER(year_code) = ? OR UPPER(name) LIKE ?) AND status = 'published'`).get(rCode, `%${rCode}%`);

            if (!year) {
              await interaction.editReply(`⚠️ Nie odnaleziono archiwum dla roku: **${rCode}**.`);
              return;
            }

            const yEmbed = new EmbedBuilder()
              .setTitle(`🏛️ ${year.name.toUpperCase()} (${year.term || year.date_range})`)
              .setDescription(year.summary || 'Oficjalne roczniki Twierdzy Magii Durmstrang.')
              .addFields(
                { name: '👑 Dyrekcja', value: year.headmaster || 'Rada Arcymistrzów', inline: true },
                { name: '🏆 Zwycięski Zakon', value: `${houseNames[year.winning_house?.toLowerCase()] || year.winning_house} (**${year.winning_points} pkt**)`, inline: true },
                { name: '🌟 Prymus Roku', value: year.best_student || 'Brak', inline: true },
                { name: '🧙‍♂️ Profesor Roku', value: year.best_professor || 'Brak', inline: true },
                { name: '⚔️ Główne Wydarzenie', value: year.highlight_event || 'Ceremonia Paktu', inline: false }
              )
              .setColor(houseColors[year.winning_house?.toLowerCase()] || 0xC59F4E)
              .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Archiwum Lat Szkolnych' });

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('Przeglądaj Cały Rok w Izbie Pamięci')
                .setStyle(ButtonStyle.Link)
                .setURL(`${frontendUrl}/#izba-pamieci/${year.id}`)
            );

            await interaction.editReply({ embeds: [yEmbed], components: [row] });
          }

          if (sub === 'puchar') {
            const trophies = db.prepare(`
              SELECT t.*, y.name as year_name, y.year_code
              FROM memory_trophies t
              JOIN memory_school_years y ON t.school_year_id = y.id
              WHERE t.trophy_type = 'house_cup' AND y.status = 'published'
              ORDER BY y.start_date DESC LIMIT 5
            `).all();

            const pDesc = trophies.map(t => `• **${t.year_name}**: ${houseNames[t.house?.toLowerCase()] || t.house} (${t.points} pkt)`).join('\n');

            const cupEmbed = new EmbedBuilder()
              .setTitle('🏆 SALA PUCHARÓW CYTADELI DURMSTRANG')
              .setDescription(`Lista ostatnich zdobywców Pucharu Twierdzy Magii:\n\n${pDesc || 'Kroniki są uzupełniane.'}`)
              .setColor(0xC59F4E)
              .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Sala Chwały' });

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('Odwiedź Salę Pucharów')
                .setStyle(ButtonStyle.Link)
                .setURL(`${frontendUrl}/#izba-pamieci/sala-pucharow`)
            );

            await interaction.editReply({ embeds: [cupEmbed], components: [row] });
          }
        }
      } catch (err) {
        console.warn('[Discord Interaction Error]', err.message);
      }
    });

    // 2. Automatyczna archiwizacja każdej wiadomości, embedu i załącznika w wątku lekcyjnym
    const resolveMentions = (text, guild) => {
      if (!text || !guild) return text || '';
      return text.replace(/<@!?(\d+)>/g, (raw, id) => {
        const m = guild.members?.cache?.get(id);
        return m ? `@${m.displayName}` : raw;
      }).replace(/<#(\d+)>/g, (raw, id) => {
        const ch = guild.channels?.cache?.get(id);
        return ch ? `#${ch.name}` : raw;
      });
    };

    this.client.on('messageCreate', async (message) => {
      if (this.role !== 'utility') return;
      // Ignoruj tylko własnego bota Durmstranga, pozwalając na archiwizację botów takich jak Fibi APL. i kart zaklęć
      if (message.author.id === this.client.user?.id) return;

      const threadId = message.channel.id;

      // Sprawdź czy sesja jest aktywna — po /lekcja zakoncz sesja jest usunięta z mapy
      if (!activeLessonSessions.has(threadId)) return;

      const lesson = db.prepare("SELECT id, professor_id FROM lessons WHERE discord_thread_id = ? AND status = 'draft' ORDER BY created_at DESC LIMIT 1").get(threadId);
      if (!lesson) return;

      // Wykryj dom — boty nie mają domów
      let userHouse = '';
      if (!message.author.bot) {
        const memberRoles = message.member?.roles?.cache?.map(r => r.name.toLowerCase()) || [];
        if (memberRoles.some(r => r.includes('bjorn') || r.includes('niedźwiedź'))) userHouse = 'bjornhall';
        else if (memberRoles.some(r => r.includes('ravn') || r.includes('kruk'))) userHouse = 'ravnheim';
        else if (memberRoles.some(r => r.includes('oter') || r.includes('wydra'))) userHouse = 'otergard';
        else if (memberRoles.some(r => r.includes('rein') || r.includes('jeleń'))) userHouse = 'reinhall';

        // Jeśli nie wykryto z ról Discord, sprawdź w bazie Cytadeli
        if (!userHouse) {
          const dbUser = db.prepare('SELECT house FROM users WHERE discord_id = ?').get(message.author.id);
          if (dbUser?.house) userHouse = dbUser.house.toLowerCase();
        }
      }

      // Obsługa załączników (pobranie lokalne na serwer)
      const localAttachments = [];
      for (const att of message.attachments.values()) {
        try {
          const ext = path.extname(att.name) || '.png';
          const localFileName = `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
          const storageUrl = await downloadDiscordAttachment(att.url, localFileName);
          localAttachments.push({
            id: `att-${Date.now()}`,
            name: att.name,
            mimeType: att.contentType || 'image/png',
            size: att.size,
            originalUrl: att.url,
            storageUrl,
            author: message.member?.displayName || message.author.username
          });
        } catch (e) {
          console.error('Błąd pobierania załącznika:', e);
        }
      }

      // Obsługa Discord Embeds (np. Karta Zaklęcia Erecto od Fibi APL.)
      const guild = message.guild;
      const formattedEmbeds = (message.embeds || []).map(e => ({
        title: resolveMentions(e.title || '', guild),
        description: resolveMentions(e.description || '', guild),
        color: e.hexColor || (e.color ? `#${e.color.toString(16).padStart(6, '0')}` : '#E5C158'),
        author: e.author ? { name: e.author.name || '', icon_url: e.author.iconURL || e.author.icon_url || '' } : null,
        fields: (e.fields || []).map(f => ({ name: resolveMentions(f.name || '', guild), value: resolveMentions(f.value || '', guild), inline: !!f.inline })),
        footer: e.footer ? { text: e.footer.text || '', icon_url: e.footer.iconURL || e.footer.icon_url || '' } : null,
        thumbnail: e.thumbnail ? { url: e.thumbnail.url } : null,
        image: e.image ? { url: e.image.url } : null,
        timestamp: e.timestamp || null
      }));

      // Obsługa wykrywania interakcji / użycia komendy (np. "Ezra Camhi używa erecto")
      let isCommand = 0;
      let commandData = '{}';
      if (message.interactionMetadata || message.interaction) {
        isCommand = 1;
        const meta = message.interactionMetadata || message.interaction;
        const resolvedName = meta.name || meta.commandName || meta.customId || '';
        commandData = JSON.stringify({
          name: resolvedName,
          author: meta.user?.displayName || meta.user?.username || message.member?.displayName || message.author.username
        });
      }

      const isBot = message.author.bot ? 1 : 0;

      // Zapis wiadomości i embedów do bazy SQLite
      db.prepare(`
        INSERT INTO lesson_messages (
          id, lesson_id, discord_message_id, discord_user_id, author_name, author_display_name, author_avatar, author_house,
          content, timestamp, reply_to_id, reply_to_author, reply_to_content, is_bot, is_system, is_command, command_data, embeds, attachments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, 0, ?, ?, ?, ?)
      `).run(
        `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        lesson.id,
        message.id,
        message.author.id,
        message.author.username,
        message.member?.displayName || message.author.username,
        message.author.displayAvatarURL(),
        userHouse,
        resolveMentions(message.content || '', guild),
        message.reference?.messageId || '',
        '',
        '',
        isBot,
        isCommand,
        commandData,
        JSON.stringify(formattedEmbeds),
        JSON.stringify(localAttachments)
      );

      // Rejestracja uczestnika lekcji (jeśli ludzki autor i nie jest prowadzącym)
      if (!message.author.bot) {
        const isProfessor = lesson.professor_id === message.author.id ||
          db.prepare('SELECT id FROM users WHERE id = ? AND discord_id = ?').get(lesson.professor_id, message.author.id);
        if (!isProfessor) {
          const existingPart = db.prepare('SELECT id FROM lesson_participants WHERE lesson_id = ? AND student_id = ?').get(lesson.id, message.author.id);
          if (!existingPart) {
            db.prepare(`
              INSERT INTO lesson_participants (id, lesson_id, student_id, student_name, house, is_present, points_awarded, comment)
              VALUES (?, ?, ?, ?, ?, 1, 10, 'Aktywny udział w wątku')
            `).run(
              `part-${Date.now()}-${message.author.id}`,
              lesson.id,
              message.author.id,
              message.member?.displayName || message.author.username,
              userHouse
            );
          }
        }
      }
    });

    // 3. Automatyczne powitanie nowych członków na serwerze Discord
    this.client.on('guildMemberAdd', async (member) => {
      if (this.role !== 'utility') return;
      try {
        console.log(`❄️ [Discord Bot] Nowy adept przybył na serwer: ${member.user.tag} (${member.id})`);
        await sendWelcomeToGuild(member.guild, member);
      } catch (err) {
        console.error('❌ [Discord Bot] Błąd powitania nowego adepta:', err.message);
      }
    });
  }

  // ==================== MODUŁ REKRUTACJI — POWIADOMIENIA ====================

  async announceRecruitmentApplication(application) {
    if (!this.client?.isReady() || !this.isReady) {
      console.warn('[Discord Bot] Pominięto powiadomienie rekrutacyjne — bot nie jest połączony.');
      return { sent: false, reason: 'bot_offline' };
    }

    try {
      const config = db.prepare('SELECT guild_id FROM discord_bot_config LIMIT 1').get() || {};
      const guildId = process.env.DISCORD_GUILD_ID || config.guild_id;
      let guild = guildId ? this.client.guilds.cache.get(guildId) : null;
      if (!guild && guildId) guild = await this.client.guilds.fetch(guildId).catch(() => null);
      guild ||= this.client.guilds.cache.first();
      if (!guild) {
        console.warn('[Discord Bot] Pominięto powiadomienie rekrutacyjne — nie znaleziono serwera.');
        return { sent: false, reason: 'guild_not_found' };
      }

      const configuredChannelId = process.env.DISCORD_RECRUITMENT_CHANNEL_ID || process.env.DISCORD_LOZA_CHANNEL_ID;
      let channel = configuredChannelId
        ? guild.channels.cache.get(configuredChannelId) || await guild.channels.fetch(configuredChannelId).catch(() => null)
        : null;

      if (!channel) {
        await guild.channels.fetch().catch(() => null);
        channel = guild.channels.cache.find(candidate => {
          if (!candidate?.isTextBased?.()) return false;
          const normalizedName = normalizeDiscordChannelName(candidate.name);
          return normalizedName === 'loza-arcymistrzow'
            || (normalizedName.includes('loza') && normalizedName.includes('arcymistrz'));
        });
      }

      if (!channel?.isTextBased?.() || typeof channel.send !== 'function') {
        console.warn('[Discord Bot] Pominięto powiadomienie rekrutacyjne — nie znaleziono kanału #loża-arcymistrzów.');
        return { sent: false, reason: 'channel_not_found' };
      }

      const message = await channel.send(buildRecruitmentNotificationPayload(application));
      console.log(`📨 [Discord Bot] Wysłano powiadomienie o podaniu (${application.role}) na #${channel.name}.`);
      return { sent: true, messageId: message.id, channelId: channel.id };
    } catch (err) {
      console.warn('[Discord Bot] Błąd wysyłania powiadomienia rekrutacyjnego:', err.message);
      return { sent: false, reason: 'send_failed', error: err.message };
    }
  }

  // ==================== CODZIENNY PLAN LEKCJI ====================

  async announceDailyTimetable({ dateKey, dayOfWeek } = {}) {
    if (!this.client?.isReady() || !this.isReady) {
      return { sent: false, reason: 'bot_offline' };
    }

    try {
      const context = dateKey && dayOfWeek ? { dateKey, dayOfWeek } : getWarsawDateContext();
      const dayNames = {
        1: 'Poniedziałek',
        2: 'Wtorek',
        3: 'Środa',
        4: 'Czwartek',
        5: 'Piątek',
        6: 'Sobota',
        7: 'Niedziela'
      };
      const config = db.prepare('SELECT guild_id FROM discord_bot_config LIMIT 1').get() || {};
      const guildId = process.env.DISCORD_GUILD_ID || config.guild_id;
      let guild = guildId ? this.client.guilds.cache.get(guildId) : null;
      if (!guild && guildId) guild = await this.client.guilds.fetch(guildId).catch(() => null);
      guild ||= this.client.guilds.cache.first();
      if (!guild) return { sent: false, reason: 'guild_not_found' };

      await guild.channels.fetch().catch(() => null);
      const configuredChannelId = process.env.DISCORD_TIMETABLE_CHANNEL_ID;
      let channel = configuredChannelId
        ? guild.channels.cache.get(configuredChannelId) || await guild.channels.fetch(configuredChannelId).catch(() => null)
        : null;

      if (!channel) {
        channel = guild.channels.cache.find(candidate => {
          if (!candidate?.isTextBased?.() || typeof candidate.send !== 'function') return false;
          const name = normalizeDiscordChannelName(candidate.name);
          return name === 'plan-lekcji'
            || name === 'plan-zajec'
            || (name.includes('plan') && (name.includes('lekcj') || name.includes('zajec')));
        });
      }

      if (!channel?.isTextBased?.() || typeof channel.send !== 'function') {
        console.warn('[Discord Bot] Nie wysłano planu — nie znaleziono kanału #plan-lekcji.');
        return { sent: false, reason: 'channel_not_found' };
      }

      const entries = db.prepare(`
        SELECT
          t.*,
          COALESCE(NULLIF(t.professor_name, ''), NULLIF(professor.full_name, ''), NULLIF(subject.professor_name, ''), 'Nieprzypisany') AS resolved_professor_name,
          COALESCE(NULLIF(t.substitute_professor_name, ''), NULLIF(substitute.full_name, ''), '') AS resolved_substitute_professor_name
        FROM timetable_entries t
        LEFT JOIN users professor ON professor.id = t.professor_id
        LEFT JOIN users substitute ON substitute.id = t.substitute_professor_id
        LEFT JOIN subjects subject ON subject.id = t.subject_id
        WHERE t.is_active = 1 AND t.day_of_week = ?
        ORDER BY t.start_time ASC, t.sort_order ASC
      `).all(context.dayOfWeek);

      const payload = buildDailyTimetablePayload(entries, {
        dateKey: context.dateKey,
        dayName: dayNames[context.dayOfWeek],
        guild
      });
      const sentMessages = [];
      for (let index = 0; index < payload.embeds.length; index += 10) {
        const message = await channel.send({
          ...payload,
          embeds: payload.embeds.slice(index, index + 10),
          components: index === 0 ? payload.components : []
        });
        sentMessages.push(message);
      }

      console.log(`📅 [Discord Bot] Wysłano plan na ${context.dateKey} (${entries.length} pozycji) na #${channel.name}.`);
      return {
        sent: true,
        messageIds: sentMessages.map(message => message.id),
        channelId: channel.id,
        entriesCount: entries.length,
        dateKey: context.dateKey
      };
    } catch (err) {
      console.warn('[Discord Bot] Błąd wysyłania codziennego planu lekcji:', err.message);
      return { sent: false, reason: 'send_failed', error: err.message };
    }
  }

  startDailyTimetableScheduler() {
    const enabled = !['0', 'false', 'no', 'off'].includes(String(process.env.DISCORD_TIMETABLE_ENABLED || 'true').toLowerCase());
    if (!enabled || this.timetableScheduler) return;

    const configuredTime = process.env.DISCORD_TIMETABLE_POST_TIME || '07:00';
    const targetMinutes = parseDailyPostTime(configuredTime);
    const checkAndPost = async () => {
      if (this.timetableCheckInProgress || !this.client?.isReady()) return;
      const context = getWarsawDateContext();
      if (context.minutesSinceMidnight < targetMinutes) return;

      const lastPostDate = db.prepare("SELECT value FROM school_config WHERE key = 'discord_timetable_last_post_date'").get()?.value;
      if (lastPostDate === context.dateKey) return;

      this.timetableCheckInProgress = true;
      try {
        const result = await this.announceDailyTimetable(context);
        if (result.sent) {
          db.prepare(`
            INSERT INTO school_config (key, value) VALUES ('discord_timetable_last_post_date', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
          `).run(context.dateKey);
        }
      } finally {
        this.timetableCheckInProgress = false;
      }
    };

    void checkAndPost();
    this.timetableScheduler = setInterval(() => void checkAndPost(), 60 * 1000);
    this.timetableScheduler.unref?.();
    console.log(`📅 [Discord Bot] Codzienny plan lekcji aktywny: ${configuredTime}, strefa Europe/Warsaw.`);
  }

  // ==================== MODUŁ PRAC DOMOWYCH — POWIADOMIENIA ====================

  async announceHomeworkCreated(homework) {
    if (!this.client?.isReady()) return;
    try {
      const channel = this.client.channels.cache.find(c =>
        c.isTextBased?.() && (
          c.name.includes('prace-domowe') || c.name.includes('prace_domowe') ||
          c.name.includes('zadania') || c.name.includes('ogłoszenia') ||
          c.name.includes('ogloszenia') || c.name.includes('katedry')
        )
      );
      if (!channel) return;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const typeLabels = {
        homework: 'Praca domowa', essay: 'Esej', practical: 'Zadanie praktyczne',
        report: 'Raport', analysis: 'Analiza', project: 'Projekt', extra: 'Praca dodatkowa'
      };
      const typeLabel = typeLabels[homework.type] || 'Praca domowa';

      const dueDate = homework.dueDate
        ? new Date(homework.dueDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) +
          ' o ' + new Date(homework.dueDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
        : '—';

      const stripHtml = (html) => {
        if (!html) return '';
        return html
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<\/li>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      };

      const plainDesc = homework.description ? stripHtml(homework.description) : '';

      const embed = new EmbedBuilder()
        .setTitle(`📜 NOWA PRACA DOMOWA • ${(homework.subjectName || homework.subjectId || '').toUpperCase()}`)
        .setDescription(
          `Profesor **${homework.professorName}** wystawił nową pracę z Katedry **${homework.subjectName || homework.subjectId}**.\n\n` +
          `**„${homework.title}"**\n\n` +
          (plainDesc ? `*${plainDesc.slice(0, 200)}${plainDesc.length > 200 ? '...' : ''}*\n\n` : '') +
          `**Klasa:** ${homework.classYear || 'Wszystkie klasy'}\n` +
          `**Typ:** ${typeLabel}\n` +
          `**Termin oddania:** ${dueDate}\n` +
          `**Maks. punktów:** ${homework.maxPoints || 20} pkt`
        )
        .setColor(0x8B6A38)
        .setFooter({ text: 'Twierdza Magii Durmstrang • Katedry Akademickie' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Otwórz Centrum Prac Domowych')
          .setStyle(ButtonStyle.Link)
          .setURL(`${frontendUrl}/#/homework`)
          .setEmoji('📚')
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`📜 [Discord Bot] Wysłano ogłoszenie nowej pracy domowej: ${homework.title}`);
    } catch (err) {
      console.warn('[Discord Bot] Błąd ogłoszenia pracy domowej:', err.message);
    }
  }

  // ==================== MODUŁ EGZAMINACYJNY — POWIADOMIENIA ====================

  async announceExamOpened(exam) {
    if (!this.client?.isReady()) return;
    try {
      const channel = this.client.channels.cache.find(c =>
        c.name.includes('ogłoszenia') || c.name.includes('ogloszenia') || c.name.includes('egzaminy') || c.name.includes('sesja')
      );
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle(`📜 SESJA EGZAMINACYJNA • ${exam.subjectName || exam.title}`)
        .setDescription(
          `Oficjalny arkusz egzaminacyjny został **OTWARTY** w Centrum Egzaminacyjnym Twierdzy Durmstrang.\n\n` +
          `**Katedra:** ${exam.subjectName || 'Główna'}\n` +
          `**Rocznik:** ${exam.classYear || 'Wszystkie klasy'}\n` +
          `**Limit Czasu:** ${exam.timeLimitMinutes} minut\n` +
          `**Maks. Punktów:** ${exam.totalPoints || 100} pkt\n\n` +
          `*Pieczęć zostanie złamana w momencie rozpoczęcia podejścia.*`
        )
        .setColor(0xC59F4E)
        .setFooter({ text: 'Twierdza Magii Durmstrang • Centrum Egzaminacyjne' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Przejdź do Egzaminu')
          .setStyle(ButtonStyle.Link)
          .setURL(process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/#/egzaminy` : 'http://localhost:5173/#/egzaminy')
          .setEmoji('ᛉ')
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`📜 [Discord Bot] Wysłano ogłoszenie otwarcia egzaminu: ${exam.title}`);
    } catch (err) {
      console.warn('Błąd wysyłania ogłoszenia egzaminu na Discordzie:', err.message);
    }
  }

  async announceExamResultsPublished(exam) {
    if (!this.client?.isReady()) return;
    try {
      const channel = this.client.channels.cache.find(c =>
        c.name.includes('ogłoszenia') || c.name.includes('ogloszenia') || c.name.includes('egzaminy') || c.name.includes('sesja')
      );
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle(`🏆 WYNIKI EGZAMINU • ${exam.subjectName || exam.title}`)
        .setDescription(
          `Oficjalne wyniki i protokoły ocen z przedmiotu **${exam.subjectName || exam.title}** (${exam.classYear || ''}) zostały **OPUBLIKOWANE**.\n\n` +
          `Adeptowie mogą sprawdzić swoje oceny w **Centrum Egzaminacyjnym** oraz na Karcie Tożsamości.\n\n` +
          `*Szczegółowe oceny indywidualne pozostają dostępne wyłącznie dla uprawnionych adeptów.*`
        )
        .setColor(0x10B981)
        .setFooter({ text: 'Twierdza Magii Durmstrang • Rada Mistrzów' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Zobacz Wyniki')
          .setStyle(ButtonStyle.Link)
          .setURL(process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/#/egzaminy` : 'http://localhost:5173/#/egzaminy')
          .setEmoji('📜')
      );

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`🏆 [Discord Bot] Wysłano ogłoszenie publikacji wyników: ${exam.title}`);
    } catch (err) {
      console.warn('Błąd wysyłania ogłoszenia wyników na Discordzie:', err.message);
    }
  }

  async announceLessonPublished(lesson, subject) {
    if (!this.client?.isReady() || !this.isReady) return;
    const channelId = subject?.discord_channel_id || '';
    if (!channelId) return;

    try {
      const channel = this.client.channels.cache.get(channelId);
      if (!channel?.isTextBased?.() || typeof channel.send !== 'function') return;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const lessonDate = lesson.date
        ? new Date(lesson.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

      const embed = new EmbedBuilder()
        .setTitle(`📖 NOWY DZIENNIK • ${String(lesson.subject_name || '').toUpperCase()}`)
        .setDescription(
          `Profesor **${lesson.professor_name}** opublikował dziennik zajęć z **${lesson.subject_name}**.\n\n` +
          `**„${lesson.topic}"**\n\n` +
          `**Data:** ${lessonDate}\n` +
          `**Rocznik:** ${lesson.class_year || 'Wszyscy'}\n` +
          `**Uczestnicy:** ${lesson.participants_count || 0}\n` +
          `**Punkty Zakonu:** ${lesson.total_points || 0} pkt`
        )
        .setColor(0x5865F2)
        .setFooter({ text: 'Twierdza Magii Durmstrang • Dziennik Lekcji' })
        .setTimestamp();

      const buttons = [
        new ButtonBuilder()
          .setLabel('Otwórz Dziennik')
          .setStyle(ButtonStyle.Link)
          .setURL(`${frontendUrl}/#/lessons`)
          .setEmoji('📖')
      ];
      if (lesson.discord_thread_url) {
        buttons.push(
          new ButtonBuilder()
            .setLabel('Wątek Lekcji')
            .setStyle(ButtonStyle.Link)
            .setURL(lesson.discord_thread_url)
            .setEmoji('💬')
        );
      }

      await channel.send({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(buttons)]
      });
      console.log(`📖 [Discord Bot] Ogłoszono lekcję: „${lesson.topic}" → #${channel.name}`);
    } catch (err) {
      console.warn('[Discord Bot] Błąd ogłoszenia lekcji:', err.message);
    }
  }

  async announceWorldState(worldState, { channelId, actorName } = {}) {
    if (!this.client?.isReady() || !this.isReady) throw new Error('Bot Discord nie jest aktualnie połączony.');
    const config = db.prepare('SELECT guild_id, lessons_channel_id FROM discord_bot_config LIMIT 1').get() || {};
    const guild = (config.guild_id && this.client.guilds.cache.get(config.guild_id)) || this.client.guilds.cache.first();
    if (!guild) throw new Error('Bot nie znajduje się na skonfigurowanym serwerze Discord.');
    const target = (channelId && guild.channels.cache.get(channelId))
      || (config.lessons_channel_id && guild.channels.cache.get(config.lessons_channel_id))
      || guild.channels.cache.find(c => c.isTextBased?.() && (c.name.includes('ogłoszenia') || c.name.includes('ogloszenia') || c.name.includes('edykty')));
    if (!target?.isTextBased?.()) throw new Error('Nie znaleziono kanału ogłoszeń. Wskaż identyfikator kanału.');
    const rune = worldState.runeOfTheDay || {};
    const colors = { I:0x6B7280, II:0xC59F4E, III:0xB7791F, IV:0x9B2C2C, V:0x50151B };
    const embed = new EmbedBuilder()
      .setTitle('☾ MAGICZNA PÓŁNOC • STAN CYTADELI')
      .setDescription(worldState.narrativeReport || 'Kronikarze nie pozostawili dodatkowego raportu.')
      .setColor(colors[worldState.threatLevel] || 0x8B6A38)
      .addFields(
        { name:'Pora', value:String(worldState.seasonalCycle !== 'NORMAL' ? worldState.seasonalCycle : worldState.timeOfDay), inline:true },
        { name:'Pogoda', value:`${worldState.weather} • ${Math.round(worldState.temperature)}°C`, inline:true },
        { name:'Wiatr', value:`${worldState.windDirection} • ${worldState.windIntensity}/5`, inline:true },
        { name:'Księżyc', value:String(worldState.moonPhase), inline:true },
        { name:'Runa dnia', value:`${rune.symbol || 'ᛁ'} ${rune.name || '—'}`, inline:true },
        { name:'Zagrożenie', value:`${worldState.threatLevel} • ${worldState.citadelState}`, inline:true }
      )
      .setFooter({ text:`Twierdza Magii Durmstrang • ${actorName || 'Reżyser Świata'}` })
      .setTimestamp();
    const sent = await target.send({ embeds:[embed] });
    return { messageId:sent.id, channelId:target.id, channelName:target.name };
  }

  // ─── Questy Discord ────────────────────────────────────────────────────────

  _buildQuestSceneEmbed(questState, questId) {
    const stage = questState.stage;
    const diffColor = DIFFICULTY_COLOR[questState.difficulty] || 0x9ca3af;

    const embed = new EmbedBuilder()
      .setColor(diffColor)
      .setAuthor({ name: `${questState.category || 'Quest'} · ${questState.difficulty || '—'}` })
      .setTitle(questState.title || 'Quest');

    if (questState.totalStages > 1 && stage) {
      embed.setFooter({ text: `Etap ${stage.index + 1} z ${questState.totalStages} · ${stage.title || ''}` });
    }

    if (stage?.narrative) {
      embed.setDescription(stage.narrative.slice(0, 4096));
    }

    if (questState.lastActionResult?.text && questState.lastActionResult.stageIndex < questState.currentStageIndex) {
      embed.addFields({
        name: 'Skutek poprzedniego wyboru',
        value: String(questState.lastActionResult.text).slice(0, 1024),
        inline: false,
      });
    }

    if (stage?.objective && stage.type !== 'narrative') {
      embed.addFields({ name: 'Cel', value: stage.objective, inline: false });
    }

    if (stage?.type === 'narrative' && stage?.prompt) {
      embed.addFields({ name: 'Twoje zadanie', value: stage.prompt, inline: false });
    }

    return embed;
  }

  _buildQuestActionButtons(questState, questId, userId) {
    const stage = questState.stage;
    if (!stage) return [];
    if (stage.platform === 'web') return [];

    if (stage.type === 'narrative') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`qnarr_${questId.slice(0, 30)}_${userId}`)
          .setLabel('Napisz interpretację')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✍️')
      );
      return [row];
    }

    if (stage.type === 'visit_location') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`qact_${questId.slice(0, 30)}_${userId}_arrived`)
          .setLabel('Dotarłem do celu')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
      );
      return [row];
    }

    if (stage.actions?.length > 0) {
      const buttons = stage.actions.slice(0, 4).map(action =>
        new ButtonBuilder()
          .setCustomId(`qact_${questId.slice(0, 30)}_${userId}_${action.id}`)
          .setLabel(action.label.slice(0, 80))
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⚔️')
      );
      return [new ActionRowBuilder().addComponents(buttons)];
    }

    return [];
  }

  async _getOrCreateQuestThread(discordId, questId, questState = {}) {
    const guild = await this.client.guilds.fetch(TMD_GUILD_ID).catch(() => null);
    if (!guild) throw new Error('Nie znaleziono serwera TMD.');

    const playChannelId = process.env.DISCORD_QUEST_PLAY_CHANNEL_ID;
    if (!playChannelId) throw new Error('Brak DISCORD_QUEST_PLAY_CHANNEL_ID w konfiguracji.');

    const parentChannel = await guild.channels.fetch(playChannelId).catch(() => null);
    if (!parentChannel?.threads?.create) {
      throw new Error('Kanał questów nie obsługuje wątków.');
    }

    const saved = db.prepare(`
      SELECT thread_id, parent_channel_id
      FROM quest_discord_threads
      WHERE quest_id=? AND discord_user_id=?
    `).get(questId, discordId);

    if (saved?.thread_id && saved.parent_channel_id === playChannelId) {
      let existingThread = await guild.channels.fetch(saved.thread_id).catch(() => null);
      if (existingThread?.isThread()) {
        if (existingThread.archived) {
          existingThread = await existingThread.setArchived(false, 'Kontynuacja questa').catch(() => null);
        }
        if (existingThread?.isThread() && !existingThread.archived) {
          await existingThread.members.add(discordId).catch(() => {});
          db.prepare(`
            UPDATE quest_discord_threads
            SET status='active', updated_at=datetime('now')
            WHERE quest_id=? AND discord_user_id=?
          `).run(questId, discordId);
          return existingThread;
        }
      }
    }

    const member = await guild.members.fetch(discordId).catch(() => null);
    const discordUser = member?.user || await this.client.users.fetch(discordId).catch(() => null);
    const playerName = member?.displayName || discordUser?.username || `adept-${discordId.slice(-6)}`;
    const questTitle = questState.title || questId;
    const threadName = `⚔️ ${questTitle} — ${playerName}`.slice(0, 100);

    const thread = await parentChannel.threads.create({
      name: threadName,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread,
      invitable: false,
      reason: `Quest ${questId} dla ${discordId}`,
    });

    await thread.members.add(discordId).catch(() => {});
    db.prepare(`
      INSERT INTO quest_discord_threads
        (quest_id, discord_user_id, thread_id, parent_channel_id, status, updated_at)
      VALUES (?, ?, ?, ?, 'active', datetime('now'))
      ON CONFLICT(quest_id, discord_user_id) DO UPDATE SET
        thread_id=excluded.thread_id,
        parent_channel_id=excluded.parent_channel_id,
        status='active',
        updated_at=datetime('now')
    `).run(questId, discordId, thread.id, playChannelId);

    return thread;
  }

  async sendQuestSceneToThread(discordId, questId, questState) {
    if (!this.client || !this.isReady) return;
    try {
      const thread = await this._getOrCreateQuestThread(discordId, questId, questState);
      const embed = this._buildQuestSceneEmbed(questState, questId);
      const components = this._buildQuestActionButtons(questState, questId, discordId);

      await thread.send({
        content: `<@${discordId}>`,
        embeds: [embed],
        components,
        allowedMentions: { users: [discordId] },
      });
    } catch (err) {
      console.warn('[Quest Thread Error]', err.message);
    }
  }

  async sendQuestWebHandoffToThread(discordId, questId, questState) {
    if (!this.client || !this.isReady) return;
    try {
      const thread = await this._getOrCreateQuestThread(discordId, questId, questState);
      const stage = questState?.stage;
      const portalUrl = process.env.FRONTEND_URL || process.env.APP_URL || '';
      const embed = new EmbedBuilder()
        .setColor(0x8ecae6)
        .setTitle('🌐 Dalszy etap na stronie')
        .setDescription(
          `Kolejny etap questa **${questState?.title || questId}** wykonuje się na mapie portalu.` +
          (stage?.title ? `\n\n**Etap:** ${stage.title}` : '') +
          (stage?.objective ? `\n**Cel:** ${stage.objective}` : '') +
          (portalUrl ? `\n\n[Przejdź do portalu](${portalUrl})` : '')
        )
        .setFooter({ text: 'Po wykonaniu etapu następna scena może wrócić do tego wątku.' });

      await thread.send({
        content: `<@${discordId}>`,
        embeds: [embed],
        allowedMentions: { users: [discordId] },
      });
    } catch (err) {
      console.warn('[Quest Web Handoff Error]', err.message);
    }
  }

  async sendQuestCompleteToThread(discordId, questId, questTitle, rewards, outcomeText = '') {
    if (!this.client || !this.isReady) return;
    try {
      const thread = await this._getOrCreateQuestThread(discordId, questId, { title: questTitle });
      const rewardLines = [
        rewards?.points > 0 && `⚡ ${rewards.points} punktów`,
        rewards?.xp > 0 && `✨ ${rewards.xp} XP`,
        rewards?.skirniry > 0 && `🪙 ${rewards.skirniry} Skirnirów`,
        rewards?.item && `🎁 ${rewards.item}`,
      ].filter(Boolean);

      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('✅ Quest ukończony!')
        .setDescription(`**${questTitle}** — zadanie zakończone sukcesem.`)
        .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Silnik Questów' });

      if (rewardLines.length > 0) {
        embed.addFields({ name: 'Nagrody', value: rewardLines.join('\n'), inline: false });
      }
      if (outcomeText) {
        embed.addFields({ name: 'Rezultat', value: String(outcomeText).slice(0, 1024), inline: false });
      }

      await thread.send({
        content: `<@${discordId}>`,
        embeds: [embed],
        allowedMentions: { users: [discordId] },
      });
      db.prepare(`
        UPDATE quest_discord_threads
        SET status='completed', updated_at=datetime('now')
        WHERE quest_id=? AND discord_user_id=?
      `).run(questId, discordId);
      await thread.setArchived(true, 'Quest ukończony').catch(() => {});
    } catch (err) {
      console.warn('[Quest Complete Thread Error]', err.message);
    }
  }

  async sendQuestRejectionToThread(discordId, questId) {
    if (!this.client || !this.isReady) return;
    try {
      const quest = db.prepare('SELECT title FROM quest_definitions WHERE id=?').get(questId);
      const thread = await this._getOrCreateQuestThread(discordId, questId, { title: quest?.title || questId });
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('❌ Odpowiedź odrzucona')
        .setDescription('Twoja interpretacja nie spełniła wymagań. Spróbuj ponownie w tym wątku — możesz napisać nową odpowiedź.')
        .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Silnik Questów' });

      const state = db.prepare('SELECT id FROM users WHERE discord_id=?').get(discordId);
      const questState = state ? getQuestState(questId, state.id, db) : null;
      const components = questState ? this._buildQuestActionButtons(questState, questId, discordId) : [];
      await thread.send({
        content: `<@${discordId}>`,
        embeds: [embed],
        components,
        allowedMentions: { users: [discordId] },
      });
    } catch (err) {
      console.warn('[Quest Rejection Thread Error]', err.message);
    }
  }

  async _getOrCreateLocationThread(discordId, location) {
    const guild = await this.client.guilds.fetch(TMD_GUILD_ID).catch(() => null);
    if (!guild) throw new Error('Nie znaleziono serwera TMD.');

    const playChannelId = process.env.DISCORD_QUEST_PLAY_CHANNEL_ID;
    if (!playChannelId) throw new Error('Brak DISCORD_QUEST_PLAY_CHANNEL_ID w konfiguracji.');

    const parentChannel = await guild.channels.fetch(playChannelId).catch(() => null);
    if (!parentChannel?.threads?.create) {
      throw new Error('Kanał działań nie obsługuje publicznych wątków.');
    }

    const saved = db.prepare(`
      SELECT thread_id, parent_channel_id
      FROM location_discord_threads
      WHERE location_id=? AND discord_user_id=?
    `).get(location.id, discordId);

    if (saved?.thread_id && saved.parent_channel_id === playChannelId) {
      let existingThread = await guild.channels.fetch(saved.thread_id).catch(() => null);
      if (existingThread?.isThread()) {
        if (existingThread.archived) {
          existingThread = await existingThread.setArchived(false, 'Powrót do lokacji').catch(() => null);
        }
        if (existingThread?.isThread() && !existingThread.archived) {
          await existingThread.members.add(discordId).catch(() => {});
          db.prepare(`
            UPDATE location_discord_threads
            SET status='active', updated_at=datetime('now')
            WHERE location_id=? AND discord_user_id=?
          `).run(location.id, discordId);
          return existingThread;
        }
      }
    }

    const member = await guild.members.fetch(discordId).catch(() => null);
    const discordUser = member?.user || await this.client.users.fetch(discordId).catch(() => null);
    const playerName = member?.displayName || discordUser?.username || `adept-${discordId.slice(-6)}`;
    const threadName = `📍 ${location.name} — ${playerName}`.slice(0, 100);

    const thread = await parentChannel.threads.create({
      name: threadName,
      autoArchiveDuration: 1440,
      type: ChannelType.PublicThread,
      reason: `Działania w lokacji ${location.id} dla ${discordId}`,
    });

    await thread.members.add(discordId).catch(() => {});
    db.prepare(`
      INSERT INTO location_discord_threads
        (location_id, discord_user_id, thread_id, parent_channel_id, status, updated_at)
      VALUES (?, ?, ?, ?, 'active', datetime('now'))
      ON CONFLICT(location_id, discord_user_id) DO UPDATE SET
        thread_id=excluded.thread_id,
        parent_channel_id=excluded.parent_channel_id,
        status='active',
        updated_at=datetime('now')
    `).run(location.id, discordId, thread.id, playChannelId);

    return thread;
  }

  async openLocationActionsThread(discordId, locationId) {
    if (!this.client || !this.isReady) throw new Error('Bot Discord nie jest gotowy.');

    const location = db.prepare(`
      SELECT id, name, nordic_name, short_desc, full_lore, actions
      FROM locations WHERE id=?
    `).get(locationId);
    if (!location) throw Object.assign(new Error('Lokacja nie istnieje.'), { statusCode: 404 });

    let actions = [];
    try { actions = JSON.parse(location.actions || '[]'); } catch (_) {}
    if (actions.length === 0) {
      throw Object.assign(new Error('Ta lokacja nie ma działań na Discordzie.'), { statusCode: 400 });
    }

    const thread = await this._getOrCreateLocationThread(discordId, location);
    const embed = new EmbedBuilder()
      .setColor(0xc59f4e)
      .setAuthor({ name: location.nordic_name || 'Mapa Północy' })
      .setTitle(`📍 ${location.name}`)
      .setDescription((location.full_lore || location.short_desc || 'Wybierz działanie w tej lokacji.').slice(0, 3500))
      .addFields({ name: 'Działania', value: 'Wybierz jedną z opcji poniżej. Dalszą deklarację odegraj bezpośrednio w tym wątku.', inline: false })
      .setFooter({ text: 'TWIERDZA MAGII DURMSTRANG • Działania lokacji' });

    const rows = [];
    for (let i = 0; i < actions.length; i += 5) {
      const row = new ActionRowBuilder();
      for (let index = i; index < Math.min(i + 5, actions.length); index += 1) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`qloc_${location.id.slice(0, 30)}_${discordId}_${index}`)
            .setLabel(String(actions[index]).slice(0, 80))
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⚔️')
        );
      }
      rows.push(row);
    }

    await thread.send({
      content: `<@${discordId}>`,
      embeds: [embed],
      components: rows.slice(0, 5),
      allowedMentions: { users: [discordId] },
    });

    return {
      threadId: thread.id,
      threadUrl: `https://discord.com/channels/${TMD_GUILD_ID}/${thread.id}`,
    };
  }

  async sendNarrativeReviewToArxy(reviewId, questId, questTitle, stageTitle, prompt, responseText, playerDiscordId, playerName) {
    if (!this.client || !this.isReady) return;
    try {
      const guild = await this.client.guilds.fetch(TMD_GUILD_ID).catch(() => null);
      if (!guild) return;

      // Znajdź kanał review — szukaj po nazwie lub env var
      const reviewChannelId = process.env.DISCORD_QUEST_REVIEW_CHANNEL_ID;
      let channel = reviewChannelId
        ? await guild.channels.fetch(reviewChannelId).catch(() => null)
        : null;

      if (!channel) {
        const keywords = ['quest-recenz', 'questy-recenz', 'recenzje', 'arxy-review', 'arxymistrzowie', 'arxy'];
        channel = guild.channels.cache.find(ch =>
          ch.isTextBased() && keywords.some(kw => ch.name.toLowerCase().includes(kw))
        );
      }

      if (!channel) {
        const staffKeywords = ['rada', 'staff', 'administracja', 'arxy'];
        channel = guild.channels.cache.find(ch =>
          ch.isTextBased() && staffKeywords.some(kw => ch.name.toLowerCase().includes(kw))
        );
      }

      if (!channel) {
        console.warn('[Quest Narrative Review] Nie znaleziono kanału recenzji. Ustaw DISCORD_QUEST_REVIEW_CHANNEL_ID w .env.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle(`📜 Recenzja narracji — ${questTitle}`)
        .setDescription(
          `<@&${ARXYMISTRZOW_ROLE_ID}> — nowa odpowiedź do zatwierdzenia.\n\n` +
          `**Adept:** ${playerName || `<@${playerDiscordId}>`}\n` +
          `**Etap:** ${stageTitle || '—'}`
        )
        .addFields(
          { name: 'Zadanie (prompt)', value: (prompt || '—').slice(0, 1024), inline: false },
          { name: 'Odpowiedź gracza', value: responseText.slice(0, 1024), inline: false }
        )
        .setFooter({ text: `Review ID: ${reviewId.slice(0, 8)}… · Quest: ${questId}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`qaprv_${reviewId.slice(0, 36)}`)
          .setLabel('Zatwierdź')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`qrejt_${reviewId.slice(0, 36)}`)
          .setLabel('Odrzuć')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

      await channel.send({ embeds: [embed], components: [row] });
    } catch (err) {
      console.warn('[Quest Narrative Review Error]', err.message);
    }
  }

  async sendLocationNarrativeReview(reviewId, locationName, actionLabel, responseText, playerDiscordId, playerName) {
    if (!this.client || !this.isReady) return;
    try {
      const guild = await this.client.guilds.fetch(TMD_GUILD_ID).catch(() => null);
      if (!guild) return;

      const reviewChannelId = process.env.DISCORD_QUEST_REVIEW_CHANNEL_ID;
      let channel = reviewChannelId
        ? await guild.channels.fetch(reviewChannelId).catch(() => null)
        : null;

      if (!channel) {
        const keywords = ['quest-recenz', 'questy-recenz', 'recenzje', 'arxy-review', 'arxymistrzowie', 'arxy'];
        channel = guild.channels.cache.find(ch =>
          ch.isTextBased() && keywords.some(kw => ch.name.toLowerCase().includes(kw))
        );
      }
      if (!channel) {
        const staffKeywords = ['rada', 'staff', 'administracja', 'arxy'];
        channel = guild.channels.cache.find(ch =>
          ch.isTextBased() && staffKeywords.some(kw => ch.name.toLowerCase().includes(kw))
        );
      }
      if (!channel) {
        console.warn('[Location Narrative Review] Nie znaleziono kanału recenzji. Ustaw DISCORD_QUEST_REVIEW_CHANNEL_ID w .env.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xc59f4e)
        .setTitle(`⚔️ Recenzja działania — ${locationName}`)
        .setDescription(
          `<@&${ARXYMISTRZOW_ROLE_ID}> — nowe działanie lokacji do zatwierdzenia.\n\n` +
          `**Adept:** ${playerName || `<@${playerDiscordId}>`}\n` +
          `**Działanie:** ${actionLabel}`
        )
        .addFields({ name: 'Opis gracza', value: responseText.slice(0, 1024), inline: false })
        .setFooter({ text: `Review ID: ${reviewId.slice(0, 8)}… · Lokacja: ${locationName}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`laprv_${reviewId.slice(0, 36)}`)
          .setLabel('Zatwierdź')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`lrejt_${reviewId.slice(0, 36)}`)
          .setLabel('Odrzuć')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

      await channel.send({ embeds: [embed], components: [row] });
    } catch (err) {
      console.warn('[Location Narrative Review Error]', err.message);
    }
  }

  // ─── Obsługa interakcji questowych ────────────────────────────────────────

  async _handleQuestButton(interaction) {
    const { customId } = interaction;

    // Działanie opisowe lokacji: qloc_{locationId}_{discordUserId}_{actionIndex}
    if (customId.startsWith('qloc_')) {
      const parts = customId.split('_');
      if (parts.length !== 4) return false;
      const locationId = parts[1];
      const ownerDiscordId = parts[2];
      const actionIndex = Number(parts[3]);

      if (interaction.user.id !== ownerDiscordId) {
        await interaction.reply({ content: '⛔ Ten wątek działań należy do innego adepta.', ephemeral: true });
        return true;
      }

      const user = db.prepare('SELECT id FROM users WHERE discord_id=?').get(interaction.user.id);
      if (!user) {
        await interaction.reply({ content: '⚠️ Konto Discord nie jest powiązane z portalem. Użyj `/weryfikuj`.', ephemeral: true });
        return true;
      }

      // Otwórz modal do wpisania opisu klimatycznego — nagrody po zatwierdzeniu przez Arcymistrza
      let location, actionLabel, definition;
      try {
        location = db.prepare('SELECT id, name, actions FROM locations WHERE id=?').get(locationId);
        if (!location) throw new Error('Lokacja nie istnieje.');
        const actions = JSON.parse(location.actions || '[]');
        actionLabel = Array.isArray(actions) ? actions[actionIndex] : null;
        if (!actionLabel) throw new Error('To działanie nie jest dostępne.');
        definition = buildLocationActionDefinition(location, actionLabel, actionIndex);
      } catch (error) {
        await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
        return true;
      }

      const modal = new ModalBuilder()
        .setCustomId(`locnarr_${locationId.slice(0, 30)}_${ownerDiscordId}_${actionIndex}`)
        .setTitle(actionLabel.slice(0, 45));

      const textInput = new TextInputBuilder()
        .setCustomId('location_text')
        .setLabel('Opisz co robi twoja postać')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(30)
        .setMaxLength(2000)
        .setRequired(true)
        .setPlaceholder(definition.prompt.slice(0, 100));

      modal.addComponents(new ActionRowBuilder().addComponents(textInput));
      await interaction.showModal(modal);
      return true;
    }

    // Przycisk akcji: qact_{questId}_{discordUserId}_{actionId}
    if (customId.startsWith('qact_')) {
      const parts = customId.split('_');
      // qact | questIdSlug | discordUserId | ...actionIdParts
      if (parts.length < 4) return false;
      const questIdSlug = parts[1];
      const ownerDiscordId = parts[2];
      const actionId = parts.slice(3).join('_');

      // Publiczny wątek jest widoczny dla innych — przyciski obsługuje tylko właściciel questa.
      if (!interaction.user.id.startsWith(ownerDiscordId)) {
        await interaction.reply({ content: '⛔ Ten quest należy do innego adepta.', ephemeral: true });
        return true;
      }

      // Znajdź użytkownika po discord_id
      const user = db.prepare('SELECT id, discord_id, full_name FROM users WHERE discord_id=?').get(interaction.user.id);
      if (!user) {
        await interaction.reply({ content: '⚠️ Twoje konto Discord nie jest powiązane z portalem. Użyj `/weryfikuj`.', ephemeral: true });
        return true;
      }

      // Znajdź questId (pełne) na podstawie slug
      const questDef = db.prepare("SELECT id FROM quest_definitions WHERE id LIKE ? AND is_active=1 LIMIT 1").get(`${questIdSlug}%`);
      if (!questDef) {
        await interaction.reply({ content: '⚠️ Quest nie istnieje lub wygasł.', ephemeral: true });
        return true;
      }

      await interaction.deferReply({ ephemeral: true }).catch(() => {});
      try {
        const result = submitAction(questDef.id, user.id, actionId, db, 'discord');
        if (result.completed) {
          await interaction.editReply({ content: `✅ Quest ukończony!` });
          await this.sendQuestCompleteToThread(interaction.user.id, questDef.id, result.state?.title || questDef.id, result.rewards, result.actionResult);
        } else {
          if (result.state?.stage?.platform === 'web') {
            await interaction.editReply({ content: '🌐 Następny etap wykonasz na mapie portalu.' });
            await this.sendQuestWebHandoffToThread(interaction.user.id, questDef.id, result.state);
          } else {
            await interaction.editReply({ content: '⚡ Następna scena pojawiła się w tym wątku.' });
            await this.sendQuestSceneToThread(interaction.user.id, questDef.id, result.state);
          }
        }
      } catch (err) {
        await interaction.editReply({ content: `❌ ${err.message}` });
      }
      return true;
    }

    // Przycisk narracji: qnarr_{questIdSlug}_{userId8}
    if (customId.startsWith('qnarr_')) {
      const parts = customId.split('_');
      if (parts.length < 3) return false;
      const questIdSlug = parts[1];
      const ownerDiscordId = parts[2];

      if (!interaction.user.id.startsWith(ownerDiscordId)) {
        await interaction.reply({ content: '⛔ Ten quest należy do innego adepta.', ephemeral: true });
        return true;
      }

      const questDef = db.prepare("SELECT id, title FROM quest_definitions WHERE id LIKE ? AND is_active=1 LIMIT 1").get(`${questIdSlug}%`);
      if (!questDef) {
        await interaction.reply({ content: '⚠️ Quest nie istnieje.', ephemeral: true });
        return true;
      }

      const modal = new ModalBuilder()
        .setCustomId(`qn_${questDef.id.slice(0, 30)}`)
        .setTitle(questDef.title.slice(0, 45));

      const textInput = new TextInputBuilder()
        .setCustomId('narrative_text')
        .setLabel('Twoja odpowiedź (pisz w klimacie postaci)')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(30)
        .setMaxLength(2000)
        .setRequired(true)
        .setPlaceholder('Opisz co twoja postać czuje, widzi lub robi...');

      modal.addComponents(new ActionRowBuilder().addComponents(textInput));
      await interaction.showModal(modal);
      return true;
    }

    // Przycisk zatwierdzenia: qaprv_{reviewId}
    if (customId.startsWith('qaprv_')) {
      const reviewId = customId.slice(6);
      await interaction.deferReply({ ephemeral: true }).catch(() => {});

      // Sprawdź rolę arxymistrza
      const member = interaction.member;
      const hasRole = member?.roles?.cache?.has(ARXYMISTRZOW_ROLE_ID);
      if (!hasRole) {
        await interaction.editReply({ content: '⛔ Tylko Arxymistrzowie mogą zatwierdzać odpowiedzi.' });
        return true;
      }

      try {
        const result = approveNarrative(reviewId, interaction.user.id, db);
        // Wyślij dalszy ciąg do publicznego wątku gracza
        const playerUser = db.prepare('SELECT discord_id, full_name FROM users WHERE id=?').get(result.userId);
        if (playerUser?.discord_id) {
          if (result.completed) {
            await this.sendQuestCompleteToThread(playerUser.discord_id, result.questId, result.state?.title || result.questId, result.rewards);
          } else if (result.state?.stage?.platform === 'web') {
            await this.sendQuestWebHandoffToThread(playerUser.discord_id, result.questId, result.state);
          } else {
            await this.sendQuestSceneToThread(playerUser.discord_id, result.questId, result.state);
          }
        }

        // Zaktualizuj embed recenzji
        try {
          const originalEmbed = interaction.message.embeds[0];
          const updatedEmbed = EmbedBuilder.from(originalEmbed)
            .setColor(0x22c55e)
            .setTitle(`✅ ZATWIERDZONE — ${originalEmbed.title?.replace('📜 Recenzja narracji — ', '') || ''}`);
          await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        } catch (_) {}

        await interaction.editReply({ content: `✅ Zatwierdzone! ${result.completed ? 'Quest ukończony.' : 'Gracz przeszedł do kolejnej sceny.'}` });
      } catch (err) {
        await interaction.editReply({ content: `❌ ${err.message}` });
      }
      return true;
    }

    // Przycisk odrzucenia: qrejt_{reviewId}
    if (customId.startsWith('qrejt_')) {
      const reviewId = customId.slice(6);
      await interaction.deferReply({ ephemeral: true }).catch(() => {});

      const member = interaction.member;
      const hasRole = member?.roles?.cache?.has(ARXYMISTRZOW_ROLE_ID);
      if (!hasRole) {
        await interaction.editReply({ content: '⛔ Tylko Arxymistrzowie mogą odrzucać odpowiedzi.' });
        return true;
      }

      try {
        const result = rejectNarrative(reviewId, interaction.user.id, db);
        const playerUser = db.prepare('SELECT discord_id, full_name FROM users WHERE id=?').get(result.userId);
        if (playerUser?.discord_id) {
          await this.sendQuestRejectionToThread(playerUser.discord_id, result.questId);
        }

        try {
          const originalEmbed = interaction.message.embeds[0];
          const updatedEmbed = EmbedBuilder.from(originalEmbed)
            .setColor(0xef4444)
            .setTitle(`❌ ODRZUCONE — ${originalEmbed.title?.replace('📜 Recenzja narracji — ', '') || ''}`);
          await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        } catch (_) {}

        await interaction.editReply({ content: '❌ Odpowiedź odrzucona. Gracz może spróbować ponownie.' });
      } catch (err) {
        await interaction.editReply({ content: `❌ ${err.message}` });
      }
      return true;
    }

    // Zatwierdzenie działania lokacji: laprv_{reviewId}
    if (customId.startsWith('laprv_')) {
      const reviewId = customId.slice(6);
      await interaction.deferReply({ ephemeral: true }).catch(() => {});

      const member = interaction.member;
      if (!member?.roles?.cache?.has(ARXYMISTRZOW_ROLE_ID)) {
        await interaction.editReply({ content: '⛔ Tylko Arxymistrzowie mogą zatwierdzać odpowiedzi.' });
        return true;
      }

      try {
        const { review, outcome } = approveLocationNarrative(reviewId, interaction.user.id, db);
        const playerRow = db.prepare('SELECT discord_id FROM users WHERE id=?').get(review.user_id);

        try {
          const thread = await this.client.channels.fetch(review.discord_thread_id).catch(() => null);
          if (thread) {
            const effectLines = [
              outcome.effects?.xpAwarded > 0 && `✨ +${outcome.effects.xpAwarded} XP`,
              outcome.effects?.skirnirySpent > 0 && `🪙 −${outcome.effects.skirnirySpent} Skirnirów`,
              outcome.effects?.itemAdded && `🎁 ${outcome.effects.itemAdded}`,
            ].filter(Boolean);

            const playerMention = playerRow?.discord_id ? `<@${playerRow.discord_id}>` : '';
            const resultEmbed = new EmbedBuilder()
              .setColor(0x8ecae6)
              .setTitle(`✅ ${review.action_label}`)
              .setDescription(
                `${playerMention} ${outcome.result}`.trim() +
                (outcome.duplicate ? '\n\n*To działanie było już wcześniej wykonane — nagrody nie zostały naliczone ponownie.*' : '')
              )
              .setFooter({ text: 'Działanie zatwierdzone przez Arcymistrza' })
              .setTimestamp();
            if (effectLines.length > 0) resultEmbed.addFields({ name: 'Efekty', value: effectLines.join('\n'), inline: false });

            await thread.send({
              embeds: [resultEmbed],
              allowedMentions: { users: playerRow?.discord_id ? [playerRow.discord_id] : [] },
            });
          }
        } catch (_) {}

        try {
          const originalEmbed = interaction.message.embeds[0];
          const updatedEmbed = EmbedBuilder.from(originalEmbed)
            .setColor(0x22c55e)
            .setTitle(`✅ ZATWIERDZONE — ${originalEmbed.title?.replace('⚔️ Recenzja działania — ', '') || ''}`);
          await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        } catch (_) {}

        await interaction.editReply({ content: '✅ Działanie zatwierdzone! Gracz otrzymał nagrody.' });
      } catch (err) {
        await interaction.editReply({ content: `❌ ${err.message}` });
      }
      return true;
    }

    // Odrzucenie działania lokacji: lrejt_{reviewId}
    if (customId.startsWith('lrejt_')) {
      const reviewId = customId.slice(6);
      await interaction.deferReply({ ephemeral: true }).catch(() => {});

      const member = interaction.member;
      if (!member?.roles?.cache?.has(ARXYMISTRZOW_ROLE_ID)) {
        await interaction.editReply({ content: '⛔ Tylko Arxymistrzowie mogą odrzucać odpowiedzi.' });
        return true;
      }

      try {
        const { review } = rejectLocationNarrative(reviewId, interaction.user.id, db);
        const playerRow = db.prepare('SELECT discord_id FROM users WHERE id=?').get(review.user_id);

        try {
          const thread = await this.client.channels.fetch(review.discord_thread_id).catch(() => null);
          if (thread) {
            const playerMention = playerRow?.discord_id ? `<@${playerRow.discord_id}>` : '';
            const rejEmbed = new EmbedBuilder()
              .setColor(0xef4444)
              .setTitle(`❌ Działanie odrzucone — ${review.action_label}`)
              .setDescription(
                `${playerMention} Arcymistrz odrzucił tę próbę. Możesz spróbować ponownie — kliknij przycisk działania i opisz akcję jeszcze raz.`.trim()
              )
              .setTimestamp();
            await thread.send({
              embeds: [rejEmbed],
              allowedMentions: { users: playerRow?.discord_id ? [playerRow.discord_id] : [] },
            });
          }
        } catch (_) {}

        try {
          const originalEmbed = interaction.message.embeds[0];
          const updatedEmbed = EmbedBuilder.from(originalEmbed)
            .setColor(0xef4444)
            .setTitle(`❌ ODRZUCONE — ${originalEmbed.title?.replace('⚔️ Recenzja działania — ', '') || ''}`);
          await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        } catch (_) {}

        await interaction.editReply({ content: '❌ Odpowiedź odrzucona. Gracz może spróbować ponownie.' });
      } catch (err) {
        await interaction.editReply({ content: `❌ ${err.message}` });
      }
      return true;
    }

    return false;
  }

  async _handleQuestModalSubmit(interaction) {
    // Modal działania lokacji: locnarr_{locIdSlug}_{ownerDiscordId}_{actionIndex}
    if (interaction.customId.startsWith('locnarr_')) {
      const parts = interaction.customId.split('_');
      if (parts.length !== 4) return false;
      const locIdSlug = parts[1];
      const ownerDiscordId = parts[2];
      const actionIndex = Number(parts[3]);

      if (interaction.user.id !== ownerDiscordId) {
        await interaction.reply({ content: '⛔ Ten wątek działań należy do innego adepta.', ephemeral: true });
        return true;
      }

      const responseText = interaction.fields.getTextInputValue('location_text') || '';
      await interaction.deferReply({ ephemeral: true }).catch(() => {});

      const user = db.prepare('SELECT id, full_name FROM users WHERE discord_id=?').get(interaction.user.id);
      if (!user) {
        await interaction.editReply({ content: '⚠️ Konto nie jest powiązane z portalem. Użyj `/weryfikuj`.' });
        return true;
      }

      const location = db.prepare('SELECT id, name FROM locations WHERE id LIKE ? LIMIT 1').get(`${locIdSlug}%`);
      if (!location) {
        await interaction.editReply({ content: '⚠️ Lokacja nie istnieje.' });
        return true;
      }

      try {
        const result = submitLocationNarrative({
          locationId: location.id,
          userId: user.id,
          actionIndex,
          responseText,
          discordThreadId: interaction.channelId,
          db,
        });
        await this.sendLocationNarrativeReview(
          result.reviewId,
          location.name,
          result.actionLabel,
          responseText,
          interaction.user.id,
          user.full_name || interaction.user.username
        );
        await interaction.editReply({
          content: '✅ Odpowiedź wysłana! Arcymistrzowie zatwierdzą ją wkrótce — wynik pojawi się w tym wątku.',
        });
      } catch (err) {
        await interaction.editReply({ content: `❌ ${err.message}` });
      }
      return true;
    }

    if (!interaction.customId.startsWith('qn_')) return false;

    const questIdSlug = interaction.customId.slice(3);
    const responseText = interaction.fields.getTextInputValue('narrative_text') || '';

    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    const user = db.prepare('SELECT id, full_name FROM users WHERE discord_id=?').get(interaction.user.id);
    if (!user) {
      await interaction.editReply({ content: '⚠️ Konto nie jest powiązane z portalem. Użyj `/weryfikuj`.' });
      return true;
    }

    const questDef = db.prepare("SELECT * FROM quest_definitions WHERE id LIKE ? AND is_active=1 LIMIT 1").get(`${questIdSlug}%`);
    if (!questDef) {
      await interaction.editReply({ content: '⚠️ Quest nie istnieje.' });
      return true;
    }

    try {
      const progress = db.prepare('SELECT current_stage, state_json FROM user_quest_progress WHERE user_id=? AND quest_id=?').get(user.id, questDef.id);
      let stages = [];
      try { stages = JSON.parse(questDef.stages_json || '[]'); } catch (_) {}
      const currentStage = stages[progress?.current_stage ?? 0];

      const result = submitNarrative(questDef.id, user.id, responseText, db);

      await this.sendNarrativeReviewToArxy(
        result.reviewId,
        questDef.id,
        questDef.title,
        currentStage?.title || '—',
        currentStage?.prompt || '—',
        responseText,
        interaction.user.id,
        user.full_name || interaction.user.username
      );

      await interaction.editReply({
        content: '✅ Odpowiedź wysłana! Arxymistrzowie zatwierdzą ją wkrótce — wynik pojawi się w tym wątku.'
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ ${err.message}` });
    }
    return true;
  }

  stop() {
    if (this.timetableScheduler) {
      clearInterval(this.timetableScheduler);
      this.timetableScheduler = null;
    }
    this.isReady = false;
    this.client?.destroy();
    this.client = null;
  }
}

export const questDiscordBot = new DurmstrangDiscordBot({
  role: 'quest',
  name: 'Bot Questów Durmstrang'
});

export const neridaDiscordBot = new DurmstrangDiscordBot({
  role: 'utility',
  name: 'Nerida Vulchanova'
});

class DiscordBotsFacade {
  // Powitania i status integracji używają klienta Neridy.
  get client() {
    return neridaDiscordBot.client;
  }

  get isReady() {
    return neridaDiscordBot.isReady;
  }

  async initialize() {
    const sameToken = questDiscordBot.token
      && neridaDiscordBot.token
      && questDiscordBot.token === neridaDiscordBot.token;
    const sameClientId = questDiscordBot.clientId
      && neridaDiscordBot.clientId
      && questDiscordBot.clientId === neridaDiscordBot.clientId;

    if (sameToken || sameClientId) {
      console.error('❌ [Discord] Bot questów i Nerida muszą być dwiema różnymi aplikacjami Discord. Nerida nie została uruchomiona.');
      await questDiscordBot.initialize();
      return;
    }

    await Promise.all([
      questDiscordBot.initialize(),
      neridaDiscordBot.initialize()
    ]);
  }

  stop() {
    questDiscordBot.stop();
    neridaDiscordBot.stop();
  }

  announceRecruitmentApplication(...args) { return neridaDiscordBot.announceRecruitmentApplication(...args); }
  announceDailyTimetable(...args) { return neridaDiscordBot.announceDailyTimetable(...args); }
  announceHomeworkCreated(...args) { return neridaDiscordBot.announceHomeworkCreated(...args); }
  announceExamOpened(...args) { return neridaDiscordBot.announceExamOpened(...args); }
  announceExamResultsPublished(...args) { return neridaDiscordBot.announceExamResultsPublished(...args); }
  announceLessonPublished(...args) { return neridaDiscordBot.announceLessonPublished(...args); }
  announceWorldState(...args) { return questDiscordBot.announceWorldState(...args); }

  openLocationActionsThread(...args) { return questDiscordBot.openLocationActionsThread(...args); }
  sendQuestSceneToThread(...args) { return questDiscordBot.sendQuestSceneToThread(...args); }
  sendQuestCompleteToThread(...args) { return questDiscordBot.sendQuestCompleteToThread(...args); }
}

// Zachowany interfejs dla tras API: każde wywołanie trafia do właściwego bota.
export const discordBot = new DiscordBotsFacade();
