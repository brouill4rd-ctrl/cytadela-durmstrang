import React, { useState, useEffect, useCallback } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  ScrollText, Plus, Clock, CheckCircle2, XCircle, AlertTriangle,
  Calendar, BookOpen, Shield, ChevronDown, ChevronUp, Users,
  ArrowLeft, Send, Ban, Eye, FileText, RefreshCw, Lock
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  pending:   { label: 'Oczekuje',      color: '#c59f4e', bg: 'rgba(197,159,78,0.12)',  icon: Clock,         rune: '◷' },
  approved:  { label: 'Zaakceptowane', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2,  rune: '✓' },
  rejected:  { label: 'Odrzucone',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle,       rune: '✕' },
  cancelled: { label: 'Anulowane',     color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: Ban,           rune: '—' },
  invalid:   { label: 'Nieaktualne',   color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: AlertTriangle, rune: '!' }
};

const EXCUSE_STATUS_CONFIG = {
  pending:  { label: 'Oczekuje',         color: '#c59f4e', rune: '◷' },
  approved: { label: 'Usprawiedliwiona', color: '#10b981', rune: '✓' },
  rejected: { label: 'Odrzucone',        color: '#ef4444', rune: '✕' }
};

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtDateTime(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status, small }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: small ? '0.15rem 0.5rem' : '0.25rem 0.7rem',
      borderRadius: '4px', fontSize: small ? '0.72rem' : '0.8rem',
      fontWeight: 700, letterSpacing: '0.04em',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      fontFamily: 'var(--font-heading)'
    }}>
      <Icon size={small ? 10 : 12} />
      {cfg.label}
    </span>
  );
}

function ExcuseBadge({ excuseStatus }) {
  if (!excuseStatus) return (
    <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 700 }}>
      ✗ Nieusprawiedliwiona
    </span>
  );
  const cfg = EXCUSE_STATUS_CONFIG[excuseStatus] || EXCUSE_STATUS_CONFIG.pending;
  return (
    <span style={{ color: cfg.color, fontSize: '0.78rem', fontWeight: 700 }}>
      {cfg.rune} {cfg.label}
    </span>
  );
}

const cardStyle = {
  background: 'rgba(10, 14, 22, 0.85)',
  border: '1px solid rgba(197, 159, 78, 0.2)',
  borderRadius: '10px',
  padding: '1.5rem',
  marginBottom: '1.2rem'
};

const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(197, 159, 78, 0.25)',
  borderRadius: '6px', color: '#e2e8f0',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--font-body)'
};

const labelStyle = {
  fontSize: '0.72rem', color: 'var(--gold-ancient)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.35rem'
};

// ══════════════════════════════════════════════════════════════════
// ABSENCE REQUEST FORM
// ══════════════════════════════════════════════════════════════════

