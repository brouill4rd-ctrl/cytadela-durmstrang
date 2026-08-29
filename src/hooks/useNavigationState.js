import { useState, useEffect, useCallback } from 'react';
import { parseHashRoute } from '../context/schoolRouting.js';

export function useNavigationState() {
  const initialRoute = parseHashRoute();

  const [activeView, setActiveView] = useState(initialRoute.view || 'home');
  const [activeHouseTab, setActiveHouseTab] = useState(initialRoute.houseId || null);
  const [activeSubjectId, setActiveSubjectId] = useState(initialRoute.subjectId || null);
  const [activeLessonId, setActiveLessonId] = useState(initialRoute.lessonId || null);
  const [activeLessonTab, setActiveLessonTab] = useState('journal');
  const [activeDocumentSlug, setActiveDocumentSlug] = useState(initialRoute.docSlug || null);
  const [activeDocumentCategory, setActiveDocumentCategory] = useState(initialRoute.docCategory || 'all');
  const [activeGazetteIssueId, setActiveGazetteIssueId] = useState(initialRoute.gazetteIssueId || null);
  const [activeExamId, setActiveExamId] = useState(initialRoute.examId || null);
  const [activeExamAttemptId, setActiveExamAttemptId] = useState(initialRoute.examAttemptId || null);
  const [memoryTab, setMemoryTab] = useState(initialRoute.memoryTab || 'overview');
  const [memoryYearId, setMemoryYearId] = useState(initialRoute.memoryYearId || 'year-xvii');
  const [memoryPersonId, setMemoryPersonId] = useState(initialRoute.memoryPersonId || null);
  const [memoryHouseKey, setMemoryHouseKey] = useState(initialRoute.memoryHouseKey || 'ravnheim');
  const [activeHomeworkId, setActiveHomeworkId] = useState(initialRoute.homeworkId || null);
  const [activeHomeworkSubId, setActiveHomeworkSubId] = useState(initialRoute.homeworkSubId || null);

  // Navigation helpers
  const navigateToDocumentModule = (category, slug = null) => {
    setActiveDocumentCategory(category || 'all');
    setActiveDocumentSlug(slug);
    setActiveView('documents');
    if (slug) {
      window.location.hash = `#/dokument/${slug}`;
    } else if (category && category !== 'all') {
      window.location.hash = `#/${category}`;
    } else {
      window.location.hash = '#/dokumenty';
    }
  };

  const navigateToMemory = (tab = 'overview') => {
    setMemoryTab(tab);
    setActiveView('memory');
    if (tab === 'overview') window.location.hash = '#/izba-pamieci';
    else if (tab === 'trophies') window.location.hash = '#/izba-pamieci/sala-pucharow';
    else if (tab === 'documents') window.location.hash = '#/izba-pamieci/sala-dokumentow';
    else if (tab === 'wall-of-fame') window.location.hash = '#/izba-pamieci/sciana-chwaly';
    else if (tab === 'people') window.location.hash = '#/izba-pamieci/kronika';
    else if (tab === 'timeline') window.location.hash = '#/izba-pamieci/os-czasu';
    else if (tab === 'wizard') window.location.hash = '#/izba-pamieci/kreator';
    else window.location.hash = `#/izba-pamieci/${tab}`;
  };

  const navigateToMemoryYear = (yearId) => {
    setMemoryYearId(yearId);
    setMemoryTab('year');
    setActiveView('memory');
    window.location.hash = `#/izba-pamieci/${yearId}`;
  };

  const navigateToMemoryPerson = (personIdentifier) => {
    setMemoryPersonId(personIdentifier);
    setMemoryTab('person');
    setActiveView('memory');
    window.location.hash = `#/izba-pamieci/osoba/${encodeURIComponent(personIdentifier)}`;
  };

  const navigateToMemoryOrder = (houseKey) => {
    setMemoryHouseKey(houseKey);
    setMemoryTab('order');
    setActiveView('memory');
    window.location.hash = `#/izba-pamieci/zakon/${houseKey}`;
  };

  const navigateToAbsenceChamber = () => {
    setActiveView('absence-chamber');
    window.location.hash = '#/izba-przyjec';
  };

  const navigateToGazette = () => {
    setActiveView('gazette');
    window.location.hash = '#/gazetka';
  };

  const navigateToGazetteIssue = (issueId) => {
    setActiveGazetteIssueId(issueId);
    setActiveView('gazette-reader');
    window.location.hash = `#/gazetka/numer/${issueId}`;
  };

  const navigateToGazettePanel = () => {
    setActiveView('gazette-panel');
    window.location.hash = '#/gazetka/panel';
  };

  const navigateToGazetteArchive = () => {
    setActiveView('gazette-archive');
    window.location.hash = '#/gazetka/archiwum';
  };

  const navigateToExams = () => { setActiveView('exams'); window.location.hash = '#/egzaminy'; };
  const navigateToExamTaking = (attemptId) => { setActiveExamAttemptId(attemptId); setActiveView('exam-taking'); window.location.hash = `#/egzaminy/podejscie/${attemptId}`; };
  const navigateToExamResult = (attemptId) => { setActiveExamAttemptId(attemptId); setActiveView('exam-result'); window.location.hash = `#/egzaminy/wynik/${attemptId}`; };
  const navigateToExamCreator = (examId = null) => { setActiveExamId(examId); setActiveView('exam-creator'); window.location.hash = examId ? `#/egzaminy/kreator/${examId}` : '#/egzaminy/kreator'; };
  const navigateToExamGrading = (examId) => { setActiveExamId(examId); setActiveView('exam-grading'); window.location.hash = `#/egzaminy/sprawdzanie/${examId}`; };
  const navigateToExamBank = () => { setActiveView('exam-bank'); window.location.hash = '#/egzaminy/bank'; };

  // Handle browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHashRoute();
      if (parsed.view) {
        setActiveView(parsed.view);
        if (parsed.houseId) setActiveHouseTab(parsed.houseId);
        if (parsed.subjectId) setActiveSubjectId(parsed.subjectId);
        if (parsed.lessonId) setActiveLessonId(parsed.lessonId);
        if (parsed.docSlug !== undefined) setActiveDocumentSlug(parsed.docSlug);
        if (parsed.docCategory !== undefined) setActiveDocumentCategory(parsed.docCategory);
        if (parsed.gazetteIssueId !== undefined) setActiveGazetteIssueId(parsed.gazetteIssueId);
        if (parsed.examId !== undefined) setActiveExamId(parsed.examId);
        if (parsed.examAttemptId !== undefined) setActiveExamAttemptId(parsed.examAttemptId);
        if (parsed.homeworkId !== undefined) setActiveHomeworkId(parsed.homeworkId);
        if (parsed.homeworkSubId !== undefined) setActiveHomeworkSubId(parsed.homeworkSubId);
        if (parsed.memoryTab !== undefined) setMemoryTab(parsed.memoryTab);
        if (parsed.memoryYearId !== undefined) setMemoryYearId(parsed.memoryYearId);
        if (parsed.memoryPersonId !== undefined) setMemoryPersonId(parsed.memoryPersonId);
        if (parsed.memoryHouseKey !== undefined) setMemoryHouseKey(parsed.memoryHouseKey);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync state changes to browser URL hash
  useEffect(() => {
    let targetHash = '#/';
    switch (activeView) {
      case 'home':         targetHash = '#/'; break;
      case 'rules-guide':  targetHash = '#/zasady'; break;
      case 'timetable':    targetHash = '#/plan'; break;
      case 'journals':     targetHash = '#/dzienniki'; break;
      case 'lesson-detail':
        targetHash = activeLessonId ? `#/lekcja/${activeLessonId}` : '#/dzienniki';
        break;
      case 'academic':     targetHash = '#/przedmioty'; break;
      case 'subject-detail':
        targetHash = activeSubjectId ? `#/przedmiot/${activeSubjectId}` : '#/przedmioty';
        break;
      case 'houses':
        targetHash = activeHouseTab ? `#/domy/${activeHouseTab}` : '#/domy';
        break;
      case 'ceremony':     targetHash = '#/ceremonia'; break;
      case 'rune-workshop':targetHash = '#/warsztat'; break;
      case 'map':          targetHash = '#/mapa'; break;
      case 'markethall':   targetHash = '#/rynek'; break;
      case 'bank':         targetHash = '#/bank'; break;
      case 'profile':      targetHash = '#/profil'; break;
      case 'lore':         targetHash = '#/lore'; break;
      case 'raven-post':   targetHash = '#/poczta'; break;
      case 'admin':        targetHash = '#/admin'; break;
      case 'professor-journal-editor': targetHash = '#/redaguj-dziennik'; break;
      case 'gazette':      targetHash = '#/gazetka'; break;
      case 'gazette-reader':
        targetHash = activeGazetteIssueId ? `#/gazetka/numer/${activeGazetteIssueId}` : '#/gazetka';
        break;
      case 'gazette-archive': targetHash = '#/gazetka/archiwum'; break;
      case 'gazette-panel':   targetHash = '#/gazetka/panel'; break;
      case 'exams':           targetHash = '#/egzaminy'; break;
      case 'exam-taking':
        targetHash = activeExamAttemptId ? `#/egzaminy/podejscie/${activeExamAttemptId}` : '#/egzaminy';
        break;
      case 'exam-result':
        targetHash = activeExamAttemptId ? `#/egzaminy/wynik/${activeExamAttemptId}` : '#/egzaminy';
        break;
      case 'exam-creator':
        targetHash = activeExamId ? `#/egzaminy/kreator/${activeExamId}` : '#/egzaminy/kreator';
        break;
      case 'exam-grading':
        targetHash = activeExamId ? `#/egzaminy/sprawdzanie/${activeExamId}` : '#/egzaminy';
        break;
      case 'exam-bank':    targetHash = '#/egzaminy/bank'; break;
      case 'homework':     targetHash = '#/prace-domowe'; break;
      case 'homework-detail':
        targetHash = activeHomeworkId ? `#/praca-domowa/${activeHomeworkId}` : '#/prace-domowe';
        break;
      case 'homework-creator':  targetHash = '#/zadaj-prace'; break;
      case 'homework-grading':
        targetHash = activeHomeworkId ? `#/sprawdzaj-prace/${activeHomeworkId}` : '#/prace-domowe';
        break;
      case 'documents':
        if (activeDocumentSlug) {
          targetHash = `#/dokument/${activeDocumentSlug}`;
        } else if (activeDocumentCategory && activeDocumentCategory !== 'all') {
          targetHash = `#/${activeDocumentCategory}`;
        } else {
          targetHash = '#/dokumenty';
        }
        break;
      case 'memory':
        if (memoryTab === 'overview' || !memoryTab) {
          targetHash = '#/izba-pamieci';
        } else if (memoryTab === 'trophies') {
          targetHash = '#/izba-pamieci/sala-pucharow';
        } else if (memoryTab === 'documents') {
          targetHash = '#/izba-pamieci/sala-dokumentow';
        } else if (memoryTab === 'wall-of-fame') {
          targetHash = '#/izba-pamieci/sciana-chwaly';
        } else if (memoryTab === 'people') {
          targetHash = '#/izba-pamieci/kronika';
        } else if (memoryTab === 'timeline') {
          targetHash = '#/izba-pamieci/os-czasu';
        } else if (memoryTab === 'wizard') {
          targetHash = '#/izba-pamieci/kreator';
        } else if (memoryTab === 'person' && memoryPersonId) {
          targetHash = `#/izba-pamieci/osoba/${encodeURIComponent(memoryPersonId)}`;
        } else if (memoryTab === 'order' && memoryHouseKey) {
          targetHash = `#/izba-pamieci/zakon/${memoryHouseKey}`;
        } else if (memoryTab === 'year' && memoryYearId) {
          targetHash = `#/izba-pamieci/${memoryYearId}`;
        } else {
          targetHash = '#/izba-pamieci';
        }
        break;
      default:
        targetHash = `#/${activeView}`;
    }

    if (
      window.location.hash !== targetHash &&
      !(activeView === 'home' && (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#'))
    ) {
      window.location.hash = targetHash;
    }
  }, [activeView, activeHouseTab, activeSubjectId, activeLessonId, activeDocumentSlug, activeDocumentCategory, activeGazetteIssueId, activeExamId, activeExamAttemptId, activeHomeworkId, memoryTab, memoryYearId, memoryPersonId, memoryHouseKey]);

  const navigateTo = useCallback((view, options = {}) => {
    if (options.houseId) setActiveHouseTab(options.houseId);
    if (options.subjectId) setActiveSubjectId(options.subjectId);
    if (options.lessonId) setActiveLessonId(options.lessonId);
    setActiveView(view);
  }, []);

  return {
    activeView, setActiveView,
    activeHouseTab, setActiveHouseTab,
    activeSubjectId, setActiveSubjectId,
    activeLessonId, setActiveLessonId,
    activeLessonTab, setActiveLessonTab,
    activeDocumentSlug, setActiveDocumentSlug,
    activeDocumentCategory, setActiveDocumentCategory,
    activeGazetteIssueId, setActiveGazetteIssueId,
    activeExamId, setActiveExamId,
    activeExamAttemptId, setActiveExamAttemptId,
    memoryTab, setMemoryTab,
    memoryYearId, setMemoryYearId,
    memoryPersonId, setMemoryPersonId,
    memoryHouseKey, setMemoryHouseKey,
    activeHomeworkId, setActiveHomeworkId,
    activeHomeworkSubId, setActiveHomeworkSubId,
    navigateTo,
    navigateToDocumentModule,
    navigateToMemory,
    navigateToMemoryYear,
    navigateToMemoryPerson,
    navigateToMemoryOrder,
    navigateToAbsenceChamber,
    navigateToGazette,
    navigateToGazetteIssue,
    navigateToGazettePanel,
    navigateToGazetteArchive,
    navigateToExams,
    navigateToExamTaking,
    navigateToExamResult,
    navigateToExamCreator,
    navigateToExamGrading,
    navigateToExamBank,
  };
}
