import React, { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useSound } from '../context/SoundContext';
import {
  X,
  Sparkles,
  Send,
  MessageSquare,
  Award,
  Dice5,
  Zap,
  Users,
  Compass,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export const MarauderQuestModal = ({ location, isOpen, onClose }) => {
  const { awardHousePoints, currentUser, showNotification, completedQuests = [], completeMapQuest } = useSchool();
  const { playWandSwoosh, playRuneChime, playGateThud } = useSound();

  const [activeTab, setActiveTab] = useState('quests'); // 'quests' | 'discord_bot' | 'lore'
  const [selectedQuest, setSelectedQuest] = useState(null);
  
  const completedQuestIds = completedQuests.map(q => q.questId || q.id);

  // Discord Bot Interactive Thread State
  const [messages, setMessages] = useState([]);
  const [inputCommand, setInputCommand] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (location?.quests && location.quests.length > 0) {
      setSelectedQuest(location.quests[0]);
    } else {
      setSelectedQuest(null);
    }
    setActiveTab('quests');
    setMessages([]);
  }, [location]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen || !location) return null;

  // Initialize Discord Bot thread for a quest
  const handleStartQuestInDiscord = (quest) => {
    playWandSwoosh();
    setSelectedQuest(quest);
    setActiveTab('discord_bot');

    const initTime = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: `msg-${Date.now()}-init`,
        author: 'TMD Bot [SYSTEM]',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
        isBot: true,
        timestamp: initTime,
        embed: {
          title: `⚔️ WĄTEK MISJI: ${quest.title.toUpperCase()}`,
          color: '#c59f4e',
          description: quest.initialBotMessage || quest.description,
          fields: [
            { name: '📍 Lokacja', value: `${location.name} (${location.nordicName})`, inline: true },
            { name: '🏆 Nagroda', value: `+${quest.reward.points} pkt Zakonu, ${quest.reward.item}`, inline: true },
            { name: '📜 Kategoria', value: quest.category, inline: true }
          ],
          footer: 'Wpisz komendę lub kliknij sugerowaną akcję poniżej, aby rzucić zaklęcie.'
        }
      }
    ]);
  };

  // Execute User Action / Spell in Discord Bot
  const handleExecuteCommand = (commandText) => {
    const text = (commandText || inputCommand).trim();
    if (!text || !selectedQuest) return;

    playWandSwoosh();
    const time = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `msg-${Date.now()}-user`,
      author: currentUser?.fullName || 'Adept Cytadeli',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      isBot: false,
      content: text,
      timestamp: time
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputCommand('');

    // Check if command contains dice roll or spell
    const isDiceRoll = text.toLowerCase().includes('rzut') || text.toLowerCase().includes('k20') || text.toLowerCase().includes('test');
    const lowerText = text.toLowerCase();

    // Check against solution keywords
    const isSuccess = selectedQuest.solutionKeywords?.some((kw) => lowerText.includes(kw.toLowerCase()));

    setIsRolling(true);

    setTimeout(() => {
      setIsRolling(false);
      const botTime = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

      if (isDiceRoll) {
        // Roll d20
        const roll = Math.floor(Math.random() * 20) + 1;
        const modifier = 3;
        const total = roll + modifier;
        const passed = roll >= 8;

        if (passed) {
          playRuneChime();
          const isDone = !completedQuestIds.includes(selectedQuest.id);
          if (isDone && completeMapQuest) {
            completeMapQuest({
              questId: selectedQuest.id,
              questTitle: selectedQuest.title,
              locationId: location.id,
              locationName: location.name,
              rewardPoints: selectedQuest.reward.points,
              rewardXp: selectedQuest.reward.xp || 50,
              rewardGalleons: selectedQuest.reward.galleons || 15,
              rewardItem: selectedQuest.reward.item
            });
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}-bot-roll`,
              author: 'TMD Bot [SYSTEM]',
              avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
              isBot: true,
              timestamp: botTime,
              embed: {
                title: `🎲 RZUT KOŚCIĄ K20: ${roll} + ${modifier} = ${total} (SUKCES!)`,
                color: '#22c55e',
                description: `${selectedQuest.successMessage}\n\n**Otrzymano:**\n• +${selectedQuest.reward.points} punktów dla Domu\n• +${selectedQuest.reward.xp} punktów doświadczenia (XP)\n• +${selectedQuest.reward.galleons} Galleonów\n• Artefakt: **${selectedQuest.reward.item}**`,
                footer: 'Zadanie zostało pomyślnie rozwiązane i odnotowane w Kronice Twierdzy.'
              }
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}-bot-roll`,
              author: 'TMD Bot [SYSTEM]',
              avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
              isBot: true,
              timestamp: botTime,
              embed: {
                title: `🎲 RZUT KOŚCIĄ K20: ${roll} + ${modifier} = ${total} (Porażka)`,
                color: '#ef4444',
                description: `${selectedQuest.failMessage}\n\nSpróbuj ponownie lub użyj innego zaklęcia/przedmiotu!`,
                footer: 'Wskazówka: Użyj odpowiedniej inkantacji lub zbadaj wskazówki.'
              }
            }
          ]);
        }
      } else if (isSuccess) {
        playRuneChime();
        const isDone = !completedQuestIds.includes(selectedQuest.id);
        if (isDone && completeMapQuest) {
          completeMapQuest({
            questId: selectedQuest.id,
            questTitle: selectedQuest.title,
            locationId: location.id,
            locationName: location.name,
            rewardPoints: selectedQuest.reward.points,
            rewardXp: selectedQuest.reward.xp || 50,
            rewardGalleons: selectedQuest.reward.galleons || 15,
            rewardItem: selectedQuest.reward.item
          });
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-bot-success`,
            author: 'TMD Bot [SYSTEM]',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
            isBot: true,
            timestamp: botTime,
            embed: {
              title: `✨ WŁAŚCIWA INKANTACJA / DZIAŁANIE!`,
              color: '#22c55e',
              description: `${selectedQuest.successMessage}\n\n**Nagroda:**\n• +${selectedQuest.reward.points} pkt Zakonu\n• +${selectedQuest.reward.xp} XP\n• Artefakt: **${selectedQuest.reward.item}**`,
              footer: 'Zadanie zostało pomyślnie rozwiązane i odnotowane w Kronice Twierdzy.'
            }
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-bot-default`,
            author: 'TMD Bot [SYSTEM]',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
            isBot: true,
            timestamp: botTime,
            embed: {
              title: `❓ Odpowiedź z otoczenia`,
              color: '#eab308',
              description: `Twoje działanie \`${text}\` nie przyniosło oczekiwanego rezultatu.\n\n${selectedQuest.failMessage}`,
              footer: 'Wskazówka: Skorzystaj z sugerowanych akcji poniżej.'
            }
          }
        ]);
      }
    }, 700);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="gothic-card runic-corners"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'radial-gradient(ellipse at center, #151a24 0%, #090c12 100%)',
          border: '1.5px solid var(--gold-ancient)',
          borderRadius: '8px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95), 0 0 40px rgba(197, 159, 78, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.2rem 1.8rem',
            borderBottom: '1px solid rgba(197, 159, 78, 0.25)',
            background: 'rgba(10, 13, 18, 0.9)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '1.8rem' }}>{location.icon}</span>
            <div>
              <div style={{ color: 'var(--gold-ancient)', fontSize: '0.75rem', letterSpacing: '0.15em', fontFamily: 'var(--font-heading)' }}>
                {location.nordicName} • {location.type}
              </div>
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0 }}>
                {location.name}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(197, 159, 78, 0.3)' }}>
              <button
                onClick={() => setActiveTab('quests')}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeTab === 'quests' ? 'var(--gold-ancient)' : 'transparent',
                  color: activeTab === 'quests' ? '#000000' : '#d1d5db',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Award size={13} /> Dostępne Questy
              </button>
              <button
                onClick={() => {
                  if (!selectedQuest && location.quests?.[0]) {
                    handleStartQuestInDiscord(location.quests[0]);
                  } else {
                    setActiveTab('discord_bot');
                  }
                }}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeTab === 'discord_bot' ? '#5865F2' : 'transparent',
                  color: activeTab === 'discord_bot' ? '#ffffff' : '#d1d5db',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <MessageSquare size={13} /> Bot Discord RPG
              </button>
              <button
                onClick={() => setActiveTab('lore')}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeTab === 'lore' ? 'var(--gold-ancient)' : 'transparent',
                  color: activeTab === 'lore' ? '#000000' : '#d1d5db',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <BookOpen size={13} /> Lore & NPC
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(197, 159, 78, 0.3)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab 1: Quests List */}
        {activeTab === 'quests' && (
          <div style={{ padding: '1.8rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                Wybierz zadanie poboczne w tej lokacji, aby rozpocząć interakcję w kanale bota Discorda:
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1rem' }}>
              {location.quests && location.quests.length > 0 ? (
                location.quests.map((quest) => {
                  const isDone = completedQuestIds.includes(quest.id);

                  return (
                    <div
                      key={quest.id}
                      style={{
                        background: 'rgba(15, 20, 30, 0.8)',
                        border: isDone ? '1.5px solid #22c55e' : '1px solid rgba(197, 159, 78, 0.3)',
                        borderRadius: '8px',
                        padding: '1.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <span
                            style={{
                              background: quest.difficulty === 'Arcymistrzowski' ? 'rgba(239, 68, 68, 0.2)' : quest.difficulty === 'Trudny' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                              color: quest.difficulty === 'Arcymistrzowski' ? '#f87171' : quest.difficulty === 'Trudny' ? '#fde047' : '#4ade80',
                              border: `1px solid ${quest.difficulty === 'Arcymistrzowski' ? '#ef4444' : quest.difficulty === 'Trudny' ? '#eab308' : '#22c55e'}`,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}
                          >
                            {quest.difficulty} • {quest.category}
                          </span>

                          {isDone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#4ade80', fontSize: '0.75rem', fontWeight: 700 }}>
                              <CheckCircle2 size={14} /> Ukończono
                            </span>
                          )}
                        </div>

                        <h3 style={{ color: '#ffffff', fontSize: '1.15rem', marginTop: '0.3rem', marginBottom: '0.5rem' }}>
                          {quest.title}
                        </h3>

                        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>
                          {quest.description}
                        </p>
                      </div>

                      {/* Reward box & CTA */}
                      <div>
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px dashed rgba(197, 159, 78, 0.25)',
                            borderRadius: '4px',
                            padding: '0.5rem 0.8rem',
                            marginBottom: '0.8rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.78rem'
                          }}
                        >
                          <span style={{ color: 'var(--gold-ancient)' }}>🏆 Nagroda:</span>
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                            +{quest.reward.points} pkt Zakonu • {quest.reward.item}
                          </span>
                        </div>

                        <button
                          onClick={() => handleStartQuestInDiscord(quest)}
                          className="gothic-btn"
                          style={{
                            width: '100%',
                            padding: '0.6rem 1rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: '#5865F2',
                            borderColor: '#5865F2',
                            color: '#ffffff'
                          }}
                        >
                          <MessageSquare size={15} />
                          {isDone ? 'Otwórz Wątek Bota (Powtórz)' : 'Wykonaj w Kanale Discorda'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#9ca3af', padding: '2rem', textAlign: 'center' }}>
                  Brak aktywnych questów w tej lokacji w obecnym sezonie.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Discord Bot Exploration Channel (LIVE RPG) */}
        {activeTab === 'discord_bot' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '520px', background: '#313338' }}>
            {/* Discord Channel Sub-header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                background: '#2b2d31',
                borderBottom: '1px solid #1f2023',
                color: '#dbdee1',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <span style={{ color: '#80848e', fontSize: '1.1rem' }}>#</span>
              <span>{selectedQuest?.discordChannel || 'eksploracja-durmstrang'}</span>
              <span style={{ color: '#80848e', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                | Wątek RPG: {selectedQuest?.title}
              </span>
            </div>

            {/* Message Stream */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                background: '#313338'
              }}
            >
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                  <img
                    src={msg.avatar}
                    alt={msg.author}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{ color: '#f2f3f5', fontWeight: 600, fontSize: '0.88rem' }}>
                        {msg.author}
                      </span>
                      {msg.isBot && (
                        <span
                          style={{
                            background: '#5865f2',
                            color: '#ffffff',
                            fontSize: '0.6rem',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontWeight: 700
                          }}
                        >
                          BOT
                        </span>
                      )}
                      <span style={{ color: '#949ba4', fontSize: '0.72rem' }}>{msg.timestamp}</span>
                    </div>

                    {msg.content && (
                      <div style={{ color: '#dbdee1', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                        {msg.content}
                      </div>
                    )}

                    {/* Discord Embed */}
                    {msg.embed && (
                      <div
                        style={{
                          marginTop: '0.4rem',
                          background: '#2b2d31',
                          borderLeft: `4px solid ${msg.embed.color || '#5865f2'}`,
                          borderRadius: '4px',
                          padding: '0.8rem 1rem',
                          maxWidth: '680px'
                        }}
                      >
                        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                          {msg.embed.title}
                        </div>
                        <div style={{ color: '#dbdee1', fontSize: '0.86rem', lineHeight: 1.5, whiteSpace: 'pre-line', marginBottom: '0.6rem' }}>
                          {msg.embed.description}
                        </div>

                        {msg.embed.fields && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '0.6rem' }}>
                            {msg.embed.fields.map((f, idx) => (
                              <div key={idx}>
                                <div style={{ color: '#949ba4', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                  {f.name}
                                </div>
                                <div style={{ color: '#f2f3f5', fontSize: '0.82rem', fontWeight: 600 }}>
                                  {f.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.embed.footer && (
                          <div style={{ color: '#949ba4', fontSize: '0.72rem', fontStyle: 'italic', borderTop: '1px solid #383a40', paddingTop: '0.4rem' }}>
                            {msg.embed.footer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isRolling && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#949ba4', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  <Dice5 size={16} className="spin-slow" /> Rzucanie kośćmi i kalkulacja zaklęcia przez bota...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Buttons */}
            {selectedQuest?.suggestedActions && (
              <div
                style={{
                  padding: '0.5rem 1.2rem',
                  background: '#2b2d31',
                  borderTop: '1px solid #1f2023',
                  display: 'flex',
                  gap: '0.4rem',
                  flexWrap: 'wrap'
                }}
              >
                {selectedQuest.suggestedActions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => handleExecuteCommand(act.cmd)}
                    style={{
                      background: '#383a40',
                      border: '1px solid #4e5058',
                      color: '#dbdee1',
                      borderRadius: '4px',
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#474953')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#383a40')}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Box */}
            <div style={{ padding: '0.8rem 1.2rem', background: '#313338' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteCommand();
                }}
                style={{ display: 'flex', gap: '0.5rem' }}
              >
                <input
                  type="text"
                  value={inputCommand}
                  onChange={(e) => setInputCommand(e.target.value)}
                  placeholder={`Wpisz polecenie np. /rzuc Lumos lub /rzut k20...`}
                  style={{
                    flex: 1,
                    background: '#383a40',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.7rem 1rem',
                    color: '#f2f3f5',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#5865F2',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.7rem 1.2rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Lore, NPCs and Clues */}
        {activeTab === 'lore' && (
          <div style={{ padding: '1.8rem', overflowY: 'auto', flex: 1 }}>
            <p style={{ color: '#c5cdd9', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
              {location.fullLore}
            </p>

            <div className="grid-3" style={{ marginBottom: '1rem' }}>
              {/* NPCs */}
              <div style={{ padding: '1rem', background: 'rgba(15, 19, 27, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-glow)', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                  <Users size={15} /> Obecni Profesorowie & NPC
                </div>
                <ul style={{ listStyle: 'none', color: '#e5e7eb', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {location.npcs?.map((npc, i) => (
                    <li key={i}>• {npc}</li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div style={{ padding: '1rem', background: 'rgba(15, 19, 27, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-glow)', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                  <Compass size={15} /> Dostępne Interakcje
                </div>
                <ul style={{ listStyle: 'none', color: '#e5e7eb', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {location.actions?.map((act, i) => (
                    <li key={i}>⚔️ {act}</li>
                  ))}
                </ul>
              </div>

              {/* Secret Clue */}
              <div style={{ padding: '1rem', background: 'rgba(15, 19, 27, 0.7)', border: '1px solid rgba(197, 159, 78, 0.3)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-ancient)', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                  <Key size={15} /> Wskazówka do Sekretu
                </div>
                <p style={{ color: '#d8c2ff', fontStyle: 'italic', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  „{location.secretClue}”
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
