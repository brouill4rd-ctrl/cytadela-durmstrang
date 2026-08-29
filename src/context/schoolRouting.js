export const ROUTE_ALIASES = {
  '/': 'home',
  '/glowna': 'home',
  '/start': 'home',
  '/home': 'home',
  '/zasady': 'rules-guide',
  '/regulamin': 'rules-guide',
  '/kodeks': 'rules-guide',
  '/przewodnik': 'rules-guide',
  '/faq': 'rules-guide',
  '/zasady-oceniania': 'rules-guide',
  '/pakt': 'rules-guide',
  '/rules': 'rules-guide',
  '/wladze': 'documents',
  '/obowiazki': 'documents',
  '/obowiazki-wladz': 'documents',
  '/kompetencje': 'documents',
  '/wladze-twierdzy': 'documents',
  '/dekrety': 'documents',
  '/edykty': 'documents',
  '/regulamin-dc': 'documents',
  '/regulamin-discord': 'documents',
  '/statut': 'documents',
  '/zabawy': 'documents',
  '/gry': 'documents',
  '/dokumenty': 'documents',
  '/dokument': 'documents',
  '/podstrony': 'documents',
  '/codex': 'documents',
  '/plan': 'timetable',
  '/plan-lekcji': 'timetable',
  '/harmonogram': 'timetable',
  '/timetable': 'timetable',
  '/grafik': 'timetable',
  '/dziennik': 'journals',
  '/dzienniki': 'journals',
  '/lekcje': 'journals',
  '/journals': 'journals',
  '/przedmioty': 'academic',
  '/katedry': 'academic',
  '/akademia': 'academic',
  '/nauka': 'academic',
  '/academic': 'academic',
  '/domy': 'houses',
  '/zakony': 'houses',
  '/houses': 'houses',
  '/reinhall': 'houses',
  '/bjornhall': 'houses',
  '/ravnheim': 'houses',
  '/otergard': 'houses',
  '/ceremonia': 'ceremony',
  '/przydzial': 'ceremony',
  '/kamien-przysiegi': 'ceremony',
  '/ceremony': 'ceremony',
  '/warsztat': 'rune-workshop',
  '/galdrastofa': 'rune-workshop',
  '/runy': 'rune-workshop',
  '/alchemia': 'rune-workshop',
  '/workshop': 'rune-workshop',
  '/mapa': 'map',
  '/cytadela': 'map',
  '/teren': 'map',
  '/map': 'map',
  '/rynek': 'markethall',
  '/sklep': 'markethall',
  '/kaupangr': 'markethall',
  '/targ': 'markethall',
  '/market': 'markethall',
  '/bank': 'bank',
  '/skarbiec': 'bank',
  '/skirnir': 'bank',
  '/waluta': 'bank',
  '/profil': 'profile',
  '/karta-postaci': 'profile',
  '/ekwipunek': 'profile',
  '/paszport': 'profile',
  '/profile': 'profile',
  '/lore': 'lore',
  '/kroniki': 'lore',
  '/archiwum': 'lore',
  '/historia': 'lore',
  '/bestiariusz': 'lore',
  '/poczta': 'raven-post',
  '/kruki': 'raven-post',
  '/wiadomosci': 'raven-post',
  '/raven-post': 'raven-post',
  '/admin': 'admin',
  '/cms': 'admin',
  '/dyrekcja': 'admin',
  '/gazetka': 'gazette',
  '/gazeta': 'gazette',
  '/zelazne-pioro': 'gazette',
  '/pioro': 'gazette',
  '/gazette': 'gazette',
  '/iron-quill': 'gazette',
  '/gazette-archive': 'gazette-archive',
  '/gazette-panel': 'gazette-panel',
  '/gazette-reader': 'gazette-reader',
  '/egzaminy': 'exams',
  '/egzamin': 'exams',
  '/sesja-egzaminacyjna': 'exams',
  '/exams': 'exams',
  '/exam': 'exams',
  '/prace-domowe': 'homework',
  '/praca-domowa': 'homework',
  '/homework': 'homework',
  '/zadania-domowe': 'homework',
  '/zadania': 'homework',
  '/prace': 'homework',
  '/homework-creator': 'homework-creator',
  '/homework-grading': 'homework-grading',
  '/zadaj-prace': 'homework-creator',
  '/sprawdzaj-prace': 'homework-grading',
  '/izba-przyjec': 'absence-chamber',
  '/usprawiedliwienia': 'absence-chamber',
  '/nieobecnosci': 'absence-chamber',
  '/absence': 'absence-chamber',
  '/absence-chamber': 'absence-chamber',
  '/izba-usprawiedliwien': 'absence-chamber',
  '/izba-pamieci': 'memory',
  '/pamiec': 'memory',
  '/memory': 'memory',
  '/archiwum-lat': 'memory',
  '/sala-pamieci': 'memory',
  '/sala-pucharow': 'memory',
  '/sala-dokumentow': 'memory',
  '/sciana-chwaly': 'memory',
  '/kronika-ludzi': 'memory',
  '/os-czasu': 'memory'
};

