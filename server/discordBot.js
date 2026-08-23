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

import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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

export class DurmstrangDiscordBot {
  constructor() {
    this.token = process.env.DISCORD_BOT_TOKEN || '';
    this.clientId = process.env.DISCORD_CLIENT_ID || '';
    this.client = null;
    this.isReady = false;
  }

  // Definicje komend Slash
  getSlashCommands() {
    return [
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
          GatewayIntentBits.GuildMessageReactions
        ]
      });

      this.registerEventHandlers();
      await this.client.login(this.token);
      this.isReady = true;
      console.log(`🏰 [Discord Bot] Pomyślnie zalogowano jako: ${this.client.user.tag}`);

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
      if (!interaction.isChatInputCommand()) return;

      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferReply().catch(() => {});
        }

        const { commandName } = interaction;

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
              lessonId, threadId, subjectName: przedmiot, classYear, topic: temat, professorName, startTime: new Date().toISOString()
            });

            const embed = new EmbedBuilder()
              .setTitle('📖 CYTADELA DURMSTRANG — ROZPOCZĘTO SESJĘ LEKCYJNĄ')
              .setDescription(`Oficjalny wątek lekcyjny Katedry został otwarty i jest archiwizowany.`)
              .addFields(
                { name: '🏛️ Katedra / Przedmiot', value: przedmiot, inline: true },
                { name: '📜 Klasa', value: classYear, inline: true },
                { name: '🧙‍♂️ Prowadzący', value: professorName, inline: true },
                { name: '✨ Temat Zajęć', value: `**${temat}**` }
              )
              .setColor(0xC59F4E)
              .setFooter({ text: 'Cytadela Durmstrang • Użyj /lekcja zakoncz po zakończeniu zajęć' });

            await interaction.editReply({ embeds: [embed] });
          }

          if (sub === 'zakoncz') {
            const threadId = interaction.channel.id;
            const lesson = db.prepare('SELECT * FROM lessons WHERE discord_thread_id = ? ORDER BY created_at DESC LIMIT 1').get(threadId);

            if (!lesson) {
              await interaction.editReply('⚠️ Nie odnaleziono aktywnej sesji lekcyjnej w tym wątku. Uruchom najpierw `/lekcja rozpocznij`.');
              return;
            }

            const participants = db.prepare('SELECT COUNT(*) as count FROM lesson_participants WHERE lesson_id = ?').get(lesson.id);
            const messagesCount = db.prepare('SELECT COUNT(*) as count FROM lesson_messages WHERE lesson_id = ?').get(lesson.id);

            activeLessonSessions.delete(threadId);

            const summaryEmbed = new EmbedBuilder()
              .setTitle('📜 SESJA LEKCYJNA ZAKOŃCZONA — PROTOKÓŁ WYGENEROWANY')
              .setDescription(`Przebieg zajęć został zarchiwizowany w bazie Cytadeli. Szkic dziennika w stanie **DRAFT** oczekuje na weryfikację obecności i zatwierdzenie punktów przez Profesora.`)
              .addFields(
                { name: 'Temat', value: lesson.topic, inline: false },
                { name: 'Zarchiwizowane wiadomości', value: `${messagesCount?.count || 0}`, inline: true },
                { name: 'Zarejestrowani uczestnicy', value: `${participants?.count || 0}`, inline: true }
              )
              .setColor(0x10B981)
              .setFooter({ text: 'Cytadela Durmstrang • Panel Dzienników Lekcyjnych' });

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('Otwórz Dziennik na Stronie')
                .setStyle(ButtonStyle.Link)
                .setURL(`http://localhost:5173/`)
            );

            await interaction.editReply({ embeds: [summaryEmbed], components: [row] });
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
      } catch (err) {
        console.warn('[Discord Interaction Error]', err.message);
      }
    });

    // 2. Automatyczna archiwizacja każdej wiadomości, embedu i załącznika w wątku lekcyjnym
    this.client.on('messageCreate', async (message) => {
      // Ignoruj tylko własnego bota Durmstranga, pozwalając na archiwizację botów takich jak Fibi APL. i kart zaklęć
      if (message.author.id === this.client.user?.id) return;

      const threadId = message.channel.id;
      const lesson = db.prepare("SELECT id FROM lessons WHERE discord_thread_id = ? AND status = 'draft' ORDER BY created_at DESC LIMIT 1").get(threadId);
      if (!lesson) return;

      // Wykryj dom / rolę użytkownika
      let userHouse = 'reinhall';
      const memberRoles = message.member?.roles?.cache?.map(r => r.name.toLowerCase()) || [];
      if (memberRoles.some(r => r.includes('bjorn') || r.includes('niedźwiedź'))) userHouse = 'bjornhall';
      else if (memberRoles.some(r => r.includes('ravn') || r.includes('kruk'))) userHouse = 'ravnheim';
      else if (memberRoles.some(r => r.includes('oter') || r.includes('wydra'))) userHouse = 'otergard';

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
      const formattedEmbeds = (message.embeds || []).map(e => ({
        title: e.title || '',
        description: e.description || '',
        color: e.hexColor || (e.color ? `#${e.color.toString(16).padStart(6, '0')}` : '#E5C158'),
        author: e.author ? { name: e.author.name || '', icon_url: e.author.iconURL || e.author.icon_url || '' } : null,
        fields: (e.fields || []).map(f => ({ name: f.name || '', value: f.value || '', inline: !!f.inline })),
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
        commandData = JSON.stringify({
          name: meta.name || meta.commandName || 'zaklęcie',
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
        message.content || '',
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
  }
}

export const discordBot = new DurmstrangDiscordBot();
