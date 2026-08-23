import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { api } from '../api';
import {
  X,
  Radio,
  Send,
  Image as ImageIcon,
  Flame,
  Zap,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  BookOpen,
  Users,
  CornerDownRight,
  ExternalLink,
  Plus
} from 'lucide-react';

export const DiscordLessonSimulatorModal = ({ isOpen, onClose }) => {
  const {
    subjects,
    setActiveLessonId,
    setActiveView,
    refreshLessons,
    currentUser,
    showNotification
  } = useSchool();

  // Step in simulator: 'setup' | 'live_thread' | 'ended_summary'
  const [step, setStep] = useState('setup');
  const [threadId, setThreadId] = useState(`thread-${Date.now()}`);
  const [threadName, setThreadName] = useState('lekcja-eliksiry-wiggen');
  const [subjectId, setSubjectId] = useState('eliksiry-i-destylacja');
  const [classYear, setClassYear] = useState('Klasa II');
  const [topic, setTopic] = useState('Eliksir Wiggenowy — Stabilizacja i Warzenie Północne');
  const [professorName, setProfessorName] = useState(currentUser?.fullName || 'Prof. Astrid Vinter');

  // Live session messages
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeAuthor, setActiveAuthor] = useState({
    name: 'Prof. Astrid Vinter',
    house: 'reinhall',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    isBot: false
  });
  const [replyingTo, setReplyingTo] = useState(null);
  const [createdLessonId, setCreatedLessonId] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  if (!isOpen) return null;

  // 1. Start lesson (/lekcja rozpocznij)
  const handleStartLesson = async () => {
    const subj = subjects.find(s => s.id === subjectId);
    const res = await api.startDiscordLesson({
      threadId,
      threadName,
      subjectId,
      subjectName: subj?.name || 'Eliksiry i Destylacja Soli',
      classYear,
      topic,
      professorName
    });

    if (res.ok) {
      setMessages([
        {
          id: `msg-${Date.now()}-init`,
          authorDisplayName: 'Cytadela Bot [SYSTEM]',
          authorName: 'Cytadela Bot',
          authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
          content: `📖 **ROZPOCZĘTO SESJĘ LEKCYJNĄ CYTADELI DURMSTRANG**\n\n**Przedmiot:** ${subj?.name || 'Eliksiry'}\n**Klasa:** ${classYear}\n**Prowadzący:** ${professorName}\n**Temat:** ${topic}\n\n*Wszystkie wypowiedzi, załączniki, embedy i reakcje w tym wątku są automatycznie archiwizowane.*`,
          timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
          isBot: true,
          reactions: [{ emoji: '🔥', count: 1 }],
          attachments: []
        }
      ]);
      setStep('live_thread');
    }
  };

  // 2. Post Message
  const handleSendMessage = async (customContent = null, customAttachments = [], isCommand = false, commandData = {}, embeds = []) => {
    const text = customContent !== null ? customContent : inputMessage;
    if (!text.trim() && customAttachments.length === 0 && embeds.length === 0 && !isCommand) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      authorDisplayName: activeAuthor.name,
      authorName: activeAuthor.name,
      authorAvatar: activeAuthor.avatar,
      authorHouse: activeAuthor.house,
      content: text,
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      replyToId: replyingTo?.id || '',
      replyToAuthor: replyingTo?.authorName || '',
      replyToContent: replyingTo?.content || '',
      isBot: activeAuthor.isBot,
      isCommand,
      commandData,
      embeds,
      reactions: [],
      attachments: customAttachments
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setReplyingTo(null);

    await api.postDiscordMessage({
      threadId,
      ...newMsg
    });
  };

  // Send photo demo
  const handleSendPhotoDemo = async () => {
    const photoAttachment = [
      {
        id: `att-${Date.now()}`,
        name: 'wiggenweld_herbs_diagram.png',
        mimeType: 'image/png',
        size: 245100,
        originalUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=800&auto=format&fit=crop&q=80',
        storageUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=800&auto=format&fit=crop&q=80',
        width: 800,
        height: 533,
        author: activeAuthor.name
      }
    ];

    await handleSendMessage('Spójrzcie na rycinę preparatu. Który składnik stabilizuje wywar?', photoAttachment);
  };

  // Send /quiz command demo
  const handleSendQuizDemo = async () => {
    const commandData = {
      name: '/quiz',
      author: activeAuthor.name,
      params: { temat: 'Eliksiry Klasa II', pytania: 1 },
      result: 'Rozpoczęto quiz Katedry.'
    };

    const embeds = [
      {
        title: '⚗️ QUIZ ELIKSIRÓW — Katedra Alchemii i Warzenia',
        description: 'Który składnik stabilizuje Eliksir Wiggenowy w temperaturze poniżej zera?',
        color: '#c59f4e',
        author: { name: 'Katedra Eliksirów Cytadeli' },
        fields: [
          { name: 'Opcja A', value: 'Sproszkowany Pazur Gryfa', inline: true },
          { name: 'Opcja B', value: 'Kora Jarzębiny Arktycznej & Śluz', inline: true },
          { name: 'Opcja C', value: 'Krew Salamandry Ognistej', inline: true }
        ],
        footer: { text: 'Odpowiedz wpisując opcję • Czas: 120s' }
      }
    ];

    await handleSendMessage('', [], true, commandData, embeds);
  };

  // Add reaction to a message
  const handleAddReaction = (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const existing = m.reactions?.find(r => r.emoji === emoji);
        if (existing) {
          return {
            ...m,
            reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
          };
        }
        return {
          ...m,
          reactions: [...(m.reactions || []), { emoji, count: 1, users: [activeAuthor.name] }]
        };
      }
      return m;
    }));
  };

  // 3. End Lesson (/lekcja zakoncz)
  const handleEndLesson = async () => {
    const res = await api.endDiscordLesson({ threadId });
    if (res.ok) {
      setCreatedLessonId(res.data.lessonId);
      setSummaryData(res.data.summary);
      setStep('ended_summary');
      await refreshLessons();
    }
  };

  const handleOpenCreatedJournal = () => {
    if (createdLessonId) {
      setActiveLessonId(createdLessonId);
      setActiveView('professor-journal-editor');
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          background: '#0f131c',
          border: '1px solid var(--gold-ancient)',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 30px rgba(88, 101, 242, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1c2230 0%, #0d111a 100%)',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#5865F2', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={15} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
                DISCORD BOT • SYMULATOR SESJI LEKCYJNEJ CYTADELI
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Testowanie komend /lekcja rozpocznij, /lekcja zakoncz, załączników i automatycznej archiwizacji
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* =========================================================================
            STEP 1: SETUP LESSON (/lekcja rozpocznij)
            ========================================================================= */}
        {step === 'setup' && (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto' }}>
            <div style={{ background: 'rgba(88, 101, 242, 0.1)', border: '1px solid rgba(88, 101, 242, 0.3)', borderRadius: '8px', padding: '1rem', color: '#c7d2fe', fontSize: '0.85rem' }}>
              ℹ️ Ten symulator wykonuje rzeczywiste wywołania do silnika bota i bazy SQLite. Pozwala zasymulować aktywność uczniów na Discordzie, przetestować załączniki, embedy, quizy oraz automatyczne przygotowanie szkicu dziennika.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 700 }}>
                  Przedmiot
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#171c26', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#ffffff', fontSize: '0.85rem' }}
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 700 }}>
                  Klasa
                </label>
                <select
                  value={classYear}
                  onChange={(e) => setClassYear(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#171c26', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#ffffff', fontSize: '0.85rem' }}
                >
                  <option value="Klasa I">Klasa I</option>
                  <option value="Klasa II">Klasa II</option>
                  <option value="Klasa III">Klasa III</option>
                  <option value="Klasa IV">Klasa IV</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 700 }}>
                Temat Lekcji (do komendy /lekcja rozpocznij)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.8rem', background: '#171c26', border: '1px solid rgba(197, 159, 78, 0.4)', borderRadius: '6px', color: '#ffffff', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 700 }}>
                  Prowadzący Profesor
                </label>
                <input
                  type="text"
                  value={professorName}
                  onChange={(e) => setProfessorName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#171c26', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#ffffff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 700 }}>
                  Nazwa Wątku Discord
                </label>
                <input
                  type="text"
                  value={threadName}
                  onChange={(e) => setThreadName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', background: '#171c26', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#ffffff', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                onClick={handleStartLesson}
                className="btn-durmstrang"
                style={{
                  padding: '0.7rem 1.8rem',
                  background: 'linear-gradient(135deg, #5865F2 0%, #3b44a9 100%)',
                  borderColor: '#7289da',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(88, 101, 242, 0.4)'
                }}
              >
                /lekcja rozpocznij 🚀
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: LIVE THREAD INTERACTION
            ========================================================================= */}
        {step === 'live_thread' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Identity Switcher Bar */}
            <div
              style={{
                background: '#151923',
                padding: '0.6rem 1.2rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                <span>Tożsamość w wątku:</span>
                {[
                  { name: professorName, house: 'reinhall', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', isBot: false },
                  { name: 'Valdemar Krag-Hansen', house: 'ravnheim', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', isBot: false },
                  { name: 'Erik Nilsen', house: 'bjornhall', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', isBot: false },
                  { name: 'Freja Lund', house: 'ravnheim', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', isBot: false }
                ].map((idOption, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveAuthor(idOption)}
                    style={{
                      background: activeAuthor.name === idOption.name ? 'rgba(88, 101, 242, 0.3)' : 'rgba(255,255,255,0.05)',
                      border: activeAuthor.name === idOption.name ? '1px solid #5865F2' : '1px solid rgba(255,255,255,0.1)',
                      color: activeAuthor.name === idOption.name ? '#ffffff' : '#cbd5e1',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {idOption.name}
                  </button>
                ))}
              </div>

              {/* End Lesson Command Button */}
              <button
                onClick={handleEndLesson}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#ffffff',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)'
                }}
              >
                /lekcja zakoncz 🛑
              </button>
            </div>

            {/* Simulated Discord Message Stream */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
                background: '#0a0d14',
                minHeight: '300px',
                maxHeight: '400px'
              }}
            >
              {messages.map((m, idx) => (
                <div
                  key={m.id || idx}
                  style={{
                    background: 'rgba(18, 23, 33, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  {m.replyToAuthor && (
                    <div style={{ fontSize: '0.72rem', color: '#93c5fd' }}>
                      ↳ Odpowiedź do @{m.replyToAuthor}: „{m.replyToContent?.slice(0, 40)}...”
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={m.authorAvatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>{m.authorDisplayName}</span>
                      {m.isBot && <span style={{ background: '#5865F2', color: '#fff', fontSize: '0.58rem', padding: '0.05rem 0.3rem', borderRadius: '2px', fontWeight: 800 }}>BOT</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.timestamp}</span>
                      {/* Reply button */}
                      <button
                        onClick={() => setReplyingTo(m)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer' }}
                        title="Odpowiedz"
                      >
                        Odpowiedz
                      </button>
                    </div>
                  </div>

                  {m.content && (
                    <div style={{ color: '#e2e8f0', fontSize: '0.86rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {m.content}
                    </div>
                  )}

                  {/* Embeds */}
                  {m.embeds && m.embeds.map((emb, ei) => (
                    <div key={ei} style={{ background: '#121622', borderLeft: '3px solid #c59f4e', padding: '0.6rem', borderRadius: '4px', marginTop: '0.4rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>{emb.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.2rem' }}>{emb.description}</div>
                    </div>
                  ))}

                  {/* Attachments */}
                  {m.attachments && m.attachments.map((att, ai) => (
                    <div key={ai} style={{ maxWidth: '200px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(197,159,78,0.4)', marginTop: '0.4rem' }}>
                      <img src={att.storageUrl || att.originalUrl} alt="" style={{ width: '100%', display: 'block' }} />
                    </div>
                  ))}

                  {/* Reactions toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                    {m.reactions?.map((r, ri) => (
                      <span key={ri} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                        {r.emoji} {r.count}
                      </span>
                    ))}
                    {['❤️', '👍', '🔥', '🦌', '🐦'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(m.id, emoji)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.6 }}
                        title={`Dodaj ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bar / Shortcuts */}
            <div style={{ padding: '0.5rem 1rem', background: '#121622', display: 'flex', alignItems: 'center', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Szybkie akcje symulatora:</span>
              <button
                onClick={handleSendPhotoDemo}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#ffffff', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <ImageIcon size={12} /> Wyślij Zdjęcie
              </button>
              <button
                onClick={handleSendQuizDemo}
                style={{ background: 'rgba(197, 159, 78, 0.15)', border: '1px solid var(--gold-ancient)', color: 'var(--gold-glow)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Zap size={12} /> Uruchom /quiz
              </button>
            </div>

            {/* Replying notice */}
            {replyingTo && (
              <div style={{ background: '#181f30', padding: '0.35rem 1rem', fontSize: '0.75rem', color: '#93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Odpowiadasz do: <strong>@{replyingTo.authorDisplayName}</strong></span>
                <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Anuluj</button>
              </div>
            )}

            {/* Input Bar */}
            <div style={{ padding: '0.8rem 1rem', background: '#0e121a', display: 'flex', alignItems: 'center', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                placeholder={`Napisz wiadomość jako @${activeAuthor.name}...`}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.9rem',
                  background: '#181d28',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleSendMessage()}
                className="btn-durmstrang"
                style={{ padding: '0.6rem 1rem', background: '#5865F2', borderColor: '#7289da' }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: SUMMARY & LINK TO PROFESSOR PANEL
            ========================================================================= */}
        {step === 'ended_summary' && summaryData && (
          <div style={{ padding: '2.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
              📖 LEKCJA ZAKOŃCZONA — WĄTEK ZARCHIWIZOWANY
            </h3>

            <div style={{ background: '#151923', border: '1px solid var(--gold-ancient)', borderRadius: '8px', padding: '1.2rem', maxWidth: '480px', width: '100%', textAlign: 'left' }}>
              <div style={{ fontWeight: 800, color: 'var(--gold-glow)', fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>
                {summaryData.subject} — {summaryData.classYear}
              </div>
              <div style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>
                {summaryData.topic}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', fontSize: '0.84rem' }}>
                <span>👥 {summaryData.stats.participantsCount} uczestników</span>
                <span>💬 {summaryData.stats.messagesCount} wiadomości</span>
                <span>🖼 {summaryData.stats.attachmentsCount} załączników</span>
              </div>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '520px', margin: 0, lineHeight: 1.5 }}>
              Szkic dziennika lekcyjnego został pomyślnie utworzony w stanie <strong>DRAFT</strong>. Kliknij poniżej, aby otworzyć Panel Profesora, zweryfikować obecność, przyznać punkty i oficjalnie opublikować wpis w kronice.
            </p>

            <button
              onClick={handleOpenCreatedJournal}
              className="btn-durmstrang"
              style={{
                padding: '0.75rem 2rem',
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #c59f4e 0%, #9a7629 100%)',
                color: '#090d14',
                fontWeight: 800,
                boxShadow: '0 4px 20px rgba(197, 159, 78, 0.4)'
              }}
            >
              <BookOpen size={16} /> [ OTWÓRZ DZIENNIK W PANELU PROFESORA ]
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
