import React from 'react';
import DOMPurify from 'dompurify';
import { isHtmlContent } from '../utils/legacyMarkdownToHtml';
import './RichTextEditor.css';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark',
    'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
    'code', 'pre', 'a', 'hr', 'span', 'img',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'style', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

function renderInline(text) {
  const parts = [];
  const regex = /(\{color:([^}]+)\}(.*?)\{\/color\}|\{mark:([^}]+)\}(.*?)\{\/mark\}|__(.+?)__|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2])       parts.push(<span key={m.index} style={{ color: m[2] }}>{m[3]}</span>);
    else if (m[4])  parts.push(<mark key={m.index} style={{ background: m[4], padding: '0 2px', borderRadius: '2px', color: 'inherit' }}>{m[5]}</mark>);
    else if (m[6])  parts.push(<u key={m.index}>{m[6]}</u>);
    else if (m[7])  parts.push(<strong key={m.index}>{m[7]}</strong>);
    else if (m[8])  parts.push(<em key={m.index}>{m[8]}</em>);
    else if (m[9])  parts.push(<s key={m.index}>{m[9]}</s>);
    else if (m[10]) parts.push(<code key={m.index}>{m[10]}</code>);
    else if (m[11]) parts.push(<a key={m.index} href={m[12]} target="_blank" rel="noreferrer">{m[11]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

function renderLegacyContent(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith(':::warning')) {
      const block = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(':::')) { block.push(lines[i]); i++; }
      elements.push(
        <div key={`w${i}`} style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.4)', borderLeft: '4px solid #f59e0b', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#fbbf24' }}>
          <strong>⚠ Uwaga:</strong> {block.join(' ')}
        </div>
      );
    } else if (line.startsWith(':::info')) {
      const block = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(':::')) { block.push(lines[i]); i++; }
      elements.push(
        <div key={`info${i}`} style={{ background: 'rgba(164,200,225,0.1)', border: '1px solid rgba(164,200,225,0.3)', borderLeft: '4px solid var(--ice-frost)', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--ice-crystal)' }}>
          <strong>ℹ Info:</strong> {block.join(' ')}
        </div>
      );
    } else if (line.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      elements.push(
        <pre key={`code${i}`} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1rem', overflowX: 'auto' }}>
          <code style={{ color: '#a3e635', fontFamily: 'monospace', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>{code.join('\n')}</code>
        </pre>
      );
    } else if (line.startsWith('# ') && !line.startsWith('## ')) {
      elements.push(<h2 key={i}>{renderInline(line.slice(2))}</h2>);
    } else if (line.startsWith('## ') && !line.startsWith('### ')) {
      elements.push(<h3 key={i}>{renderInline(line.slice(3))}</h3>);
    } else if (line.startsWith('### ')) {
      elements.push(<h4 key={i}>{renderInline(line.slice(4))}</h4>);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i}>{renderInline(line.slice(2))}</blockquote>);
    } else if (line.trim() === '---') {
      elements.push(<hr key={i} />);
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('* ') || lines[i].startsWith('- '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul${i}`}>
          {items.map((li, j) => <li key={j}>{renderInline(li)}</li>)}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={`ol${i}`}>
          {items.map((li, j) => <li key={j}>{renderInline(li)}</li>)}
        </ol>
      );
      continue;
    } else if (line.startsWith('![')) {
      const m = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (m) elements.push(<img key={i} src={m[2]} alt={m[1]} style={{ maxWidth: '100%', borderRadius: '6px', marginBottom: '1rem', border: '1px solid rgba(164,200,225,0.2)' }} />);
    } else if (line.trim() !== '') {
      let align = {};
      let content = line;
      if (line.startsWith('{c}')) { align = { textAlign: 'center' }; content = line.slice(3); }
      else if (line.startsWith('{r}')) { align = { textAlign: 'right' }; content = line.slice(3); }
      else if (line.startsWith('{j}')) { align = { textAlign: 'justify', hyphens: 'auto' }; content = line.slice(3); }
      elements.push(<p key={i} style={align}>{renderInline(content)}</p>);
    }
    i++;
  }
  return elements;
}

export function RichTextRenderer({ content, className = '', style = {} }) {
  if (!content) return null;

  const cls = `tmd-rich-text${className ? ` ${className}` : ''}`;

  if (isHtmlContent(content)) {
    const clean = DOMPurify.sanitize(content, PURIFY_CONFIG);
    return (
      <div
        className={cls}
        style={style}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  return (
    <div className={cls} style={style}>
      {renderLegacyContent(content)}
    </div>
  );
}
