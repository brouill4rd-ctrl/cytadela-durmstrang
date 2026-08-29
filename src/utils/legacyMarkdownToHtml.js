export function isHtmlContent(content) {
  return /<[a-zA-Z][^>]*>/.test(String(content || ''));
}

function renderInlineMd(text) {
  return text
    .replace(/\{color:([^}]+)\}(.*?)\{\/color\}/g, '<span style="color:$1">$2</span>')
    .replace(/\{mark:([^}]+)\}(.*?)\{\/mark\}/g, '<mark style="background:$1">$2</mark>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function legacyMarkdownToHtml(text) {
  if (!text || !text.trim()) return '';

  const lines = text.split('\n');
  const parts = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith(':::warning')) {
      const block = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(':::')) { block.push(lines[i]); i++; }
      parts.push(`<blockquote><strong>⚠ Uwaga:</strong> ${block.join(' ')}</blockquote>`);
    } else if (line.startsWith(':::info')) {
      const block = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(':::')) { block.push(lines[i]); i++; }
      parts.push(`<blockquote><strong>ℹ Info:</strong> ${block.join(' ')}</blockquote>`);
    } else if (line.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      parts.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
    } else if (line.startsWith('# ') && !line.startsWith('## ')) {
      parts.push(`<h2>${renderInlineMd(line.slice(2))}</h2>`);
    } else if (line.startsWith('## ') && !line.startsWith('### ')) {
      parts.push(`<h3>${renderInlineMd(line.slice(3))}</h3>`);
    } else if (line.startsWith('### ')) {
      parts.push(`<h4>${renderInlineMd(line.slice(4))}</h4>`);
    } else if (line.startsWith('> ')) {
      parts.push(`<blockquote><p>${renderInlineMd(line.slice(2))}</p></blockquote>`);
    } else if (line.trim() === '---') {
      parts.push('<hr>');
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('* ') || lines[i].startsWith('- '))) {
        items.push(`<li>${renderInlineMd(lines[i].slice(2))}</li>`);
        i++;
      }
      parts.push(`<ul>${items.join('')}</ul>`);
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${renderInlineMd(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i++;
      }
      parts.push(`<ol>${items.join('')}</ol>`);
      continue;
    } else if (line.trim() === '') {
      // empty line — skip
    } else {
      let align = '';
      let content = line;
      if (line.startsWith('{c}')) { align = ' style="text-align:center"'; content = line.slice(3); }
      else if (line.startsWith('{r}')) { align = ' style="text-align:right"'; content = line.slice(3); }
      else if (line.startsWith('{j}')) { align = ' style="text-align:justify"'; content = line.slice(3); }
      parts.push(`<p${align}>${renderInlineMd(content)}</p>`);
    }

    i++;
  }

  return parts.join('');
}
