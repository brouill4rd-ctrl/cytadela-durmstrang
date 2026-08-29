import React from 'react';
import { useLessonMessages } from '../hooks/useLessonMessages';

const HOUSE_COLORS = {
  reinhall:  '#8B3A52',
  bjornhall: '#6B7280',
  ravnheim:  '#7C3CE1',
  otergard:  '#0D9488',
};

const IMG_EXTS = /\.(png|jpe?g|gif|webp|svg|bmp)$/i;

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return isNaN(d) ? ts : d.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Initials({ name, house }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: HOUSE_COLORS[house] || '#374151',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.72rem', fontWeight: 700, color: '#fff', userSelect: 'none'
    }}>
      {initials}
    </div>
  );
}

function EmbedBlock({ embed }) {
  if (!embed) return null;
  const borderColor = embed.color || '#5865F2';
  return (
    <div style={{
      borderLeft: `4px solid ${borderColor}`,
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '0 6px 6px 0',
      padding: '0.6rem 0.8rem',
      marginTop: '0.4rem',
      maxWidth: 440
    }}>
      {embed.author?.name && (
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
          {embed.author.name}
        </div>
      )}
      {embed.title && (
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.3rem' }}>
          {embed.title}
        </div>
      )}
      {embed.description && (
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', whiteSpace: 'pre-wrap', marginBottom: '0.3rem' }}>
          {embed.description.slice(0, 500)}{embed.description.length > 500 ? '…' : ''}
        </div>
      )}
      {embed.fields?.map((f, i) => (
        <div key={i} style={{ marginTop: '0.3rem', display: f.inline ? 'inline-block' : 'block', marginRight: f.inline ? '1rem' : 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>{f.name}</div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{f.value}</div>
        </div>
      ))}
      {embed.image?.url && (
        <img src={embed.image.url} alt="" style={{ marginTop: '0.5rem', maxWidth: '100%', maxHeight: 200, borderRadius: 4, display: 'block' }}
          onError={e => { e.target.style.display = 'none'; }} />
      )}
      {embed.thumbnail?.url && (
        <img src={embed.thumbnail.url} alt="" style={{ float: 'right', maxWidth: 80, maxHeight: 80, borderRadius: 4, marginLeft: '0.5rem' }}
          onError={e => { e.target.style.display = 'none'; }} />
      )}
      {embed.footer?.text && (
        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem' }}>{embed.footer.text}</div>
      )}
    </div>
  );
}

function MessageRow({ msg }) {
  const isBot = msg.isBot;
  const house = msg.authorHouse?.toLowerCase();
  const houseColor = HOUSE_COLORS[house] || (isBot ? '#5865F2' : '#4B5563');

  return (
    <div style={{
      display: 'flex',
      gap: '0.7rem',
      padding: '0.5rem 0.75rem',
      borderLeft: isBot ? '3px solid rgba(88,101,242,0.5)' : `3px solid ${houseColor}40`,
      background: isBot ? 'rgba(88,101,242,0.06)' : 'transparent',
      borderRadius: '0 6px 6px 0',
      marginBottom: '0.3rem',
    }}>
      <Initials name={msg.authorDisplayName} house={house} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isBot ? '#818cf8' : (HOUSE_COLORS[house] || '#e2e8f0') }}>
            {msg.authorDisplayName}
          </span>
          {isBot && (
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, background: '#5865F2',
              color: '#fff', padding: '0 4px', borderRadius: 3, letterSpacing: '0.04em'
            }}>BOT</span>
          )}
          <span style={{ fontSize: '0.72rem', color: '#475569' }}>{formatTimestamp(msg.timestamp)}</span>
        </div>

        {msg.replyToId && msg.replyToAuthor && (
          <div style={{
            fontSize: '0.75rem', color: '#64748b', background: 'rgba(255,255,255,0.04)',
            borderLeft: '2px solid #374151', padding: '0.2rem 0.5rem', borderRadius: '0 4px 4px 0',
            marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            ↩ <strong>{msg.replyToAuthor}</strong>: {msg.replyToContent || '…'}
          </div>
        )}

        {msg.content && (
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.content}
          </div>
        )}

        {msg.embeds?.map((embed, i) => <EmbedBlock key={i} embed={embed} />)}

        {msg.attachments?.map((att, i) => (
          IMG_EXTS.test(att.name || att.storageUrl || '') ? (
            <img key={i}
              src={att.storageUrl || att.originalUrl}
              alt={att.name}
              style={{ display: 'block', marginTop: '0.4rem', maxWidth: 280, maxHeight: 200, borderRadius: 6, objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div key={i} style={{ fontSize: '0.78rem', color: '#60a5fa', marginTop: '0.3rem' }}>
              📎 {att.name}
            </div>
          )
        ))}

        {msg.reactions?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
            {msg.reactions.map((r, i) => (
              <span key={i} style={{
                fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
                padding: '1px 8px', color: '#e2e8f0'
              }}>
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const DiscordThreadLog = ({ lessonId }) => {
  const { messages, loading, error } = useLessonMessages(lessonId);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Ładowanie logu wątku…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', fontSize: '0.85rem' }}>
        Nie udało się załadować logu wątku. Sprawdź uprawnienia.
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{
        padding: '3rem', textAlign: 'center', color: '#475569',
        background: 'rgba(15,20,30,0.8)', borderRadius: 10,
        border: '1px dashed rgba(197,159,78,0.2)'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
        <div style={{ fontSize: '0.9rem' }}>Brak zarchiwizowanych wiadomości</div>
        <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: '#334155' }}>
          Użyj <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3 }}>/eksport</code> na Discordzie, aby zaimportować wątek.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(15,20,30,0.95)',
      border: '1px solid rgba(197,159,78,0.2)',
      borderRadius: 10,
      padding: '1.2rem 1rem',
      boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
      maxHeight: '70vh',
      overflowY: 'auto',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {messages.length} wiadomości w wątku
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        {messages.map(msg => <MessageRow key={msg.id} msg={msg} />)}
      </div>
    </div>
  );
};
