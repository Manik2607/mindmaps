'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Block, BlockType, DocNodeData } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  X, Plus, GripVertical, Check,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Code2, ImageIcon, AlignLeft,
  ChevronDown, Quote, Info, Minus,
  Bold, Italic, Underline, Strikethrough,
  Link2, HelpCircle, Copy, CheckCheck,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Block command menu options
// ─────────────────────────────────────────────────────────────────────────────
const BLOCK_COMMANDS: { type: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'paragraph',  label: 'Text',            icon: <AlignLeft size={16} />,    desc: 'Plain text block' },
  { type: 'heading1',   label: 'Heading 1',       icon: <Heading1 size={16} />,     desc: 'Large section heading (#)' },
  { type: 'heading2',   label: 'Heading 2',       icon: <Heading2 size={16} />,     desc: 'Medium section heading (##)' },
  { type: 'heading3',   label: 'Heading 3',       icon: <Heading3 size={16} />,     desc: 'Small section heading (###)' },
  { type: 'bullet',     label: 'Bulleted List',   icon: <List size={16} />,         desc: 'Unordered list item (- or *)' },
  { type: 'numbered',   label: 'Numbered List',   icon: <ListOrdered size={16} />,  desc: 'Ordered list item (1.)' },
  { type: 'checklist',  label: 'To-do List',      icon: <ListChecks size={16} />,   desc: 'Task item with checkbox ([] )' },
  { type: 'quote',      label: 'Quote',           icon: <Quote size={16} />,        desc: 'Capture a quote (> )' },
  { type: 'callout',    label: 'Callout',         icon: <Info size={16} />,         desc: 'Highlighted note or idea (! )' },
  { type: 'code',       label: 'Code Block',      icon: <Code2 size={16} />,        desc: 'Monospace code block (```)' },
  { type: 'divider',    label: 'Divider',         icon: <Minus size={16} />,        desc: 'Visual divider line (---)' },
  { type: 'image',      label: 'Image',           icon: <ImageIcon size={16} />,    desc: 'Paste or upload image' },
];

const CALLOUT_ICONS = ['💡', '📌', '⚠️', '🚀', 'ℹ️', '🔥', '🎯', '📝'];

function newBlock(type: BlockType = 'paragraph', content = ''): Block {
  return {
    id: uuidv4(),
    type,
    content,
    checked: false,
    icon: type === 'callout' ? '💡' : undefined,
  };
}

