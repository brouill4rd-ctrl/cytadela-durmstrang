import React, { useEffect, useCallback, useState } from 'react';
import { api } from '../api';
import './PrologueView.css';

const JOURNEY_STAGES = ['PORT', 'SHIP', 'FJORD', 'BORDER_CONTROL', 'GREAT_HALL', 'ARRIVED'];

const scenes = {
  PORT: {
    kicker: 'Nabrzeże Czarnej Latarni',
    title: 'Port',
    locationLabel: 'PORT',
    atmosphere: 'Czarna woda uderza o pale. Wśród tłumu adeptów wyróżniasz się spokojem i dokumentami pod pachą.',
    text: 'Na nabrzeżu kłębi się gromada nowicjuszy. Jeden z nich gubi mapę — wiatr porywa ją ku wodzie. Straż portowa zajęta jest przetwarzaniem biletów.',
    choices: [
      { id: 'retrieve', label: 'Reagujesz natychmiast — chwytasz mapę w ostatniej chwili' },
      { id: 'delegate', label: 'Wskazujesz adeptowi właściwy kierunek, sam piszesz dalej' },
      { id: 'observe', label: 'Czekasz i obserwujesz, jak nowicjusz radzi sobie sam' }
    ]
  },
  SHIP: {
    kicker: 'Przejście przez Morze Północne',
    title: 'Statek',
    locationLabel: 'STATEK',
    atmosphere: 'Kadłub drakkaru ryczy pod naporem fal. Adepci skupiają się pod pokładem. Ty zostajesz na górze.',
    text: 'Burza zbliża się od zachodu. Kilku adeptów panikuje — widzisz strach w ich oczach. Kapitan nie interweniuje.',
    choices: [
      { id: 'calm', label: 'Przywołujesz ich do siebie i spokojnie wyjaśniasz zjawisko' },
      { id: 'let_go', label: 'Pozwalasz im poczuć burzę — to pierwsza lekcja Durmstrangu' },
      { id: 'report', label: 'Meldasz kapitanowi o stanie adeptów' }
    ]
  },
  FJORD: {
    kicker: 'Czarny Fiord',
    title: 'Fiord',
    locationLabel: 'FIORD',
    atmosphere: 'Nad wodą drży światło Magicznej Północy. Skały zwierają się jak dłonie zamkniętej bramy.',
    text: 'Twierdza wyrasta z lodowca powoli, jak wspomnienie. Patrzysz na mury, które od dziś będą Twoim miejscem pracy — i pytasz siebie, czym napełnisz te korytarze.',
    choices: [
      { id: 'recall', label: 'Wspominasz własne lata nauki — i kogo chciałbyś/chciałabyś wychować' },
      { id: 'plan', label: 'Piszesz w myślach plan pierwszej lekcji' },
      { id: 'silent', label: 'Milczysz. Twierdza mówi sama za siebie' }
    ]
  },
  BORDER_CONTROL: {
    kicker: 'Północna Brama',
    title: 'Kontrola Graniczna',
    locationLabel: 'BRAMA',
    atmosphere: null,
    text: 'Strażnik w zbroi runicznej sprawdza Twój Akt Mianowania. „Kadra" — mówi krótko i kiwa głową. Brama otwiera się inaczej niż dla adeptów — szerzej, jakby Twierdza wiedziała, że wchodzi nauczyciel.',
    choices: [
      { id: 'documents', label: 'Okazujesz Akt Mianowania i przekraczasz próg' }
    ]
  },
  GREAT_HALL: {
    kicker: 'Za Wrotami Twierdzy',
    title: 'Wielka Sala',
    locationLabel: 'TWIERDZA',
    atmosphere: 'Herby Reinhall, Björnhall, Ravnheim i Otergard płoną w półmroku.',
    text: 'Stoisz po stronie podium — nie pośród adeptów, lecz naprzeciwko nich. Wielka Sala jest teraz Twoją salą. Pytanie brzmi: czego będziesz ich tu uczyć?',
    choices: [
      { id: 'enter', label: 'Zajmujesz swoje miejsce pośród Kadry' }
    ]
  },
  ARRIVED: {
    kicker: 'Pierwsza Noc w Twierdzy',
    title: 'Witaj w Durmstrangu',
    locationLabel: 'TWIERDZA',
    atmosphere: null,
    text: 'Klucz do gabinetu zimny w dłoni. Brama zamknęła się z głębokim, runicznym dźwiękiem. Od tej chwili mury Twierdzy są w Twojej pieczy — tak samo, jak adepci, którzy jutro staną przed Tobą.',
    choices: [
      { id: 'complete', label: 'Zapal świecę w gabinecie i rozpocznij swoją sagę' }
    ]
  }
};

const nextStage = {
  LETTER_PENDING: 'LETTER_OPENED',
  LETTER_OPENED: 'PORT',
  PORT: 'SHIP',
  SHIP: 'FJORD',
  FJORD: 'BORDER_CONTROL',
  BORDER_CONTROL: 'GREAT_HALL',
  GREAT_HALL: 'ARRIVED',
  ARRIVED: 'COMPLETED'
};

