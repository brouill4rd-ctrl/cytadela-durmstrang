import React, { useEffect, useCallback, useState, useRef } from 'react';
import { api } from '../api';
import { useSchool } from '../context/SchoolContext';
import './PrologueView.css';

const MANDATORY_KIT_IDS = ['kit-rozdzka', 'kit-szaty', 'kit-podreczniki'];

const JOURNEY_STAGES = ['PORT', 'SHIP', 'FJORD', 'BORDER_CONTROL', 'GREAT_HALL', 'ARRIVED'];

const scenes = {
  PORT: {
    kicker: 'Nabrzeże Czarnej Latarni',
    title: 'Port',
    locationLabel: 'PORT',
    atmosphere: 'Czarna woda uderza o pale. Pochodni nie brakuje, ale dym gryzie w oczy.',
    text: 'Ponad śniegiem po raz pierwszy dostrzegasz banderę Twierdzy. Przed tobą jeden z adeptów upuszcza dokument — pieczęć z herbem jego Zakonu.',
    choices: [
      { id: 'return', label: 'Podnieś dokument i oddaj właścicielowi' },
      { id: 'call', label: 'Zawołaj właściciela przez nabrzeże' },
      { id: 'ignore', label: 'Ruszasz dalej — nie twoja sprawa' }
    ]
  },
  SHIP: {
    kicker: 'Przejście przez Morze Północne',
    title: 'Statek',
    locationLabel: 'STATEK',
    atmosphere: 'Kadłub drakkaru ryczy pod naporem fal. Za rufą giną ostatnie światła zwykłego świata.',
    text: 'Fale są wyższe niż się spodziewałaś/eś. Kilka adeptów wycofało się pod pokład. Wicher szarpie liną masztu.',
    choices: [
      { id: 'deck', label: 'Zostajesz na pokładzie — lubisz wicher' },
      { id: 'below', label: 'Schodzisz pod pokład z pozostałymi' },
      { id: 'passenger', label: 'Podchodzisz do starszego pasażera w płaszczu' }
    ]
  },
  FJORD: {
    kicker: 'Czarny Fiord',
    title: 'Fiord',
    locationLabel: 'FIORD',
    atmosphere: 'Nad wodą drży światło Magicznej Północy. Zorzę widać nawet w biały dzień.',
    text: 'Skały zwierają się wokół statku jak szczęki olbrzyma. W oddali, pod lodowym niebem, wyrasta Cytadela Durmstrangu.',
    choices: [
      { id: 'watch', label: 'Wpatrujesz się w mury Twierdzy' },
      { id: 'listen', label: 'Wsłuchujesz się w szept fiordu' },
      { id: 'prepare', label: 'Sprawdzasz dokumenty i szaty' }
    ]
  },
  BORDER_CONTROL: {
    kicker: 'Północna Brama',
    title: 'Kontrola Graniczna',
    locationLabel: 'BRAMA',
    atmosphere: null,
    text: 'Strażnik w zbroi runicznej przesuwa wzrokiem po pieczęci, bilecie i twoim imieniu. Niczego nie musisz powtarzać — Kancelaria zna twoją tożsamość.',
    choices: [
      { id: 'documents', label: 'Okazujesz bilet i list przyjęcia' }
    ]
  },
  GREAT_HALL: {
    kicker: 'Za Wrotami Cytadeli',
    title: 'Wielka Sala',
    locationLabel: 'CYTADELA',
    atmosphere: 'W półmroku płoną herby wszystkich czterech Zakonów.',
    text: 'Symbole Reinhall, Björnhall, Ravnheim i Otergard świecą w mroku Wielkiej Sali. Twoje miejsce pośród Zakonów nie zostało jeszcze wyznaczone.',
    choices: [
      { id: 'enter', label: 'Wchodzisz do serca Twierdzy' }
    ]
  },
  ARRIVED: {
    kicker: 'Pierwsza Noc w Cytadeli',
    title: 'Witaj w Durmstrangu',
    locationLabel: 'TWIERDZA',
    atmosphere: null,
    text: 'Brama zamyka się za tobą z głębokim, runicznym hałasem. Od tej chwili nie jesteś już kandydatem. Jesteś adeptem Durmstrangu.',
    choices: [
      { id: 'complete', label: 'Rozpocznij swoją sagę' }
    ]
  }
};

