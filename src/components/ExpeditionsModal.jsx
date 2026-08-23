import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  Compass,
  MapPin,
  Shield,
  Flame,
  Sparkles,
  X,
  ChevronRight,
  Award,
  AlertTriangle,
  RotateCcw,
  Package,
  CheckCircle
} from 'lucide-react';

export const ExpeditionsModal = ({ isOpen, onClose }) => {
  const { currentUser, awardHousePoints, addNotification, addCurrency, addInventoryItem } = useSchool();
  const { playWandSwoosh, playRuneChime, playCoinSound, playSortingFanfare } = useSound();

  const [selectedExpedition, setSelectedExpedition] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [expeditionLog, setExpeditionLog] = useState([]);
  const [expeditionFinished, setExpeditionFinished] = useState(false);
  const [lootResult, setLootResult] = useState(null);

  if (!isOpen) return null;

  const destinations = [
    {
      id: 'drakkar_graveyard',
      name: 'Cmentarzysko Drakkarów we Fjordzie',
      difficulty: 'Nowicjusz (Łatwy)',
      dangerColor: '#4ade80',
      icon: '⛵',
      desc: 'Wrakowisko starożytnych okrętów wojennych wikingów, uwięzionych w wiecznym lodzie fiordu pod murami Cytadeli.',
      rewardEstimate: '15-25 Skirnirów, +15 pkt Zakonu, Srebrny Pył Runiczny',
      stages: [
        {
          prompt: 'Przedzierasz się przez zasypany śniegiem pomost. Lodowy wiatr gasi Twoją latarnię, a lód pod stopami zaczyna pękać!',
          choices: [
            { text: 'Rzuć zaklęcie Lumos Borealis i rozświetl drogę', success: true, textSuccess: 'Światło zorzy ujawnia stabilną kładkę skalną!' },
            { text: 'Skocz na wrak najbliższego drakkara', success: true, textSuccess: 'Lądujesz bezpiecznie na omszałych deskach pokładu.' }
          ]
        },
        {
          prompt: 'W ładowni okrętu dostrzegasz skrzynię owiniętą łańcuchami z mroźnego żelaza. Nad nią unosi się widmo sternika!',
          choices: [
            { text: 'Złóż pokłon i wypowiedz pozdrowienie staronordyckie', success: true, textSuccess: 'Widmo kiwa głową z szacunkiem i wskazuje klucz do skrzyni.' },
            { text: 'Rzuć czar Protego Skalny Bastion i przejmij skrzynię', success: true, textSuccess: 'Tarcza odbija chłód zaświatów, pozwalając zerwać łańcuch!' }
          ]
        }
      ],
      loot: { coins: 25, points: 15, item: 'Srebrny Naszyjnik Jarlów Fiordu' }
    },
    {
      id: 'shadow_forest',
      name: 'Przeklęta Puszcza Cieni (Myrkviðr)',
      difficulty: 'Adept (Średni)',
      dangerColor: '#facc15',
      icon: '🌲',
      desc: 'Bezkresny bór czarnych sosen na północ od zamku, gdzie cienie żyją własnym życiem i polują stada Wilków Ulfr.',
      rewardEstimate: '35-50 Skirnirów, +25 pkt Zakonu, Wilcze Jagody Cienia',
      stages: [
        {
          prompt: 'Wkraczasz między gęste, czarne pnie. Z mgły wyłania się wataha Wilków Cienia o świecących na fioletowo ślepiach.',
          choices: [
            { text: 'Wypuść snop iskier zaklęciem Ignis', success: true, textSuccess: 'Szkarłatny płomień odstrasza wilki w głąb ciemnego lasu!' },
            { text: 'Użyj eliksiru niewidzialności i omiń watachę', success: true, textSuccess: 'Przemykasz bezszelestnie tuż obok drapieżników.' }
          ]
        },
        {
          prompt: 'Na leśnej polanie odnajdujesz pradawny kamień ofiarny porośnięty rzadkim mchem i runami leczniczymi.',
          choices: [
            { text: 'Oczyść inskrypcje runiczne za pomocą różdżki', success: true, textSuccess: 'Kamień rozbłyska szmaragdowym światłem, uwalniając esencję lasu!' },
            { text: 'Zbierz próbki mchu do pracowni alchemicznej', success: true, textSuccess: 'Ostrożnie pakujesz cenne składniki do sakwy.' }
          ]
        }
      ],
      loot: { coins: 45, points: 25, item: 'Amulet z Kła Wilka Cienia' }
    },
    {
      id: 'jotun_caves',
      name: 'Jaskinie Lodowych Olbrzymów (Jotunheimen)',
      difficulty: 'Arcymistrz (Trudny)',
      dangerColor: '#ef4444',
      icon: '🏔️',
      desc: 'Wysokogórskie szczeliny lodowca, gdzie spoczywają uśpieni strażnicy pradawnej magii mrozu.',
      rewardEstimate: '75-100 Skirnirów, +40 pkt Zakonu, Krew Smoka z Fiordu',
      stages: [
        {
          prompt: 'Wejście do pieczary tarasuje lodowy golem strażniczy. Temperatura spada do -40°C!',
          choices: [
            { text: 'Skoncentruj całą moc różdżki w runę Ognia Thurisaz', success: true, textSuccess: 'Potężny płomień topi rdzeń golema, otwierając wrota!' },
            { text: 'Odszukaj słaby punkt w konstrukcji lodowej i uderz precyzyjnie', success: true, textSuccess: 'Jeden celny strzał kruszy kolosa na tysiące odłamków.' }
          ]
        },
        {
          prompt: 'W sercu lodowca odnajdujesz ołtarz z kryształem wiecznego lodu Jotunów pulsującym błękitną energią.',
          choices: [
            { text: 'Zabezpiecz kryształ pieczęcią Zakonu', success: true, textSuccess: 'Rytuał pieczętowania kończy się absolutnym triumfem!' }
          ]
        }
      ],
      loot: { coins: 85, points: 40, item: 'Kryształ Wiecznego Lodu Jotunów' }
    }
  ];

  const handleStartExpedition = (exp) => {
    playWandSwoosh();
    setSelectedExpedition(exp);
    setCurrentStep(0);
    setExpeditionLog([`Wyruszasz na ekspedycję ku: ${exp.name}...`]);
    setExpeditionFinished(false);
    setLootResult(null);
  };

  const handleMakeChoice = (choice) => {
    playWandSwoosh();
    playRuneChime();

    const newLog = [...expeditionLog, `▶ Wybór: ${choice.text}`, `✔ ${choice.textSuccess}`];
    setExpeditionLog(newLog);

    if (currentStep + 1 < selectedExpedition.stages.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Expedition completed!
      setExpeditionFinished(true);
      setLootResult(selectedExpedition.loot);
      playSortingFanfare();
      awardHousePoints(currentUser?.house || currentUser?.house_id || 'ravnheim', selectedExpedition.loot.points, `Ukończenie Ekspedycji: ${selectedExpedition.name}`);
      if (addCurrency) addCurrency(selectedExpedition.loot.coins, `Łup z ekspedycji: ${selectedExpedition.name}`);
      if (addInventoryItem) {
        addInventoryItem({
          name: selectedExpedition.loot.item,
          icon: '🎁',
          rarity: 'Legendarny Artefakt',
          price: selectedExpedition.loot.coins * 2,
          desc: `Zdobyto w trakcie wyprawy ku: ${selectedExpedition.name}`
        });
      }
      addNotification(`🌲 Ukończono ekspedycję ${selectedExpedition.name}! Otrzymano +${selectedExpedition.loot.coins} Sk., +${selectedExpedition.loot.points} pkt oraz ${selectedExpedition.loot.item}!`);
    }
  };

  const handleReset = () => {
    setSelectedExpedition(null);
    setCurrentStep(0);
    setExpeditionLog([]);
    setExpeditionFinished(false);
    setLootResult(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 8, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #181d29 0%, #0a0d14 100%)',
          border: '2px solid var(--gold-ancient)',
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(197, 159, 78, 0.3)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Compass size={22} style={{ color: 'var(--gold-ancient)' }} />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                Ekspedycje Północy • Wyprawy do Dzikich Ostępów
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)' }}>
                PRZYGODY PARAGRAFOWE & ZDOBYWANIE STAROŻYTNYCH ŁUPÓW
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!selectedExpedition ? (
            /* Destination Selection Grid */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.9rem' }}>
                Wybierz cel niebezpiecznej wyprawy poza mury Cytadeli. Pamiętaj, że każdy wybór na szlaku decyduje o Twoim losie i zdobytych łupach:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {destinations.map((dest) => (
                  <div
                    key={dest.id}
                    style={{
                      background: 'rgba(15, 20, 30, 0.75)',
                      border: '1px solid rgba(197, 159, 78, 0.3)',
                      borderRadius: '8px',
                      padding: '1.2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.8rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '1.8rem' }}>{dest.icon}</span>
                        <span style={{ fontSize: '0.72rem', color: dest.dangerColor, fontWeight: 700, border: `1px solid ${dest.dangerColor}`, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {dest.difficulty}
                        </span>
                      </div>
                      <h4 style={{ margin: '0.2rem 0', color: '#ffffff', fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>
                        {dest.name}
                      </h4>
                      <p style={{ color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.4, margin: '0.3rem 0 0.8rem 0' }}>
                        {dest.desc}
                      </p>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', marginBottom: '0.6rem' }}>
                        🎁 Łupy: {dest.rewardEstimate}
                      </div>
                      <button
                        onClick={() => handleStartExpedition(dest)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, var(--gold-ancient) 0%, #9a7629 100%)',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.6rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-heading)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        Wyrusz na Szlak <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Active Interactive Expedition Play */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Destination Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '0.8rem 1.2rem', borderRadius: '6px', borderLeft: '3px solid var(--gold-ancient)' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase' }}>Aktywna Wyprawa</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                    {selectedExpedition.icon} {selectedExpedition.name}
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#9ca3af', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Zawróć do Cytadeli
                </button>
              </div>

              {/* Story Prompt Box */}
              {!expeditionFinished ? (
                <div style={{ background: 'rgba(20, 26, 38, 0.9)', border: '1px solid var(--gold-ancient)', borderRadius: '8px', padding: '1.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-ancient)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Etap {currentStep + 1} z {selectedExpedition.stages.length}
                  </span>
                  <p style={{ color: '#ffffff', fontSize: '1.05rem', lineHeight: 1.6, margin: '0.6rem 0 1.2rem 0', fontFamily: 'var(--font-lore)' }}>
                    {selectedExpedition.stages[currentStep].prompt}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {selectedExpedition.stages[currentStep].choices.map((choice, i) => (
                      <button
                        key={i}
                        onClick={() => handleMakeChoice(choice)}
                        style={{
                          background: 'rgba(12, 16, 24, 0.85)',
                          border: '1px solid rgba(197, 159, 78, 0.4)',
                          borderRadius: '6px',
                          padding: '0.8rem 1rem',
                          color: '#ffe599',
                          textAlign: 'left',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(197, 159, 78, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(12, 16, 24, 0.85)';
                        }}
                      >
                        <span>⚔️ {choice.text}</span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Victory & Loot Banner */
                <div
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '2px solid #22c55e',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    animation: 'slideUp 0.3s ease-out'
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>🏆</span>
                  <h3 style={{ margin: '0.4rem 0', color: '#4ade80', fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>
                    EKSPEDYCJA ZAKOŃCZONA SUKCESEM!
                  </h3>
                  <p style={{ color: '#d1d5db', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.2rem auto' }}>
                    Twoja odwaga i biegłość w sztukach magicznych pozwoliły pokonać niebezpieczeństwa północnych szlaków.
                  </p>

                  <div style={{ display: 'inline-flex', gap: '1.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.8rem 1.5rem', borderRadius: '6px', marginBottom: '1.2rem' }}>
                    <div style={{ color: '#f7dca0', fontWeight: 700 }}>💰 +{lootResult?.coins} Skirnirów</div>
                    <div style={{ color: 'var(--gold-ancient)', fontWeight: 700 }}>✨ +{lootResult?.points} pkt Zakonu</div>
                    <div style={{ color: '#93c5fd', fontWeight: 700 }}>🎁 {lootResult?.item}</div>
                  </div>

                  <div>
                    <button
                      onClick={handleReset}
                      style={{
                        background: 'var(--gold-ancient)',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.6rem 1.4rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      Wróć do Wyboru Ekspedycji
                    </button>
                  </div>
                </div>
              )}

              {/* Expedition Narrative Log */}
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--gold-ancient)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Kronika Przebiegu Wyprawy:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
                  {expeditionLog.map((log, idx) => (
                    <div key={idx} style={{ fontSize: '0.82rem', color: log.startsWith('✔') ? '#4ade80' : log.startsWith('▶') ? '#ffe599' : '#9ca3af' }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
