import React, { useState, useEffect, useRef } from 'react';
import { RichTextEditor } from '../components/RichTextEditor';
import { RichTextRenderer } from '../components/RichTextRenderer';
import { useSchool } from '../context/SchoolContext';
import { SubjectIcon } from '../components/SubjectIcon';
import { getSubjectBannerImage } from '../data/subjectBanners';
import {
  BookOpen, ArrowLeft, User, MapPin, ScrollText, FileText,
  Star, Award, Trophy, ChevronDown, ChevronUp, Edit3, Save,
  X, Plus, Trash2, CheckCircle2, Clock, Flame, Sparkles,
  GraduationCap, ClipboardList, MessageSquare, BarChart2, Shield
} from 'lucide-react';

// ===================================================================
// Skala ocen HP
// ===================================================================
const HP_GRADES = [
  { code: 'W', label: 'Wybitny', short: 'W', value: 5, color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.5)' },
  { code: 'P', label: 'Powyżej Oczekiwań', short: 'P', value: 4, color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.5)' },
  { code: 'Z', label: 'Zadowalający', short: 'Z', value: 3, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.5)' },
  { code: 'N', label: 'Nędzny', short: 'N', value: 2, color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.5)' },
  { code: 'T', label: 'Troll', short: 'T', value: 1, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)' },
];

function getGradeInfo(code) {
  return HP_GRADES.find(g => g.code === code) || HP_GRADES[2];
}

const GradeBadge = ({ grade, size = 'md' }) => {
  const info = getGradeInfo(grade);
  const sizes = { sm: { font: '0.7rem', pad: '0.1rem 0.4rem' }, md: { font: '0.82rem', pad: '0.2rem 0.65rem' }, lg: { font: '1rem', pad: '0.35rem 0.9rem' } };
  const s = sizes[size] || sizes.md;
  return (
    <span style={{
      display: 'inline-block',
      padding: s.pad,
      borderRadius: '5px',
      background: info.bg,
      border: `1px solid ${info.border}`,
      color: info.color,
      fontWeight: 800,
      fontSize: s.font,
      fontFamily: 'var(--font-heading)',
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap'
    }}>
      {info.code} — {info.label}
    </span>
  );
};

// ===================================================================
// Simple Markdown renderer (subset)
// ===================================================================
function renderMarkdownLite(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: '0.4rem' }} />;
        if (line.startsWith('# ')) return <h2 key={i} style={{ margin: '0.5rem 0 0.2rem', color: '#fff', fontSize: '1.3rem', fontFamily: 'var(--font-heading)', borderBottom: '1px solid rgba(197,159,78,0.25)', paddingBottom: '0.3rem' }}>{line.slice(2)}</h2>;
        if (line.startsWith('## ')) return <h3 key={i} style={{ margin: '0.4rem 0 0.15rem', color: 'var(--gold-glow)', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} style={{ margin: '0.3rem 0 0.1rem', color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 700 }}>{line.slice(4)}</h4>;
        if (/^\d+\./.test(line)) {
          const content = line.replace(/^\d+\.\s*/, '');
          return (
            <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', paddingLeft: '0.5rem' }}>
              <span style={{ color: 'var(--gold-ancient)', fontWeight: 700, minWidth: '1.2rem', fontFamily: 'var(--font-heading)', flexShrink: 0 }}>{line.match(/^\d+/)[0]}.</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: content.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#fff;font-weight:800">$1</strong>') }} />
            </div>
          );
        }
        if (line.startsWith('- ')) return (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', paddingLeft: '0.5rem' }}>
            <span style={{ color: 'var(--gold-ancient)', marginTop: '0.3rem', flexShrink: 0 }}>•</span>
            <span style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#fff;font-weight:800">$1</strong>') }} />
          </div>
        );
        return (
          <p key={i} style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#fff;font-weight:800">$1</strong>') }} />
        );
      })}
    </div>
  );
}

// ===================================================================
// Bezpieczny opis HTML katedry
// ===================================================================
const SUBJECT_DESCRIPTION_TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'MARK',
  'BLOCKQUOTE', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4', 'HR',
  'CODE', 'PRE', 'SMALL'
]);

const SUBJECT_THEMES = [
  { match: /alchemia|warzenie/i, accent: '#2ec4b6', rgb: '46, 196, 182' },
  { match: /historia|kroniki/i, accent: '#d4a574', rgb: '212, 165, 116' },
  { match: /języki|inskrypcje|runy/i, accent: '#a78bfa', rgb: '167, 139, 250' },
  { match: /kosmologia|astronomia/i, accent: '#38bdf8', rgb: '56, 189, 248' },
  { match: /pierwotna/i, accent: '#fb923c', rgb: '251, 146, 60' },
  { match: /praktyczna/i, accent: '#60a5fa', rgb: '96, 165, 250' },
  { match: /modyfikacja/i, accent: '#c084fc', rgb: '192, 132, 252' },
  { match: /ścisłe|numerologia/i, accent: '#22d3ee', rgb: '34, 211, 238' },
  { match: /obrona|przetrwanie/i, accent: '#f87171', rgb: '248, 113, 113' },
  { match: /przyroda|zielar|flora|stworzenia|smok/i, accent: '#56d590', rgb: '86, 213, 144' },
  { match: /bojowa|latanie/i, accent: '#f59e0b', rgb: '245, 158, 11' },
  { match: /tajemne|wróżbiar/i, accent: '#818cf8', rgb: '129, 140, 248' },
  { match: /zakazane|czarna magia|klątw|truciz/i, accent: '#e879f9', rgb: '232, 121, 249' }
];

function getSubjectTheme(subject) {
  const signature = `${subject?.category || ''} ${subject?.id || ''} ${subject?.name || ''}`;
  return SUBJECT_THEMES.find(theme => theme.match.test(signature)) || { accent: '#c59f4e', rgb: '197, 159, 78' };
}

function escapeSubjectHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const SAFE_STYLE_PROPS = new Set(['text-align', 'font-style', 'font-weight']);
const STYLE_BEARING_TAGS = new Set(['P', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'LI', 'DIV']);

