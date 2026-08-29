/**
 * CYTADELA DURMSTRANG — STANDALONE DISCORD BOT RUNNER
 * Uruchamia bota bezpośrednio z kolorowymi logami i natychmiastową rejestracją komend.
 */

import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ActivityType, ChannelType } from 'discord.js';
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

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token) {
  console.error('\n❌ BŁĄD: Brak DISCORD_BOT_TOKEN w pliku .env!\n');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ]
});

// Pomocnicza funkcja pobierania załącznika
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
    const config = db.prepare('SELECT welcome_channel_id, welcome_enabled FROM discord_bot_config LIMIT 1').get();
    if (config && config.welcome_enabled === 0) {
      console.log('[Discord Bot] Powitania są wyłączone w konfiguracji.');
      return null;
    }
    if (config?.welcome_channel_id) {
      targetChannel = guild.channels.cache.get(config.welcome_channel_id);
    }
  }

  if (!targetChannel) {
    const welcomeKeywords = ['witamy', 'powitania', 'welcome', 'powitanie', 'dziedziniec', 'brama-glowna', 'brama', 'weryfikacja', 'ogólny', 'ogolny', 'general'];
    targetChannel = guild.channels.cache.find(ch => 
      ch.isTextBased() && welcomeKeywords.some(kw => ch.name.toLowerCase().includes(kw))
    );
  }

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

// Definicje komend Slash
const commands = [
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
    .setName('eksport')
    .setDescription('Eksportuje cały wątek Discord do Dziennika na portalu Cytadeli')
    .addChannelOption(opt =>
      opt.setName('watek')
        .setDescription('Wątek Discord do eksportu (wpisz # i wybierz z listy)')
        .setRequired(true)
        .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
    )
];