const ROUTE_MAP = [
  { id: 'PORT', label: 'Port' },
  { id: 'SHIP', label: 'Statek' },
  { id: 'FJORD', label: 'Fiord' },
  { id: 'BORDER_CONTROL', label: 'Brama' },
  { id: 'GREAT_HALL', label: 'Sala' },
  { id: 'ARRIVED', label: 'Twierdza' }
];

function SnowFlakes() {
  return (
    <div className="pl-snow" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} className="pl-snowflake" style={{
          left: `${(i * 5.6 + Math.sin(i) * 8) % 100}%`,
          animationDelay: `${(i * 0.7) % 6}s`,
          animationDuration: `${8 + (i % 5) * 1.5}s`,
          fontSize: `${0.4 + (i % 4) * 0.2}rem`,
          opacity: 0.15 + (i % 3) * 0.1
        }}>❄</span>
      ))}
    </div>
  );
}

function RouteMap({ currentStage }) {
  const currentIdx = ROUTE_MAP.findIndex(s => s.id === currentStage);
  return (
    <nav className="pl-route-map" aria-label="Trasa podróży">
      {ROUTE_MAP.map((stop, i) => (
        <React.Fragment key={stop.id}>
          <div className={`pl-route-stop ${i < currentIdx ? 'passed' : ''} ${stop.id === currentStage ? 'current' : ''}`}>
            <div className="pl-route-dot" />
            <span className="pl-route-label">{stop.label}</span>
          </div>
          {i < ROUTE_MAP.length - 1 && (
            <div className={`pl-route-line ${i < currentIdx ? 'passed' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export const TeacherPrologueView = ({ onComplete }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(() => {
    api.getMyPrologue().then(r => {
      if (r.ok) setData(r.data);
      else setError(r.error);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stage = data?.stage;
  const scene = scenes[stage];

  const advance = async (choiceId) => {
    if (!nextStage[stage] || busy) return;
    setBusy(true);
    setError('');
    const result = await api.advancePrologue(nextStage[stage], choiceId);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setData(result.data);
    if (result.data.completed) onComplete?.();
  };

  const handleOpenLetter = () => {
    setOpening(true);
    setTimeout(() => advance(), 650);
  };

  // ── Loading / Error ──────────────────────────────────────────────
  if (!data) {
    return (
      <div className="prologue-root">
        <SnowFlakes />
        <p className="pl-loading">{error || 'Kancelaria weryfikuje pieczęcie mianowania…'}</p>
      </div>
    );
  }
  if (data.completed) return null;

  // ── Envelope scene ───────────────────────────────────────────────
  if (stage === 'LETTER_PENDING') {
    return (
      <div className="prologue-root stage-letter-pending">
        <SnowFlakes />
        <main className="pl-envelope-scene">
          <p className="pl-kicker">Kancelaria Twierdzy Magii Durmstrang</p>
          <p className="pl-envelope-intro">Akt mianowania oczekuje na otwarcie</p>
          <div className={`pl-envelope ${opening ? 'opening' : ''}`} role="img" aria-label="Zapieczętowany akt mianowania z Durmstrangu">
            <div className="pl-env-back" />
            <div className="pl-env-flap" />
            <div className="pl-env-body">
              <div className="pl-env-address">
                <span className="pl-env-to">Do rąk własnych:</span>
                <strong className="pl-env-name">{data.character.fullName}</strong>
                <span className="pl-env-school">Twierdza Magii Durmstrang</span>
                <span className="pl-env-subtitle">Wydział Kadry Akademickiej · Twierdza</span>
              </div>
            </div>
            <button
              className="pl-wax-seal"
              aria-label="Złam pieczęć i otwórz akt mianowania"
              onClick={handleOpenLetter}
              disabled={opening || busy}
            >
              <span className="pl-wax-rune">ᛟ</span>
              <span className="pl-wax-crack" aria-hidden="true" />
            </button>
          </div>
          <p className="pl-gesture-hint" aria-live="polite">
            {opening ? 'Pieczęć pęka…' : 'Dotknij pieczęci, aby ją złamać'}
          </p>
          <button className="pl-skip-link" onClick={() => advance()} disabled={busy}>
            Otwórz akt bez animacji
          </button>
        </main>
      </div>
    );
  }

  // ── Letter scene ─────────────────────────────────────────────────
  if (stage === 'LETTER_OPENED') {
    const { letter, character } = data;
    return (
      <div className="prologue-root stage-letter-opened">
        <SnowFlakes />
        <main className="pl-letter-scene">
          <article className="pl-parchment" aria-label="Oficjalny akt mianowania na stanowisko wykładowcy">
            {/* Header */}
            <div className="pl-parchment-header">
              <div className="pl-parchment-rune" aria-hidden="true">ᛟ</div>
              <div className="pl-parchment-title-block">
                <span className="pl-parchment-school">TWIERDZA MAGII DURMSTRANG</span>
                <span className="pl-parchment-subtitle">Rada Arcymistrzów · Wydział Kadry Akademickiej</span>
              </div>
              <div className="pl-parchment-rune" aria-hidden="true">ᛞ</div>
            </div>

            <div className="pl-parchment-divider" aria-hidden="true">
              <span>✦</span><span className="pl-divider-line" /><span>ᛋ</span><span className="pl-divider-line" /><span>✦</span>
            </div>

            <p className="pl-parchment-doc-label">AKT MIANOWANIA · {letter.schoolYear}</p>

            <div className="pl-parchment-addressee">
              <span className="pl-addressee-label">Do:</span>
              <strong>{character.fullName}</strong>
              {character.specialization && <span className="pl-addressee-origin">{character.specialization}</span>}
            </div>

            <p className="pl-parchment-salutation">{letter.salutation},</p>

            <p className="pl-parchment-body">
              Rada Arcymistrzów Twierdzy Magii Durmstrang, działając w imieniu Paktu 1294 i tradycji Cytadeli,
              niniejszym informuje, że <strong>{character.fullName}</strong>{' '}
              {letter.appointmentClause} na stanowisko <strong>{letter.roleLabel}</strong>{' '}
              <strong>{letter.departmentGenitive || letter.department}</strong>.
            </p>
            <p className="pl-parchment-body">
              Objęcie obowiązków nastąpi z chwilą przekroczenia Bramy Cytadeli. Prosimy o stawienie się
              przy Nabrzeżu Czarnej Latarni o wyznaczonej godzinie. Do Aktu dołączono przepustkę kadrową —
              wymagana przy Północnej Bramie.
            </p>
            <p className="pl-parchment-body">
              Twierdza powierza {letter.panDative} adeptów i tradycję. Durmstrang kształtuje nie tylko umysły,
              lecz charaktery. Spodziewamy się, że Wasza Osoba spełni to powołanie zgodnie z Paktem.
            </p>

            <div className="pl-parchment-divider" aria-hidden="true">
              <span>✦</span><span className="pl-divider-line" /><span>ᛟ</span><span className="pl-divider-line" /><span>✦</span>
            </div>

            {/* Staff pass strip */}
            <div className="pl-ticket">
              <div className="pl-ticket-label">PRZEPUSTKA KADROWA · WEJŚCIE PERSONELU</div>
              <div className="pl-ticket-holder">{character.fullName}</div>
              <div className="pl-ticket-details">
                <span>{letter.department}</span>
                <span className="pl-ticket-sep">·</span>
                <span>{letter.roleLabel}</span>
              </div>
            </div>

            {/* Signature area */}
            <div className="pl-signature-block">
              <div className="pl-signature-left">
                <p className="pl-closing">Z upoważnienia Rady Arcymistrzów,<br />Złotą Pieczęcią Paktu 1294</p>
                {letter.signatoryPng ? (
                  <img src={letter.signatoryPng} alt={`Podpis — ${letter.signatoryName}`} className="pl-signature-img" />
                ) : (
                  <p className="pl-signature-text">{letter.signatoryName}</p>
                )}
                <p className="pl-signatory-title">{letter.signatoryTitle}</p>
              </div>
              <div className="pl-seal-css" aria-label="Pieczęć Rady Arcymistrzów" role="img">
                <span className="pl-seal-rune">ᛟ</span>
                <span className="pl-seal-text">PAKT 1294</span>
              </div>
            </div>

            <div className="pl-parchment-cta">
              <button className="pl-btn-primary" onClick={() => advance()} disabled={busy} aria-busy={busy}>
                {busy ? 'Pieczęcie się otwierają…' : 'Przyjmij mianowanie i wyrusz do Cytadeli'}
              </button>
            </div>
          </article>
        </main>
      </div>
    );
  }

  // ── Journey scenes ───────────────────────────────────────────────
  if (scene) {
    return (
      <div className={`prologue-root stage-journey stage-${stage.toLowerCase().replace('_', '-')}`}>
        <SnowFlakes />
        <div className="pl-journey-bg" aria-hidden="true" />
        <main className="pl-journey-scene">
          <RouteMap currentStage={stage} />
          <div className="pl-scene-panel">
            <p className="pl-kicker">{scene.kicker}</p>
            <h1 className="pl-scene-title">{scene.title}</h1>
            <p className="pl-scene-text">{scene.text}</p>
            {scene.atmosphere && <p className="pl-atmosphere">{scene.atmosphere}</p>}
            <div className="pl-scene-choices" role="group" aria-label="Twój wybór">
              {scene.choices.map(({ id, label }) => (
                <button
                  key={id}
                  className="pl-choice-btn"
                  onClick={() => advance(id)}
                  disabled={busy}
                  aria-busy={busy}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </main>
        {error && <div className="pl-error" role="alert">{error}</div>}
      </div>
    );
  }

  return (
    <div className="prologue-root">
      <SnowFlakes />
      <p className="pl-loading">{error || 'Wczytywanie aktu mianowania…'}</p>
    </div>
  );
};
