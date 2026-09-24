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
  ChevronDown,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Block command menu
// ─────────────────────────────────────────────────────────────────────────────
const BLOCK_COMMANDS: { type: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'paragraph',  label: 'Paragraph',      icon: <AlignLeft size={16} />,    desc: 'Plain text block' },
  { type: 'heading1',   label: 'Heading 1',       icon: <Heading1 size={16} />,     desc: 'Large section heading' },
  { type: 'heading2',   label: 'Heading 2',       icon: <Heading2 size={16} />,     desc: 'Medium section heading' },
  { type: 'heading3',   label: 'Heading 3',       icon: <Heading3 size={16} />,     desc: 'Small section heading' },
  { type: 'bullet',     label: 'Bullet List',     icon: <List size={16} />,         desc: 'Unordered list item' },
  { type: 'numbered',   label: 'Numbered List',   icon: <ListOrdered size={16} />,  desc: 'Ordered list item' },
  { type: 'checklist',  label: 'Checklist',       icon: <ListChecks size={16} />,   desc: 'Todo item with checkbox' },
  { type: 'code',       label: 'Code Block',      icon: <Code2 size={16} />,        desc: 'Monospace code block' },
  { type: 'image',      label: 'Image',           icon: <ImageIcon size={16} />,    desc: 'Paste or upload image' },
];