export function parseHashRoute() {
  if (typeof window === 'undefined') return { view: 'home' };
  const rawHash = window.location.hash.replace(/^#/, '').trim();
  if (!rawHash || rawHash === '/' || rawHash === '') return { view: 'home' };

  const normalized = rawHash.startsWith('/') ? rawHash : `/${rawHash}`;
  const parts = normalized.split('?')[0].split('/').filter(Boolean);
  const root = `/${parts[0] || ''}`.toLowerCase();

  if (root === '/dokument' || root === '/strona' || root === '/podstrona') {
    if (parts[1]) return { view: 'documents', docSlug: parts[1] };
    return { view: 'documents' };
  }
  if (['/wladze', '/obowiazki-wladz', '/obowiazki', '/kompetencje', '/wladze-twierdzy'].includes(root)) {
    return { view: 'documents', docCategory: 'wladze', docSlug: 'obowiazki-i-kompetencje-wladz-twierdzy' };
  }
  if (['/dekrety', '/wizytacje', '/hospitacje', '/regulamin-dc', '/regulamin-discord', '/statut', '/zabawy', '/dokumenty'].includes(root)) {
    return { view: 'documents', docCategory: root.replace('/', '') };
  }

  if (root === '/lekcja' || root === '/dziennik') {
    if (parts[1]) return { view: 'lesson-detail', lessonId: parts[1] };
    return { view: 'journals' };
  }
  if (root === '/przedmiot' || root === '/katedra') {
    if (parts[1]) return { view: 'subject-detail', subjectId: parts[1] };
    return { view: 'academic' };
  }
  if (root === '/domy' || root === '/zakony') {
    if (parts[1]) return { view: 'houses', houseId: parts[1] };
    return { view: 'houses' };
  }
  if (['/reinhall', '/bjornhall', '/ravnheim', '/otergard'].includes(root)) {
    return { view: 'houses', houseId: parts[0] };
  }
  if (root === '/zasady' || root === '/regulamin' || root === '/kodeks' || root === '/przewodnik' || root === '/faq') {
    return { view: 'rules-guide', tab: parts[1] || null };
  }

  if (root === '/gazetka' || root === '/gazeta' || root === '/zelazne-pioro' || root === '/gazette' || root === '/pioro') {
    if (parts[1] === 'archiwum' || parts[1] === 'archive') return { view: 'gazette-archive' };
    if ((parts[1] === 'numer' || parts[1] === 'issue' || parts[1] === 'czytaj') && parts[2]) return { view: 'gazette-reader', gazetteIssueId: parts[2] };
    if (parts[1] === 'panel' || parts[1] === 'redakcja') return { view: 'gazette-panel' };
    return { view: 'gazette' };
  }
  if (root === '/gazette-reader' || root === '/czytnik-gazetki') {
    return { view: 'gazette-reader', gazetteIssueId: parts[1] || null };
  }
  if (root === '/gazette-archive' || root === '/archiwum-gazetki') {
    return { view: 'gazette-archive' };
  }
  if (root === '/gazette-panel' || root === '/redakcja-gazetki' || (root === '/panel' && parts[1] === 'gazetka')) {
    return { view: 'gazette-panel' };
  }

  if (root === '/egzaminy' || root === '/egzamin' || root === '/exams' || root === '/exam' || root === '/sesja-egzaminacyjna') {
    if (parts[1] === 'podejscie' && parts[2]) return { view: 'exam-taking', examAttemptId: parts[2] };
    if (parts[1] === 'wynik' && parts[2]) return { view: 'exam-result', examAttemptId: parts[2] };
    if (parts[1] === 'kreator') return { view: 'exam-creator', examId: parts[2] || null };
    if (parts[1] === 'sprawdzanie' && parts[2]) return { view: 'exam-grading', examId: parts[2] };
    if (parts[1] === 'bank') return { view: 'exam-bank' };
    if (parts[1]) return { view: 'exams', examId: parts[1] };
    return { view: 'exams' };
  }

  if (root === '/exam-creator') return { view: 'exam-creator', examId: parts[1] || null };
  if (root === '/exam-grading') return { view: 'exam-grading', examId: parts[1] || null };
  if (root === '/exam-taking') return { view: 'exam-taking', examAttemptId: parts[1] || null };
  if (root === '/exam-result') return { view: 'exam-result', examAttemptId: parts[1] || null };
  if (root === '/exam-bank') return { view: 'exam-bank' };

  if (['/prace-domowe', '/praca-domowa', '/homework', '/zadania-domowe', '/zadania', '/prace'].includes(root)) {
    if (parts[1] === 'kreator' || parts[1] === 'zadaj' || parts[1] === 'nowa') return { view: 'homework-creator' };
    if (parts[1] === 'sprawdzanie' || parts[1] === 'ocenianie' || parts[1] === 'grading') return { view: 'homework-grading', homeworkId: parts[2] || null };
    if (parts[1]) return { view: 'homework-detail', homeworkId: parts[1] };
    return { view: 'homework' };
  }
  if (root === '/zadaj-prace' || root === '/homework-creator') {
    return { view: 'homework-creator' };
  }
  if (root === '/sprawdzaj-prace' || root === '/homework-grading') {
    return { view: 'homework-grading', homeworkId: parts[1] || null };
  }

  if (['/izba-pamieci', '/pamiec', '/archiwum-lat', '/sala-pamieci', '/memory'].includes(root)) {
    if (parts[1] === 'rok' || parts[1] === 'year') {
      return { view: 'memory', memoryTab: 'year', memoryYearId: parts[2] || 'year-xvii' };
    }
    if (parts[1] === 'osoba' || parts[1] === 'postac' || parts[1] === 'person') {
      return { view: 'memory', memoryTab: 'person', memoryPersonId: parts[2] || null };
    }
    if (parts[1] === 'zakon' || parts[1] === 'dom' || parts[1] === 'order') {
      return { view: 'memory', memoryTab: 'order', memoryHouseKey: parts[2] || 'ravnheim' };
    }
    if (parts[1] === 'sciana-chwaly' || parts[1] === 'chwala' || parts[1] === 'wall') {
      return { view: 'memory', memoryTab: 'wall-of-fame' };
    }
    if (parts[1] === 'sala-pucharow' || parts[1] === 'puchary' || parts[1] === 'trophies') {
      return { view: 'memory', memoryTab: 'trophies' };
    }
    if (parts[1] === 'sala-dokumentow' || parts[1] === 'dokumenty' || parts[1] === 'documents') {
      return { view: 'memory', memoryTab: 'documents' };
    }
    if (parts[1] === 'kronika' || parts[1] === 'ludzie' || parts[1] === 'people') {
      return { view: 'memory', memoryTab: 'people' };
    }
    if (parts[1] === 'os-czasu' || parts[1] === 'timeline' || parts[1] === 'historia') {
      return { view: 'memory', memoryTab: 'timeline' };
    }
    if (parts[1] === 'kreator' || parts[1] === 'archiwizuj' || parts[1] === 'wizard') {
      return { view: 'memory', memoryTab: 'wizard' };
    }
    if (parts[1]) {
      return { view: 'memory', memoryTab: 'year', memoryYearId: parts[1] };
    }
    return { view: 'memory', memoryTab: 'overview' };
  }
  if (root === '/sala-pucharow') return { view: 'memory', memoryTab: 'trophies' };
  if (root === '/sala-dokumentow') return { view: 'memory', memoryTab: 'documents' };
  if (root === '/sciana-chwaly') return { view: 'memory', memoryTab: 'wall-of-fame' };
  if (root === '/os-czasu') return { view: 'memory', memoryTab: 'timeline' };
  if (root === '/kronika-ludzi') return { view: 'memory', memoryTab: 'people' };

  if (ROUTE_ALIASES[root]) {
    return { view: ROUTE_ALIASES[root] };
  }

  return { view: 'home' };
}