const nextStage = {
  LETTER_PENDING: 'LETTER_OPENED',
  LETTER_OPENED: 'PREPARATION',
  PREPARATION: 'PORT',
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

export const PrologueView = ({ onComplete }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [marketMode, setMarketMode] = useState(false);
  const didAutoRedirect = useRef(false);

  const { setActiveView } = useSchool();

  const loadData = useCallback(() => {
    api.getMyPrologue().then(r => {
      if (r.ok) setData(r.data);
      else setError(r.error);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stage = data?.stage;
  const scene = scenes[stage];
  const kitStatus = data?.kitStatus || [];
  const mandatoryItems = kitStatus.filter(i => MANDATORY_KIT_IDS.includes(i.id));
  const optionalItems = kitStatus.filter(i => !MANDATORY_KIT_IDS.includes(i.id));
  const allMandatoryOwned = mandatoryItems.length > 0 && mandatoryItems.every(i => i.owned);
  const ownedCount = kitStatus.filter(i => i.owned).length;

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

  // Auto-redirect to market once when first entering PREPARATION (if items still needed)
  useEffect(() => {
    if (stage === 'PREPARATION' && !allMandatoryOwned && !didAutoRedirect.current) {
      didAutoRedirect.current = true;
      setMarketMode(true);
      setActiveView('markethall');
    }
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoToMarket = () => {
    setMarketMode(true);
    setActiveView('markethall');
  };

  const handleReturnFromMarket = () => {
    setMarketMode(false);
    loadData();
  };

  // ── Loading / Error ──────────────────────────────────────────────
  if (!data) {
    return (
      <div className="prologue-root">
        <SnowFlakes />
        <p className="pl-loading">{error || 'Kancelaria odczytuje pieczęcie…'}</p>
      </div>
    );
  }
  if (data.completed) return null;

  // ── Market mode: compact floating panel ──────────────────────────
  if (marketMode && stage === 'PREPARATION') {
    return (
      <div className="pl-market-panel" role="complementary" aria-label="Status wyprawki">
        <div className="pl-market-panel-header">
          <span className="pl-market-panel-rune">ᛞ</span>
          <span className="pl-market-panel-title">Wyprawka Adepta</span>
          <span className="pl-market-panel-count">{ownedCount}/{kitStatus.length}</span>
        </div>
        <div className="pl-market-kit-rows">
          {kitStatus.map(item => (
            <div key={item.id} className={`pl-market-kit-row ${item.owned ? 'owned' : ''} ${item.mandatory ? 'mandatory' : 'optional'}`}>
              <span className="pl-mkit-check">{item.owned ? '✓' : item.mandatory ? '○' : '◌'}</span>
              <span className="pl-mkit-icon">{item.icon}</span>
              <span className="pl-mkit-name">{item.name.split('—')[0].trim()}</span>
              {!item.owned && <span className="pl-mkit-price">{item.price} ᛋ</span>}
            </div>
          ))}
        </div>
        <div className="pl-market-panel-actions">
          {allMandatoryOwned ? (
            <button className="pl-market-ready-btn" onClick={handleReturnFromMarket}>
              ✓ Wyprawka skompletowana — wróć do prologu
            </button>
          ) : (
            <button className="pl-market-back-btn" onClick={handleReturnFromMarket}>
              Sprawdź stan wyprawki
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Envelope scene ───────────────────────────────────────────────
  if (stage === 'LETTER_PENDING') {
    return (
      <div className="prologue-root stage-letter-pending">
        <SnowFlakes />
        <main className="pl-envelope-scene">
          <p className="pl-kicker">Kancelaria Twierdzy Magii Durmstrang</p>
          <p className="pl-envelope-intro">Twoja przesyłka oczekuje na otwarcie</p>
          <div className={`pl-envelope ${opening ? 'opening' : ''}`} role="img" aria-label="Zapieczętowana koperta z Durmstrangu">
            <div className="pl-env-back" />
            <div className="pl-env-flap" />
            <div className="pl-env-body">
              <div className="pl-env-address">
                <span className="pl-env-to">Do rąk własnych:</span>
                <strong className="pl-env-name">{data.character.fullName}</strong>
                <span className="pl-env-school">Twierdza Magii Durmstrang</span>
                <span className="pl-env-subtitle">Droga Północna · Cytadela</span>
              </div>
            </div>
            <button
              className="pl-wax-seal"
              aria-label="Złam pieczęć i otwórz list"
              onClick={handleOpenLetter}
              disabled={opening || busy}
            >
              <span className="pl-wax-rune">ᛞ</span>
              <span className="pl-wax-crack" aria-hidden="true" />
            </button>
          </div>
          <p className="pl-gesture-hint" aria-live="polite">
            {opening ? 'Pieczęć pęka…' : 'Dotknij pieczęci, aby ją złamać'}
          </p>
          <button
            className="pl-skip-link"
            onClick={() => advance()}
            disabled={busy}
          >
            Otwórz list bez animacji
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
          <article className="pl-parchment" aria-label="Oficjalny list przyjęcia">
            {/* Header */}
            <div className="pl-parchment-header">
              <div className="pl-parchment-rune" aria-hidden="true">ᛞ</div>
              <div className="pl-parchment-title-block">
                <span className="pl-parchment-school">TWIERDZA MAGII DURMSTRANG</span>
                <span className="pl-parchment-subtitle">Kancelaria Cytadeli · Pieczęć Rady Arcymistrzów</span>
              </div>
              <div className="pl-parchment-rune" aria-hidden="true">ᛟ</div>
            </div>

            <div className="pl-parchment-divider" aria-hidden="true">
              <span>✦</span><span className="pl-divider-line" /><span>ᛋ</span><span className="pl-divider-line" /><span>✦</span>
            </div>

            {/* Document label */}
            <p className="pl-parchment-doc-label">OFICJALNY LIST PRZYJĘCIA · {letter.schoolYear}</p>

            {/* Address & salutation */}
            <div className="pl-parchment-addressee">
              <span className="pl-addressee-label">Do:</span>
              <strong>{character.fullName}</strong>
              {character.origin && <span className="pl-addressee-origin">{character.origin}</span>}
            </div>

            <p className="pl-parchment-salutation">{letter.salutation},</p>

            {/* Body */}
            <p className="pl-parchment-body">
              Rada Arcymistrzów Twierdzy Magii Durmstrang ma zaszczyt poinformować, że po wnikliwym
              rozpatrzeniu dokumentów rekrutacyjnych, {letter.acceptanceClause} w poczet adeptów
              na&nbsp;<strong>{letter.schoolYear}</strong>.
            </p>
            <p className="pl-parchment-body">
              Staw się po zmroku przy Nabrzeżu Czarnej Latarni. Okaż dołączony bilet podróżny
              i&nbsp;zachowaj niniejszy list — będzie wymagany przy kontroli przy Północnej Bramie Cytadeli.
            </p>
            <p className="pl-parchment-body">
              Skarbiec Cytadeli przekazał na Twoje konto <strong>{data.startupGrantAmount} Skirnirów</strong> stypendium
              na zakup obowiązkowej wyprawki. Szczegółowa lista ekwipunku zostanie przedstawiona w następnym kroku.
            </p>

            <div className="pl-parchment-divider" aria-hidden="true">
              <span>✦</span><span className="pl-divider-line" /><span>ᛟ</span><span className="pl-divider-line" /><span>✦</span>
            </div>

            {/* Ticket strip */}
            <div className="pl-ticket">
              <div className="pl-ticket-label">BILET PODRÓŻNY · PRZEJŚCIE NA PÓŁNOC</div>
              <div className="pl-ticket-holder">{letter.ticket.holder}</div>
              <div className="pl-ticket-details">
                <span>{letter.ticket.departure}</span>
                <span className="pl-ticket-sep">·</span>
                <span>Rejs D-{letter.ticket.passage.replace('D-','')}</span>
              </div>
            </div>

            {/* Signature area */}
            <div className="pl-signature-block">
              <div className="pl-signature-left">
                <p className="pl-closing">Z upoważnienia Rady Arcymistrzów,<br />Złotą Pieczęcią Paktu 1294</p>
                {letter.signatoryPng ? (
                  <img
                    src={letter.signatoryPng}
                    alt={`Podpis — ${letter.signatoryName}`}
                    className="pl-signature-img"
                  />
                ) : (
                  <p className="pl-signature-text">{letter.signatoryName}</p>
                )}
                <p className="pl-signatory-title">{letter.signatoryTitle}</p>
              </div>
              <div className="pl-seal-css" aria-label="Pieczęć Rady Arcymistrzów" role="img">
                <span className="pl-seal-rune">ᛞ</span>
                <span className="pl-seal-text">PAKT 1294</span>
              </div>
            </div>

            {/* CTA */}
            <div className="pl-parchment-cta">
              <button
                className="pl-btn-primary"
                onClick={() => advance()}
                disabled={busy}
                aria-busy={busy}
              >
                {busy ? 'Pieczęcie się otwierają…' : 'Przyjmij zaproszenie i przejdź do wyprawki'}
              </button>
            </div>
          </article>
        </main>
      </div>
    );
  }

  // ── Preparation scene ────────────────────────────────────────────
  if (stage === 'PREPARATION') {
    // If all mandatory items are owned, show the journey launch screen
    if (allMandatoryOwned) {
      return (
        <div className="prologue-root stage-preparation">
          <SnowFlakes />
          <main className="pl-preparation-scene">
            <p className="pl-kicker">Wyprawka skompletowana</p>
            <h1 className="pl-preparation-title">Gotowy na podróż</h1>
            <ul className="pl-kit-list" role="list">
              {kitStatus.map(item => (
                <li key={item.id} className="pl-kit-item owned">
                  <span className="pl-kit-check" aria-hidden="true">✓</span>
                  <span className="pl-kit-icon" aria-hidden="true">{item.icon}</span>
                  <span className="pl-kit-name">{item.name.split('—')[0].trim()}</span>
                </li>
              ))}
            </ul>
            <div className="pl-preparation-actions">
              <button className="pl-btn-primary" onClick={() => advance()} disabled={busy} aria-busy={busy}>
                {busy ? 'Przygotowanie do drogi…' : '⚓ Rozpocznij podróż do Cytadeli'}
              </button>
            </div>
          </main>
          {error && <div className="pl-error" role="alert">{error}</div>}
        </div>
      );
    }

    // Returned from market — show kit status and market button
    return (
      <div className="prologue-root stage-preparation">
        <SnowFlakes />
        <main className="pl-preparation-scene">
          <p className="pl-kicker">Wyprawka Adepta</p>
          <ul className="pl-kit-list" role="list">
            {mandatoryItems.map(item => (
              <li key={item.id} className={`pl-kit-item ${item.owned ? 'owned' : 'missing'}`}>
                <span className="pl-kit-check" aria-hidden="true">{item.owned ? '✓' : '○'}</span>
                <span className="pl-kit-icon" aria-hidden="true">{item.icon}</span>
                <span className="pl-kit-name">{item.name.split('—')[0].trim()}</span>
                {!item.owned && <span className="pl-kit-price">{item.price} ᛋ</span>}
              </li>
            ))}
            {optionalItems.map(item => (
              <li key={item.id} className={`pl-kit-item optional ${item.owned ? 'owned' : ''}`}>
                <span className="pl-kit-check" aria-hidden="true">{item.owned ? '✓' : '◌'}</span>
                <span className="pl-kit-icon" aria-hidden="true">{item.icon}</span>
                <span className="pl-kit-name">{item.name.split('—')[0].trim()}</span>
                {!item.owned && <span className="pl-kit-price">{item.price} ᛋ</span>}
              </li>
            ))}
          </ul>
          <div className="pl-preparation-actions">
            <button className="pl-btn-market" onClick={handleGoToMarket}>
              <span aria-hidden="true">🛍</span> Wróć do Kaupangr
            </button>
          </div>
        </main>
        {error && <div className="pl-error" role="alert">{error}</div>}
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
            {scene.atmosphere && (
              <p className="pl-atmosphere">{scene.atmosphere}</p>
            )}
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

  // Fallback
  return (
    <div className="prologue-root">
      <SnowFlakes />
      <p className="pl-loading">{error || 'Wczytywanie prologu…'}</p>
    </div>
  );
};
