import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Minus, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, ChevronDown, Type, X
} from 'lucide-react';
import { legacyMarkdownToHtml, isHtmlContent } from '../utils/legacyMarkdownToHtml';
import './RichTextEditor.css';

const TMD_COLORS = [
  { label: 'Złoty', value: '#c59f4e' },
  { label: 'Lodowy', value: '#a4c8e1' },
  { label: 'Czerwony', value: '#ef4444' },
  { label: 'Szmaragd', value: '#2ec4b6' },
  { label: 'Purpurowy', value: '#b18cfe' },
  { label: 'Biały', value: '#ffffff' },
  { label: 'Ogień', value: '#f59e0b' },
  { label: 'Krew', value: '#b32626' },
];

const RUNE_GLYPHS = [
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ',
  'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ',
  'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ',
];

function TBtn({ onClick, active, title, children, style }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`tmd-rte-btn${active ? ' is-active' : ''}`}
      style={style}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Wpisz treść...',
  minHeight = 200,
  showRuneGlyphs = false,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showRuneRow, setShowRuneRow] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editorHtmlRef = useRef('');

  const initialHtml = isHtmlContent(value) ? value : legacyMarkdownToHtml(value);
  editorHtmlRef.current = initialHtml;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml || '',
    onUpdate({ editor }) {
      const html = editor.getHTML();
      editorHtmlRef.current = html;
      onChange?.(html);
    },
  });

  // Sync when value changes externally (e.g., loading different article)
  useEffect(() => {
    if (!editor) return;
    const newHtml = isHtmlContent(value) ? value : legacyMarkdownToHtml(value);
    if (newHtml !== editorHtmlRef.current) {
      editorHtmlRef.current = newHtml;
      editor.commands.setContent(newHtml || '', false);
    }
  }, [value, editor]);

  const closeDropdowns = () => {
    setShowColorPicker(false);
    setShowHeadingMenu(false);
  };

  const handleSetLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href, target: '_blank' }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  if (!editor) return null;

  const headingLabel = editor.isActive('heading', { level: 2 }) ? 'H2'
    : editor.isActive('heading', { level: 3 }) ? 'H3'
    : editor.isActive('heading', { level: 4 }) ? 'H4'
    : 'Akapit';

  const currentColor = editor.getAttributes('textStyle').color;

  return (
    <div className="tmd-rte-wrapper" style={{ '--rte-min-height': `${minHeight}px` }}>
      <div className="tmd-rte-toolbar" onMouseDown={closeDropdowns}>

        {/* Heading dropdown */}
        <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setShowHeadingMenu(v => !v); setShowColorPicker(false); }}
            className={`tmd-rte-btn${showHeadingMenu ? ' is-active' : ''}`}
            style={{ width: 'auto', padding: '0 0.55rem', fontSize: '0.73rem', gap: '0.3rem', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
          >
            {headingLabel} <ChevronDown size={10} />
          </button>
          {showHeadingMenu && (
            <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 60, background: '#0d1320', border: '1px solid rgba(197,159,78,0.3)', borderRadius: '6px', overflow: 'hidden', minWidth: '165px', boxShadow: '0 8px 24px rgba(0,0,0,0.9)' }}>
              {[
                { label: 'Normalny akapit', action: () => editor.chain().focus().setParagraph().run(), style: { fontSize: '0.85rem' } },
                { label: 'Nagłówek H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), style: { fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-glow)' } },
                { label: 'Nagłówek H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), style: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold-ancient)' } },
                { label: 'Nagłówek H4', action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), style: { fontSize: '0.87rem', fontWeight: 700 } },
              ].map((opt, i) => (
                <button key={i} type="button"
                  onMouseDown={e => { e.preventDefault(); opt.action(); setShowHeadingMenu(false); }}
                  style={{ display: 'block', width: '100%', padding: '0.5rem 0.9rem', background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', ...opt.style }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="tmd-rte-divider" />

        {/* Text formatting */}
        <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Pogrubienie (Ctrl+B)"><Bold size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Kursywa (Ctrl+I)"><Italic size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Podkreślenie (Ctrl+U)"><UnderlineIcon size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Przekreślenie"><Strikethrough size={14} /></TBtn>

        <div className="tmd-rte-divider" />

        {/* Text color */}
        <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
          <button
            type="button"
            title="Kolor tekstu"
            onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => !v); setShowHeadingMenu(false); }}
            className={`tmd-rte-btn${showColorPicker ? ' is-active' : ''}`}
            style={{ flexDirection: 'column', gap: '1px' }}
          >
            <Type size={12} />
            <div style={{ width: '14px', height: '3px', background: currentColor || 'var(--gold-ancient, #c59f4e)', borderRadius: '1px' }} />
          </button>
          {showColorPicker && (
            <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 60, background: 'rgba(10,14,22,0.97)', border: '1px solid rgba(164,200,225,0.25)', borderRadius: '6px', padding: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.8)', width: '190px' }}>
              <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Kolor tekstu</div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                {TMD_COLORS.map(c => (
                  <button key={c.value} type="button" title={c.label}
                    onMouseDown={e => { e.preventDefault(); editor.chain().focus().setColor(c.value).run(); setShowColorPicker(false); }}
                    style={{ width: '28px', height: '28px', borderRadius: '4px', border: '2px solid rgba(255,255,255,0.15)', background: c.value, cursor: 'pointer', transition: 'transform 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
              <button type="button"
                onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                style={{ fontSize: '0.72rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', padding: '0.2rem 0.5rem', cursor: 'pointer', width: '100%' }}>
                Usuń kolor
              </button>
            </div>
          )}
        </div>

        <div className="tmd-rte-divider" />

        {/* Alignment */}
        <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Do lewej"><AlignLeft size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Wyśrodkuj"><AlignCenter size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Do prawej"><AlignRight size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Wyjustowanie"><AlignJustify size={14} /></TBtn>

        <div className="tmd-rte-divider" />

        {/* Lists */}
        <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista punktowana"><List size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerowana"><ListOrdered size={14} /></TBtn>

        <div className="tmd-rte-divider" />

        {/* Special blocks */}
        <TBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cytat"><Quote size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linia rozdzielająca"><Minus size={14} /></TBtn>

        <div className="tmd-rte-divider" />

        {/* Link */}
        <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
          <TBtn
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                setLinkUrl(editor.getAttributes('link').href || '');
                setShowLinkInput(v => !v);
              }
            }}
            active={editor.isActive('link')}
            title="Odnośnik"
          >
            <LinkIcon size={14} />
          </TBtn>
          {showLinkInput && (
            <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 60, background: 'rgba(10,14,22,0.97)', border: '1px solid rgba(164,200,225,0.25)', borderRadius: '6px', padding: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.8)', width: '270px' }}>
              <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '0.35rem' }}>URL odnośnika</div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSetLink(); } if (e.key === 'Escape') setShowLinkInput(false); }}
                  placeholder="https://..."
                  className="gothic-input"
                  style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
                  autoFocus
                />
                <button type="button" onMouseDown={e => { e.preventDefault(); handleSetLink(); }} className="btn-durmstrang-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>OK</button>
              </div>
            </div>
          )}
        </div>

        <div className="tmd-rte-divider" />

        {/* Undo / Redo */}
        <TBtn onClick={() => editor.chain().focus().undo().run()} title="Cofnij (Ctrl+Z)"><Undo2 size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().redo().run()} title="Ponów (Ctrl+Y)"><Redo2 size={14} /></TBtn>

        {/* Rune glyphs toggle */}
        {showRuneGlyphs && (
          <>
            <div className="tmd-rte-divider" />
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setShowRuneRow(v => !v); }}
              className={`tmd-rte-btn${showRuneRow ? ' is-active' : ''}`}
              style={{ width: 'auto', padding: '0 0.5rem', fontSize: '0.8rem' }}
              title="Glify Runiczne Elder Futhark"
            >
              ᚠ Runy
            </button>
          </>
        )}
      </div>

      {/* Rune row */}
      {showRuneGlyphs && showRuneRow && (
        <div className="tmd-rte-rune-row">
          <span style={{ fontSize: '0.68rem', color: 'var(--gold-ancient, #c59f4e)', marginRight: '0.25rem', whiteSpace: 'nowrap' }}>Elder Fuþark:</span>
          {RUNE_GLYPHS.map(rune => (
            <button key={rune} type="button"
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().insertContent(rune).run(); }}
              className="rune-glyph-btn"
              title={`Wstaw runę ${rune}`}
            >
              {rune}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="tmd-rte-content" style={{ minHeight: `${minHeight}px` }} onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
