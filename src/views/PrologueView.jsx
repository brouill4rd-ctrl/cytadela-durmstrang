import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import './PrologueView.css';

const scenes = {
  PORT: { kicker: 'Nabrzeże Czarnej Latarni', title: 'Port', text: 'Czarna woda uderza o pale. Ponad śniegiem po raz pierwszy dostrzegasz banderę Twierdzy. Przed tobą jeden z adeptów upuszcza dokument.', choices: [['return','Podnieś i oddaj'],['call','Zawołaj właściciela'],['ignore','Ruszyć dalej']] },
  SHIP: { kicker: 'Przejście przez Morze Północne', title: 'Statek', text: 'Kadłub jęczy pod naporem fal. Za rufą giną ostatnie światła zwyczajnego świata.', choices: [['deck','Zostań na pokładzie'],['below','Zejdź pod pokład'],['passenger','Porozmawiaj z pasażerem']] },
  FJORD: { kicker: 'Czarny Fiord', title: 'Fiord', text: 'Skały zwierają się wokół statku. W oddali, pod zimnym niebem, wyrasta Cytadela Durmstrangu.', choices: [['watch','Obserwuj twierdzę'],['listen','Wsłuchaj się w fiord'],['prepare','Przygotuj dokumenty']] },
  BORDER_CONTROL: { kicker: 'Północna Brama', title: 'Kontrola', text: 'Strażnik przesuwa wzrokiem po pieczęci, bilecie i twoim imieniu. Niczego nie musisz powtarzać — Kancelaria zna twoją tożsamość.', choices: [['documents','Pokaż dokumenty']] },
  GREAT_HALL: { kicker: 'Za Wrotami Cytadeli', title: 'Wielka Sala', text: 'W półmroku płoną symbole Reinhall, Björnhall, Ravnheim i Otergard. Twoje miejsce pośród Zakonów nie zostało jeszcze wyznaczone.', choices: [['enter','Wejdź do Cytadeli']] },
  ARRIVED: { kicker: 'Pierwsza Noc', title: 'Witaj w Twierdzy', text: 'Brama zamyka się za tobą. Od tej chwili nie jesteś już kandydatem. Jesteś adeptem Durmstrangu.', choices: [['complete','Rozpocznij swoją sagę']] }
};
const nextStage = { LETTER_PENDING:'LETTER_OPENED', LETTER_OPENED:'PREPARATION', PREPARATION:'PORT', PORT:'SHIP', SHIP:'FJORD', FJORD:'BORDER_CONTROL', BORDER_CONTROL:'GREAT_HALL', GREAT_HALL:'ARRIVED', ARRIVED:'COMPLETED' };

export const PrologueView = ({ onComplete }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.getMyPrologue().then(r => r.ok ? setData(r.data) : setError(r.error)); }, []);
  const stage = data?.stage;
  const scene = scenes[stage];
  const atmosphere = useMemo(() => stage === 'FJORD' ? 'Nad wodą drży światło Magicznej Północy.' : '', [stage]);

  const advance = async (choiceId) => {
    if (!nextStage[stage] || busy) return;
    setBusy(true); setError('');
    const result = await api.advancePrologue(nextStage[stage], choiceId);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setData(result.data);
    if (result.data.completed) onComplete?.();
  };

  if (!data) return <div className="prologue-root"><p className="prologue-loading">{error || 'Kancelaria odczytuje pieczęcie…'}</p></div>;
  if (data.completed) return null;

  return <div className={`prologue-root stage-${stage?.toLowerCase()}`}>
    <div className="prologue-snow" aria-hidden="true" />
    {stage === 'LETTER_PENDING' && <main className="envelope-scene">
      <p className="prologue-kicker">Kancelaria Twierdzy Magii Durmstrang</p>
      <div className={`envelope ${opening ? 'opening' : ''}`}>
        <div className="envelope-address"><strong>{data.character.fullName}</strong><span>TWIERDZA MAGII DURMSTRANG</span></div>
        <button className="wax-seal" aria-label="Złam pieczęć i otwórz list" onClick={() => { setOpening(true); setTimeout(() => advance(), 650); }}>ᛞ</button>
      </div>
      <p className="gesture-hint">Dotknij pieczęci, aby ją złamać</p>
      <button className="prologue-link" onClick={() => advance()}>Otwórz list bez animacji</button>
    </main>}

    {stage === 'LETTER_OPENED' && <main className="letter-scene">
      <article className="parchment">
        <div className="letter-rune">ᛞ</div><p>{data.letter.salutation},</p>
        <p>Rada Twierdzy Magii Durmstrang informuje, że po rozpatrzeniu dokumentów zostałaś/eś przyjęta/y w poczet adeptów na {data.letter.schoolYear}.</p>
        <p>Staw się po zmroku przy Nabrzeżu Czarnej Latarni. Okaż dołączony bilet i zachowaj list do kontroli przy bramie.</p>
        <p className="signature">Złotą Pieczęcią Paktu 1294<br/>Arcymistrzyni Valgerda Storm</p>
        <button className="prologue-button dark" onClick={() => advance()} disabled={busy}>Zobacz wyprawkę i bilet</button>
      </article>
    </main>}

    {stage === 'PREPARATION' && <main className="preparation-scene">
      <p className="prologue-kicker">Przygotowanie do podróży</p><h1>Wyprawka adepta</h1>
      <ul className="supply-list">{data.letter.requiredItems.map((item,i)=><li key={item}><span>{i === 0 ? '✓' : '○'}</span>{item}</li>)}</ul>
      <div className="travel-ticket"><span>PRZEJŚCIE NA PÓŁNOC</span><strong>{data.letter.ticket.holder}</strong><small>{data.letter.ticket.departure} · {data.letter.ticket.passage}</small></div>
      <p className="nonblocking">Braki w wyprawce nie zatrzymają podróży. Uzupełnisz je później w Kaupangr.</p>
      <button className="prologue-button" onClick={() => advance()} disabled={busy}>Rozpocznij podróż</button>
    </main>}

    {scene && <main className="journey-scene">
      <nav className="route-map" aria-label="Trasa podróży"><span>PORT</span><i>◆</i><span>FIORD</span><i>◇</i><span>CYTADELA</span></nav>
      <div className="scene-panel"><p className="prologue-kicker">{scene.kicker}</p><h1>{scene.title}</h1><p>{scene.text}</p>{atmosphere && <p className="atmosphere">{atmosphere}</p>}
        <div className="scene-choices">{scene.choices.map(([key,label])=><button key={key} onClick={() => advance(key)} disabled={busy}>{label}</button>)}</div>
      </div>
    </main>}
    {error && <div className="prologue-error" role="alert">{error}</div>}
  </div>;
};