// Helper to wrap/unwrap formatting markers in a textarea
function formatText(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  onApply: (newVal: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const selectedText = val.slice(start, end);

  const before = val.slice(Math.max(0, start - prefix.length), start);
  const after = val.slice(end, end + suffix.length);

  let newVal: string;
  let newStart: number;
  let newEnd: number;

  if (before === prefix && after === suffix) {
    // Already wrapped -> unwrap
    newVal = val.slice(0, start - prefix.length) + selectedText + val.slice(end + suffix.length);
    newStart = start - prefix.length;
    newEnd = end - prefix.length;
  } else if (
    selectedText.startsWith(prefix) &&
    selectedText.endsWith(suffix) &&
    selectedText.length >= prefix.length + suffix.length
  ) {
    // Selected text has wrappers
    const unwrapped = selectedText.slice(prefix.length, -suffix.length);
    newVal = val.slice(0, start) + unwrapped + val.slice(end);
    newStart = start;
    newEnd = start + unwrapped.length;
  } else {
    // Wrap
    const textToWrap = selectedText || 'text';
    newVal = val.slice(0, start) + prefix + textToWrap + suffix + val.slice(end);
    newStart = start + prefix.length;
    newEnd = newStart + textToWrap.length;
  }

  onApply(newVal);
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(newStart, newEnd);
  }, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// Single block renderer
// ─────────────────────────────────────────────────────────────────────────────
interface BlockEditorProps {
  block: Block;
  index: number;
  onChange: (id: string, patch: Partial<Block>) => void;
  onAddAfter: (id: string, type?: BlockType, initialContent?: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMergeWithPrevious: (id: string) => void;
  focusRef: React.RefObject<Map<string, HTMLTextAreaElement>>;
  setActiveTextarea: (el: HTMLTextAreaElement | null, blockId: string) => void;
  onSelectionChange: (state: { text: string; top: number; left: number; blockId: string } | null) => void;
}

function BlockEditor({
  block,
  index,
  onChange,
  onAddAfter,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMergeWithPrevious,
  focusRef,
  setActiveTextarea,
  onSelectionChange,
}: BlockEditorProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuFilter, setMenuFilter] = useState('');
  const [menuIndex, setMenuIndex] = useState(0);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Register in focus map
  useEffect(() => {
    if (inputRef.current) {
      focusRef.current?.set(block.id, inputRef.current);
    }
    return () => {
      focusRef.current?.delete(block.id);
    };
  }, [block.id, focusRef]);

  // Adjust textarea height automatically
  const adjustHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [block.content, block.type]);

  const selectCommand = (type: BlockType) => {
    const slashIdx = block.content.lastIndexOf('/');
    const newContent = slashIdx >= 0 ? block.content.slice(0, slashIdx) : block.content;
    onChange(block.id, {
      type,
      content: newContent,
      icon: type === 'callout' ? (block.icon || '💡') : undefined,
    });
    setShowMenu(false);
    setTimeout(() => {
      inputRef.current?.focus();
      adjustHeight();
    }, 50);
  };

  const filteredCommands = BLOCK_COMMANDS.filter(
    (c) => !menuFilter || c.label.toLowerCase().includes(menuFilter) || c.type.includes(menuFilter)
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const val = target.value;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    // Handle slash menu navigation
    if (showMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMenuIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMenuIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[menuIndex]) {
          selectCommand(filteredCommands[menuIndex].type);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMenu(false);
        return;
      }
    }

    // Standard Notion shortcuts
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;

    if (isCmdOrCtrl) {
      // Bold: Cmd/Ctrl + B
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        formatText(target, '**', '**', (c) => onChange(block.id, { content: c }));
        return;
      }
      // Italic: Cmd/Ctrl + I
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        formatText(target, '*', '*', (c) => onChange(block.id, { content: c }));
        return;
      }
      // Underline: Cmd/Ctrl + U
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        formatText(target, '<u>', '</u>', (c) => onChange(block.id, { content: c }));
        return;
      }
      // Strikethrough: Cmd/Ctrl + Shift + S or Cmd/Ctrl + Shift + X
      if ((e.shiftKey && (e.key === 'S' || e.key === 's')) || (e.shiftKey && (e.key === 'X' || e.key === 'x'))) {
        e.preventDefault();
        formatText(target, '~~', '~~', (c) => onChange(block.id, { content: c }));
        return;
      }
      // Inline Code: Cmd/Ctrl + E
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        formatText(target, '`', '`', (c) => onChange(block.id, { content: c }));
        return;
      }
      // Link: Cmd/Ctrl + K
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        formatText(target, '[', '](https://)', (c) => onChange(block.id, { content: c }));
        return;
      }
      // Complete Task: Cmd/Ctrl + Enter
      if (e.key === 'Enter' && block.type === 'checklist') {
        e.preventDefault();
        onChange(block.id, { checked: !block.checked });
        return;
      }
      // Turn into shortcuts: Cmd/Ctrl + Shift + 1..9
      if (e.shiftKey) {
        const num = e.key;
        const typeMap: Record<string, BlockType> = {
          '1': 'heading1',
          '2': 'heading2',
          '3': 'heading3',
          '4': 'checklist',
          '5': 'bullet',
          '6': 'numbered',
          '8': 'code',
          '9': 'quote',
          '0': 'paragraph',
        };
        if (typeMap[num]) {
          e.preventDefault();
          onChange(block.id, { type: typeMap[num] });
          return;
        }
      }
    }

    // Enter key: Split block or create new block below
    if (e.key === 'Enter' && !e.shiftKey) {
      // In code blocks, Enter adds a newline
      if (block.type === 'code') {
        return;
      }

      e.preventDefault();
      const beforeCursor = val.slice(0, start);
      const afterCursor = val.slice(end);

      // If bullet/numbered/checklist is completely empty and user hits Enter -> demote to paragraph
      if (['bullet', 'numbered', 'checklist'].includes(block.type) && val.trim() === '') {
        onChange(block.id, { type: 'paragraph' });
        return;
      }

      onChange(block.id, { content: beforeCursor });
      const nextType = ['bullet', 'numbered', 'checklist'].includes(block.type) ? block.type : 'paragraph';
      onAddAfter(block.id, nextType, afterCursor);
      return;
    }

    // Backspace at start of block
    if (e.key === 'Backspace' && start === 0 && end === 0) {
      if (block.type !== 'paragraph') {
        e.preventDefault();
        onChange(block.id, { type: 'paragraph' });
        return;
      }
      if (index > 0) {
        e.preventDefault();
        onMergeWithPrevious(block.id);
        return;
      }
    }

    // Trigger Slash menu
    if (e.key === '/') {
      setMenuFilter('');
      setMenuIndex(0);
      setShowMenu(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;

    // Notion-style markdown auto-conversion when typing prefixes
    if (block.type === 'paragraph') {
      if (val === '# ') {
        onChange(block.id, { type: 'heading1', content: '' });
        return;
      }
      if (val === '## ') {
        onChange(block.id, { type: 'heading2', content: '' });
        return;
      }
      if (val === '### ') {
        onChange(block.id, { type: 'heading3', content: '' });
        return;
      }
      if (val === '> ') {
        onChange(block.id, { type: 'quote', content: '' });
        return;
      }
      if (val === '- ' || val === '* ') {
        onChange(block.id, { type: 'bullet', content: '' });
        return;
      }
      if (val === '1. ') {
        onChange(block.id, { type: 'numbered', content: '' });
        return;
      }
      if (val === '[] ' || val === '[ ] ') {
        onChange(block.id, { type: 'checklist', content: '', checked: false });
        return;
      }
      if (val === '! ' || val === '💡 ') {
        onChange(block.id, { type: 'callout', content: '', icon: '💡' });
        return;
      }
      if (val === '```') {
        onChange(block.id, { type: 'code', content: '' });
        return;
      }
      if (val === '---') {
        onChange(block.id, { type: 'divider', content: '' });
        onAddAfter(block.id, 'paragraph');
        return;
      }
    }

    // Slash menu query filter
    if (showMenu) {
      const slashIdx = val.lastIndexOf('/');
      if (slashIdx >= 0) {
        setMenuFilter(val.slice(slashIdx + 1).toLowerCase());
        setMenuIndex(0);
      } else {
        setShowMenu(false);
      }
    }

    onChange(block.id, { content: val });
    adjustHeight();
  };

  // Detect selection for the floating bubble toolbar
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (el.selectionStart !== el.selectionEnd) {
      const selected = el.value.slice(el.selectionStart, el.selectionEnd);
      const rect = el.getBoundingClientRect();
      onSelectionChange({
        text: selected,
        top: rect.top - 44,
        left: Math.max(16, rect.left + 20),
        blockId: block.id,
      });
    } else {
      onSelectionChange(null);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(block.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Render prefix (bullet, number, checklist, icon)
  const renderPrefix = () => {
    if (block.type === 'bullet') return <span className="text-text-muted mr-2 shrink-0 select-none text-base mt-0.5">•</span>;
    if (block.type === 'numbered') return <span className="text-text-muted mr-2 shrink-0 select-none text-sm font-mono mt-0.5">{index + 1}.</span>;
    if (block.type === 'checklist') {
      return (
        <button
          className={`w-4 h-4 rounded border shrink-0 mr-2 mt-1 flex items-center justify-center transition-colors ${
            block.checked ? 'bg-accent border-accent text-white' : 'border-node-border hover:border-accent'
          }`}
          onClick={() => onChange(block.id, { checked: !block.checked })}
        >
          {block.checked && <Check size={10} />}
        </button>
      );
    }
    return null;
  };

  const textClass = {
    heading1: 'text-3xl font-bold text-text-main font-serif leading-tight py-1',
    heading2: 'text-2xl font-bold text-text-main font-serif leading-tight py-0.5',
    heading3: 'text-xl font-semibold text-text-main leading-snug py-0.5',
    paragraph: 'text-base text-text-main leading-relaxed',
    bullet: 'text-base text-text-main leading-relaxed',
    numbered: 'text-base text-text-main leading-relaxed',
    checklist: `text-base leading-relaxed ${block.checked ? 'text-text-muted line-through opacity-70' : 'text-text-main'}`,
    quote: 'text-base text-text-main italic font-serif leading-relaxed',
    callout: 'text-sm text-text-main leading-relaxed',
    code: 'font-mono text-sm text-emerald-300 leading-relaxed bg-transparent',
    divider: 'w-full',
    image: 'text-base text-text-main',
  }[block.type] || 'text-base text-text-main';

  // Divider block
  if (block.type === 'divider') {
    return (
      <div className="group/block flex items-center space-x-2 relative py-2">
        <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex space-x-0.5 shrink-0">
          <button onClick={() => onDelete(block.id)} className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
        </div>
        <div className="flex-1 py-2 cursor-pointer" onClick={() => onAddAfter(block.id, 'paragraph')}>
          <hr className="border-t border-[#333] hover:border-accent transition-colors" />
        </div>
      </div>
    );
  }

  // Image block
  if (block.type === 'image' && block.src) {
    return (
      <div className="group/block flex items-start space-x-2 relative py-1.5">
        <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col space-y-0.5 pt-1 shrink-0">
          <button onClick={() => onMoveUp(block.id)} className="text-text-muted/50 hover:text-text-muted p-0.5"><ChevronDown size={12} className="rotate-180" /></button>
          <GripVertical size={14} className="text-text-muted/30" />
          <button onClick={() => onMoveDown(block.id)} className="text-text-muted/50 hover:text-text-muted p-0.5"><ChevronDown size={12} /></button>
        </div>
        <div className="relative group/img max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt || 'image'} className="max-w-full rounded-xl border border-node-border shadow-md" style={{ maxHeight: 420 }} />
          <button
            className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-red-900/80 hover:bg-red-800 text-red-200 rounded px-2 py-1 text-xs"
            onClick={() => onDelete(block.id)}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/block flex items-start space-x-2 relative py-0.5">
      {/* Block grip and reorder handles */}
      <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col space-y-0.5 pt-1 shrink-0 cursor-grab">
        <button onClick={() => onMoveUp(block.id)} className="text-text-muted/50 hover:text-text-muted p-0.5"><ChevronDown size={12} className="rotate-180" /></button>
        <GripVertical size={14} className="text-text-muted/30" />
        <button onClick={() => onMoveDown(block.id)} className="text-text-muted/50 hover:text-text-muted p-0.5"><ChevronDown size={12} /></button>
      </div>

      {/* Block content wrapper */}
      <div className="flex-1 flex items-start relative min-w-0">
        {/* Quote Block Style */}
        {block.type === 'quote' && (
          <div className="w-1 self-stretch bg-accent rounded-full mr-3 shrink-0" />
        )}

        {/* Callout Block Style */}
        {block.type === 'callout' && (
          <div className="relative mr-2.5 shrink-0 mt-0.5">
            <button
              className="text-lg hover:scale-125 transition-transform"
              onClick={() => setShowIconPicker(!showIconPicker)}
              title="Click to change icon"
            >
              {block.icon || '💡'}
            </button>
            {showIconPicker && (
              <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg p-1.5 shadow-xl flex gap-1 z-50">
                {CALLOUT_ICONS.map((ic) => (
                  <button
                    key={ic}
                    className="p-1 hover:bg-[#333] rounded text-base"
                    onClick={() => {
                      onChange(block.id, { icon: ic });
                      setShowIconPicker(false);
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prefix for lists/checklists */}
        {renderPrefix()}

        {/* Text Area or Code Container */}
        {block.type === 'code' ? (
          <div className="w-full bg-[#101016] border border-[#2a2a3e] rounded-xl overflow-hidden relative group/code">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0a0f] border-b border-[#222234] text-xs text-text-muted/70">
              <span className="font-mono text-[11px] text-emerald-400">code</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1 hover:text-text-main transition-colors text-[11px]"
              >
                {copiedCode ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              ref={inputRef}
              className="w-full bg-transparent border-none outline-none resize-none p-3 font-mono text-sm text-emerald-300 leading-relaxed"
              value={block.content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setActiveTextarea(inputRef.current, block.id)}
              onBlur={() => {
                setTimeout(() => onSelectionChange(null), 150);
              }}
              onSelect={handleSelect}
              placeholder="// Write code here..."
              rows={2}
            />
          </div>
        ) : (
          <div
            className={`flex-1 relative ${
              block.type === 'callout'
                ? 'bg-accent/5 border border-accent/20 rounded-xl px-3 py-2 flex items-center'
                : ''
            }`}
          >
            <textarea
              ref={inputRef}
              className={`w-full bg-transparent border-none outline-none resize-none ${textClass}`}
              value={block.content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setActiveTextarea(inputRef.current, block.id)}
              onBlur={() => {
                setTimeout(() => onSelectionChange(null), 150);
              }}
              onSelect={handleSelect}
              placeholder={
                block.type === 'paragraph' ? "Type '/' for commands or markdown (#, -, >)..." :
                block.type === 'heading1' ? 'Heading 1' :
                block.type === 'heading2' ? 'Heading 2' :
                block.type === 'heading3' ? 'Heading 3' :
                block.type === 'bullet' ? 'List item' :
                block.type === 'numbered' ? 'List item' :
                block.type === 'checklist' ? 'To-do item' :
                block.type === 'quote' ? 'Empty quote...' :
                block.type === 'callout' ? 'Callout text...' :
                ''
              }
              rows={1}
              style={{ overflow: 'hidden' }}
            />
          </div>
        )}

        {/* Slash command floating menu */}
        {showMenu && filteredCommands.length > 0 && (
          <div
            data-block-menu="true"
            className="absolute top-full left-0 mt-1 w-72 bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-2 text-[11px] font-semibold text-text-muted/60 uppercase tracking-wider border-b border-[#222] px-3">
              Basic Blocks
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filteredCommands.map((cmd, i) => (
                <button
                  key={cmd.type}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left transition-colors ${
                    i === menuIndex ? 'bg-[#222] text-text-main' : 'hover:bg-[#1a1a1a] text-text-muted'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCommand(cmd.type);
                  }}
                  onMouseEnter={() => setMenuIndex(i)}
                >
                  <span className="p-1 rounded bg-[#252525] text-accent shrink-0">{cmd.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-main">{cmd.label}</div>
                    <div className="text-xs text-text-muted/70 truncate">{cmd.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main overlay
// ─────────────────────────────────────────────────────────────────────────────
export function DocEditorOverlay({ nodeId }: { nodeId: string }) {
  const node = useStore((s) => s.nodes.find((n) => n.id === nodeId));
  const updateDocBlocks = useStore((s) => s.updateDocBlocks);
  const updateDocTitle = useStore((s) => s.updateDocTitle);
  const closeOverlay = useStore((s) => s.closeOverlay);

  const focusMap = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const activeTextareaRef = useRef<{ el: HTMLTextAreaElement | null; blockId: string }>({
    el: null,
    blockId: '',
  });

  const [selectionState, setSelectionState] = useState<{
    text: string;
    top: number;
    left: number;
    blockId: string;
  } | null>(null);

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const setActiveTextarea = (el: HTMLTextAreaElement | null, blockId: string) => {
    activeTextareaRef.current = { el, blockId };
  };

  const handleBlockChange = useCallback(
    (id: string, patch: Partial<Block>) => {
      const current = useStore.getState().nodes.find((n) => n.id === nodeId);
      if (!current || current.data.kind !== 'doc') return;
      const blocks = (current.data as DocNodeData).blocks.map((b) =>
        b.id === id ? { ...b, ...patch } : b
      );
      updateDocBlocks(nodeId, blocks);
    },
    [nodeId, updateDocBlocks]
  );

  const handleAddAfter = useCallback(
    (id: string, type: BlockType = 'paragraph', initialContent = '') => {
      const current = useStore.getState().nodes.find((n) => n.id === nodeId);
      if (!current || current.data.kind !== 'doc') return;
      const blocks = [...(current.data as DocNodeData).blocks];
      const idx = blocks.findIndex((b) => b.id === id);
      const nb = newBlock(type, initialContent);
      blocks.splice(idx + 1, 0, nb);
      updateDocBlocks(nodeId, blocks);
      setTimeout(() => {
        const el = focusMap.current?.get(nb.id);
        el?.focus();
      }, 50);
    },
    [nodeId, updateDocBlocks]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const current = useStore.getState().nodes.find((n) => n.id === nodeId);
      if (!current || current.data.kind !== 'doc') return;
      const blocks = (current.data as DocNodeData).blocks.filter((b) => b.id !== id);
      if (blocks.length === 0) blocks.push(newBlock());
      updateDocBlocks(nodeId, blocks);
    },
    [nodeId, updateDocBlocks]
  );

  const handleMergeWithPrevious = useCallback(
    (id: string) => {
      const current = useStore.getState().nodes.find((n) => n.id === nodeId);
      if (!current || current.data.kind !== 'doc') return;
      const blocks = [...(current.data as DocNodeData).blocks];
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx <= 0) return;

      const prevBlock = blocks[idx - 1];
      const currentBlock = blocks[idx];
      const prevLength = prevBlock.content.length;

      // Merge text
      prevBlock.content += currentBlock.content;
      blocks.splice(idx, 1);
      updateDocBlocks(nodeId, blocks);

      setTimeout(() => {
        const el = focusMap.current?.get(prevBlock.id);
        if (el) {
          el.focus();
          el.setSelectionRange(prevLength, prevLength);
        }
      }, 50);
    },
    [nodeId, updateDocBlocks]
  );

  const handleMoveUp = useCallback(
    (id: string) => {
      const current = useStore.getState().nodes.find((n) => n.id === nodeId);
      if (!current || current.data.kind !== 'doc') return;
      const blocks = [...(current.data as DocNodeData).blocks];
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx <= 0) return;
      [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
      updateDocBlocks(nodeId, blocks);
    },
    [nodeId, updateDocBlocks]
  );

  const handleMoveDown = useCallback(
    (id: string) => {
      const current = useStore.getState().nodes.find((n) => n.id === nodeId);
      if (!current || current.data.kind !== 'doc') return;
      const blocks = [...(current.data as DocNodeData).blocks];
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx >= blocks.length - 1) return;
      [blocks[idx + 1], blocks[idx]] = [blocks[idx], blocks[idx + 1]];
      updateDocBlocks(nodeId, blocks);
    },
    [nodeId, updateDocBlocks]
  );

  // Apply formatting from top toolbar or floating toolbar
  const applyActiveFormatting = (prefix: string, suffix: string) => {
    const el = activeTextareaRef.current.el;
    const blockId = activeTextareaRef.current.blockId;
    if (!el || !blockId) return;

    formatText(el, prefix, suffix, (val) => {
      handleBlockChange(blockId, { content: val });
    });
  };

  // Convert current active block
  const convertActiveBlockType = (type: BlockType) => {
    const blockId = activeTextareaRef.current.blockId;
    if (!blockId) return;
    handleBlockChange(blockId, { type });
    setSelectionState(null);
  };

  // Capture phase Escape listener: guarantees Esc closes immediately without manual save button
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const slashMenu = document.querySelector('[data-block-menu="true"]');
        if (slashMenu) return;

        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        closeOverlay();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [closeOverlay, showShortcutsModal]);

  // Initialize with default block if empty
  useEffect(() => {
    if (node && node.data.kind === 'doc') {
      const d = node.data as DocNodeData;
      if (!d.blocks || d.blocks.length === 0) {
        updateDocBlocks(nodeId, [newBlock()]);
      }
    }
  }, [nodeId, node, updateDocBlocks]);

  if (!node || node.data.kind !== 'doc') return null;
  const d = node.data as DocNodeData;

  const blocks = d.blocks && d.blocks.length ? d.blocks : [newBlock()];

  // Calculate doc stats
  const totalWords = blocks.reduce((acc, b) => {
    return acc + (b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0);
  }, 0);
  const readingTime = Math.max(1, Math.ceil(totalWords / 200));

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0d0d0d] text-text-main"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-[#222] shrink-0 bg-[#0d0d0d]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
          <span className="text-sm font-medium text-text-muted">Document</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-text-muted/70 bg-[#161616] px-2.5 py-1 rounded-full border border-[#252525]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Auto-saved</span>
          </div>
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#2e2e2e] text-xs text-text-muted hover:text-text-main transition-colors"
            title="View shortcuts and formatting guide"
          >
            <HelpCircle size={14} />
            <span>Shortcuts</span>
          </button>
          <button
            onClick={closeOverlay}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#2e2e2e] text-xs text-text-muted hover:text-text-main transition-colors"
            title="Press Esc to close"
          >
            <X size={14} />
            <kbd className="text-[10px] bg-[#2a2a2a] text-text-muted/80 px-1 py-0.5 rounded font-mono">Esc</kbd>
          </button>
        </div>
      </div>

      {/* Notion-style Omnipresent Toolbar */}
      <div className="flex items-center justify-between px-8 py-2 border-b border-[#1c1c1c] bg-[#121212] shrink-0 overflow-x-auto text-xs">
        {/* Quick Block Inserters */}
        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-[10px] uppercase font-semibold text-text-muted/40 mr-1.5">Insert</span>
          <button
            onClick={() => handleAddAfter(blocks[blocks.length - 1].id, 'paragraph')}
            className="px-2 py-1 rounded hover:bg-[#222] text-text-muted hover:text-text-main flex items-center space-x-1"
          >
            <AlignLeft size={13} />
            <span>Text</span>
          </button>
          <button
            onClick={() => handleAddAfter(blocks[blocks.length - 1].id, 'heading1')}
            className="px-2 py-1 rounded hover:bg-[#222] text-text-muted hover:text-text-main flex items-center space-x-1"
          >
            <Heading1 size={13} />
            <span>H1</span>
          </button>
          <button
            onClick={() => handleAddAfter(blocks[blocks.length - 1].id, 'heading2')}
            className="px-2 py-1 rounded hover:bg-[#222] text-text-muted hover:text-text-main flex items-center space-x-1"
          >
            <Heading2 size={13} />
            <span>H2</span>
          </button>
          <button
            onClick={() => handleAddAfter(blocks[blocks.length - 1].id, 'bullet')}
            className="px-2 py-1 rounded hover:bg-[#222] text-text-muted hover:text-text-main flex items-center space-x-1"
          >
            <List size={13} />
            <span>Bullet</span>
          </button>
          <button
            onClick={() => handleAddAfter(blocks[blocks.length - 1].id, 'checklist')}
            className="px-2 py-1 rounded hover:bg-[#222] text-text-muted hover:text-text-main flex items-center space-x-1"
          >
            <ListChecks size={13} />
            <span>To-do</span>
          </button>
          <button
            onClick={() => handleAddAfter(blocks[blocks.length - 1].id, 'quote')}
            className="px-2 py-1 rounded hover:bg-[#222] text-text-muted hover:text-text-main flex items-center space-x-1"
          >
            <Quote size={13} />
            <span>Quote</span>
          </button>
          <button
            onClick={() => handleAddAfter(blocks[blocks.length - 1].id, 'callout')}
            className="px-2 py-1 rounded hover:bg-[#222] text-text-muted hover:text-text-main flex items-center space-x-1"
          >
            <Info size={13} />
            <span>Callout</span>
          </button>
          <button
            onClick={() => handleAddAfter(blocks[blocks.length - 1].id, 'code')}
            className="px-2 py-1 rounded hover:bg-[#222] text-text-muted hover:text-text-main flex items-center space-x-1"
          >
            <Code2 size={13} />
            <span>Code</span>
          </button>
          <button
            onClick={() => handleAddAfter(blocks[blocks.length - 1].id, 'divider')}
            className="px-2 py-1 rounded hover:bg-[#222] text-text-muted hover:text-text-main flex items-center space-x-1"
          >
            <Minus size={13} />
            <span>Divider</span>
          </button>
        </div>

        <div className="h-4 w-px bg-[#262626] mx-3 shrink-0" />

        {/* Text Formatting Tools */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => applyActiveFormatting('**', '**')}
            className="p-1.5 rounded hover:bg-[#252525] text-text-muted hover:text-text-main"
            title="Bold (Ctrl/Cmd+B)"
          >
            <Bold size={13} />
          </button>
          <button
            onClick={() => applyActiveFormatting('*', '*')}
            className="p-1.5 rounded hover:bg-[#252525] text-text-muted hover:text-text-main"
            title="Italic (Ctrl/Cmd+I)"
          >
            <Italic size={13} />
          </button>
          <button
            onClick={() => applyActiveFormatting('<u>', '</u>')}
            className="p-1.5 rounded hover:bg-[#252525] text-text-muted hover:text-text-main"
            title="Underline (Ctrl/Cmd+U)"
          >
            <Underline size={13} />
          </button>
          <button
            onClick={() => applyActiveFormatting('~~', '~~')}
            className="p-1.5 rounded hover:bg-[#252525] text-text-muted hover:text-text-main"
            title="Strikethrough (Ctrl/Cmd+Shift+S)"
          >
            <Strikethrough size={13} />
          </button>
          <button
            onClick={() => applyActiveFormatting('`', '`')}
            className="p-1.5 rounded hover:bg-[#252525] text-text-muted hover:text-text-main"
            title="Inline Code (Ctrl/Cmd+E)"
          >
            <Code2 size={13} />
          </button>
          <button
            onClick={() => applyActiveFormatting('[', '](https://)')}
            className="p-1.5 rounded hover:bg-[#252525] text-text-muted hover:text-text-main"
            title="Link (Ctrl/Cmd+K)"
          >
            <Link2 size={13} />
          </button>
          <button
            onClick={() => applyActiveFormatting('==', '==')}
            className="p-1.5 rounded hover:bg-[#252525] text-amber-400 hover:text-amber-300"
            title="Highlight"
          >
            ==
          </button>
        </div>

        {/* Word Count & Stats */}
        <div className="ml-auto text-[11px] text-text-muted/50 font-mono shrink-0 pl-4">
          {totalWords} words • {readingTime} min read
        </div>
      </div>

      {/* Floating Selection Toolbar */}
      {selectionState && (
        <div
          className="fixed z-[120] bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl p-1 flex items-center space-x-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: Math.max(70, selectionState.top), left: selectionState.left }}
        >
          <button
            className="p-1.5 rounded hover:bg-[#2a2a2a] text-text-main"
            onClick={() => applyActiveFormatting('**', '**')}
            title="Bold (Cmd+B)"
          >
            <Bold size={13} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-[#2a2a2a] text-text-main"
            onClick={() => applyActiveFormatting('*', '*')}
            title="Italic (Cmd+I)"
          >
            <Italic size={13} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-[#2a2a2a] text-text-main"
            onClick={() => applyActiveFormatting('<u>', '</u>')}
            title="Underline (Cmd+U)"
          >
            <Underline size={13} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-[#2a2a2a] text-text-main"
            onClick={() => applyActiveFormatting('~~', '~~')}
            title="Strikethrough (Cmd+Shift+S)"
          >
            <Strikethrough size={13} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-[#2a2a2a] text-text-main"
            onClick={() => applyActiveFormatting('`', '`')}
            title="Inline Code (Cmd+E)"
          >
            <Code2 size={13} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-[#2a2a2a] text-text-main"
            onClick={() => applyActiveFormatting('[', '](https://)')}
            title="Add Link (Cmd+K)"
          >
            <Link2 size={13} />
          </button>
          <div className="h-4 w-px bg-[#333] mx-1" />
          <button
            className="text-[11px] px-2 py-1 rounded hover:bg-[#2a2a2a] text-text-muted hover:text-text-main"
            onClick={() => convertActiveBlockType('heading1')}
          >
            H1
          </button>
          <button
            className="text-[11px] px-2 py-1 rounded hover:bg-[#2a2a2a] text-text-muted hover:text-text-main"
            onClick={() => convertActiveBlockType('heading2')}
          >
            H2
          </button>
          <button
            className="text-[11px] px-2 py-1 rounded hover:bg-[#2a2a2a] text-text-muted hover:text-text-main"
            onClick={() => convertActiveBlockType('quote')}
          >
            Quote
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Title */}
          <input
            className="w-full bg-transparent border-none outline-none text-4xl font-bold font-serif text-text-main placeholder-text-muted/30 mb-8"
            value={d.title}
            onChange={(e) => updateDocTitle(nodeId, e.target.value)}
            placeholder="Untitled"
          />

          {/* Blocks */}
          <div className="space-y-0.5">
            {blocks.map((block, i) => (
              <BlockEditor
                key={block.id}
                block={block}
                index={i}
                onChange={handleBlockChange}
                onAddAfter={handleAddAfter}
                onDelete={handleDelete}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onMergeWithPrevious={handleMergeWithPrevious}
                focusRef={focusMap}
                setActiveTextarea={setActiveTextarea}
                onSelectionChange={setSelectionState}
              />
            ))}
          </div>

          {/* Add block button */}
          <button
            className="mt-6 flex items-center space-x-2 text-sm text-text-muted/40 hover:text-text-muted transition-colors group"
            onClick={() => {
              const current = useStore.getState().nodes.find((n) => n.id === nodeId);
              if (!current || current.data.kind !== 'doc') return;
              const bs = (current.data as DocNodeData).blocks;
              const nb = newBlock();
              updateDocBlocks(nodeId, [...bs, nb]);
              setTimeout(() => {
                focusMap.current?.get(nb.id)?.focus();
              }, 50);
            }}
          >
            <Plus size={14} className="group-hover:text-accent" />
            <span>Add block</span>
          </button>
        </div>
      </div>

      {/* Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 max-w-lg w-full shadow-2xl text-text-main"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center space-x-2">
                <HelpCircle size={18} className="text-accent" />
                <h3 className="font-semibold text-base">Notion Keyboard Shortcuts</h3>
              </div>
              <button
                className="text-text-muted hover:text-text-main p-1"
                onClick={() => setShowShortcutsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <h4 className="font-semibold text-text-muted uppercase tracking-wider mb-2 text-[11px]">
                  Markdown Prefixes (Type at start of line)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono"># </kbd> Heading 1
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono">## </kbd> Heading 2
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono">### </kbd> Heading 3
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono">- </kbd> or <kbd className="text-accent font-mono">* </kbd> Bullet List
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono">1. </kbd> Numbered List
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono">[] </kbd> Checklist
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono">&gt; </kbd> Quote Block
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono">! </kbd> Callout Note
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono">``` </kbd> Code Block
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-accent font-mono">--- </kbd> Divider Line
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-muted uppercase tracking-wider mb-2 text-[11px]">
                  Text Formatting Shortcuts
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-blue-400 font-mono">Cmd/Ctrl + B</kbd> Bold
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-blue-400 font-mono">Cmd/Ctrl + I</kbd> Italic
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-blue-400 font-mono">Cmd/Ctrl + U</kbd> Underline
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-blue-400 font-mono">Cmd/Ctrl + Shift + S</kbd> Strikethrough
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-blue-400 font-mono">Cmd/Ctrl + E</kbd> Inline Code
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-blue-400 font-mono">Cmd/Ctrl + K</kbd> Link
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-blue-400 font-mono">Cmd/Ctrl + Enter</kbd> Complete Task
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-muted uppercase tracking-wider mb-2 text-[11px]">
                  Block Conversion & Commands
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-emerald-400 font-mono">/</kbd> Open Commands Menu
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-emerald-400 font-mono">Enter</kbd> Split block
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-emerald-400 font-mono">Shift + Enter</kbd> Line break
                  </div>
                  <div className="bg-[#1c1c1c] p-2 rounded border border-[#292929]">
                    <kbd className="text-emerald-400 font-mono">Backspace</kbd> Demote/merge block
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                className="px-4 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-lg text-xs font-medium transition-colors"
                onClick={() => setShowShortcutsModal(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