function AbsenceRequestForm({ onSuccess, onCancel, prefill }) {
  const { showNotification } = useSchool();
  const [type, setType] = useState(prefill?.type || 'post_factum');
  const [startAt, setStartAt] = useState(prefill?.startAt || '');
  const [endAt, setEndAt] = useState(prefill?.endAt || '');
  const [reason, setReason] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const lessonLinks = prefill?.lessonLinks || [];

  const fetchPreview = useCallback(async () => {
    if (!startAt || !endAt || type !== 'planned') return;
    setPreviewLoading(true);
    const res = await api.getTimetablePreviewForAbsence(startAt, endAt);
    setPreviewLoading(false);
    if (res.ok) setPreview(res.data);
  }, [startAt, endAt, type]);

  useEffect(() => {
    if (type === 'planned' && startAt && endAt) fetchPreview();
    else setPreview(null);
  }, [type, startAt, endAt, fetchPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!reason.trim()) { setError('Podaj powód nieobecności.'); return; }
    setSubmitting(true);
    const res = await api.createAbsenceRequest({
      type, startAt, endAt, reason: reason.trim(), extraInfo, lessonLinks
    });
    setSubmitting(false);
    if (res.ok) {
      showNotification('Wniosek złożony', 'Twój wniosek trafił do rozpatrzenia.', 'success');
      onSuccess(res.data);
    } else {
      setError(res.error || 'Błąd składania wniosku.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={labelStyle}>Typ wniosku</div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {[['post_factum', 'Usprawiedliwienie nieobecności', ScrollText], ['planned', 'Planowana nieobecność', Calendar]].map(([v, lbl, Icon]) => (
            <button key={v} type="button"
              onClick={() => setType(v)}
              style={{
                flex: 1, padding: '0.9rem', borderRadius: '8px', cursor: 'pointer',
                border: `2px solid ${type === v ? 'var(--gold-ancient)' : 'rgba(197,159,78,0.2)'}`,
                background: type === v ? 'rgba(197,159,78,0.12)' : 'rgba(255,255,255,0.03)',
                color: type === v ? 'var(--gold-glow)' : '#9ca3af',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem'
              }}
            >
              <Icon size={16} /> {lbl}
            </button>
          ))}
        </div>
      </div>

      {!prefill?.startAt && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={labelStyle}>{type === 'planned' ? 'Od (data i godzina)' : 'Data nieobecności'}</div>
            <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <div style={labelStyle}>{type === 'planned' ? 'Do (data i godzina)' : 'Koniec okresu'}</div>
            <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} style={inputStyle} required />
          </div>
        </div>
      )}

      {prefill?.lessonInfo && (
        <div style={{ ...cardStyle, padding: '1rem', marginBottom: '1rem', borderColor: 'rgba(197,159,78,0.3)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Dotyczy lekcji</div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{prefill.lessonInfo.subjectName}</div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{fmtDate(prefill.lessonInfo.date)} • {prefill.lessonInfo.professorName}</div>
        </div>
      )}

      {type === 'planned' && preview && preview.length > 0 && (
        <div style={{ ...cardStyle, padding: '1rem', marginBottom: '1rem', borderColor: 'rgba(16,185,129,0.25)' }}>
          <div style={{ fontSize: '0.72rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
            Twoja nieobecność obejmie {preview.length} {preview.length === 1 ? 'zajęcia' : 'zajęć'}:
          </div>
          {preview.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0', borderBottom: i < preview.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ color: 'var(--gold-ancient)', fontSize: '0.9rem' }}>📚</span>
              <div>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{e.subjectName}</span>
                <span style={{ color: '#6b7280', fontSize: '0.78rem', marginLeft: '0.5rem' }}>{e.lessonStart}–{e.lessonEnd} • {e.lessonDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {type === 'planned' && previewLoading && (
        <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: '1rem' }}>
          <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Sprawdzam plan zajęć…
        </div>
      )}
      {type === 'planned' && preview && preview.length === 0 && (
        <div style={{ color: '#6b7280', fontSize: '0.82rem', marginBottom: '1rem' }}>
          Brak zajęć w wybranym przedziale czasu.
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <div style={labelStyle}>Powód nieobecności</div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="Opisz powód nieobecności…"
          style={{ ...inputStyle, resize: 'vertical' }}
          required
        />
        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
          Pełna treść widoczna tylko dla Dyrekcji. Profesor zobaczy wyłącznie status.
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={labelStyle}>Informacja dodatkowa (opcjonalna)</div>
        <input
          type="text"
          value={extraInfo}
          onChange={e => setExtraInfo(e.target.value)}
          placeholder="np. numer telefonu, kontakt z opiekunem…"
          style={inputStyle}
        />
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.8rem' }}>
        <button type="submit" disabled={submitting} className="btn-durmstrang" style={{ flex: 1 }}>
          <Send size={14} style={{ marginRight: '0.4rem' }} />
          {submitting ? 'Wysyłanie…' : 'Złóż wniosek'}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: '0.65rem 1.2rem', borderRadius: '6px', cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#9ca3af', fontFamily: 'var(--font-heading)', fontWeight: 700
        }}>
          Anuluj
        </button>
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════
// REQUEST CARD
// ══════════════════════════════════════════════════════════════════

function RequestCard({ request, onCancel, expanded, onToggle }) {
  const { currentUser } = useSchool();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    await onCancel(request.id);
    setCancelling(false);
  };

  return (
    <div style={{
      background: 'rgba(8, 11, 18, 0.9)',
      border: `1px solid ${STATUS_CONFIG[request.status]?.color || 'rgba(197,159,78,0.2)'}44`,
      borderRadius: '8px', marginBottom: '0.8rem', overflow: 'hidden'
    }}>
      <div
        style={{ padding: '1rem 1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
        onClick={onToggle}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <StatusBadge status={request.status} small />
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'var(--font-heading)' }}>
              {request.type === 'planned' ? '📋 Planowana' : '📜 Usprawiedliwienie'}
            </span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600 }}>
            {fmtDateTime(request.startAt)}
            {request.startAt !== request.endAt && ` — ${fmtDateTime(request.endAt)}`}
          </div>
          {request.lessons && request.lessons.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.15rem' }}>
              {request.lessons.length} {request.lessons.length === 1 ? 'zajęcie' : 'zajęć'}: {request.lessons.slice(0, 2).map(l => l.subjectName).join(', ')}{request.lessons.length > 2 ? '…' : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{fmtDate(request.submittedAt)}</span>
          {expanded ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 1.2rem 1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ marginTop: '0.8rem' }}>
            <div style={labelStyle}>Powód</div>
            <p style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
              {request.reason}
            </p>
          </div>
          {request.extraInfo && (
            <div style={{ marginTop: '0.6rem' }}>
              <div style={labelStyle}>Dodatkowe informacje</div>
              <p style={{ color: '#9ca3af', fontSize: '0.82rem', margin: 0 }}>{request.extraInfo}</p>
            </div>
          )}
          {request.lessons && request.lessons.length > 0 && (
            <div style={{ marginTop: '0.8rem' }}>
              <div style={labelStyle}>Powiązane zajęcia</div>
              {request.lessons.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.35rem 0', fontSize: '0.82rem', color: '#cbd5e1', borderBottom: i < request.lessons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ color: 'var(--gold-ancient)' }}>📚</span>
                  <span>{l.subjectName}</span>
                  {l.lessonDate && <span style={{ color: '#6b7280' }}>• {l.lessonDate} {l.lessonStart && `${l.lessonStart}–${l.lessonEnd}`}</span>}
                </div>
              ))}
            </div>
          )}
          {request.status === 'rejected' && request.reviewComment && (
            <div style={{ marginTop: '0.8rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '0.75rem' }}>
              <div style={{ ...labelStyle, color: '#ef4444' }}>Powód odrzucenia</div>
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0 }}>{request.reviewComment}</p>
              {request.reviewedByName && (
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.25rem' }}>— {request.reviewedByName}, {fmtDate(request.reviewedAt)}</div>
              )}
            </div>
          )}
          {request.status === 'approved' && (
            <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#10b981' }}>
              <CheckCircle2 size={13} />
              Zaakceptowane przez {request.reviewedByName || 'Dyrekcję'} · {fmtDate(request.reviewedAt)}
            </div>
          )}
          {request.status === 'pending' && (
            <div style={{ marginTop: '1rem' }}>
              <button onClick={handleCancel} disabled={cancelling} style={{
                padding: '0.4rem 0.9rem', borderRadius: '5px', cursor: 'pointer',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5', fontSize: '0.78rem', fontFamily: 'var(--font-heading)', fontWeight: 700
              }}>
                {cancelling ? 'Anulowanie…' : 'Anuluj wniosek'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// UNEXCUSED ABSENCE ROW
// ══════════════════════════════════════════════════════════════════

function UnexcusedRow({ absence, onExcuse }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '0.85rem 1rem',
      background: 'rgba(8,11,18,0.9)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: '7px', marginBottom: '0.6rem'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>{absence.subjectName}</div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          {fmtDate(absence.date)} • {absence.professorName}
        </div>
        {absence.excuseStatus && (
          <div style={{ marginTop: '0.2rem' }}>
            <ExcuseBadge excuseStatus={absence.excuseStatus} />
          </div>
        )}
      </div>
      {!absence.excuseStatus && (
        <button
          onClick={() => onExcuse(absence)}
          style={{
            padding: '0.4rem 0.85rem', borderRadius: '5px', cursor: 'pointer',
            background: 'rgba(197,159,78,0.12)', border: '1px solid rgba(197,159,78,0.35)',
            color: 'var(--gold-glow)', fontSize: '0.78rem', fontFamily: 'var(--font-heading)', fontWeight: 700,
            whiteSpace: 'nowrap'
          }}
        >
          Usprawiedliw
        </button>
      )}
      {absence.excuseStatus === 'pending' && (
        <span style={{ fontSize: '0.75rem', color: '#c59f4e', whiteSpace: 'nowrap' }}>◷ Oczekuje</span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ADMIN QUEUE PANEL
// ══════════════════════════════════════════════════════════════════

function AdminQueuePanel() {
  const { showNotification } = useSchool();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAbsenceQueue();
    if (res.ok) setQueue(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (id, decision) => {
    setSubmitting(true);
    const res = await api.reviewAbsenceRequest(id, { decision, reviewComment });
    setSubmitting(false);
    if (res.ok) {
      showNotification(
        decision === 'approved' ? 'Zaakceptowano' : 'Odrzucono',
        `Wniosek ${decision === 'approved' ? 'został zaakceptowany' : 'został odrzucony'}.`,
        decision === 'approved' ? 'success' : 'warning'
      );
      setReviewing(null);
      setReviewComment('');
      load();
    } else {
      showNotification('Błąd', res.error || 'Nie udało się rozpatrzyć wniosku.', 'error');
    }
  };

  if (loading) return <div style={{ color: '#9ca3af', padding: '2rem', textAlign: 'center' }}>Ładowanie kolejki…</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <h3 style={{ color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', fontSize: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
          ⚖️ Kolejka do rozpatrzenia ({queue.length})
        </h3>
        <button onClick={load} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {queue.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
          <CheckCircle2 size={28} style={{ marginBottom: '0.5rem' }} />
          <div>Brak oczekujących wniosków.</div>
        </div>
      )}

      {queue.map(req => (
        <div key={req.id} style={{ background: 'rgba(8,11,18,0.9)', border: '1px solid rgba(197,159,78,0.2)', borderRadius: '8px', marginBottom: '0.8rem', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '1rem' }} onClick={() => setExpanded(expanded === req.id ? null : req.id)}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{req.userName}</span>
                {req.house && <span style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'capitalize' }}>{req.house}</span>}
                {req.classYear && <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{req.classYear}</span>}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                {req.type === 'planned' ? '📋 Planowana' : '📜 Usprawiedliwienie'} • {fmtDateTime(req.startAt)}
              </div>
              {req.lessons?.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>
                  {req.lessons.map(l => l.subjectName).join(', ')}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{fmtDate(req.submittedAt)}</span>
              {expanded === req.id ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
            </div>
          </div>

          {expanded === req.id && (
            <div style={{ padding: '0 1.2rem 1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ marginTop: '0.8rem' }}>
                <div style={labelStyle}>Powód</div>
                <p style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.6, margin: 0, background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid var(--gold-ancient)' }}>
                  „{req.reason}"
                </p>
              </div>
              {req.extraInfo && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={labelStyle}>Dodatkowe informacje</div>
                  <p style={{ color: '#9ca3af', fontSize: '0.82rem', margin: 0 }}>{req.extraInfo}</p>
                </div>
              )}
              {req.lessons?.length > 0 && (
                <div style={{ marginTop: '0.8rem' }}>
                  <div style={labelStyle}>Powiązane zajęcia ({req.lessons.length})</div>
                  {req.lessons.map((l, i) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: '#cbd5e1', padding: '0.25rem 0' }}>
                      📚 {l.subjectName} — {l.lessonDate} {l.lessonStart && `${l.lessonStart}–${l.lessonEnd}`}
                    </div>
                  ))}
                </div>
              )}
              {reviewing === req.id ? (
                <div style={{ marginTop: '1rem' }}>
                  <div style={labelStyle}>Komentarz do decyzji (opcjonalny)</div>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={2}
                    placeholder="Wpisz uzasadnienie decyzji…"
                    style={{ ...inputStyle, resize: 'vertical', marginBottom: '0.8rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button disabled={submitting} onClick={() => handleReview(req.id, 'approved')} style={{
                      flex: 1, padding: '0.6rem', borderRadius: '6px', cursor: 'pointer',
                      background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                      color: '#10b981', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem'
                    }}>
                      ✓ Zaakceptuj
                    </button>
                    <button disabled={submitting} onClick={() => handleReview(req.id, 'rejected')} style={{
                      flex: 1, padding: '0.6rem', borderRadius: '6px', cursor: 'pointer',
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
                      color: '#fca5a5', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem'
                    }}>
                      ✕ Odrzuć
                    </button>
                    <button onClick={() => { setReviewing(null); setReviewComment(''); }} style={{
                      padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#6b7280', fontFamily: 'var(--font-heading)'
                    }}>
                      Anuluj
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '1rem' }}>
                  <button onClick={() => setReviewing(req.id)} style={{
                    padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer',
                    background: 'rgba(197,159,78,0.12)', border: '1px solid rgba(197,159,78,0.35)',
                    color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem'
                  }}>
                    ⚖️ Rozpatrz wniosek
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN VIEW
// ══════════════════════════════════════════════════════════════════

export const AbsenceChamberView = () => {
  const { currentUser, showNotification } = useSchool();
  const [tab, setTab] = useState('overview');
  const [requests, setRequests] = useState([]);
  const [unexcused, setUnexcused] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formPrefill, setFormPrefill] = useState(null);
  const [expandedReq, setExpandedReq] = useState(null);

  const isAdmin = currentUser?.role === 'admin';
  const isProfessor = currentUser?.role === 'professor';

  const loadData = useCallback(async () => {
    setLoading(true);
    const [reqRes, statsRes, unexRes] = await Promise.all([
      api.getAbsenceRequests(),
      api.getAbsenceStats(),
      currentUser?.role === 'student' ? api.getUnexcusedAbsences() : Promise.resolve({ ok: true, data: [] })
    ]);
    if (reqRes.ok) setRequests(reqRes.data);
    if (statsRes.ok) setStats(statsRes.data);
    if (unexRes.ok) setUnexcused(unexRes.data);
    setLoading(false);
  }, [currentUser?.role]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExcuse = (absence) => {
    const now = new Date(absence.date + 'T00:00:00').toISOString();
    const end = new Date(absence.date + 'T23:59:00').toISOString();
    setFormPrefill({
      type: 'post_factum',
      startAt: now,
      endAt: end,
      lessonInfo: {
        subjectName: absence.subjectName,
        date: absence.date,
        professorName: absence.professorName
      },
      lessonLinks: [{
        lessonId: absence.lessonId,
        subjectId: absence.subjectId,
        subjectName: absence.subjectName,
        professorId: absence.professorId,
        professorName: absence.professorName,
        lessonDate: absence.date,
        participantId: absence.participantId
      }]
    });
    setShowForm(true);
  };

  const handleFormSuccess = (newReq) => {
    setShowForm(false);
    setFormPrefill(null);
    loadData();
  };

  const handleCancel = async (id) => {
    const res = await api.cancelAbsenceRequest(id);
    if (res.ok) {
      showNotification('Anulowano', 'Wniosek został anulowany.', 'info');
      loadData();
    } else {
      showNotification('Błąd', res.error || 'Nie udało się anulować.', 'error');
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const unexcusedWithoutPending = unexcused.filter(a => !a.excuseStatus);

  if (!currentUser) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
        <Lock size={32} style={{ marginBottom: '1rem' }} />
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Zaloguj się, aby uzyskać dostęp do Izby.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem' }}>

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '0.72rem', letterSpacing: '0.25em', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '0.5rem' }}>
          TWIERDZA MAGII DURMSTRANG
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: '#ffffff', margin: '0 0 0.5rem', letterSpacing: '0.04em', textShadow: '0 2px 15px rgba(0,0,0,0.8)' }}>
          Izba Przyjęć i Usprawiedliwień
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.88rem', fontStyle: 'italic', margin: 0 }}>
          „Każda nieobecność zostawia ślad w księgach Cytadeli."
        </p>
      </div>

      {/* FORM OVERLAY */}
      {showForm && (
        <div style={{ ...cardStyle, border: '1px solid rgba(197,159,78,0.4)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <ScrollText size={18} color="var(--gold-ancient)" />
            <h3 style={{ color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', fontSize: '1rem', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {formPrefill?.type === 'planned' ? 'Zgłoś planowaną nieobecność' : 'Złóż usprawiedliwienie'}
            </h3>
          </div>
          <AbsenceRequestForm
            prefill={formPrefill}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setFormPrefill(null); }}
          />
        </div>
      )}

      {/* QUICK ACTION — if unexcused absences exist and no form open */}
      {!showForm && currentUser.role === 'student' && unexcusedWithoutPending.length > 0 && (
        <div style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.25)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <AlertTriangle size={16} color="#ef4444" />
            <span style={{ color: '#fca5a5', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Do wyjaśnienia ({unexcusedWithoutPending.length})
            </span>
          </div>
          {unexcusedWithoutPending.map(a => (
            <UnexcusedRow key={a.participantId} absence={a} onExcuse={handleExcuse} />
          ))}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(197,159,78,0.15)', paddingBottom: '0' }}>
        {[
          ['overview', 'Przegląd', ScrollText],
          ...(isAdmin ? [['queue', `Kolejka${pendingCount ? ` (${pendingCount})` : ''}`, Users]] : []),
          ['history', 'Moje wnioski', FileText],
          ...(currentUser.role === 'student' ? [['absences', 'Moje nieobecności', BookOpen]] : [])
        ].map(([v, lbl, Icon]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            style={{
              padding: '0.6rem 1rem', borderRadius: '6px 6px 0 0', cursor: 'pointer',
              background: tab === v ? 'rgba(197,159,78,0.12)' : 'transparent',
              border: tab === v ? '1px solid rgba(197,159,78,0.3)' : '1px solid transparent',
              borderBottom: tab === v ? '1px solid rgba(10,14,22,0.9)' : '1px solid rgba(197,159,78,0.15)',
              color: tab === v ? 'var(--gold-glow)' : '#6b7280',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8rem',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            <Icon size={13} /> {lbl}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {tab === 'overview' && (
        <div>
          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Obecności', value: stats.present, color: '#10b981' },
                { label: 'Nieobecności', value: stats.absent, color: '#ef4444' },
                { label: 'Usprawiedliwione', value: stats.excused, color: '#3b82f6' },
                { label: 'Nieusprawiedliwione', value: stats.unexcused, color: '#f59e0b' }
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(8,11,18,0.9)',
                  border: `1px solid ${s.color}33`,
                  borderRadius: '8px', padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-heading)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.2rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Action button */}
          {!showForm && (
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                onClick={() => { setFormPrefill({ type: 'planned' }); setShowForm(true); }}
                className="btn-durmstrang"
                style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }}
              >
                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                Zgłoś planowaną nieobecność
              </button>
            </div>
          )}

          {/* Recent requests */}
          {requests.length > 0 && (
            <div style={cardStyle}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ ...labelStyle, fontSize: '0.75rem' }}>Ostatnie wnioski</div>
              </div>
              {requests.slice(0, 5).map(r => (
                <RequestCard
                  key={r.id}
                  request={r}
                  onCancel={handleCancel}
                  expanded={expandedReq === r.id}
                  onToggle={() => setExpandedReq(expandedReq === r.id ? null : r.id)}
                />
              ))}
            </div>
          )}

          {requests.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
              <ScrollText size={28} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <div>Nie masz jeszcze żadnych wniosków.</div>
            </div>
          )}
        </div>
      )}

      {/* TAB: QUEUE (admin) */}
      {tab === 'queue' && isAdmin && (
        <AdminQueuePanel />
      )}

      {/* TAB: HISTORY */}
      {tab === 'history' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={labelStyle}>Wszystkie moje wnioski ({requests.length})</div>
            <button
              onClick={() => { setFormPrefill(null); setShowForm(true); }}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '5px', cursor: 'pointer',
                background: 'rgba(197,159,78,0.1)', border: '1px solid rgba(197,159,78,0.3)',
                color: 'var(--gold-glow)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              <Plus size={12} /> Nowy wniosek
            </button>
          </div>
          {loading && <div style={{ color: '#9ca3af', textAlign: 'center' }}>Ładowanie…</div>}
          {requests.map(r => (
            <RequestCard
              key={r.id}
              request={r}
              onCancel={handleCancel}
              expanded={expandedReq === r.id}
              onToggle={() => setExpandedReq(expandedReq === r.id ? null : r.id)}
            />
          ))}
          {requests.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Brak wniosków.</div>
          )}
        </div>
      )}

      {/* TAB: ABSENCES (student) */}
      {tab === 'absences' && currentUser.role === 'student' && (
        <div>
          <div style={labelStyle}>Moje nieobecności z dzienników ({unexcused.length + (stats?.excused || 0)})</div>
          {loading && <div style={{ color: '#9ca3af' }}>Ładowanie…</div>}

          {unexcused.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
              <CheckCircle2 size={28} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <div>Brak nieobecności wymagających usprawiedliwienia.</div>
            </div>
          )}

          {unexcused.map(a => (
            <UnexcusedRow key={a.participantId} absence={a} onExcuse={handleExcuse} />
          ))}
        </div>
      )}

    </div>
  );
};
