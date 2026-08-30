import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import api from '../api';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Award,
  Sparkles,
  Save,
  Send,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { DiscordThreadLog } from '../components/DiscordThreadLog';

export const ProfessorJournalEditor = () => {
  const {
    activeLessonId,
    setActiveLessonId,
    setActiveView,
    getLessonDetails,
    saveLessonDraft,
    publishLesson,
    subjects,
    houses,
    users,
    currentUser,
    navigateToHomeworkCreator
  } = useSchool();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dziennik');

  const profDefaultSubjectId = currentUser?.taughtSubjectIds?.[0] || 'eliksiry';

  const [formData, setFormData] = useState({
    id: `les-${Date.now()}`,
    subjectId: profDefaultSubjectId,
    subjectName: '',
    classYear: 'Klasa II',
    topic: '',
    description: '',
    professorId: currentUser?.id || '',
    professorName: currentUser?.fullName || '',
    professorAvatar: currentUser?.avatar || '',
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    discordThreadId: '',
    participants: []
  });

  // Once subjects list loads, ensure formData reflects a valid subject
  useEffect(() => {
    if (subjects.length === 0) return;
    setFormData(prev => {
      const found = subjects.find(s => s.id === prev.subjectId)
        || subjects.find(s => s.id === profDefaultSubjectId)
        || subjects[0];
      if (found.id === prev.subjectId && found.name === prev.subjectName) return prev;
      return { ...prev, subjectId: found.id, subjectName: found.name };
    });
  }, [subjects]);

  useEffect(() => {
    const loadLesson = async () => {
      if (activeLessonId) {
        setLoading(true);
        const data = await getLessonDetails(activeLessonId);
        if (data) {
          // If stored subjectId is unrecognised, prefer professor's own subject
          const knownIds = subjects.map(s => s.id);
          const resolvedSubjectId = (data.subjectId && knownIds.includes(data.subjectId))
            ? data.subjectId
            : profDefaultSubjectId;
          const resolvedSubjectName = subjects.find(s => s.id === resolvedSubjectId)?.name || data.subjectName || '';
          setFormData({
            id: data.id,
            subjectId: resolvedSubjectId,
            subjectName: resolvedSubjectName,
            classYear: data.classYear || 'Klasa II',
            discordThreadId: data.discordThreadId || '',
            topic: data.topic || '',
            description: data.description || '',
            professorId: data.professorId || currentUser?.id,
            professorName: data.professorName || currentUser?.fullName,
            professorAvatar: data.professorAvatar || currentUser?.avatar,
            date: data.date || new Date().toISOString().split('T')[0],
            status: data.status || 'draft',
            participants: data.participants && data.participants.length > 0 ? data.participants : [
              { id: 'p-1', studentId: '', studentName: 'Nowy Adept', house: 'reinhall', isPresent: true, pointsAwarded: 10, comment: '' }
            ]
          });
        }
        setLoading(false);
      }
    };

    loadLesson();
  }, [activeLessonId]);

  const handleSubjectChange = (subjectId) => {
    const found = subjects.find(s => s.id === subjectId);
    setFormData(prev => ({
      ...prev,
      subjectId,
      subjectName: found?.name || subjectId
    }));
  };

  const handleAddParticipant = () => {
    const newPart = {
      id: `p-${Date.now()}`,
      studentId: '',
      studentName: 'Nowy Adept',
      house: 'reinhall',
      isPresent: true,
      pointsAwarded: 10,
      comment: 'Aktywny udział'
    };
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, newPart]
    }));
  };

  const handleRemoveParticipant = (partId) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== partId)
    }));
  };

  const handleUpdateParticipant = (partId, field, value) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(p => {
        if (p.id === partId) {
          if (field === 'studentName') {
            // Auto fill student ID and house if match in users
            const matchedUser = users.find(u => u.fullName.toLowerCase() === value.toLowerCase() || u.name.toLowerCase() === value.toLowerCase());
            return {
              ...p,
              studentName: value,
              studentId: matchedUser ? matchedUser.id : p.studentId,
              house: matchedUser?.house ? matchedUser.house.toLowerCase() : p.house
            };
          }
          return { ...p, [field]: value };
        }
        return p;
      })
    }));
  };

  const handleDeleteDraft = async () => {
    if (!window.confirm('Na pewno chcesz usunąć ten szkic dziennika? Tej operacji nie można cofnąć.')) return;
    const res = await api.deleteLessonDraft(formData.id);
    if (res.ok) {
      setActiveView('journals');
    } else {
      alert(res.data?.error || 'Nie udało się usunąć szkicu.');
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.topic.trim()) {
      alert('Wprowadź temat lekcji przed zapisaniem.');
      return;
    }
    await saveLessonDraft(formData.id, { ...formData, status: 'draft' });
  };

  const handlePublish = async () => {
    if (!formData.topic.trim()) {
      alert('Wprowadź temat lekcji przed publikacją.');
      return;
    }

    // 1. Save changes first
    await saveLessonDraft(formData.id, { ...formData, status: 'draft' });
    // 2. Publish and commit points
    const published = await publishLesson(formData.id);
    if (published) {
      setActiveLessonId(formData.id);
      setActiveView('lesson-detail');
    }
  };

  // Calculate live points summary by house
  const housePointsPreview = {};
  formData.participants.forEach(p => {
    if (p.isPresent && parseInt(p.pointsAwarded, 10) > 0) {
      const h = (p.house || 'reinhall').toLowerCase();
      housePointsPreview[h] = (housePointsPreview[h] || 0) + parseInt(p.pointsAwarded, 10);
    }
  });

  const totalPreviewPoints = Object.values(housePointsPreview).reduce((a, b) => a + b, 0);

  return (
    <div className="view-container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(197, 159, 78, 0.25)'
        }}
      >
        <button
          onClick={() => setActiveView('journals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--gold-ancient)',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Powrót do Dzienników
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            type="button"
            onClick={() => {
              navigateToHomeworkCreator({ lesson: formData, returnView: 'professor-journal' });
            }}
            className="btn-durmstrang"
            style={{
              padding: '0.6rem 1.2rem',
              background: 'rgba(197, 159, 78, 0.18)',
              borderColor: 'var(--gold-ancient)',
              color: '#ffffff',
              fontSize: '0.85rem'
            }}
            title="Utwórz pracę domową powiązaną bezpośrednio z tą lekcją"
          >
            <BookOpen size={15} color="var(--gold-ancient)" /> Zadaj Pracę Domową
          </button>

          {formData.status === 'draft' && activeLessonId && (
            <button
              onClick={handleDeleteDraft}
              className="btn-durmstrang"
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(239, 68, 68, 0.12)',
                borderColor: '#ef4444',
                color: '#ef4444',
                fontSize: '0.85rem'
              }}
              title="Usuń ten szkic dziennika"
            >
              <Trash2 size={15} /> Usuń Szkic
            </button>
          )}

          <button
            onClick={handleSaveDraft}
            className="btn-durmstrang"
            style={{
              padding: '0.6rem 1.2rem',
              background: 'rgba(234, 179, 8, 0.15)',
              borderColor: '#eab308',
              color: '#facc15',
              fontSize: '0.85rem'
            }}
          >
            <Save size={15} /> Zapisz Szkic (DRAFT)
          </button>

          <button
            onClick={handlePublish}
            className="btn-durmstrang"
            style={{
              padding: '0.6rem 1.4rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderColor: '#10b981',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 800,
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            <CheckCircle2 size={16} /> PUBLIKUJ DZIENNIK & ZAKSIĘGUJ PUNKTY
          </button>
        </div>
      </div>

      {/* Tab Navigation — only for Discord-linked lessons */}
      {formData.discordThreadId && (
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(197,159,78,0.2)', marginBottom: '1.5rem', gap: 0 }}>
          {[
            { key: 'dziennik', label: 'Dziennik', icon: <BookOpen size={14} /> },
            { key: 'log', label: 'Log wątku Discord', icon: <MessageSquare size={14} /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.65rem 1.4rem',
                background: activeTab === key ? 'rgba(197,159,78,0.12)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === key ? '2px solid var(--gold-ancient)' : '2px solid transparent',
                color: activeTab === key ? 'var(--gold-ancient)' : '#64748b',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'color 0.15s, border-color 0.15s'
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      )}

      {/* Discord thread log tab */}
      {formData.discordThreadId && activeTab === 'log' && (
        <DiscordThreadLog lessonId={formData.id} />
      )}

      {/* Main Editor Form Grid */}
      {(!formData.discordThreadId || activeTab === 'dziennik') && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Lesson Metadata */}
        <div
          style={{
            background: 'rgba(15, 20, 30, 0.95)',
            border: '1px solid rgba(197, 159, 78, 0.3)',
            borderRadius: '10px',
            padding: '1.8rem',
            boxShadow: '0 15px 35px rgba(0,0,0,0.7)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
            <BookOpen size={18} color="var(--gold-glow)" />
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>
              Parametry Protokołu Lekcyjnego
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Subject Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>
                Katedra / Przedmiot
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  background: '#0d111a',
                  border: '1px solid rgba(197, 159, 78, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.88rem'
                }}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Class & Date Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>
                  Klasa
                </label>
                <select
                  value={formData.classYear}
                  onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    background: '#0d111a',
                    border: '1px solid rgba(197, 159, 78, 0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="Klasa I">Klasa I</option>
                  <option value="Klasa II">Klasa II</option>
                  <option value="Klasa III">Klasa III</option>
                  <option value="Klasa IV">Klasa IV</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>
                  Data Lekcji
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    background: '#0d111a',
                    border: '1px solid rgba(197, 159, 78, 0.3)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>
            </div>

            {/* Topic Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>
                Temat Lekcji (Oficjalny Tytuł) *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="np. Eliksir Wiggenowy — Stabilizacja i Warzenie Północne"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  background: '#0d111a',
                  border: '1px solid rgba(197, 159, 78, 0.4)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            {/* Pedagogical Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>
                Opis Przebiegu Zajęć & Notatki Dydaktyczne
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Podczas zajęć adepci poznali arktyczną odmianę wywaru, zasady neutralizacji toksyn oraz przećwiczyli formowanie barier..."
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  background: '#0d111a',
                  border: '1px solid rgba(197, 159, 78, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Professor Signature */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>
                Magister Prowadzący
              </label>
              <input
                type="text"
                value={formData.professorName}
                onChange={(e) => setFormData({ ...formData, professorName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  background: '#0d111a',
                  border: '1px solid rgba(197, 159, 78, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.88rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Points Calculation & Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Live House Point Impact Preview */}
          <div
            style={{
              background: 'rgba(15, 20, 30, 0.95)',
              border: '1px solid var(--gold-ancient)',
              borderRadius: '10px',
              padding: '1.5rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} color="var(--gold-glow)" />
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>
                  Podgląd Zasilenia Pucharu Zakonów (+{totalPreviewPoints} pkt)
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Zgodnie z zasadą Single Source of Truth</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
              {Object.keys(houses).map(hKey => {
                const h = houses[hKey];
                const pts = housePointsPreview[hKey] || 0;
                return (
                  <div
                    key={hKey}
                    style={{
                      background: 'rgba(10, 13, 20, 0.85)',
                      border: `1px solid ${pts > 0 ? h.colors.border : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '6px',
                      padding: '0.6rem 0.4rem',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.2rem' }}>{h.crestIcon}</div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, marginTop: '0.1rem' }}>{h.name}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: pts > 0 ? h.colors.secondary : '#6b7280', marginTop: '0.2rem' }}>
                      {pts > 0 ? `+${pts}` : '0'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Participants & Points Roster */}
          <div
            style={{
              background: 'rgba(15, 20, 30, 0.95)',
              border: '1px solid rgba(197, 159, 78, 0.3)',
              borderRadius: '10px',
              padding: '1.5rem',
              boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
              flex: 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--gold-ancient)" />
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>
                  Uczestnicy, Obecność & Punkty ({formData.participants.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddParticipant}
                className="btn-durmstrang"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem' }}
              >
                <Plus size={13} /> Dodaj Adepta
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.3rem' }}>
              {formData.participants.map((p, idx) => (
                <div
                  key={p.id || idx}
                  style={{
                    background: 'rgba(10, 13, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                    {/* Presence Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', color: p.isPresent ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      <input
                        type="checkbox"
                        checked={p.isPresent}
                        onChange={(e) => handleUpdateParticipant(p.id, 'isPresent', e.target.checked)}
                      />
                      <span>{p.isPresent ? 'Obecny (✓)' : 'Nieobecny (✗)'}</span>
                    </label>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveParticipant(p.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      title="Usuń uczestnika"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '0.6rem' }}>
                    {/* Student Name */}
                    <div>
                      <input
                        type="text"
                        value={p.studentName}
                        onChange={(e) => handleUpdateParticipant(p.id, 'studentName', e.target.value)}
                        placeholder="Imię i nazwisko adepta..."
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.6rem',
                          background: '#151922',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>

                    {/* House Select */}
                    <div>
                      <select
                        value={p.house}
                        onChange={(e) => handleUpdateParticipant(p.id, 'house', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.6rem',
                          background: '#151922',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '0.82rem'
                        }}
                      >
                        <option value="reinhall">ᚦ Reinhall</option>
                        <option value="bjornhall">ᛉ Björnhall</option>
                        <option value="ravnheim">ᚱ Ravnheim</option>
                        <option value="otergard">ᛞ Otergard</option>
                      </select>
                    </div>

                    {/* Points Awarded */}
                    <div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={p.pointsAwarded}
                        onChange={(e) => handleUpdateParticipant(p.id, 'pointsAwarded', parseInt(e.target.value, 10) || 0)}
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.6rem',
                          background: '#151922',
                          border: '1px solid #2ec4b6',
                          borderRadius: '4px',
                          color: '#2ec4b6',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  {/* Comment */}
                  <input
                    type="text"
                    value={p.comment}
                    onChange={(e) => handleUpdateParticipant(p.id, 'comment', e.target.value)}
                    placeholder="Komentarz do aktywności (np. Wybitna odpowiedź w quizie)..."
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '4px',
                      color: '#cbd5e1',
                      fontSize: '0.78rem'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
