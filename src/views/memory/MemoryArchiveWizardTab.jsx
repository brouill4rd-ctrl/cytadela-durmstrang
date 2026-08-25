import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Trophy,
  Users,
  FileText,
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { api } from '../../api';

export const MemoryArchiveWizardTab = ({ onPublishedYear }) => {
  const [formData, setFormData] = useState({
    yearCode: 'XVIII',
    name: 'XVIII Rok Szkolny',
    term: 'Semestr Zimowy 2026',
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    headmaster: 'Arcymistrz Valdemar Krag-Hansen',
    deputy: 'Prof. Morana Vane',
    highlightEvent: 'Uroczyste Zamknięcie Roku & Finał Pucharu Twierdzy'
  });

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGeneratePreview = async (e) => {
    e.preventDefault();
    setLoadingPreview(true);
    setErrorMsg('');
    setPublishSuccess(null);

    const res = await api.previewYearArchive(formData);
    if (res.ok && res.data?.preview) {
      setPreviewData(res.data.preview);
    } else {
      setErrorMsg(res.error || 'Nie udało się wygenerować podglądu archiwum.');
    }
    setLoadingPreview(false);
  };

  const handlePublish = async () => {
    if (!previewData) return;
    if (!window.confirm(`Czy na pewno chcesz opublikować archiwum roku ${previewData.year?.name} (${previewData.year?.yearCode}) w oficjalnej Izbie Pamięci? Wpisy zostaną trwale zabezpieczone.`)) {
      return;
    }

    setPublishing(true);
    setErrorMsg('');

    const res = await api.publishYearArchive(previewData);
    if (res.ok) {
      setPublishSuccess(`Rocznik ${previewData.year?.name} został pomyślnie opublikowany w Izbie Pamięci.`);
      if (onPublishedYear && res.data?.yearId) {
        setTimeout(() => {
          onPublishedYear(res.data.yearId);
        }, 1500);
      }
    } else {
      setErrorMsg(res.error || 'Nie udało się opublikować rocznika.');
    }
    setPublishing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div
        className="gothic-card"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          background: 'radial-gradient(circle at center, rgba(197, 159, 78, 0.15) 0%, rgba(10, 13, 18, 0.98) 75%)',
          border: '2px solid #c59f4e'
        }}
      >
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-ancient)', fontFamily: 'var(--font-heading)' }}>
          KREATÓR ZAMKNIĘCIA & ARCHIWIZACJI ROKU
        </div>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.4rem 0 0.5rem' }}>
          AUTOMATYCZNE ARCHIWUM ROKU SZKOLNEGO
        </h1>
        <p style={{ color: '#cbd5e1', maxWidth: '700px', margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Narzędzie Najwyższej Rady Dyrekcji do zamrażania roczników. System automatycznie skanuje bazę adeptów, wykrywa absolwentów, sporządza końcowe rankingi, generuje puchary i świadectwa z podglądem do zatwierdzenia.
        </p>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          {errorMsg}
        </div>
      )}

      {publishSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '1.2rem', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center' }}>
          ✨ {publishSuccess}
        </div>
      )}

      {/* Step 1: Configuration Form */}
      <form onSubmit={handleGeneratePreview} className="gothic-card" style={{ padding: '2rem', border: '1px solid rgba(197, 159, 78, 0.3)' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--gold-ancient)" /> Krok 1: Parametry Rocznika do Archiwizacji
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.3rem' }}>
              Kod Roku (np. XVIII, XIX)
            </label>
            <input
              type="text"
              className="gothic-input"
              value={formData.yearCode}
              onChange={(e) => setFormData({ ...formData, yearCode: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.3rem' }}>
              Pełna Nazwa Roku
            </label>
            <input
              type="text"
              className="gothic-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.3rem' }}>
              Semestr / Okres
            </label>
            <input
              type="text"
              className="gothic-input"
              value={formData.term}
              onChange={(e) => setFormData({ ...formData, term: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.3rem' }}>
              Data Rozpoczęcia
            </label>
            <input
              type="date"
              className="gothic-input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.3rem' }}>
              Data Zakończenia (Wydanie Świadectw)
            </label>
            <input
              type="date"
              className="gothic-input"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.3rem' }}>
              Dyrektor Szkoły (Podpis)
            </label>
            <input
              type="text"
              className="gothic-input"
              value={formData.headmaster}
              onChange={(e) => setFormData({ ...formData, headmaster: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button
            type="submit"
            disabled={loadingPreview}
            className="btn-durmstrang"
            style={{ padding: '0.75rem 1.8rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Play size={16} /> {loadingPreview ? 'Skanowanie Bazy...' : 'Przygotuj Podgląd Archiwum'}
          </button>
        </div>
      </form>

      {/* Step 2: Interactive Preview & Approval */}
      {previewData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="gothic-card" style={{ padding: '2rem', border: '2px solid #2ec4b6', background: 'rgba(13, 45, 51, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#2ec4b6', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>
                  Krok 2: Weryfikacja Podglądu
                </span>
                <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: '#ffffff', margin: '0.2rem 0' }}>
                  Podgląd Snapshotu — {previewData.year?.name}
                </h3>
              </div>

              <button
                onClick={handlePublish}
                disabled={publishing}
                className="btn-durmstrang"
                style={{
                  padding: '0.85rem 2rem',
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#34d399',
                  color: '#ffffff',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Check size={18} /> {publishing ? 'Publikowanie...' : 'Zatwierdź i Opublikuj w Izbie Pamięci'}
              </button>
            </div>

            {/* Quick Metrics of Snapshot */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Zwycięski Zakon:</span>
                <div style={{ fontSize: '1.1rem', color: '#fde047', fontWeight: 800, marginTop: '2px' }}>
                  Zakon {previewData.year?.winningHouse?.toUpperCase()} ({previewData.year?.winningPoints} pkt)
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Wykryci Adepci:</span>
                <div style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 800, marginTop: '2px' }}>
                  {previewData.people?.length || 0} osób ({previewData.people?.filter(p => p.isGraduate).length || 0} Absolwentów)
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Kadra do Zapisania:</span>
                <div style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 800, marginTop: '2px' }}>
                  {previewData.staff?.length || 0} Profesorów & Władz
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase' }}>Świadectwa:</span>
                <div style={{ fontSize: '1.1rem', color: '#2ec4b6', fontWeight: 800, marginTop: '2px' }}>
                  {previewData.certificates?.length || 0} Wygenerowanych
                </div>
              </div>
            </div>

            {/* List of Detected Graduates */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.6rem' }}>
                🎓 Wykryci Absolwenci II Kręgu:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.8rem' }}>
                {previewData.people?.filter(p => p.isGraduate).map((grad, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.8rem' }}>
                    <div style={{ fontWeight: 800, color: '#ffffff' }}>{grad.characterName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#fde047' }}>Zakon: {grad.house?.toUpperCase()} • {grad.points} pkt</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Ocena: {grad.finalGrade} ({grad.bestSubject})</div>
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