client.on('clientReady', async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  🏰 BOT CYTADELI DURMSTRANG JEST ONLINE                     ║`);
  console.log(`║  Zalogowano jako: ${client.user.tag.padEnd(41)}  ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (clientId) {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=397284550720&scope=bot%20applications.commands`;
    console.log(`🔗 Link do zaproszenia bota na serwer:\n   ${inviteUrl}\n`);
  }

  client.user.setActivity('wątki lekcyjne • /lekcja', { type: ActivityType.Watching });

  // Rejestracja komend Slash
  if (clientId) {
    const rest = new REST({ version: '10' }).setToken(token);
    const body = commands.map(c => c.toJSON());

    let registeredOnGuild = false;
    if (guildId) {
      try {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
        console.log(`⚡ [Slash Commands] Zarejestrowano komendy na serwerze GUILD: ${guildId}`);
        registeredOnGuild = true;
      } catch (err) {
        console.log(`ℹ️ [Slash Commands] Brak bezpośredniego dostępu do Guild ${guildId}. Rejestruję globalnie...`);
      }
    }

    if (!registeredOnGuild) {
      try {
        await rest.put(Routes.applicationCommands(clientId), { body });
        console.log('⚡ [Slash Commands] Zarejestrowano komendy globalnie (/lekcja, /quiz, /pytanie, /zaklecie, /losowanie).');
      } catch (err) {
        console.error('❌ Błąd rejestracji komend:', err.message);
      }
    }
  }
});

client.on('error', (err) => {
  console.warn('[Discord Bot Warning]', err.message);
});

// Obsługa interakcji Slash Commands
client.on('interactionCreate', async (interaction) => {
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
      await interaction.deferReply({ ephemeral: commandName === 'eksport' }).catch(() => {});
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

      let allMessages = [];
      let before;
      while (true) {
        const opts = { limit: 100 };
        if (before) opts.before = before;
        let batch;
        try {
          batch = await thread.messages.fetch(opts);
        } catch (e) { break; }
        if (batch.size === 0) break;
        allMessages.push(...batch.values());
        before = batch.last()?.id;
        if (batch.size < 100) break;
      }
      allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      let lesson = db.prepare('SELECT * FROM lessons WHERE discord_thread_id = ? ORDER BY created_at DESC LIMIT 1').get(thread.id);
      if (!lesson) {
        const lessonId = `les-discord-export-${Date.now()}`;
        const channelName = thread.name || 'Wątek Discord';
        const professorName = interaction.member?.displayName || interaction.user.username;
        db.prepare(`INSERT INTO lessons (id, discord_thread_id, subject_id, subject_name, class_year, topic, description, professor_id, professor_name, date, status, total_points) VALUES (?, ?, 'inne', 'Wątek Discord', 'Klasa I', ?, ?, ?, ?, ?, 'draft', 0)`)
          .run(lessonId, thread.id, channelName, `Wyeksportowany wątek Discord: #${channelName}`, interaction.user.id, professorName, new Date().toISOString().split('T')[0]);
        lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
      }

      const existingCheck = db.prepare('SELECT id FROM lesson_messages WHERE discord_message_id = ?');
      const insertMsg = db.prepare(`INSERT INTO lesson_messages (id, lesson_id, discord_message_id, discord_user_id, author_name, author_display_name, author_avatar, author_house, content, timestamp, order_index, reply_to_id, reply_to_author, reply_to_content, is_bot, is_system, is_command, command_data, embeds, reactions, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`);

      let newCount = 0;
      for (let i = 0; i < allMessages.length; i++) {
        const msg = allMessages[i];
        if (existingCheck.get(msg.id)) continue;

        let userHouse = '';
        if (!msg.author.bot) {
          let member = msg.member;
          if (!member) { try { member = await thread.guild.members.fetch(msg.author.id); } catch (_) {} }
          const roles = member?.roles?.cache?.map(r => r.name.toLowerCase()) || [];
          if (roles.some(r => r.includes('bjorn') || r.includes('niedźwiedź'))) userHouse = 'bjornhall';
          else if (roles.some(r => r.includes('ravn') || r.includes('kruk'))) userHouse = 'ravnheim';
          else if (roles.some(r => r.includes('oter') || r.includes('wydra'))) userHouse = 'otergard';
          else if (roles.some(r => r.includes('rein') || r.includes('jeleń'))) userHouse = 'reinhall';
          if (!userHouse) {
            const dbUser = db.prepare('SELECT house FROM users WHERE discord_id = ?').get(msg.author.id);
            if (dbUser?.house) userHouse = dbUser.house.toLowerCase();
          }
        }

        const localAttachments = [];
        for (const att of msg.attachments.values()) {
          try {
            const ext = path.extname(att.name) || '.png';
            const fn = `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`;
            const storageUrl = await downloadDiscordAttachment(att.url, fn);
            localAttachments.push({ id: `att-${Date.now()}`, name: att.name, mimeType: att.contentType || 'image/png', size: att.size, originalUrl: att.url, storageUrl });
          } catch (_) {}
        }

        const formattedEmbeds = (msg.embeds || []).map(e => ({
          title: e.title || '', description: e.description || '', color: e.hexColor || '#E5C158',
          author: e.author ? { name: e.author.name || '', icon_url: e.author.iconURL || '' } : null,
          fields: (e.fields || []).map(f => ({ name: f.name || '', value: f.value || '', inline: !!f.inline })),
          footer: e.footer ? { text: e.footer.text || '' } : null,
          thumbnail: e.thumbnail ? { url: e.thumbnail.url } : null,
          image: e.image ? { url: e.image.url } : null, timestamp: e.timestamp || null
        }));
        const formattedReactions = [...msg.reactions.cache.values()].map(r => ({ emoji: r.emoji.name || r.emoji.id, count: r.count }));

        let isCommand = 0, commandData = '{}';
        if (msg.interactionMetadata || msg.interaction) {
          isCommand = 1;
          const meta = msg.interactionMetadata || msg.interaction;
          commandData = JSON.stringify({ name: meta.name || meta.commandName || '', author: meta.user?.username || msg.author.username });
        }

        try {
          insertMsg.run(
            `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, lesson.id, msg.id, msg.author.id,
            msg.author.username, msg.member?.displayName || msg.author.username,
            msg.author.displayAvatarURL?.() || '', userHouse,
            msg.content || '', new Date(msg.createdTimestamp).toISOString(), i,
            msg.reference?.messageId || '', '', '', msg.author.bot ? 1 : 0,
            isCommand, commandData,
            JSON.stringify(formattedEmbeds), JSON.stringify(formattedReactions), JSON.stringify(localAttachments)
          );
          newCount++;
        } catch (_) {}

        if (!msg.author.bot) {
          const ep = db.prepare('SELECT id FROM lesson_participants WHERE lesson_id = ? AND student_id = ?').get(lesson.id, msg.author.id);
          if (!ep) {
            try {
              db.prepare(`INSERT INTO lesson_participants (id, lesson_id, student_id, student_name, house, is_present, points_awarded, comment) VALUES (?, ?, ?, ?, ?, 1, 10, 'Aktywny udział w wątku')`)
                .run(`part-${Date.now()}-${msg.author.id}`, lesson.id, msg.author.id, msg.member?.displayName || msg.author.username, userHouse);
            } catch (_) {}
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

    if (commandName === 'zaklecie') {
      const formula = interaction.options.getString('formula');
      await interaction.editReply(`⚡ *„${formula}”* — chłodne powietrze faluje, a na ścianach komnaty rozbłyskują blade nordyckie runy.`);
    }

    if (commandName === 'losowanie') {
      const zakon = interaction.options.getString('zakon');
      const houseNames = { reinhall: '🦌 Reinhall', bjornhall: '🐻 Björnhall', ravnheim: '🐦 Ravnheim', otergard: '🦦 Otergard' };
      const label = zakon ? `z Zakonu ${houseNames[zakon] || zakon}` : 'spośród wszystkich obecnych adeptów';
      await interaction.editReply(`🎲 *Kielich Przeznaczenia krąży w powietrzu...* Wylosowano adepta ${label}!`);
    }

    // ==================== WERYFIKACJA I ROLE DISCORD ====================
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

          try {
            const created = await guild.roles.create({
              name: mapping.discord_role_name || mapping.role_label,
              color: mapping.color || '#c59f4e',
              reason: 'Automatyczne utworzenie roli przez bota Cytadeli Durmstrang'
            });
            guildRoles.set(created.id, created);
            return created;
          } catch (err) {
            return null;
          }
        };

        const rolesToAdd = [];

        // 1. Zweryfikowany
        const verifiedMap = mappings.find(m => m.internal_key === 'verified');
        if (verifiedMap) {
          const r = await getOrCreateRole(verifiedMap);
          if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
          else { assignedRoleNames.push(verifiedMap.discord_role_name); }
        }

        // 2. Zakon
        if (user.house) {
          const houseMap = mappings.find(m => m.category === 'house' && m.internal_key === user.house.toLowerCase());
          if (houseMap) {
            const r = await getOrCreateRole(houseMap);
            if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
            else { assignedRoleNames.push(houseMap.discord_role_name); }
          }
        }

        // 3. Ranga
        if (user.role) {
          const roleMap = mappings.find(m => m.category === 'role' && m.internal_key === user.role.toLowerCase());
          if (roleMap) {
            const r = await getOrCreateRole(roleMap);
            if (r) { rolesToAdd.push(r.id); assignedRoleNames.push(r.name); }
            else { assignedRoleNames.push(roleMap.discord_role_name); }
          }
        }

        // 4. Klasa
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

        if (member && rolesToAdd.length > 0) {
          try { await member.roles.add(rolesToAdd); } catch (roleErr) { console.warn('[Discord Role Error]', roleErr.message); }
        }

        try {
          if (member && user.full_name && member.manageable) {
            await member.setNickname(user.full_name);
          }
        } catch (_) {}
      }

      const now = new Date().toISOString();
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

      const houseColors = { reinhall: 0xC59F4E, bjornhall: 0x2EC4B6, ravnheim: 0xA855F7, otergard: 0xE63946 };
      const houseNames = { reinhall: '🦌 Zakon Reinhall (Jeleń)', bjornhall: '🐻 Zakon Björnhall (Niedźwiedź)', ravnheim: '🐦 Zakon Ravnheim (Kruk)', otergard: '🦦 Zakon Otergard (Wydra)' };
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

    if (commandName === 'synchronizuj') {
      const user = db.prepare('SELECT * FROM users WHERE discord_id = ?').get(interaction.user.id);
      if (!user) {
        await interaction.editReply('⚠️ Twoje konto Discord nie jest jeszcze powiązane z Cytadelą. Użyj najpierw `/weryfikuj kod: [KOD]`.');
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

    if (commandName === 'profil') {
      const user = db.prepare('SELECT * FROM users WHERE discord_id = ?').get(interaction.user.id);
      if (!user) {
        await interaction.editReply('⚠️ Nie odnaleziono profilu powiązanego z Twoim kontem Discord. Użyj `/weryfikuj kod: [KOD]`, aby połączyć konto.');
        return;
      }

      const houseNames = { reinhall: '🦌 Reinhall', bjornhall: '🐻 Björnhall', ravnheim: '🐦 Ravnheim', otergard: '🦦 Otergard' };
      const houseColors = { reinhall: 0xC59F4E, bjornhall: 0x2EC4B6, ravnheim: 0xA855F7, otergard: 0xE63946 };

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
  } catch (err) {
    console.warn('[Discord Interaction Error]', err.message);
  }
});

// Automatyczna archiwizacja wiadomości, embedów i załączników w wątku lekcyjnym
client.on('messageCreate', async (message) => {
  // Ignoruj tylko własnego bota Durmstranga, pozwalając na archiwizację botów takich jak Fibi APL. i kart zaklęć
  if (message.author.id === client.user?.id) return;

  const threadId = message.channel.id;
  const lesson = db.prepare("SELECT id FROM lessons WHERE discord_thread_id = ? AND status = 'draft' ORDER BY created_at DESC LIMIT 1").get(threadId);
  if (!lesson) return;

  let userHouse = 'reinhall';
  const memberRoles = message.member?.roles?.cache?.map(r => r.name.toLowerCase()) || [];
  if (memberRoles.some(r => r.includes('bjorn') || r.includes('niedźwiedź'))) userHouse = 'bjornhall';
  else if (memberRoles.some(r => r.includes('ravn') || r.includes('kruk'))) userHouse = 'ravnheim';
  else if (memberRoles.some(r => r.includes('oter') || r.includes('wydra'))) userHouse = 'otergard';

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

  // Format Embeds (np. Karta Zaklęcia Erecto od Fibi APL.)
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

  // Detect interaction / command usage
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

// Automatyczne powitanie nowych członków na serwerze Discord
client.on('guildMemberAdd', async (member) => {
  try {
    console.log(`❄️ [Discord Bot] Nowy adept przybył na serwer: ${member.user.tag} (${member.id})`);
    await sendWelcomeToGuild(member.guild, member);
  } catch (err) {
    console.error('❌ [Discord Bot] Błąd powitania nowego adepta:', err.message);
  }
});

client.login(token).catch(err => {
  console.error('\n❌ BŁĄD LOGOWANIA DISCORD:', err.message);
});
