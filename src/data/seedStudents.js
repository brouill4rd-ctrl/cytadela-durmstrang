export const DEMO_ACCOUNTS = {
  student: {
    id: 'stud-1',
    name: 'Valdemar',
    surname: 'Krag-Hansen',
    fullName: 'Valdemar Krag-Hansen',
    role: 'student',
    house: 'ravnheim',
    title: 'Adept Drugiego Kręgu Ravnheim',
    classYear: 'Rok IV • Semestr Zimowy',
    origin: 'Trondheim, Północne Fiordy',
    level: 4,
    xp: 840,
    nextLevelXp: 1200,
    points: 115,
    currency: 340,
    wand: {
      wood: 'Czarne Drzewo Cisowe z Gór Skandynawskich',
      core: 'Włókno z Serca Wilka Lodowcowego',
      length: '12¾ cala',
      flexibility: 'Sztywna, nieugięta w dłoni'
    },
    patronus: 'Puchacz Śnieżny (Bubo scandiacus)',
    companion: {
      type: 'Kruk Mądrości',
      name: 'Hugin',
      affinityLevel: 6,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    grades: [
      { subjectId: 'czarna-magia', subjectName: 'Czarna Magia i Nekromancja', lessonTitle: 'Wiązanie Cieni', grade: 'Wybitny (W)', professor: 'Prof. Morana Vane' },
      { subjectId: 'starozytne-runy', subjectName: 'Starożytne Runy Północy', lessonTitle: 'Futhark Starszy', grade: 'Powyżej Oczekiwań (P)', professor: 'Prof. Sigrid Hällström' },
      { subjectId: 'klatwy-i-uroki', subjectName: 'Klątwy i Magia Bojowa', lessonTitle: 'Tarcza Żelaza', grade: 'Wybitny (W)', professor: 'Prof. Gunnar Vargson' }
    ],
    inventory: [
      { id: 'item-1', name: 'Zimowa Opończa z Wilczym Kołnierzem', category: 'robes', rarity: 'rare', icon: 'Shirt' },
      { id: 'item-2', name: 'Różdżka Cisowa (Wilcze Serce)', category: 'wands', rarity: 'epic', icon: 'Sparkles' },
      { id: 'item-3', name: 'Grimuar: Rytuały Ciemnego Przesilenia', category: 'grimoires', rarity: 'legendary', icon: 'BookOpen' },
      { id: 'item-4', name: 'Krople Czystego Lodu (Eliksir Odporności)', category: 'potions', rarity: 'common', icon: 'FlaskConical' }
    ]
  },
  professor: {
    id: 'prof-1',
    name: 'Morana',
    surname: 'Vane',
    fullName: 'Prof. Morana Vane',
    role: 'professor',
    house: 'ravnheim',
    title: 'Opiekunka Zakonu Ravnheim • Katedra Czarnej Magii',
    office: 'Wieża Nocnych Szeptów, Sala Cienia IV',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    subjectsTaught: ['czarna-magia', 'astronomia-i-zorze']
  },
  admin: {
    id: 'admin-1',
    name: 'Valgerda',
    surname: 'Storm',
    fullName: 'Arcymistrzyni Valgerda Storm',
    role: 'admin',
    house: null,
    title: 'Arcymistrzyni Cytadeli Durmstrang • Strażniczka Paktu 1294',
    office: 'Komnaty Najwyższej Wieży Durmstrang',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
  }
};

export const LEADERBOARD_STUDENTS = [
  { id: 'stud-2', name: 'Astrid Vargadottir', fullName: 'Astrid Vargadottir', house: 'bjornhall', points: 145, year: 'V', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 'stud-1', name: 'Valdemar Krag-Hansen', fullName: 'Valdemar Krag-Hansen', house: 'ravnheim', points: 115, year: 'IV', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 'stud-3', name: 'Magnus Blom', fullName: 'Magnus Blom', house: 'reinhall', points: 110, year: 'VI', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 'stud-4', name: 'Sigrun Lindqvist', fullName: 'Sigrun Lindqvist', house: 'otergard', points: 95, year: 'IV', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80' },
  { id: 'stud-5', name: 'Einar Jarnskjold', fullName: 'Einar Jarnskjold', house: 'bjornhall', points: 85, year: 'III', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' }
];

export const LEADERBOARD_STAFF = [
  { id: 'usr-valgerda', name: 'Valgerda Storm', fullName: 'Arcymistrzyni Valgerda Storm', role: 'admin', roleLabel: 'Dyrekcja Cytadeli', house: null, points: 320, department: 'Rada Dyrekcji Cytadeli', title: 'Arcymistrzyni Cytadeli Durmstrang', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80' },
  { id: 'usr-morana', name: 'Morana Vane', fullName: 'Prof. Morana Vane', role: 'professor', roleLabel: 'Opiekunka Ravnheim', house: 'ravnheim', points: 285, department: 'Czarna Magia & Klątwy', title: 'Katedra Czarnej Magii', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80' },
  { id: 'usr-gunnar', name: 'Gunnar Vargson', fullName: 'Prof. Gunnar Vargson', role: 'professor', roleLabel: 'Opiekun Björnhall', house: 'bjornhall', points: 260, department: 'Liga Bojowa & Hólmganga', title: 'Mistrz Szermierki Runicznej', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { id: 'usr-sigrid', name: 'Sigrid Hällström', fullName: 'Prof. Sigrid Hällström', role: 'professor', roleLabel: 'Opiekunka Reinhall', house: 'reinhall', points: 240, department: 'Starożytne Runy & Futhark', title: 'Katedra Starożytnych Run', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80' },
  { id: 'usr-klaus', name: 'Klaus Lindqvist', fullName: 'Prof. Klaus Lindqvist', role: 'professor', roleLabel: 'Opiekun Otergard', house: 'otergard', points: 220, department: 'Eliksiry & Toksyny Fiordów', title: 'Katedra Eliksirów & Toksyn', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' }
];

export const PENDING_APPLICATIONS = [
  {
    id: 'app-1',
    name: 'Henrik',
    surname: 'Frostgard',
    origin: 'Bergen, Królestwo Norwegii',
    age: '15',
    wand: 'Modrzew arktyczny, pióro gryfa śnieżnego, 13 cali',
    patronus: 'Ryś Północny',
    companion: 'Puchacz arktyczny (Sleipnir)',
    appearance: 'Wysoki, jasnowłosy adept z blizną na dłoni po próbie mrozu, ubrany w ciężki wełniany płaszcz.',
    backstory: 'Pochodzi ze starego rodu czarodziejów z fiordów Sognefjord. Od dziecka zgłębiał właściwości arktycznych ziół i run.',
    dateSubmitted: '2026-09-02',
    status: 'pending'
  }
];
