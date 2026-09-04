import {
  Home,
  GraduationCap,
  Users,
  Shield,
  Compass,
  Trophy,
  Scroll,
  Award,
  BookOpen,
  Calendar,
  Zap,
  ClipboardList,
  FileSignature,
  Feather,
  Flame,
  Landmark,
  Newspaper
} from 'lucide-react';

/**
 * SINGLE SOURCE OF TRUTH for the portal navigation.
 *
 * The desktop bar shows the 6 top-level entries exactly (icon over LABEL over
 * sublabel). Four of them carry a `children` list that opens as a dropdown on
 * click; the mobile drawer renders the whole tree. `view` is where the top-level
 * item itself navigates; `memoryTab` routes into an Izba Pamięci tab.
 *
 * Visibility:  auth: true -> logged-in only ;  roles: [...] -> those roles only
 * Active state: match: [...activeView]  (top item also lights on any child match)
 */

export const RESTRICTED_VIEWS = [
  'journals',
  'lesson-detail',
  'professor-journal-editor',
  'ceremony',
  'rune-workshop',
  'markethall',
  'bank',
  'profile',
  'raven-post',
  'admin',
  'absence-chamber',
  'enrollment-chamber'
];

export const PRIMARY_NAV = [
  {
    id: 'home',
    label: 'Twierdza',
    sublabel: 'Strona główna',
    icon: Home,
    view: 'home',
    match: ['home']
  },
  {
    id: 'academy',
    label: 'Akademia',
    sublabel: 'Lekcje i katedry',
    icon: GraduationCap,
    view: 'academic',
    match: [
      'academic', 'subject-detail',
      'journals', 'lesson-detail', 'professor-journal-editor',
      'exams', 'exam-taking', 'exam-result', 'exam-creator', 'exam-grading', 'exam-bank',
      'homework', 'homework-detail', 'homework-creator', 'homework-grading',
      'timetable', 'rules-guide', 'documents', 'rune-workshop'
    ],
    children: [
      { id: 'journals', label: 'Dzienniki Lekcyjne', view: 'journals', icon: Scroll, match: ['journals', 'lesson-detail', 'professor-journal-editor'] },
      { id: 'exams', label: 'Egzaminy', view: 'exams', icon: Award, match: ['exams', 'exam-taking', 'exam-result', 'exam-creator', 'exam-grading', 'exam-bank'] },
      { id: 'homework', label: 'Prace Domowe', view: 'homework', icon: BookOpen, match: ['homework', 'homework-detail', 'homework-creator', 'homework-grading'] },
      { id: 'timetable', label: 'Plan Lekcji & Sale', view: 'timetable', icon: Calendar, match: ['timetable'], badge: { text: 'GRAFIK', tone: 'gold' } },
      { id: 'academic', label: '15 Katedr & Lekcje', view: 'academic', icon: BookOpen, match: ['academic', 'subject-detail'], auth: true },
      { id: 'rules-guide', label: 'Pakt 1294 & Taryfikator', view: 'rules-guide', icon: Shield, match: ['rules-guide'], badge: { text: 'PAKT', tone: 'muted' } },
      { id: 'documents', label: 'Dekrety & Wizytacje', view: 'documents', hash: '#/dekrety', icon: Scroll, match: ['documents'], badge: { text: 'KODEKS', tone: 'gold' } },
      { id: 'rune-workshop', label: 'Warsztat Run (Galdr)', view: 'rune-workshop', icon: Zap, match: ['rune-workshop'], auth: true, accent: 'teal', badge: { text: 'NOWOŚĆ', tone: 'teal' } }
    ]
  },
  {
    id: 'adepci',
    label: 'Adepci',
    sublabel: 'Uczniowie',
    icon: Users,
    view: 'houses',
    match: ['absence-chamber', 'enrollment-chamber', 'raven-post'],
    children: [
      { id: 'houses-adepci', label: 'Wszyscy Adepci', view: 'houses', icon: Users, match: [] },
      { id: 'absence-chamber', label: 'Izba Przyjęć & Usprawiedliwień', view: 'absence-chamber', icon: ClipboardList, match: ['absence-chamber'], auth: true },
      { id: 'enrollment-chamber', label: 'Kancelaria Zapisów', view: 'enrollment-chamber', icon: FileSignature, match: ['enrollment-chamber'], auth: true },
      { id: 'raven-post', label: 'Krucza Poczta', view: 'raven-post', icon: Feather, match: ['raven-post'], auth: true }
    ]
  },
  {
    id: 'houses',
    label: 'Zakony',
    sublabel: 'Cztery domy',
    icon: Shield,
    view: 'houses',
    match: ['houses', 'ceremony', 'lore'],
    children: [
      { id: 'houses-main', label: 'Cztery Zakony', view: 'houses', icon: Shield, match: ['houses'] },
      { id: 'ceremony', label: 'Kamień Przysięgi', view: 'ceremony', icon: Flame, match: ['ceremony'], roles: ['student'] },
      { id: 'lore', label: 'Kroniki i Bestiariusz', view: 'lore', icon: Scroll, match: ['lore'] }
    ]
  },
  {
    id: 'map',
    label: 'Mapa',
    sublabel: 'Świat Północy',
    icon: Compass,
    view: 'map',
    match: ['map']
  },
  {
    id: 'rankings',
    label: 'Rankingi',
    sublabel: 'Puchary i punkty',
    icon: Trophy,
    view: 'memory',
    memoryTab: 'trophies',
    match: ['memory', 'gazette', 'gazette-reader', 'gazette-archive', 'gazette-panel'],
    children: [
      { id: 'trophies', label: 'Sala Pucharów', view: 'memory', memoryTab: 'trophies', icon: Trophy, match: ['memory'] },
      { id: 'north-cup', label: 'Puchar Północy', view: 'houses', icon: Shield, match: [] },
      { id: 'memory', label: 'Izba Pamięci', view: 'memory', memoryTab: 'overview', icon: Landmark, match: [] },
      { id: 'gazette', label: 'Żelazne Pióro (Gazeta)', view: 'gazette', icon: Newspaper, match: ['gazette', 'gazette-reader', 'gazette-archive', 'gazette-panel'], badge: { text: 'NOWOŚĆ', tone: 'gold' } }
    ]
  }
];

/** Flatten every leaf destination (mobile drawer + lookups). */
export function flattenNav(entries = PRIMARY_NAV) {
  const out = [];
  for (const entry of entries) {
    out.push(entry);
    if (entry.children) out.push(...entry.children);
  }
  return out;
}

/** Is `entry` visible for the current session? */
export function isVisible(entry, { currentUser, currentRole }) {
  if (!entry) return false;
  if (entry.auth && !currentUser) return false;
  if (entry.roles && !entry.roles.includes(currentRole)) return false;
  return true;
}

/** Does `activeView` fall under this entry (top item also lights on any visible child)? */
export function isActive(entry, activeView, session) {
  if ((entry.match || []).includes(activeView)) return true;
  if (entry.children) {
    return entry.children.some(
      (child) => isVisible(child, session) && (child.match || []).includes(activeView)
    );
  }
  return false;
}