function newBlock(type: BlockType = 'paragraph'): Block {
  return { id: uuidv4(), type, content: '', checked: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Single block renderer
// ─────────────────────────────────────────────────────────────────────────────
interface BlockEditorProps {
  block: Block;
  index: number;
  onChange: (id: string, patch: Partial<Block>) => void;
  onAddAfter: (id: string, type?: BlockType) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  focusRef: React.RefObject<Map<string, HTMLElement>>;
}

function BlockEditor({ block, index, onChange, onAddAfter, onDelete, onMoveUp, onMoveDown, focusRef }: BlockEditorProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuFilter, setMenuFilter] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Register in focus map
  useEffect(() => {
    if (inputRef.current) {
      focusRef.current?.set(block.id, inputRef.current);
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const val = (e.target as HTMLTextAreaElement).value;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddAfter(block.id);
    }

    if (e.key === 'Backspace' && val === '') {
      e.preventDefault();
      onDelete(block.id);
    }

    if (e.key === '/') {
      setMenuFilter('');
      setShowMenu(true);
    }

    if (showMenu) {
      if (e.key === 'Escape') { setShowMenu(false); }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (showMenu) {
      const slashIdx = val.lastIndexOf('/');
      if (slashIdx >= 0) {
        setMenuFilter(val.slice(slashIdx + 1).toLowerCase());
      } else {
        setShowMenu(false);
      }
    }
    onChange(block.id, { content: val });
  };

  const selectCommand = (type: BlockType) => {
    // Strip the trailing /filter text
    const slashIdx = block.content.lastIndexOf('/');
    const newContent = slashIdx >= 0 ? block.content.slice(0, slashIdx) : block.content;
    onChange(block.id, { type, content: newContent });
    setShowMenu(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const filteredCommands = BLOCK_COMMANDS.filter(
    (c) => !menuFilter || c.label.toLowerCase().includes(menuFilter) || c.type.includes(menuFilter)
  );

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((it) => it.type.startsWith('image/'));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(block.id, { type: 'image', src: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Render prefix by block type
  const renderPrefix = () => {
    if (block.type === 'bullet') return <span className="text-text-muted mr-2 shrink-0 mt-1">•</span>;
    if (block.type === 'numbered') return <span className="text-text-muted mr-2 shrink-0 mt-1 text-sm">{index + 1}.</span>;
    if (block.type === 'checklist') return (
      <button
        className={`w-4 h-4 rounded border shrink-0 mr-2 mt-1 flex items-center justify-center transition-colors ${block.checked ? 'bg-accent border-accent' : 'border-node-border hover:border-accent'}`}
        onClick={() => onChange(block.id, { checked: !block.checked })}
      >
        {block.checked && <Check size={10} className="text-white" />}
      </button>
    );
    return null;
  };

  const textClass = {
    heading1: 'text-3xl font-bold text-text-main font-serif leading-tight',
    heading2: 'text-2xl font-bold text-text-main font-serif leading-tight',
    heading3: 'text-xl font-semibold text-text-main leading-tight',
    paragraph: 'text-base text-text-main leading-relaxed',
    bullet: 'text-base text-text-main leading-relaxed',
    numbered: 'text-base text-text-main leading-relaxed',
    checklist: `text-base leading-relaxed ${block.checked ? 'text-text-muted line-through' : 'text-text-main'}`,
    code: 'font-mono text-sm text-green-300 leading-relaxed',
    image: 'text-base text-text-main',
  }[block.type] || 'text-base text-text-main';

  if (block.type === 'image' && block.src) {
    return (
      <div className="group/block flex items-start space-x-2 relative py-1">
        <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col space-y-0.5 pt-1 shrink-0">
          <button onClick={() => onMoveUp(block.id)} className="text-text-muted/50 hover:text-text-muted p-0.5"><ChevronDown size={12} className="rotate-180" /></button>
          <GripVertical size={14} className="text-text-muted/30" />
          <button onClick={() => onMoveDown(block.id)} className="text-text-muted/50 hover:text-text-muted p-0.5"><ChevronDown size={12} /></button>
        </div>
        <div className="relative group/img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt || 'image'} className="max-w-full rounded-lg border border-node-border" style={{ maxHeight: 400 }} />
          <button
            className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-red-900/80 text-red-200 rounded px-2 py-1 text-xs"
            onClick={() => onDelete(block.id)}
          >Remove</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/block flex items-start space-x-2 relative py-0.5">
      {/* Move handles */}
      <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col space-y-0.5 pt-1 shrink-0 cursor-grab">
        <button onClick={() => onMoveUp(block.id)} className="text-text-muted/50 hover:text-text-muted p-0.5"><ChevronDown size={12} className="rotate-180" /></button>
        <GripVertical size={14} className="text-text-muted/30" />
        <button onClick={() => onMoveDown(block.id)} className="text-text-muted/50 hover:text-text-muted p-0.5"><ChevronDown size={12} /></button>
      </div>

      {/* Prefix (bullet, number, checkbox) */}
      {renderPrefix()}

      {/* Text area */}
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          className={`w-full bg-transparent border-none outline-none resize-none ${textClass} ${block.type === 'code' ? 'bg-[#111] rounded p-3 border border-node-border' : ''}`}
          value={block.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={block.type === 'image' ? handleImagePaste : undefined}
          placeholder={
            block.type === 'paragraph' ? "Type '/' for commands…" :
            block.type === 'heading1' ? 'Heading 1' :
            block.type === 'heading2' ? 'Heading 2' :
            block.type === 'heading3' ? 'Heading 3' :
            block.type === 'bullet' ? 'List item' :
            block.type === 'numbered' ? 'List item' :
            block.type === 'checklist' ? 'Todo item' :
            block.type === 'code' ? '// Code here…' :
            ''
          }
          rows={1}
          style={{ overflow: 'hidden' }}
          onInput={(e) => {
            const el = e.target as HTMLTextAreaElement;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
          }}
        />

        {/* Slash command menu */}
        {showMenu && filteredCommands.length > 0 && (
          <div data-block-menu="true" className="absolute top-full left-0 mt-1 w-72 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2 text-xs text-text-muted border-b border-[#333] px-3">Blocks</div>
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.type}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#2a2a2a] transition-colors text-left"
                onMouseDown={(e) => { e.preventDefault(); selectCommand(cmd.type); }}
              >
                <span className="text-text-muted shrink-0">{cmd.icon}</span>
                <div>
                  <div className="text-sm text-text-main">{cmd.label}</div>
                  <div className="text-xs text-text-muted">{cmd.desc}</div>
                </div>
              </button>
            ))}
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

  const focusMap = useRef<Map<string, HTMLElement>>(new Map());

  const handleBlockChange = useCallback((id: string, patch: Partial<Block>) => {
    const current = useStore.getState().nodes.find((n) => n.id === nodeId);
    if (!current || current.data.kind !== 'doc') return;
    const blocks = (current.data as DocNodeData).blocks.map((b) =>
      b.id === id ? { ...b, ...patch } : b
    );
    updateDocBlocks(nodeId, blocks);
  }, [nodeId, updateDocBlocks]);

  const handleAddAfter = useCallback((id: string, type: BlockType = 'paragraph') => {
    const current = useStore.getState().nodes.find((n) => n.id === nodeId);
    if (!current || current.data.kind !== 'doc') return;
    const blocks = [...(current.data as DocNodeData).blocks];
    const idx = blocks.findIndex((b) => b.id === id);
    const nb = newBlock(type);
    blocks.splice(idx + 1, 0, nb);
    updateDocBlocks(nodeId, blocks);
    setTimeout(() => {
      const el = focusMap.current?.get(nb.id) as HTMLTextAreaElement | undefined;
      el?.focus();
    }, 50);
  }, [nodeId, updateDocBlocks]);

  const handleDelete = useCallback((id: string) => {
    const current = useStore.getState().nodes.find((n) => n.id === nodeId);
    if (!current || current.data.kind !== 'doc') return;
    const blocks = (current.data as DocNodeData).blocks.filter((b) => b.id !== id);
    if (blocks.length === 0) blocks.push(newBlock());
    updateDocBlocks(nodeId, blocks);
  }, [nodeId, updateDocBlocks]);

  const handleMoveUp = useCallback((id: string) => {
    const current = useStore.getState().nodes.find((n) => n.id === nodeId);
    if (!current || current.data.kind !== 'doc') return;
    const blocks = [...(current.data as DocNodeData).blocks];
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx <= 0) return;
    [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
    updateDocBlocks(nodeId, blocks);
  }, [nodeId, updateDocBlocks]);

  const handleMoveDown = useCallback((id: string) => {
    const current = useStore.getState().nodes.find((n) => n.id === nodeId);
    if (!current || current.data.kind !== 'doc') return;
    const blocks = [...(current.data as DocNodeData).blocks];
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx >= blocks.length - 1) return;
    [blocks[idx + 1], blocks[idx]] = [blocks[idx], blocks[idx + 1]];
    updateDocBlocks(nodeId, blocks);
  }, [nodeId, updateDocBlocks]);

  // Capture phase Escape listener: guarantees Esc closes immediately without manual save button
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const slashMenu = document.querySelector('[data-block-menu="true"]');
        if (slashMenu) return; // let block command menu close first

        e.preventDefault();
        e.stopPropagation();
        closeOverlay();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [closeOverlay]);

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

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0d0d0d] text-text-main"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-[#222] shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-sm text-text-muted">Document</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-text-muted/70 bg-[#161616] px-2.5 py-1 rounded-full border border-[#252525]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Auto-saved</span>
          </div>
          <button
            onClick={closeOverlay}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#2e2e2e] text-xs text-text-muted hover:text-text-main transition-colors"
            title="Press Esc to close (auto-saved)"
          >
            <X size={14} />
            <kbd className="text-[10px] bg-[#2a2a2a] text-text-muted/80 px-1 py-0.5 rounded font-mono">Esc</kbd>
          </button>
        </div>
      </div>

      {/* Editor */}
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
          <div className="space-y-0">
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
                focusRef={focusMap}
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
              setTimeout(() => { (focusMap.current?.get(nb.id) as HTMLTextAreaElement | undefined)?.focus(); }, 50);
            }}
          >
            <Plus size={14} className="group-hover:text-accent" />
            <span>Add block</span>
          </button>
        </div>
      </div>
    </div>
  );
}