function sanitizeInlineStyle(styleStr) {
  if (!styleStr) return '';
  return styleStr.split(';')
    .map(d => d.trim()).filter(Boolean)
    .filter(d => {
      const prop = d.split(':')[0]?.trim().toLowerCase();
      return prop && SAFE_STYLE_PROPS.has(prop);
    })
    .join('; ');
}

function splitDescriptionIntoParagraphs(text) {
  const explicitParagraphs = text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
  if (explicitParagraphs.length > 1 || text.length < 430) return explicitParagraphs;

  const sentences = text.match(/[^.!?]+[.!?]+(?:[”"»])?|[^.!?]+$/g)?.map(sentence => sentence.trim()).filter(Boolean) || [text];
  const paragraphs = [];
  let current = '';
  sentences.forEach(sentence => {
    if (current && current.length + sentence.length > 390) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
  });
  if (current) paragraphs.push(current);
  return paragraphs;
}

function formatSubjectDescriptionHtml(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const containsHtml = /<\/?[a-z][\s\S]*?>/i.test(text);
  if (!containsHtml) {
    return splitDescriptionIntoParagraphs(text)
      .map(paragraph => `<p>${escapeSubjectHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  if (typeof DOMParser === 'undefined') return escapeSubjectHtml(text);
  const documentFragment = new DOMParser().parseFromString(text, 'text/html');
  const forbiddenTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON']);

  Array.from(documentFragment.body.querySelectorAll('*')).forEach(node => {
    if (forbiddenTags.has(node.tagName)) {
      node.remove();
      return;
    }
    if (!SUBJECT_DESCRIPTION_TAGS.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }
    Array.from(node.attributes).forEach(attribute => {
      if (attribute.name === 'style' && STYLE_BEARING_TAGS.has(node.tagName)) {
        const safe = sanitizeInlineStyle(attribute.value);
        if (safe) node.setAttribute('style', safe);
        else node.removeAttribute('style');
      } else {
        node.removeAttribute(attribute.name);
      }
    });
  });

  return documentFragment.body.innerHTML;
}

function containsSubjectHtml(value) {
  return /<\/?[a-z][\s\S]*?>/i.test(String(value || ''));
}

const SubjectRichContent = ({ content }) => {
  if (!content) return null;
  return <RichTextRenderer content={content} className="subject-rich-content" />;
};


const SubjectDescriptionCard = ({ description, subject, compact = false, theme }) => {
  if (!description) return null;
  const formattedDescription = formatSubjectDescriptionHtml(description);
  const botanical = /zielar|roślin|flora|herb/i.test(`${subject?.id || ''} ${subject?.name || ''} ${subject?.category || ''}`);
  const activeTheme = theme || getSubjectTheme(subject);

  return (
    <section
      className={`subject-description-card${botanical ? ' subject-description-card--botanical' : ''}${compact ? ' subject-description-card--compact' : ''}`}
      style={{ '--description-accent': activeTheme.accent, '--description-accent-rgb': activeTheme.rgb }}
    >
      <div className="subject-description-card__aura" aria-hidden="true" />
      <div className="subject-description-card__particles" aria-hidden="true">
        {Array.from({ length: compact ? 3 : 7 }, (_, index) => (
          <span key={index} style={{ '--particle-index': index }} />
        ))}
      </div>
      <header className="subject-description-card__header">
        <div className="subject-description-card__sigil" aria-hidden="true">
          <span>{subject?.icon || '✦'}</span>
        </div>
        <div className="subject-description-card__heading">
          <span className="subject-description-card__eyebrow">Kronika Katedry</span>
          <h3>Opis Katedry</h3>
        </div>
        <div className="subject-description-card__rune" aria-hidden="true">ᛉ</div>
      </header>
      <div
        className="subject-description-card__body"
        dangerouslySetInnerHTML={{ __html: formattedDescription }}
      />
      {!compact && (
        <footer className="subject-description-card__footer" aria-hidden="true">
          <span>ᚱ</span><i />
          <small>Wiedza • Dyscyplina • Północ</small>
          <i /><span>ᛉ</span>
        </footer>
      )}
    </section>
  );
};

// ===================================================================
// SubjectDocumentView — piękny widok dokumentu (syllabus / regulamin)
// ===================================================================
const SubjectDocumentView = ({ content, label, subject, theme }) => {
  if (!content) return null;
  return (
    <div
      className="subject-doc-view"
      style={{ '--doc-accent': theme?.accent || '#c59f4e', '--doc-accent-rgb': theme?.rgb || '197, 159, 78' }}
    >
      <div className="subject-doc-view__aura" aria-hidden="true" />
      <header className="subject-doc-view__header">
        <div className="subject-doc-view__sigil" aria-hidden="true">
          <span>{subject?.icon || '📜'}</span>
        </div>
        <div>
          <span className="subject-doc-view__eyebrow">{label}</span>
          <div className="subject-doc-view__title">{subject?.name}</div>
        </div>
        <div className="subject-doc-view__runes" aria-hidden="true">ᛗ ᚱ ᛉ</div>
      </header>
      <div className="subject-doc-view__body">
        <SubjectRichContent content={content} />
      </div>
      <footer className="subject-doc-view__footer" aria-hidden="true">
        <span>ᚠ</span><i /><small>In Sapientia Fortitudo</small><i /><span>ᛞ</span>
      </footer>
    </div>
  );
};

// ===================================================================
// SubjectDetailView — główny komponent
// ===================================================================
export const SubjectDetailView = () => {
  const {
    activeSubjectDetail,
    activeSubjectId,
    setActiveView,
    getSubjectDetails,
    updateSubject,
    updateSyllabus,
    updateRegulations,
    addGrade,
    deleteGrade,
    currentUser,
    currentRole,
    hasPermission,
    users,
    houses,
    showNotification,
    setActiveLessonId,
    setActiveLessonTab
  } = useSchool();

  const [tab, setTab] = useState('overview');
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editing states
  const [editingSyllabus, setEditingSyllabus] = useState(false);
  const [syllabusText, setSyllabusText] = useState('');
  const [editingRegulations, setEditingRegulations] = useState(false);
  const [regulationsText, setRegulationsText] = useState('');
  const [savingText, setSavingText] = useState(false);

  // Grade form state
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [gradeForm, setGradeForm] = useState({ studentId: '', studentName: '', house: 'ravnheim', grade: 'Z', categoryId: '', title: '', comment: '' });
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [gradeFilter, setGradeFilter] = useState({ house: '', category: '' });

  // Admin edit state
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getSubjectDetails(activeSubjectId);
      if (data) {
        setSubject(data);
        setSyllabusText(data.syllabus || '');
        setRegulationsText(data.regulations || '');
        setInfoForm({
          name: data.name,
          code: data.code || '',
          icon: data.icon || '📚',
          classroom: data.classroom || '',
          description: data.description || '',
          professorId: data.professorId || '',
          professorName: data.professorName || '',
          bannerGradient: data.bannerGradient || 'linear-gradient(135deg, #1c132e 0%, #0d0618 100%)',
        });
      }
      setLoading(false);
    };
    if (activeSubjectId) load();
  }, [activeSubjectId]);

  useEffect(() => {
    if (activeSubjectDetail) {
      setSubject(activeSubjectDetail);
      setSyllabusText(activeSubjectDetail.syllabus || '');
      setRegulationsText(activeSubjectDetail.regulations || '');
    }
  }, [activeSubjectDetail]);

  if (loading || !subject) {
    return (
      <div className="view-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>ᚱ</div>
        <p style={{ color: '#c5cdd9', marginTop: '1rem', fontFamily: 'var(--font-heading)' }}>Otwieranie ksiąg Katedry…</p>
      </div>
    );
  }

  const isAdmin = currentRole === 'admin';
  const isProfessor = currentRole === 'professor';
  // Profesor może edytować tylko przedmiot, do którego jest przypisany
  const isAssignedProfessor = isProfessor && (
    currentUser?.id === subject.professorId ||
    subject.professors?.some(professor => professor.id === currentUser?.id) ||
    currentUser?.departmentName?.toLowerCase().includes(subject.id) ||
    (currentUser?.taughtSubjectIds && Array.isArray(currentUser.taughtSubjectIds) && currentUser.taughtSubjectIds.includes(subject.id)) ||
    (currentUser?.department && (currentUser.department === subject.id || currentUser.department.includes(subject.id)))
  );
  const canEditSyllabus = isAdmin || isAssignedProfessor;
  const canGrade = isAdmin || isAssignedProfessor;
  const canEditInfo = isAdmin || isAssignedProfessor;

  const grades = subject.grades || [];
  const categories = subject.categories || [];
  const canManageLessons = isAdmin || isAssignedProfessor || hasPermission('canManageLessons');
  const recentLessons = (subject.recentLessons || []).filter(l => canManageLessons || l.status === 'published');
  const stats = subject.stats || {};
  const achievements = stats.achievements || [];

  // Filter grades
  const filteredGrades = grades.filter(g => {
    if (gradeFilter.house && g.house !== gradeFilter.house) return false;
    if (gradeFilter.category && g.categoryId !== gradeFilter.category) return false;
    return true;
  });

  // Grade distribution
  const dist = stats.gradeDistribution || {};
  const totalGrades = grades.length;

  // Top students (honor board)
  const studentGrades = {};
  grades.forEach(g => {
    if (!studentGrades[g.studentId]) {
      studentGrades[g.studentId] = { name: g.studentName, house: g.house, total: 0, count: 0, best: 0 };
    }
    studentGrades[g.studentId].total += g.gradeValue;
    studentGrades[g.studentId].count++;
    if (g.gradeValue > studentGrades[g.studentId].best) studentGrades[g.studentId].best = g.gradeValue;
  });
  const topStudents = Object.values(studentGrades).sort((a, b) => (b.total / b.count) - (a.total / a.count)).slice(0, 5);

  const students = users?.filter(u => u.role === 'student' && u.status === 'approved') || [];

  const handleSaveSyllabus = async () => {
    setSavingText(true);
    const ok = await updateSyllabus(subject.id, syllabusText);
    if (ok) setSubject(prev => ({ ...prev, syllabus: syllabusText }));
    setEditingSyllabus(false);
    setSavingText(false);
  };

  const handleSaveRegulations = async () => {
    setSavingText(true);
    const ok = await updateRegulations(subject.id, regulationsText);
    if (ok) setSubject(prev => ({ ...prev, regulations: regulationsText }));
    setEditingRegulations(false);
    setSavingText(false);
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    const { professorId, professorName, ...professorEditableInfo } = infoForm;
    const updated = await updateSubject(subject.id, isAdmin ? infoForm : professorEditableInfo);
    if (updated) {
      setSubject(prev => ({
        ...prev,
        ...updated,
        grades: prev.grades || [],
        recentLessons: prev.recentLessons || [],
        stats: prev.stats || {}
      }));
      setEditingInfo(false);
    }
    setSavingInfo(false);
  };

  const insertHtmlAtSelection = (editorRef, value, setValue, openingTag, closingTag = '', placeholder = 'treść') => {
    // Legacy helper — kept for compatibility but no longer used
    const editor = editorRef?.current;
    const selectionStart = editor?.selectionStart ?? value.length;
    const selectionEnd = editor?.selectionEnd ?? value.length;
    const selection = value.slice(selectionStart, selectionEnd) || placeholder;
    const inserted = `${openingTag}${selection}${closingTag}`;
    const nextValue = `${value.slice(0, selectionStart)}${inserted}${value.slice(selectionEnd)}`;
    setValue(nextValue);

    requestAnimationFrame(() => {
      if (!editorRef.current) return;
      const nextSelectionStart = selectionStart + openingTag.length;
      editorRef.current.focus();
      editorRef.current.setSelectionRange(nextSelectionStart, nextSelectionStart + selection.length);
    });
  };

  const insertDescriptionHtml = (openingTag, closingTag = '', placeholder = 'treść') => insertHtmlAtSelection(
    null,
    infoForm.description || '',
    nextValue => setInfoForm(prev => ({ ...prev, description: nextValue })),
    openingTag,
    closingTag,
    placeholder
  );

  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!gradeForm.studentName || !gradeForm.grade || !gradeForm.categoryId) {
      showNotification('Brak Danych', 'Uzupełnij adept, kategorię i ocenę HP.', 'warning');
      return;
    }
    setSubmittingGrade(true);
    const selectedStudent = students.find(s => s.id === gradeForm.studentId);
    const result = await addGrade(subject.id, {
      ...gradeForm,
      studentId: gradeForm.studentId || `ext-${Date.now()}`,
      studentName: gradeForm.studentName || selectedStudent?.fullName || gradeForm.studentId,
      house: gradeForm.house,
      professorId: currentUser?.id || '',
      professorName: currentUser?.fullName || 'Profesor Katedry',
      date: new Date().toISOString().split('T')[0]
    });
    if (result) {
      setSubject(prev => ({ ...prev, grades: [result, ...(prev.grades || [])] }));
      setGradeForm({ studentId: '', studentName: '', house: 'ravnheim', grade: 'Z', categoryId: '', title: '', comment: '' });
      setShowGradeForm(false);
    }
    setSubmittingGrade(false);
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Usunąć tę ocenę z ksiąg katedry?')) return;
    const ok = await deleteGrade(subject.id, gradeId);
    if (ok) setSubject(prev => ({ ...prev, grades: (prev.grades || []).filter(g => g.id !== gradeId) }));
  };

  const houseArr = Object.values(houses || {});
  const subjectBannerImage = getSubjectBannerImage(subject);
  const subjectTheme = getSubjectTheme(subject);

  const TABS = [
    { id: 'overview', icon: <BookOpen size={15} />, label: 'Przegląd' },
    { id: 'syllabus', icon: <ScrollText size={15} />, label: 'Plan Nauczania' },
    { id: 'regulations', icon: <FileText size={15} />, label: 'Regulamin' },
    { id: 'grades', icon: <Star size={15} />, label: `Oceny (${grades.length})` },
    { id: 'lessons', icon: <MessageSquare size={15} />, label: `Dzienniki (${recentLessons.length})` },
  ];

  return (
    <div
      className="view-container animate-fade-in subject-detail-theme"
      style={{ paddingBottom: '5rem', '--subject-accent': subjectTheme.accent, '--subject-accent-rgb': subjectTheme.rgb }}
    >
      {/* ============================================================
          BANER + HEADER KATEDRY
      ============================================================ */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Powrót */}
        <button
          onClick={() => setActiveView('academic')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: 'var(--gold-ancient)', fontSize: '0.88rem', fontFamily: 'var(--font-heading)', cursor: 'pointer', padding: '0.3rem 0.5rem', marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} /> Powrót do Systemu Nauki
        </button>

        {/* Baner */}
        <div style={{
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(197,159,78,0.3)',
          boxShadow: '0 15px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            backgroundColor: '#0d0618',
            backgroundImage: subjectBannerImage
              ? `linear-gradient(180deg, rgba(7, 10, 15, 0.2) 0%, rgba(7, 10, 15, 0.48) 52%, rgba(7, 10, 15, 0.78) 100%), url("${subjectBannerImage}")`
              : subject.bannerGradient || 'linear-gradient(135deg, #1c132e 0%, #0d0618 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 44%',
            backgroundRepeat: 'no-repeat',
            padding: '2.5rem 2rem',
            position: 'relative'
          }}>
            {/* Dekoracyjne runy w tle */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04, fontSize: '8rem', fontFamily: 'var(--font-heading)', letterSpacing: '2rem', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 1rem', pointerEvents: 'none', userSelect: 'none' }}>
              ᚱᚢᚾᛖᛊᛏᚱᛟᛗ
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <SubjectIcon subject={subject} size={36} containerSize={68} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gold-ancient)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                      {subject.code} • {subject.category}
                    </span>
                    {(() => {
                      const years = subject.classYears || (Array.isArray(subject.classYear) ? subject.classYear : [subject.classYear]);
                      const isY1 = years.some(y => y === 'Klasa I' || y === 1 || y === '1' || (typeof y === 'string' && y.includes('I') && !y.includes('II')));
                      const isY2 = years.some(y => y === 'Klasa II' || y === 2 || y === '2' || (typeof y === 'string' && y.includes('II')));
                      let badge = { label: 'Katedra Ogólna', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)' };
                      if (isY1 && isY2) badge = { label: 'Klasa I & II', color: '#c59f4e', bg: 'rgba(197, 159, 78, 0.15)', border: 'rgba(197, 159, 78, 0.4)' };
                      else if (isY1) badge = { label: 'I Klasa • Fundamenty', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)' };
                      else if (isY2) badge = { label: 'II Klasa • Zaawansowana', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.18)', border: 'rgba(168, 85, 247, 0.4)' };
                      return (
                        <span style={{
                          fontSize: '0.66rem',
                          padding: '0.1rem 0.5rem',
                          borderRadius: '3px',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontWeight: 800,
                          fontFamily: 'var(--font-heading)'
                        }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <h1 style={{ margin: 0, fontSize: '2rem', color: '#ffffff', fontFamily: 'var(--font-heading)', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                    {subject.name}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {(() => {
                      const assignedProf = (users || []).find(u => (subject.professorId && u.id === subject.professorId) || (subject.professorName && (u.fullName === subject.professorName || u.name === subject.professorName)));
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '20px', padding: '0.25rem 0.75rem' }}>
                          {assignedProf?.avatar ? (
                            <img
                              src={assignedProf.avatar}
                              alt={assignedProf.fullName}
                              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold-ancient)' }}
                            />
                          ) : (
                            <User size={14} color="var(--gold-ancient)" />
                          )}
                          <span style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600 }}>
                            {subject.professorName || assignedProf?.fullName || 'Nie przypisano'}
                          </span>
                          {assignedProf?.role === 'admin' ? (
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: 'rgba(238,207,130,0.2)', border: '1px solid var(--gold-ancient)', color: 'var(--gold-ancient)', fontWeight: 800 }}>
                              👑 DYREKCJA
                            </span>
                          ) : assignedProf?.role === 'professor' ? (
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', background: 'rgba(164,200,225,0.15)', border: '1px solid #a4c8e1', color: '#a4c8e1', fontWeight: 700 }}>
                              📜 PROFESOR
                            </span>
                          ) : null}
                        </div>
                      );
                    })()}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c5cdd9', fontSize: '0.85rem' }}>
                      <MapPin size={14} /> {subject.classroom || 'Sala nieprzypisana'}
                    </span>
                    <button
                      onClick={() => setActiveView('timetable')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(197, 159, 78, 0.18)',
                        border: '1px solid var(--gold-ancient)',
                        borderRadius: '4px',
                        padding: '0.2rem 0.55rem',
                        color: 'var(--gold-glow)',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      <span>📅 Zobacz w Planie Lekcji</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Statystyki mini */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Lekcje', value: stats.lessonsCount || 0, icon: <BookOpen size={14} /> },
                  { label: 'Oceny', value: stats.totalGrades || 0, icon: <Star size={14} /> },
                  { label: 'Śr. ocena', value: stats.averageGrade ? HP_GRADES.find(g => g.value === Math.round(stats.averageGrade))?.code || '—' : '—', icon: <BarChart2 size={14} /> },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(197,159,78,0.2)', borderRadius: '8px', padding: '0.7rem 1.1rem', textAlign: 'center', minWidth: '70px', backdropFilter: 'blur(8px)' }}>
                    <div style={{ color: 'var(--gold-ancient)', marginBottom: '0.2rem' }}>{stat.icon}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          ZAKŁADKI NAWIGACJI
      ============================================================ */}
      <div className="subject-detail-tabs" style={{ display: 'flex', overflowX: 'auto', flexWrap: 'nowrap', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`subject-detail-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}

        {/* Dyrekcja lub przypisany profesor - edycja strony katedry */}
        {canEditInfo && (
          <button
            onClick={() => setEditingInfo(!editingInfo)}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', border: '1px solid rgba(197,159,78,0.4)', borderRadius: '8px', background: editingInfo ? 'rgba(197,159,78,0.2)' : 'transparent', color: 'var(--gold-ancient)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
          >
            <Edit3 size={13} /> {editingInfo ? 'Anuluj Edycję' : 'Edytuj Katedrę'}
          </button>
        )}
      </div>

      {/* ============================================================
          PANEL EDYCJI INFO
      ============================================================ */}
      {editingInfo && (
        <div style={{ background: 'rgba(197,159,78,0.07)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(197,159,78,0.2)', paddingBottom: '0.7rem' }}>
            <h3 style={{ color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✏️</span> {isAdmin ? 'Zarządzanie & Przypisanie Katedry' : 'Edycja Strony Katedry'}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {isAdmin ? 'Wybierz konto z listy, aby powiązać profesora i automatycznie uzupełnić dane' : 'Możesz edytować dane prowadzonego przez siebie przedmiotu'}
            </span>
          </div>

          {/* Szybki Selektor Konta Nauczyciela / Dyrekcji */}
          {isAdmin && <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--gold-glow)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <User size={15} /> 🧙‍♂️ Połączone Konto Nauczyciela / Dyrekcji
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'center' }}>
              <div>
                <select
                  value={infoForm.professorId || ''}
                  onChange={e => {
                    const selectedId = e.target.value;
                    const foundUser = (users || []).find(u => u.id === selectedId);
                    if (foundUser) {
                      setInfoForm(prev => ({
                        ...prev,
                        professorId: foundUser.id,
                        professorName: foundUser.fullName || `${foundUser.name} ${foundUser.surname}`.trim(),
                        classroom: prev.classroom && prev.classroom !== 'Sala nieprzypisana' ? prev.classroom : (foundUser.office || prev.classroom || '')
                      }));
                    } else {
                      setInfoForm(prev => ({
                        ...prev,
                        professorId: '',
                        professorName: ''
                      }));
                    }
                  }}
                  style={{ width: '100%', background: 'rgba(10,14,22,0.95)', border: '1px solid rgba(197,159,78,0.5)', borderRadius: '6px', padding: '0.6rem 0.8rem', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                >
                  <option value="">-- Wybierz konto z Cytadeli (Auto-uzupełnianie) --</option>
                  <optgroup label="👑 Rada Dyrekcji (Arcymistrzowie)">
                    {(users || []).filter(u => u.role === 'admin').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || `${u.name} ${u.surname}`} (@{u.username}) — {u.title || 'Dyrekcja'}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📜 Profesorowie Katedr">
                    {(users || []).filter(u => u.role === 'professor').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || `${u.name} ${u.surname}`} (@{u.username}) — {u.title || u.departmentName || 'Profesor'}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Podgląd połączonego profilu */}
              {(() => {
                const selectedProf = (users || []).find(u => u.id === infoForm.professorId);
                if (!selectedProf) return <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Wybierz konto z listy powyżej, aby automatycznie powiązać Katedrę z nauczycielem lub wpisz dane poniżej.</div>;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(197,159,78,0.1)', border: '1px solid rgba(197,159,78,0.25)', borderRadius: '6px', padding: '0.4rem 0.8rem' }}>
                    <img src={selectedProf.avatar} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold-ancient)' }} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ color: 'var(--gold-glow)', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {selectedProf.fullName} ({selectedProf.role === 'admin' ? 'Dyrekcja' : 'Profesor'})
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {selectedProf.office || selectedProf.title || `@${selectedProf.username}`}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nazwa Katedry</label>
              <input
                value={infoForm.name || ''}
                onChange={e => setInfoForm(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kod Przedmiotu</label>
              <input
                value={infoForm.code || ''}
                onChange={e => setInfoForm(prev => ({ ...prev, code: e.target.value }))}
                style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ikona (emoji)</label>
              <input
                value={infoForm.icon || ''}
                onChange={e => setInfoForm(prev => ({ ...prev, icon: e.target.value }))}
                style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sala / Lokacja</label>
              <input
                value={infoForm.classroom || ''}
                onChange={e => setInfoForm(prev => ({ ...prev, classroom: e.target.value }))}
                style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>
            {isAdmin && <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wyświetlana Nazwa Prowadzącego</label>
              <input
                value={infoForm.professorName || ''}
                onChange={e => setInfoForm(prev => ({ ...prev, professorName: e.target.value }))}
                style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>}

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Opis Katedry</label>
              <RichTextEditor
                value={infoForm.description || ''}
                onChange={val => setInfoForm(prev => ({ ...prev, description: val }))}
                placeholder="Opisz katedrę — czego uczysz, co studentów czeka..."
                minHeight={200}
              />
              {infoForm.description && (
                <div className="subject-description-preview">
                  <span className="subject-description-preview__label">Podgląd na żywo</span>
                  <SubjectDescriptionCard description={infoForm.description} subject={{ ...subject, ...infoForm }} compact theme={subjectTheme} />
                </div>
              )}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gradient Banera (CSS)</label>
              <input
                value={infoForm.bannerGradient || ''}
                onChange={e => setInfoForm(prev => ({ ...prev, bannerGradient: e.target.value }))}
                style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.82rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditingInfo(false)} style={{ padding: '0.45rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>Anuluj</button>
            <button onClick={handleSaveInfo} disabled={savingInfo} className="btn-durmstrang" style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem', gap: '0.35rem' }}>
              {savingInfo ? <><Clock size={13} /> Zapisywanie…</> : <><Save size={13} /> Zapisz Zmiany</>}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          ZAKŁADKA: PRZEGLĄD
      ============================================================ */}
      {tab === 'overview' && (
        <div className="subject-tab-content subject-tab-content--overview" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Opis */}
          {subject.description && (
            <SubjectDescriptionCard description={subject.description} subject={subject} theme={subjectTheme} />
          )}

          {/* Rozkład ocen */}
          {totalGrades > 0 && (
            <div className="subject-arcane-panel" style={{ background: 'rgba(10,14,22,0.7)', borderRadius: '10px', padding: '1.4rem' }}>
              <h3 className="subject-tab-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                <BarChart2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
                Rozkład Ocen HP
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {HP_GRADES.map(g => {
                  const count = dist[g.code] || 0;
                  const pct = totalGrades > 0 ? (count / totalGrades) * 100 : 0;
                  return (
                    <div key={g.code} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '130px', flexShrink: 0 }}>
                        <GradeBadge grade={g.code} size="sm" />
                      </div>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: g.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ width: '45px', textAlign: 'right', color: count > 0 ? g.color : '#6b7280', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tablica Honorowa */}
          {topStudents.length > 0 && (
            <div className="subject-arcane-panel" style={{ background: 'rgba(10,14,22,0.7)', borderRadius: '10px', padding: '1.4rem' }}>
              <h3 className="subject-tab-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                <Trophy size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
                Tablica Honorowa Katedry
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {topStudents.map((s, i) => {
                  const h = Object.values(houses || {}).find(hh => hh.id === s.house) || { crestIcon: 'ᛞ', name: s.house, colors: { secondary: '#c59f4e' } };
                  const avgVal = s.total / s.count;
                  const avg = HP_GRADES.find(g => g.value === Math.round(avgVal));
                  const rankBadges = ['I', 'II', 'III'];
                  return (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: i === 0 ? 'rgba(197,159,78,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? 'rgba(197,159,78,0.3)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '8px', padding: '0.7rem 1rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, minWidth: '1.8rem', textAlign: 'center', color: i === 0 ? 'var(--gold-ancient)' : i === 1 ? '#cbd5e1' : i === 2 ? '#d97706' : '#6b7280', fontFamily: 'var(--font-heading)' }}>
                        {rankBadges[i] || `#${i + 1}`}
                      </span>
                      <span style={{ color: h.colors?.secondary || '#c5cdd9', fontSize: '1rem', flexShrink: 0, fontFamily: 'serif' }}>{h.crestIcon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem' }}>{s.name}</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.78rem' }}>{h.name} • {s.count} ocen</div>
                      </div>
                      {avg && <GradeBadge grade={avg.code} size="sm" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Osiągnięcia */}
          {achievements.length > 0 && (
            <div className="subject-arcane-panel" style={{ background: 'rgba(10,14,22,0.7)', borderRadius: '10px', padding: '1.4rem' }}>
              <h3 className="subject-tab-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                <Award size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
                Osiągnięcia Katedry
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {achievements.map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(197,159,78,0.07)', border: '1px solid rgba(197,159,78,0.2)', borderRadius: '8px', padding: '0.85rem' }}>
                    <span style={{ fontSize: '1.6rem' }}>{a.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--gold-ancient)', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>{a.title}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.15rem' }}>{a.studentName}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.1rem' }}>{a.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          ZAKŁADKA: PLAN NAUCZANIA (SYLLABUS)
      ============================================================ */}
      {tab === 'syllabus' && (
        <div className="subject-tab-content subject-arcane-panel subject-document-panel" style={{ borderRadius: '10px', padding: '1.8rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 className="subject-tab-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              <ScrollText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Plan Nauczania — {subject.name}
            </h3>
            {canEditSyllabus && !editingSyllabus && (
              <button onClick={() => setEditingSyllabus(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', border: '1px solid rgba(197,159,78,0.4)', borderRadius: '6px', background: 'transparent', color: 'var(--gold-ancient)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                <Edit3 size={13} /> Edytuj Plan
              </button>
            )}
          </div>

          {editingSyllabus ? (
            <div>
              <RichTextEditor
                value={syllabusText}
                onChange={setSyllabusText}
                placeholder="Napisz plan nauczania — tematy, cele, harmonogram..."
                minHeight={400}
              />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.85rem', justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditingSyllabus(false); setSyllabusText(subject.syllabus || ''); }} style={{ padding: '0.45rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>Anuluj</button>
                <button onClick={handleSaveSyllabus} disabled={savingText} className="btn-durmstrang" style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem', gap: '0.35rem' }}>
                  {savingText ? <><Clock size={13} /> Zapisywanie…</> : <><Save size={13} /> Zapisz Syllabus</>}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ minHeight: '200px' }}>
              {subject.syllabus ? (
                <SubjectDocumentView content={subject.syllabus} label="Plan Nauczania" subject={subject} theme={subjectTheme} />
              ) : (
                <div className="subject-arcane-panel subject-empty-state" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', borderRadius: '10px' }}>
                  <ScrollText size={28} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem' }}>Plan nauczania nie został jeszcze opublikowany przez prowadzącego profesora.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          ZAKŁADKA: REGULAMIN
      ============================================================ */}
      {tab === 'regulations' && (
        <div className="subject-tab-content subject-arcane-panel subject-document-panel" style={{ borderRadius: '10px', padding: '1.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 className="subject-tab-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Regulamin Zajęć — {subject.name}
            </h3>
            {canEditSyllabus && !editingRegulations && (
              <button onClick={() => setEditingRegulations(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', border: '1px solid rgba(197,159,78,0.4)', borderRadius: '6px', background: 'transparent', color: 'var(--gold-ancient)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                <Edit3 size={13} /> Edytuj Regulamin
              </button>
            )}
          </div>

          {editingRegulations ? (
            <div>
              <RichTextEditor
                value={regulationsText}
                onChange={setRegulationsText}
                placeholder="Napisz regulamin zajęć — zasady, wymagania, nieobecności..."
                minHeight={320}
              />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.85rem', justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditingRegulations(false); setRegulationsText(subject.regulations || ''); }} style={{ padding: '0.45rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>Anuluj</button>
                <button onClick={handleSaveRegulations} disabled={savingText} className="btn-durmstrang" style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem', gap: '0.35rem' }}>
                  {savingText ? <><Clock size={13} /> Zapisywanie…</> : <><Save size={13} /> Zapisz Regulamin</>}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ minHeight: '150px' }}>
              {subject.regulations ? (
                <SubjectDocumentView content={subject.regulations} label="Regulamin Katedry" subject={subject} theme={subjectTheme} />
              ) : (
                <div className="subject-arcane-panel subject-empty-state" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', borderRadius: '10px' }}>
                  <FileText size={28} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem' }}>Regulamin zajęć nie został jeszcze opublikowany.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          ZAKŁADKA: OCENY HP
      ============================================================ */}
      {tab === 'grades' && (
        <div className="subject-tab-content subject-grades-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Header + Dodaj ocenę */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="subject-tab-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                <Star size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
                Księga Ocen HP — {subject.name}
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>Skala: Troll (T) → Nędzny (N) → Zadowalający (Z) → Powyżej Oczekiwań (P) → Wybitny (W)</p>
            </div>
            {canGrade && (
              <button onClick={() => setShowGradeForm(!showGradeForm)} className="btn-durmstrang" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.95rem' }}>
                {showGradeForm ? <><X size={14} /> Anuluj</> : <><Plus size={14} /> Wystaw Ocenę</>}
              </button>
            )}
          </div>

          {/* Formularz oceny */}
          {showGradeForm && canGrade && (
            <form className="subject-arcane-panel subject-grade-form" onSubmit={handleAddGrade} style={{ borderRadius: '10px', padding: '1.4rem' }}>
              <h4 style={{ color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', margin: '0 0 1rem', fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📋 Nowa Ocena HP</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                {/* Adept */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold-ancient)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Adept</label>
                  {students.length > 0 ? (
                    <select
                      value={gradeForm.studentId}
                      onChange={e => {
                        const s = students.find(st => st.id === e.target.value);
                        setGradeForm(prev => ({ ...prev, studentId: e.target.value, studentName: s?.fullName || '', house: s?.house || 'ravnheim' }));
                      }}
                      style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.45rem 0.7rem', color: '#fff', fontSize: '0.85rem' }}
                    >
                      <option value="">— Wybierz adepta —</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.house})</option>)}
                    </select>
                  ) : (
                    <input value={gradeForm.studentName} onChange={e => setGradeForm(prev => ({ ...prev, studentName: e.target.value }))} placeholder="Imię Adepta" style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.45rem 0.7rem', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  )}
                </div>
                {/* Zakon */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold-ancient)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Zakon</label>
                  <select value={gradeForm.house} onChange={e => setGradeForm(prev => ({ ...prev, house: e.target.value }))} style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.45rem 0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                    {houseArr.map(h => <option key={h.id} value={h.id}>{h.crestIcon} {h.name}</option>)}
                  </select>
                </div>
                {/* Kategoria */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold-ancient)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Kategoria</label>
                  <select value={gradeForm.categoryId} onChange={e => setGradeForm(prev => ({ ...prev, categoryId: e.target.value }))} style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.45rem 0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                    <option value="">— Kategoria —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                {/* Ocena HP */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold-ancient)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Ocena HP</label>
                  <select value={gradeForm.grade} onChange={e => setGradeForm(prev => ({ ...prev, grade: e.target.value }))} style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.45rem 0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                    {HP_GRADES.map(g => <option key={g.code} value={g.code}>{g.code} — {g.label}</option>)}
                  </select>
                </div>
                {/* Tytuł */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold-ancient)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Tytuł (np. nazwa zadania)</label>
                  <input value={gradeForm.title} onChange={e => setGradeForm(prev => ({ ...prev, title: e.target.value }))} placeholder="np. Esej: Pieczęć Wstrzymująca" style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.45rem 0.7rem', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                </div>
                {/* Komentarz */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gold-ancient)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Komentarz Profesora</label>
                  <textarea value={gradeForm.comment} onChange={e => setGradeForm(prev => ({ ...prev, comment: e.target.value }))} rows={2} placeholder="Uzasadnienie oceny..." style={{ width: '100%', background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', padding: '0.5rem 0.7rem', color: '#fff', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={submittingGrade} className="btn-durmstrang" style={{ padding: '0.5rem 1.4rem', fontSize: '0.87rem', gap: '0.4rem' }}>
                  {submittingGrade ? <><Clock size={13} /> Wpisywanie…</> : <><CheckCircle2 size={13} /> Wpisz Ocenę do Ksiąg</>}
                </button>
              </div>
            </form>
          )}

          {/* Filtry */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Filtruj:</span>
            <select value={gradeFilter.house} onChange={e => setGradeFilter(p => ({ ...p, house: e.target.value }))} style={{ background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '0.3rem 0.6rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
              <option value="">Wszystkie Zakony</option>
              {houseArr.map(h => <option key={h.id} value={h.id}>{h.crestIcon} {h.name}</option>)}
            </select>
            <select value={gradeFilter.category} onChange={e => setGradeFilter(p => ({ ...p, category: e.target.value }))} style={{ background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '0.3rem 0.6rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
              <option value="">Wszystkie Kategorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* Tabela ocen */}
          {filteredGrades.length === 0 ? (
            <div className="subject-arcane-panel subject-empty-state" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <Star size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem' }}>Brak ocen w księdze katedry.</p>
            </div>
          ) : (
            <div className="subject-arcane-panel subject-grades-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(8,11,16,0.7)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(197,159,78,0.2)' }}>
                <thead>
                  <tr style={{ background: 'rgba(197,159,78,0.1)', borderBottom: '1px solid rgba(197,159,78,0.25)' }}>
                    {['Adept', 'Zakon', 'Kategoria', 'Ocena HP', 'Tytuł / Komentarz', 'Data', ''].map((h, i) => (
                      <th key={i} style={{ padding: '0.7rem 0.9rem', color: 'var(--gold-ancient)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((g, idx) => {
                    const h = Object.values(houses || {}).find(hh => hh.id === g.house) || { crestIcon: '🛡️', name: g.house, colors: { secondary: '#c59f4e' } };
                    return (
                      <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                        <td style={{ padding: '0.75rem 0.9rem', color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>{g.studentName}</td>
                        <td style={{ padding: '0.75rem 0.9rem' }}>
                          <span style={{ color: h.colors?.secondary || '#c5cdd9', fontSize: '0.85rem', fontWeight: 600 }}>{h.crestIcon} {h.name}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                            <span>{g.categoryIcon || '📝'}</span> {g.categoryName || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem' }}>
                          <GradeBadge grade={g.grade} size="sm" />
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem', maxWidth: '220px' }}>
                          {g.title && <div style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.15rem' }}>{g.title}</div>}
                          {g.comment && <div style={{ color: '#94a3b8', fontSize: '0.77rem', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>„{g.comment}"</div>}
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem', color: '#6b7280', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{g.date}</td>
                        <td style={{ padding: '0.75rem 0.9rem' }}>
                          {canGrade && (
                            <button onClick={() => handleDeleteGrade(g.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem', opacity: 0.6, transition: 'opacity 0.2s' }} title="Usuń ocenę" onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.6}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          ZAKŁADKA: DZIENNIKI LEKCYJNE Z DISCORDA
      ============================================================ */}
      {tab === 'lessons' && (
        <div className="subject-tab-content subject-lessons-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h3 className="subject-tab-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              <MessageSquare size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Dzienniki Lekcyjne z Discorda
            </h3>
            <span style={{ background: 'rgba(88,101,242,0.15)', border: '1px solid rgba(88,101,242,0.3)', color: '#818cf8', borderRadius: '12px', padding: '0.1rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-ui)' }}>
              {recentLessons.length} lekcji
            </span>
          </div>

          {recentLessons.length === 0 ? (
            <div className="subject-arcane-panel subject-empty-state" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <MessageSquare size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9rem' }}>Brak dzienników lekcyjnych dla tej katedry.</p>
            </div>
          ) : (
            recentLessons.map(lesson => {
              const isPublished = lesson.status === 'published';
              const participants = lesson.participants || [];
              const housePoints = {};
              participants.forEach(p => {
                if (p.pointsAwarded > 0) housePoints[p.house] = (housePoints[p.house] || 0) + p.pointsAwarded;
              });

              return (
                <div
                  key={lesson.id}
                  className="subject-lesson-card"
                  style={{ background: 'rgba(10,14,22,0.7)', border: `1px solid ${isPublished ? 'rgba(197,159,78,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '1.2rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => {
                    setActiveLessonId(lesson.id);
                    setActiveLessonTab('journal');
                    setActiveView('lesson-detail');
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(197,159,78,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isPublished ? 'rgba(197,159,78,0.3)' : 'rgba(255,255,255,0.08)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <span style={{ background: isPublished ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.12)', border: `1px solid ${isPublished ? 'rgba(16,185,129,0.4)' : 'rgba(234,179,8,0.3)'}`, color: isPublished ? '#10b981' : '#eab308', borderRadius: '4px', padding: '0.12rem 0.5rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-ui)' }}>
                          {isPublished ? '✓ Opublikowany' : '⏳ Szkic'}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>{lesson.date} • {lesson.classYear}</span>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-ui)', marginBottom: '0.25rem' }}>{lesson.topic}</div>
                      {lesson.description && <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>„{lesson.description}"</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#c5cdd9', fontSize: '0.8rem' }}>
                        <User size={12} /> {lesson.professorName}
                      </span>
                      {lesson.totalPoints > 0 && (
                        <span style={{ color: '#2ec4b6', fontWeight: 700, fontSize: '0.82rem' }}>+{lesson.totalPoints} pkt</span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#818cf8', fontSize: '0.78rem' }}>
                        <MessageSquare size={11} /> Discord #{lesson.discordThreadId?.slice(-6) || 'archiwum'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
