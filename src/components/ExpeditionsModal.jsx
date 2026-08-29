import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, Clock3, Compass, Info, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { api } from '../api';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import { EXPEDITION_DESTINATIONS, EXPEDITION_RULES } from '../data/expeditionsData';

const panelStyle = {
  background: 'rgba(12, 16, 24, 0.82)',
  border: '1px solid rgba(197, 159, 78, 0.3)',
  borderRadius: '8px'
};

const EMPTY_STATUS = {
  dailyLimit: EXPEDITION_RULES.dailyLimit,
  used: 0,
  remaining: EXPEDITION_RULES.dailyLimit,
  attempts: []
};

export const ExpeditionsModal = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUser, fetchRankings, addNotification } = useSchool();
  const { playWandSwoosh, playRuneChime, playSortingFanfare } = useSound();
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [statusReady, setStatusReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [startingId, setStartingId] = useState(null);
  const [error, setError] = useState('');
  const [rulesOpen, setRulesOpen] = useState(true);
  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [choiceIds, setChoiceIds] = useState([]);
  const [expeditionLog, setExpeditionLog] = useState([]);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoadingStatus(true);
    setStatusReady(false);
    setError('');
    api.getExpeditionStatus().then((response) => {
      if (!active) return;
      if (response.ok) {
        setStatus(response.data);
        setStatusReady(true);
      } else {
        setError(response.error || 'Nie udało się odczytać limitu ekspedycji.');
      }
    }).finally(() => {
      if (active) setLoadingStatus(false);
    });
    return () => { active = false; };
  }, [isOpen]);

  const lockedRoutes = useMemo(
    () => new Set((status.attempts || []).map((attempt) => attempt.destinationId)),
    [status.attempts]
  );

  if (!isOpen) return null;

  const resetAdventure = () => {
    setSelectedExpedition(null);
    setAttemptId(null);
    setCurrentStep(0);
    setChoiceIds([]);
    setExpeditionLog([]);
    setResult(null);
    setError('');
  };

  const startExpedition = async (expedition) => {
    setStartingId(expedition.id);
    setError('');
    playWandSwoosh();
    const response = await api.startExpedition(expedition.id);
    setStartingId(null);
    if (!response.ok) {
      setError(response.error || 'Kwatermistrz nie otworzył szlaku.');
      if (response.data?.attempts) setStatus(response.data);
      return;
    }

    setStatus(response.data);
    setSelectedExpedition(expedition);
    setAttemptId(response.data.attemptId);
    setCurrentStep(0);
    setChoiceIds([]);
    setExpeditionLog([`Wyruszasz ku: ${expedition.name}. Dzienny slot wyprawy został wykorzystany.`]);
    setRulesOpen(false);
  };

  const finishExpedition = async (finalChoiceIds) => {
    setFinishing(true);
    setError('');
    const response = await api.completeExpedition(attemptId, finalChoiceIds);
    setFinishing(false);
    if (!response.ok) {
      setError(response.error || 'Nie udało się rozliczyć ekspedycji.');
      return;
    }

    setResult(response.data.result);
    setStatus(response.data.status);
    if (response.data.user && updateCurrentUser) {
      const user = response.data.user;
      await updateCurrentUser({
        points: user.points,
        xp: user.xp,
        level: user.level,
        nextLevelXp: user.nextLevelXp,
        currency: user.currency,
        inventory: user.inventory
      });
    }
    if (fetchRankings) fetchRankings();
    playSortingFanfare();
    const reward = response.data.result;
    const pointsLabel = currentUser?.role === 'student' ? 'pkt Zakonu' : 'pkt osobistych';
    addNotification(reward.success
      ? `🏔️ Ekspedycja ukończona: ${reward.score}/6. +${reward.coins} Skirnirów i +${reward.points} ${pointsLabel}.`
      : `❄️ Ekspedycja zakończona wynikiem ${reward.score}/6. Wracasz bez łupu.`);
  };

  const makeChoice = async (choice) => {
    if (finishing || choiceIds.length >= selectedExpedition.stages.length) return;
    playWandSwoosh();
    playRuneChime();
    const nextChoices = [...choiceIds, choice.id];
    setChoiceIds(nextChoices);
    setExpeditionLog((previous) => [
      ...previous,
      `▸ ${choice.text}`,
      `✓ ${choice.successText} (+${choice.points} pkt wyprawy)`
    ]);
    if (currentStep + 1 < selectedExpedition.stages.length) setCurrentStep((step) => step + 1);
    else await finishExpedition(nextChoices);
  };

  const noSlots = status.remaining <= 0;
  const allChoicesMade = selectedExpedition && choiceIds.length >= selectedExpedition.stages.length;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(3,5,8,.93)', backdropFilter: 'blur(12px)' }}>
      <div style={{ width: '100%', maxWidth: '960px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '12px', border: '2px solid var(--gold-ancient)', background: 'linear-gradient(180deg,#181d29 0%,#090c12 100%)', boxShadow: '0 12px 60px rgba(0,0,0,.95),0 0 30px rgba(197,159,78,.25)' }}>
        <header style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid rgba(197,159,78,.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: 'rgba(0,0,0,.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <Compass size={24} color="var(--gold-ancient)" />
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>Ekspedycje Północy</h3>
              <span style={{ color: 'var(--gold-ancient)', fontSize: '.72rem' }}>WYPRAWY DO DZIKICH OSTĘPÓW • ZASADY I PUNKTACJA</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Zamknij" style={{ border: 0, background: 'transparent', color: '#9ca3af', cursor: 'pointer', padding: '.3rem' }}><X size={21} /></button>
        </header>

        <main style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!selectedExpedition ? (
            <>
              <section style={{ ...panelStyle, padding: '1rem 1.1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <Clock3 size={20} color="var(--gold-ancient)" />
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700 }}>Dzisiejsze wyprawy: {loadingStatus ? '…' : `${status.used}/${status.dailyLimit}`}</div>
                    <div style={{ color: '#9ca3af', fontSize: '.78rem' }}>Pozostało {status.remaining} • reset o {EXPEDITION_RULES.resetTime}</div>
                  </div>
                </div>
                <button type="button" onClick={() => setRulesOpen((open) => !open)} style={{ border: '1px solid rgba(197,159,78,.45)', borderRadius: '5px', background: 'rgba(197,159,78,.09)', color: '#f7dca0', padding: '.55rem .8rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <Info size={15} /> {rulesOpen ? 'Ukryj zasady' : 'Zasady i punktacja'}
                </button>
              </section>

              {rulesOpen && (
                <section style={{ ...panelStyle, padding: '1rem 1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: '#fff', fontFamily: 'var(--font-heading)', marginBottom: '.75rem' }}><ShieldCheck size={18} color="#8cefe6" /> Regulamin szlaku</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(205px,1fr))', gap: '.7rem', marginBottom: '1rem' }}>
                    {[
                      ['3 wyprawy na dobę', 'Każda z trzech tras może być podjęta najwyżej raz.'],
                      ['Start zużywa limit', 'Zawrócenie, zamknięcie okna lub utrata połączenia nie oddaje slotu.'],
                      ['2 decyzje • 2–6 pkt', 'Każda decyzja jest warta od 1 do 3 punktów wyprawy.'],
                      ['Nagrody za wynik', 'Artefakt otrzymasz tylko za bezbłędny rezultat 6/6.']
                    ].map(([title, text]) => (
                      <div key={title} style={{ background: 'rgba(255,255,255,.035)', borderRadius: '6px', padding: '.75rem' }}>
                        <div style={{ color: '#f7dca0', fontWeight: 700, fontSize: '.82rem' }}>{title}</div>
                        <div style={{ color: '#9ca3af', fontSize: '.75rem', lineHeight: 1.45, marginTop: '.25rem' }}>{text}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px', color: '#d1d5db', fontSize: '.76rem' }}>
                      <thead><tr style={{ color: '#f7dca0', textAlign: 'left', borderBottom: '1px solid rgba(197,159,78,.3)' }}><th style={{ padding: '.55rem' }}>Szlak</th><th>Próg</th><th>Skirniry</th><th>Punkty Zakonu</th><th>Artefakt</th></tr></thead>
                      <tbody>{EXPEDITION_DESTINATIONS.map((expedition) => (
                        <tr key={expedition.id} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                          <td style={{ padding: '.6rem' }}>{expedition.icon} {expedition.difficulty}</td>
                          <td>{expedition.successThreshold}/6</td>
                          <td>{expedition.rewardTiers.filter((tier) => tier.coins).map((tier) => tier.coins).join(' / ')} ᛋ</td>
                          <td>{expedition.rewardTiers.filter((tier) => tier.points).map((tier) => tier.points).join(' / ')}</td>
                          <td>wyłącznie 6/6</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div style={{ color: '#8cefe6', fontSize: '.74rem', marginTop: '.7rem' }}>Dzienny pułap: maks. {EXPEDITION_RULES.maxDailyPoints} pkt Zakonu i {EXPEDITION_RULES.maxDailySkirnirs} Skirnirów.</div>
                </section>
              )}

              {error && <div role="alert" style={{ ...panelStyle, borderColor: 'rgba(239,68,68,.55)', color: '#fca5a5', padding: '.75rem 1rem', display: 'flex', gap: '.5rem', alignItems: 'center' }}><AlertTriangle size={17} /> {error}</div>}
              <p style={{ margin: '.1rem 0', color: '#9ca3af', fontSize: '.88rem' }}>Wybierz cel. Kwatermistrz zapisze wyjście w chwili otwarcia szlaku.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: '1rem' }}>
                {EXPEDITION_DESTINATIONS.map((expedition) => {
                  const locked = lockedRoutes.has(expedition.id);
                  const disabled = locked || noSlots || !statusReady || startingId !== null;
                  return (
                    <article key={expedition.id} style={{ ...panelStyle, padding: '1.1rem', opacity: locked ? .62 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '.9rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}><span style={{ fontSize: '1.8rem' }}>{expedition.icon}</span><span style={{ color: expedition.dangerColor, border: `1px solid ${expedition.dangerColor}`, borderRadius: '4px', padding: '.16rem .42rem', fontSize: '.7rem', fontWeight: 700 }}>{expedition.difficulty} ({expedition.difficultyLabel})</span></div>
                        <h4 style={{ margin: '.55rem 0 .35rem', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>{expedition.name}</h4>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '.79rem', lineHeight: 1.45 }}>{expedition.desc}</p>
                      </div>
                      <div>
                        <div style={{ color: 'var(--gold-ancient)', fontSize: '.72rem', marginBottom: '.6rem' }}>🎁 {expedition.rewardSummary}</div>
                        <button type="button" disabled={disabled} onClick={() => startExpedition(expedition)} style={{ width: '100%', border: 0, borderRadius: '5px', padding: '.62rem', fontFamily: 'var(--font-heading)', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#6b7280' : '#090b10', background: disabled ? 'rgba(255,255,255,.07)' : 'linear-gradient(135deg,var(--gold-ancient),#9a7629)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.35rem' }}>
                          {locked ? 'Szlak wykorzystany' : noSlots ? 'Limit wyczerpany' : startingId === expedition.id ? 'Otwieranie szlaku…' : <>Wyrusz na szlak <ChevronRight size={14} /></>}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <section style={{ ...panelStyle, borderLeft: '3px solid var(--gold-ancient)', padding: '.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.8rem' }}>
                <div><div style={{ color: 'var(--gold-ancient)', fontSize: '.68rem' }}>AKTYWNA WYPRAWA • PRÓG {selectedExpedition.successThreshold}/6</div><div style={{ color: '#fff', fontFamily: 'var(--font-heading)' }}>{selectedExpedition.icon} {selectedExpedition.name}</div></div>
                {!result && <button type="button" onClick={resetAdventure} style={{ border: '1px solid rgba(255,255,255,.18)', borderRadius: '4px', background: 'transparent', color: '#9ca3af', padding: '.4rem .6rem', cursor: 'pointer', fontSize: '.72rem' }}>Zawróć • slot przepada</button>}
              </section>

              {error && <div role="alert" style={{ ...panelStyle, borderColor: 'rgba(239,68,68,.55)', color: '#fca5a5', padding: '.75rem 1rem', display: 'flex', gap: '.5rem', alignItems: 'center' }}><AlertTriangle size={17} /> {error}</div>}
              {!result ? (
                <section style={{ ...panelStyle, borderColor: 'rgba(197,159,78,.65)', padding: '1.25rem' }}>
                  <div style={{ color: 'var(--gold-ancient)', fontWeight: 700, fontSize: '.72rem' }}>ETAP {currentStep + 1} Z {selectedExpedition.stages.length}</div>
                  <p style={{ color: '#fff', fontFamily: 'var(--font-lore)', fontSize: '1rem', lineHeight: 1.58, margin: '.55rem 0 1rem' }}>{selectedExpedition.stages[currentStep].prompt}</p>
                  {!allChoicesMade && <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                    {selectedExpedition.stages[currentStep].choices.map((choice) => (
                      <button key={choice.id} type="button" disabled={finishing} onClick={() => makeChoice(choice)} style={{ border: '1px solid rgba(197,159,78,.38)', borderRadius: '6px', background: 'rgba(7,10,16,.72)', color: '#ffe599', padding: '.78rem .9rem', cursor: finishing ? 'wait' : 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.8rem' }}>
                        <span><span style={{ color: '#6b7280', fontSize: '.68rem', display: 'block', marginBottom: '.18rem' }}>{choice.risk.toUpperCase()}</span>⚔️ {choice.text}</span><ChevronRight size={16} />
                      </button>
                    ))}
                  </div>}
                  {finishing && <div style={{ color: '#8cefe6', fontSize: '.78rem' }}>Kwatermistrz rozlicza wynik wyprawy…</div>}
                  {allChoicesMade && !finishing && error && <button type="button" onClick={() => finishExpedition(choiceIds)} style={{ border: '1px solid var(--gold-ancient)', borderRadius: '5px', background: 'rgba(197,159,78,.12)', color: '#f7dca0', padding: '.55rem .8rem', cursor: 'pointer' }}>Ponów rozliczenie</button>}
                </section>
              ) : (
                <section style={{ ...panelStyle, padding: '1.35rem', textAlign: 'center', border: `2px solid ${result.success ? '#22c55e' : '#ef4444'}`, background: result.success ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.09)' }}>
                  <span style={{ fontSize: '2.4rem' }}>{result.success ? '🏆' : '❄️'}</span>
                  <h3 style={{ color: result.success ? '#4ade80' : '#fca5a5', fontFamily: 'var(--font-heading)', margin: '.4rem 0' }}>{result.success ? 'EKSPEDYCJA ZAKOŃCZONA' : 'ODWRÓT DO CYTADELI'}</h3>
                  <div style={{ color: '#d1d5db', marginBottom: '1rem' }}>Wynik: <strong style={{ color: '#fff' }}>{result.score}/{result.maxScore}</strong> punktów wyprawy.</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '.7rem', marginBottom: '1rem' }}>
                    <span style={{ ...panelStyle, padding: '.55rem .75rem', color: '#f7dca0' }}>💰 +{result.coins} Skirnirów</span>
                    <span style={{ ...panelStyle, padding: '.55rem .75rem', color: '#8cefe6' }}>✨ +{result.points} pkt Zakonu</span>
                    {result.item && <span style={{ ...panelStyle, padding: '.55rem .75rem', color: '#c4b5fd' }}>🎁 {result.item}</span>}
                  </div>
                  {!result.success && <p style={{ color: '#9ca3af', fontSize: '.8rem' }}>Nie osiągnięto progu {selectedExpedition.successThreshold}/6. Ta trasa pozostaje zamknięta do następnej doby.</p>}
                  <button type="button" onClick={resetAdventure} style={{ border: 0, borderRadius: '5px', padding: '.6rem 1rem', background: 'var(--gold-ancient)', color: '#080a0f', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', gap: '.4rem', alignItems: 'center' }}><RotateCcw size={15} /> Wróć do mapy wypraw</button>
                </section>
              )}

              <section style={{ ...panelStyle, padding: '.9rem 1rem' }}>
                <div style={{ color: 'var(--gold-ancient)', fontSize: '.7rem', fontWeight: 700, marginBottom: '.45rem' }}>KRONIKA WYPRAWY</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>{expeditionLog.map((entry, index) => <div key={`${index}-${entry}`} style={{ color: entry.startsWith('✓') ? '#4ade80' : entry.startsWith('▸') ? '#ffe599' : '#9ca3af', fontSize: '.78rem' }}>{entry}</div>)}</div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
