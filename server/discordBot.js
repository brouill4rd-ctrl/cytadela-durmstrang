/**
 * CYTADELA DURMSTRANG — OFICJALNY BOT DISCORD (DISCORD.JS v14)
 * 
 * Służy do prowadzenia lekcji na żywo na serwerze Discord Cytadeli:
 * 1. Slash commands: /lekcja rozpocznij, /lekcja zakoncz, /quiz, /pytanie, /zaklecie, /losowanie
 * 2. Archiwizacja wiadomości w wątku, autorów, domów, odpowiedzi (reply-to)
 * 3. Automatyczne pobieranie załączników (grafik, rycin) na serwer do /uploads/lessons/
 * 4. Zapisywanie szkicu dziennika (DRAFT) w SQLite durmstrang.db
 * 5. Generowanie interaktywnego podsumowania na Discordzie z linkiem do panelu profesora
 */

import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import db from './db.js';
import { normalizeSubjectId, normalizeClassYear } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'lessons');
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
      name: 'CYTADELA DURMSTRANG • BRAMA GŁÓWNA',
      iconURL: 'attachment://tmd_herb.png'
    });
  } else {
    embed.setAuthor({
      name: 'CYTADELA DURMSTRANG • BRAMA GŁÓWNA'
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
  constructor() {
    this.token = process.env.DISCORD_BOT_TOKEN || '';
    this.clientId = process.env.DISCORD_CLIENT_ID || '';
    this.client = null;
    this.isReady = false;
    this.timetableScheduler = null;
    this.timetableCheckInProgress = false;
  }

  // Definicje komend Slash
  getSlashCommands() {
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
        )
    ];
  }

  // Inicjalizacja klienta Discord
  async initialize() {
    // 1. Sprawdź konfigurację w bazie SQLite lub zmiennych środowiskowych
    const config = db.prepare('SELECT * FROM discord_bot_config LIMIT 1').get();
    if (config && config.bot_token && config.bot_token !== 'BOT_TOKEN_DISCORD_DURMSTRANG_SECRET') {
      this.token = config.bot_token;
      this.clientId = config.client_id;
    }

    if (!this.token || this.token === 'BOT_TOKEN_DISCORD_DURMSTRANG_SECRET') {
      console.log('------------------------------------------------------------------');
      console.log('🤖 [Discord Bot] Status: TRYB HYBRYDOWY / API SYMULATOR (Gotowy do pracy)');
      console.log('💡 Aby podłączyć bota bezpośrednio do swojego serwera Discord:');
      console.log('   Ustaw DISCORD_BOT_TOKEN i DISCORD_CLIENT_ID w .env lub w Panelu Admina.');
      console.log('   Symulator sesji w aplikacji działa natywnie bez zewnętrznego bota!');
      console.log('------------------------------------------------------------------');
      return;
    }

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMessageReactions,
          GatewayIntentBits.GuildMembers
        ]
      });

      this.registerEventHandlers();
      await this.client.login(this.token);
      this.isReady = true;
      console.log(`🏰 [Discord Bot] Pomyślnie zalogowano jako: ${this.client.user.tag}`);
      this.startDailyTimetableScheduler();

      // Rejestracja Slash Commands w Discord API
      if (this.clientId) {
        const rest = new REST({ version: '10' }).setToken(this.token);
        const commandsJson = this.getSlashCommands().map(c => c.toJSON());
        await rest.put(Routes.applicationCommands(this.clientId), { body: commandsJson });
        console.log('⚡ [Discord Bot] Zarejestrowano slash commands (/lekcja, /quiz, /pytanie, /zaklecie, /losowanie).');
      }
    } catch (err) {
      console.error('❌ [Discord Bot] Błąd logowania bota Discord:', err.message);
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
              .setFooter({ text: 'Cytadela Durmstrang • System Tożsamości Runicznej' });

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
              .setFooter({ text: 'Cytadela Durmstrang • Cztery Totemy Północy' });

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

      if (!interaction.isChatInputCommand()) return;

      try {
        const { commandName } = interaction;

        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferReply({ ephemeral: commandName === 'lekcja' }).catch(() => {});
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
              .setTitle('📖 CYTADELA DURMSTRANG — ROZPOCZĘTO SESJĘ LEKCYJNĄ')
              .setDescription(`Oficjalny wątek lekcyjny Katedry został otwarty i jest archiwizowany.`)
              .addFields(
                { name: '🏛️ Katedra / Przedmiot', value: przedmiot, inline: true },
                { name: '📜 Klasa', value: classYear, inline: true },
                { name: '🧙‍♂️ Prowadzący', value: professorName, inline: true },
                { name: '✨ Temat Zajęć', value: `**${temat}**` }
              )
              .setColor(0xC59F4E)
              .setFooter({ text: 'Cytadela Durmstrang • Archiwum Wątków Lekcyjnych' });

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
              .setFooter({ text: 'Cytadela Durmstrang • Archiwum Wątków Lekcyjnych' });

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
              .setFooter({ text: 'Cytadela Durmstrang • System Weryfikacji Adeptów' });

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

            // 2. Rola Zakonu
            if (user.house) {
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

            // 4. Rola Klasy
            if (user.class_year) {
              const cy = user.class_year.toLowerCase();
              let classKey = '';
              if (cy.includes('1') || (cy.includes('i') && !cy.includes('ii') && !cy.includes('iii') && !cy.includes('iv'))) classKey = 'klasa_1';
              else if (cy.includes('2') || (cy.includes('ii') && !cy.includes('iii'))) classKey = 'klasa_2';
              else if (cy.includes('3') || cy.includes('iii')) classKey = 'klasa_3';
              else if (cy.includes('4') || cy.includes('iv')) classKey = 'klasa_4';

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

          const roleDisplay = user.role === 'admin' ? '⚡ Rada Arcymistrzów' : user.role === 'professor' ? '🧙‍♂️ Profesor Katedry' : user.role === 'prefect' ? '🛡️ Prefekt' : '📜 Adept';

          const successEmbed = new EmbedBuilder()
            .setTitle('🏰 TOŻSAMOŚĆ POTWIERDZONA — CYTADELA DURMSTRANG')
            .setDescription(`Witaj w murach Cytadeli, **${user.full_name}**! Twoje konto Discord zostało pomyślnie powiązane z Twoją kartą w Wiecznej Księdze Paktu.`)
            .addFields(
              { name: '👤 Adept / Czarodziej', value: `**${user.full_name}** (\`@${user.username}\`)`, inline: true },
              { name: '🏛️ Zakon', value: houseNames[user.house?.toLowerCase()] || user.house || 'Nieprzydzielony', inline: true },
              { name: '📜 Status & Klasa', value: `${roleDisplay} • ${user.class_year || 'Kadra'}`, inline: true },
              { name: '✨ Nadane Role Discord', value: assignedRoleNames.length > 0 ? assignedRoleNames.map(r => `• \`${r}\``).join('\n') : '• `Zweryfikowany Adept`' },
              { name: '💰 Skarbiec', value: `🪙 **${user.currency || 0}** Skirnirów | 🏆 **${user.points || 0}** Punktów`, inline: true }
            )
            .setColor(houseColors[user.house?.toLowerCase()] || 0xC59F4E)
            .setThumbnail(user.avatar || interaction.user.displayAvatarURL())
            .setFooter({ text: 'Cytadela Durmstrang • Weryfikacja zakończona sukcesem' })
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
            if (user.house) {
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
            .setFooter({ text: 'Cytadela Durmstrang • Synchronizacja Tożsamości' });

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
            .setFooter({ text: 'Cytadela Durmstrang • Portal Dzienników i Magii' });

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
              .setFooter({ text: 'Cytadela Durmstrang • Izba Pamięci' });

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
              .setFooter({ text: 'Cytadela Durmstrang • Sala Pucharów' });

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
              .setFooter({ text: 'Cytadela Durmstrang • Archiwum Lat Szkolnych' });

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
              .setFooter({ text: 'Cytadela Durmstrang • Sala Chwały' });

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
      // Ignoruj tylko własnego bota Durmstranga, pozwalając na archiwizację botów takich jak Fibi APL. i kart zaklęć
      if (message.author.id === this.client.user?.id) return;

      const threadId = message.channel.id;

      // Sprawdź czy sesja jest aktywna — po /lekcja zakoncz sesja jest usunięta z mapy
      if (!activeLessonSessions.has(threadId)) return;

      const lesson = db.prepare("SELECT id FROM lessons WHERE discord_thread_id = ? AND status = 'draft' ORDER BY created_at DESC LIMIT 1").get(threadId);
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

      // Rejestracja uczestnika lekcji (jeśli ludzki autor)
      if (!message.author.bot) {
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
    });

    // 3. Automatyczne powitanie nowych członków na serwerze Discord
    this.client.on('guildMemberAdd', async (member) => {
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

      const embed = new EmbedBuilder()
        .setTitle(`📜 NOWA PRACA DOMOWA • ${(homework.subjectName || homework.subjectId || '').toUpperCase()}`)
        .setDescription(
          `Profesor **${homework.professorName}** wystawił nową pracę z Katedry **${homework.subjectName || homework.subjectId}**.\n\n` +
          `**„${homework.title}"**\n\n` +
          (homework.description ? `*${homework.description.slice(0, 200)}${homework.description.length > 200 ? '...' : ''}*\n\n` : '') +
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

export const discordBot = new DurmstrangDiscordBot();
