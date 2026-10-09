'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { KanbanColumn, KanbanCard, KanbanNodeData } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  X, Plus, Trash2, Check, GripVertical, Copy, CheckCheck,
  Calendar, Palette, FileText, AlignLeft,
  Columns3, Flag, ArrowRight,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Board Theme Options
// ─────────────────────────────────────────────────────────────────────────────
export const BOARD_THEMES = [
  {
    id: 'cosmic',
    name: 'Cosmic Indigo',
    background: 'radial-gradient(circle at 20% 15%, #1e113a 0%, #0c0b16 55%, #06050a 100%)',
    accent: '#a78bfa',
    border: '#2e2548',
  },
  {
    id: 'emerald',
    name: 'Deep Emerald',
    background: 'radial-gradient(circle at 80% 20%, #0d291e 0%, #091712 55%, #040907 100%)',
    accent: '#34d399',
    border: '#1a3d2b',
  },
  {
    id: 'sunset',
    name: 'Sunset Nebula',
    background: 'radial-gradient(circle at 50% 15%, #2e1220 0%, #160a15 55%, #080409 100%)',
    accent: '#f43f5e',
    border: '#451e33',
  },
  {
    id: 'ocean',
    name: 'Midnight Ocean',
    background: 'radial-gradient(circle at 30% 20%, #0f253a 0%, #091522 55%, #05090e 100%)',
    accent: '#38bdf8',
    border: '#1a3750',
  },
  {
    id: 'amber',
    name: 'Amber Glow',
    background: 'radial-gradient(circle at 70% 15%, #2a1f0a 0%, #151006 55%, #080603 100%)',
    accent: '#fbbf24',
    border: '#423314',
  },
  {
    id: 'slate',
    name: 'Minimal Slate',
    background: 'linear-gradient(135deg, #181920 0%, #101014 50%, #09090b 100%)',
    accent: '#94a3b8',
    border: '#2a2b36',
  },
];

const CARD_COLORS = [
  { value: 'transparent', label: 'None', bg: '#2a2a2a' },
  { value: '#6366f1', label: 'Indigo', bg: '#6366f1' },
  { value: '#10b981', label: 'Emerald', bg: '#10b981' },
  { value: '#f59e0b', label: 'Amber', bg: '#f59e0b' },
  { value: '#ef4444', label: 'Rose', bg: '#ef4444' },
  { value: '#06b6d4', label: 'Cyan', bg: '#06b6d4' },
  { value: '#ec4899', label: 'Pink', bg: '#ec4899' },
  { value: '#8b5cf6', label: 'Purple', bg: '#8b5cf6' },
];

const PRIORITY_LEVELS: { id: 'low' | 'medium' | 'high' | 'urgent'; label: string; color: string; bg: string }[] = [
  { id: 'low', label: 'Low', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  { id: 'medium', label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  { id: 'high', label: 'High', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  { id: 'urgent', label: 'Urgent', color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Card Pop-up Modal (Trello-style detailed panel)
// ─────────────────────────────────────────────────────────────────────────────
interface CardDetailModalProps {
  card: KanbanCard;
  columnId: string;
  columns: KanbanColumn[];
  onUpdate: (patch: Partial<KanbanCard>) => void;
  onMove: (targetColId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function CardDetailModal({
  card,
  columnId,
  columns,
  onUpdate,
  onMove,
  onDuplicate,
  onDelete,
  onClose,
}: CardDetailModalProps) {
  const [newChecklistText, setNewChecklistText] = useState('');
  const [copiedDesc, setCopiedDesc] = useState(false);
  const currentColumn = columns.find((c) => c.id === columnId);

  const doneCount = (card.checklist || []).filter((it) => it.done).length;
  const totalCount = (card.checklist || []).length;
  const percentDone = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleCopyDescription = () => {
    const textToCopy = card.description?.trim() ? card.description : card.title;
    navigator.clipboard.writeText(textToCopy);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const handleAddCheckItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const checklist = [...(card.checklist || []), { id: uuidv4(), text: newChecklistText.trim(), done: false }];
    onUpdate({ checklist });
    setNewChecklistText('');
  };

  const toggleCheckItem = (itemId: string) => {
    const checklist = (card.checklist || []).map((it) =>
      it.id === itemId ? { ...it, done: !it.done } : it
    );
    onUpdate({ checklist });
  };

  const removeCheckItem = (itemId: string) => {
    const checklist = (card.checklist || []).filter((it) => it.id !== itemId);
    onUpdate({ checklist });
  };

  const updateCheckItem = (itemId: string, text: string) => {
    const checklist = (card.checklist || []).map((it) =>
      it.id === itemId ? { ...it, text } : it
    );
    onUpdate({ checklist });
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#14151f] border border-[#2a2c3f] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-text-main animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top color bar if card has a color */}
        {card.color && card.color !== 'transparent' && (
          <div className="h-2 w-full shrink-0" style={{ backgroundColor: card.color }} />
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-[#222436] shrink-0">
          <div className="flex-1 pr-4">
            <input
              className="w-full bg-transparent border-none outline-none text-xl font-bold text-text-main focus:bg-white/5 rounded px-2 py-1 -ml-2 transition-colors"
              value={card.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Card title"
            />
            <div className="flex items-center space-x-2 mt-1 text-xs text-text-muted">
              <span>in list</span>
              <span className="font-semibold text-text-main/90 bg-[#202234] px-2 py-0.5 rounded-md">
                {currentColumn?.title || 'Column'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#202234] hover:bg-[#2c2f48] text-text-muted hover:text-text-main transition-colors shrink-0"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Properties Row (Color, Priority, Due Date) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#191a27] border border-[#25273b]">
            {/* Color Tag */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted/70 block mb-2">
                Color Tag
              </span>
              <div className="flex items-center flex-wrap gap-1.5">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`w-5 h-5 rounded-full border transition-all hover:scale-125 ${
                      card.color === c.value ? 'ring-2 ring-accent ring-offset-2 ring-offset-[#14151f]' : 'border-white/10'
                    }`}
                    style={{ backgroundColor: c.bg }}
                    title={c.label}
                    onClick={() => onUpdate({ color: c.value })}
                  />
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted/70 block mb-2">
                Priority
              </span>
              <div className="flex items-center flex-wrap gap-1">
                {PRIORITY_LEVELS.map((p) => {
                  const isSelected = card.priority === p.id;
                  return (
                    <button
                      key={p.id}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                        isSelected
                          ? 'border border-white/40 shadow-sm scale-105'
                          : 'opacity-60 hover:opacity-100 border border-transparent'
                      }`}
                      style={{ backgroundColor: p.bg, color: p.color }}
                      onClick={() => onUpdate({ priority: isSelected ? undefined : p.id })}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted/70 block mb-2">
                Due Date
              </span>
              <div className="flex items-center space-x-1.5">
                <Calendar size={13} className="text-text-muted shrink-0" />
                <input
                  type="date"
                  className="bg-[#12131e] border border-[#2c2f45] rounded-md px-2 py-1 text-xs text-text-main outline-none focus:border-accent"
                  value={card.dueDate || ''}
                  onChange={(e) => onUpdate({ dueDate: e.target.value })}
                />
                {card.dueDate && (
                  <button
                    className="text-text-muted/40 hover:text-red-400 p-0.5"
                    onClick={() => onUpdate({ dueDate: undefined })}
                    title="Clear date"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-semibold text-text-main">
                <AlignLeft size={16} className="text-accent" />
                <span>Description</span>
              </div>
              <button
                onClick={handleCopyDescription}
                className="flex items-center space-x-1.5 text-xs text-text-muted hover:text-text-main bg-[#1e2030] hover:bg-[#282a40] px-2.5 py-1 rounded-lg transition-colors border border-[#2b2d42]"
                title="Copy description to clipboard"
              >
                {copiedDesc ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedDesc ? 'Copied!' : 'Copy description'}</span>
              </button>
            </div>
            <textarea
              className="w-full bg-[#181927] border border-[#26283d] rounded-xl p-3 text-sm text-text-main outline-none focus:border-accent transition-colors resize-y leading-relaxed min-h-[90px]"
              placeholder="Add detailed notes, links, or context for this card…"
              value={card.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Checklist Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-semibold text-text-main">
                <Check size={16} className="text-emerald-400" />
                <span>Checklist</span>
              </div>
              {totalCount > 0 && (
                <span className="text-xs font-mono text-text-muted">
                  {doneCount}/{totalCount} ({percentDone}%)
                </span>
              )}
            </div>

            {/* Visual Progress Bar */}
            {totalCount > 0 && (
              <div className="w-full bg-[#1c1e2e] h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${percentDone}%` }}
                />
              </div>
            )}

            {/* Checklist items list */}
            <div className="space-y-2">
              {(card.checklist || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-2.5 group/item bg-[#171825] border border-[#222438] rounded-lg px-3 py-2 hover:border-[#2f324c] transition-colors"
                >
                  <button
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#444] hover:border-emerald-400'
                    }`}
                    onClick={() => toggleCheckItem(item.id)}
                  >
                    {item.done && <Check size={10} />}
                  </button>
                  <input
                    className={`flex-1 bg-transparent border-none outline-none text-xs ${
                      item.done ? 'line-through text-text-muted/60' : 'text-text-main'
                    }`}
                    value={item.text}
                    onChange={(e) => updateCheckItem(item.id, e.target.value)}
                    placeholder="Checklist task…"
                  />
                  <button
                    className="opacity-0 group-hover/item:opacity-100 text-text-muted/40 hover:text-red-400 transition-opacity p-0.5"
                    onClick={() => removeCheckItem(item.id)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add checklist item form */}
            <form onSubmit={handleAddCheckItem} className="flex items-center space-x-2">
              <input
                className="flex-1 bg-[#171825] border border-[#26283d] rounded-lg px-3 py-1.5 text-xs text-text-main outline-none focus:border-accent"
                placeholder="Add checklist item… (Press Enter)"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#222438] hover:bg-[#2e314d] text-text-main text-xs rounded-lg transition-colors flex items-center space-x-1"
              >
                <Plus size={12} />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between p-4 px-6 bg-[#11121b] border-t border-[#222436] shrink-0 text-xs">
          {/* Move to another column */}
          <div className="flex items-center space-x-2">
            <span className="text-text-muted/70">Move to:</span>
            <select
              className="bg-[#1b1c2b] border border-[#2a2d42] rounded-lg px-2.5 py-1 text-xs text-text-main outline-none"
              value={columnId}
              onChange={(e) => onMove(e.target.value)}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onDuplicate}
              className="px-3 py-1.5 rounded-lg bg-[#1e2030] hover:bg-[#282a40] text-text-muted hover:text-text-main transition-colors border border-[#2b2d42]"
            >
              Duplicate
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 transition-colors border border-red-900/40 flex items-center space-x-1"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Tile Component (Clean, interactive card in column)
// ─────────────────────────────────────────────────────────────────────────────
function CardItem({
  card,
  onOpenModal,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  card: KanbanCard;
  onOpenModal: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const doneCount = (card.checklist || []).filter((it) => it.done).length;
  const totalCount = (card.checklist || []).length;
  const allDone = totalCount > 0 && doneCount === totalCount;

  const priorityMeta = PRIORITY_LEVELS.find((p) => p.id === card.priority);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = card.description?.trim() ? card.description : card.title;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="bg-[#181924]/90 border border-[#2b2d40] rounded-xl p-3 cursor-pointer hover:border-accent/60 hover:shadow-lg hover:shadow-accent/5 transition-all group/card relative select-none"
      style={{
        borderLeft: card.color && card.color !== 'transparent' ? `4px solid ${card.color}` : undefined,
      }}
      draggable
      onClick={onOpenModal}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Priority badge or due date tag if present */}
      {(priorityMeta || card.dueDate) && (
        <div className="flex items-center space-x-1.5 mb-2">
          {priorityMeta && (
            <span
              className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: priorityMeta.bg, color: priorityMeta.color }}
            >
              {priorityMeta.label}
            </span>
          )}
          {card.dueDate && (
            <span className="text-[10px] text-text-muted/80 flex items-center space-x-1 font-mono">
              <Calendar size={10} className="shrink-0" />
              <span>{card.dueDate.slice(5)}</span>
            </span>
          )}
        </div>
      )}

      {/* Main row: Grip + Text Title + Action Buttons all on the SAME LINE */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <GripVertical
            size={13}
            className="text-text-muted/30 group-hover/card:text-text-muted/70 shrink-0 cursor-grab active:cursor-grabbing transition-colors"
          />
          <span className="text-sm font-medium text-text-main leading-snug break-words flex-1">
            {card.title || 'Untitled card'}
          </span>
        </div>

        {/* Hover Quick Action Buttons: COPY & DELETE on the same line */}
        <div className="flex items-center space-x-1 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
          {/* Quick Copy Button */}
          <button
            className={`p-1 rounded text-xs transition-colors ${
              copied
                ? 'bg-emerald-950 text-emerald-300'
                : 'bg-[#25273b] hover:bg-[#343752] text-text-muted hover:text-text-main'
            }`}
            onClick={handleCopy}
            title={copied ? 'Copied description' : 'Copy description to clipboard'}
          >
            {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>

          {/* Quick Delete */}
          <button
            className="p-1 rounded bg-[#25273b] hover:bg-red-950/80 text-text-muted hover:text-red-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete card"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Card Badges Row (Description indicator & Checklist counter) */}
      {(Boolean(card.description?.trim()) || totalCount > 0) && (
        <div className="flex items-center space-x-3 mt-2.5 pt-2 border-t border-white/5 text-[11px] text-text-muted">
          {Boolean(card.description?.trim()) && (
            <div className="flex items-center space-x-1" title="Has description">
              <AlignLeft size={11} />
            </div>
          )}
          {totalCount > 0 && (
            <div
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded font-mono text-[10px] ${
                allDone ? 'bg-emerald-950/60 text-emerald-300 font-semibold' : 'text-text-muted'
              }`}
            >
              <Check size={10} className={allDone ? 'text-emerald-400' : 'text-text-muted/60'} />
              <span>
                {doneCount}/{totalCount}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column component (Frosted Glass Container)
// ─────────────────────────────────────────────────────────────────────────────
function ColumnView({
  col,
  onUpdateCol,
  onDeleteCol,
  onAddCard,
  onOpenCardModal,
  onDeleteCard,
  onDragCardStart,
  onDragCardOver,
  onDropCard,
}: {
  col: KanbanColumn;
  onUpdateCol: (patch: Partial<KanbanColumn>) => void;
  onDeleteCol: () => void;
  onAddCard: (title: string) => void;
  onOpenCardModal: (card: KanbanCard) => void;
  onDeleteCard: (cardId: string) => void;
  onDragCardStart: (colId: string, cardId: string) => void;
  onDragCardOver: (e: React.DragEvent, colId: string, cardId?: string) => void;
  onDropCard: (targetColId: string, targetCardId?: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingCard && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingCard]);

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) {
      setIsAddingCard(false);
      return;
    }
    onAddCard(newCardTitle.trim());
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  return (
    <div
      className="flex flex-col bg-[#13141d]/85 backdrop-blur-md rounded-2xl border border-white/10 min-w-[280px] max-w-[320px] shrink-0 shadow-2xl transition-all"
      onDragOver={(e) => onDragCardOver(e, col.id)}
      onDrop={() => onDropCard(col.id)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 shrink-0">
        {editingTitle ? (
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-text-main"
            value={col.title}
            onChange={(e) => onUpdateCol({ title: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false);
            }}
          />
        ) : (
          <h3
            className="text-sm font-semibold text-text-main cursor-text flex-1 truncate"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {col.title}
          </h3>
        )}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-text-muted bg-[#1e202e] rounded-full px-2 py-0.5 font-mono">
            {col.cards.length}
          </span>
          <button
            className="text-text-muted/40 hover:text-red-400 transition-colors p-1"
            onClick={onDeleteCol}
            title="Delete column"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[calc(100vh-250px)]">
        {col.cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onOpenModal={() => onOpenCardModal(card)}
            onDelete={() => onDeleteCard(card.id)}
            onDragStart={() => onDragCardStart(col.id, card.id)}
            onDragOver={(e) => {
              e.preventDefault();
              onDragCardOver(e, col.id, card.id);
            }}
            onDrop={() => onDropCard(col.id, card.id)}
          />
        ))}

        {/* Inline Add Card Form */}
        {isAddingCard ? (
          <form onSubmit={handleCreateCard} className="space-y-2 bg-[#181925] p-2.5 rounded-xl border border-accent/40">
            <input
              ref={inputRef}
              className="w-full bg-transparent border-none outline-none text-xs text-text-main placeholder-text-muted/50"
              placeholder="Enter card title…"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsAddingCard(false);
              }}
            />
            <div className="flex items-center space-x-1.5 pt-1">
              <button
                type="submit"
                className="px-2.5 py-1 bg-accent hover:bg-accent/80 text-white text-xs rounded-md font-medium transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="px-2 py-1 text-text-muted hover:text-text-main text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* Add Card Button */}
      {!isAddingCard && (
        <button
          className="flex items-center space-x-2 px-4 py-3 text-xs text-text-muted/60 hover:text-text-main hover:bg-white/5 transition-colors rounded-b-2xl border-t border-white/5"
          onClick={() => setIsAddingCard(true)}
        >
          <Plus size={14} />
          <span>Add card</span>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Kanban Board Overlay
// ─────────────────────────────────────────────────────────────────────────────
export function KanbanBoardOverlay({ nodeId }: { nodeId: string }) {
  const node = useStore((s) => s.nodes.find((n) => n.id === nodeId));
  const updateKanbanColumns = useStore((s) => s.updateKanbanColumns);
  const updateKanbanTitle = useStore((s) => s.updateKanbanTitle);
  const updateKanbanTheme = useStore((s) => s.updateKanbanTheme);
  const closeOverlay = useStore((s) => s.closeOverlay);

  const [activeModalCardId, setActiveModalCardId] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const dragSrc = useRef<{ colId: string; cardId: string } | null>(null);

  // Close overlay on Escape when no modal is open; isolate Delete / Backspace keys from canvas
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModalCardId) {
          setActiveModalCardId(null);
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        closeOverlay();
        return;
      }

      // Stop Delete and Backspace from propagating to canvas when pressed inside the overlay
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;
        if (!isInput) {
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [closeOverlay, activeModalCardId]);

  // Initialize with default columns if empty
  useEffect(() => {
    if (node && node.data.kind === 'kanban') {
      const d = node.data as KanbanNodeData;
      if (!d.columns || d.columns.length === 0) {
        updateKanbanColumns(nodeId, [
          { id: uuidv4(), title: 'To Do', cards: [] },
          { id: uuidv4(), title: 'In Progress', cards: [] },
          { id: uuidv4(), title: 'Done', cards: [] },
        ]);
      }
    }
  }, [nodeId, node, updateKanbanColumns]);

  if (!node || node.data.kind !== 'kanban') return null;
  const d = node.data as KanbanNodeData;

  const currentTheme = BOARD_THEMES.find((t) => t.id === d.theme) || BOARD_THEMES[0];

  const getColumns = () =>
    (useStore.getState().nodes.find((n) => n.id === nodeId)?.data as KanbanNodeData)?.columns || [];

  const setColumns = (cols: KanbanColumn[]) => updateKanbanColumns(nodeId, cols);

  const addColumn = () => {
    const cols = getColumns();
    setColumns([...cols, { id: uuidv4(), title: 'New Column', cards: [] }]);
  };

  const deleteColumn = (colId: string) => {
    setColumns(getColumns().filter((c) => c.id !== colId));
  };

  const updateColumn = (colId: string, patch: Partial<KanbanColumn>) => {
    setColumns(getColumns().map((c) => (c.id === colId ? { ...c, ...patch } : c)));
  };

  const addCard = (colId: string, title: string) => {
    const cols = getColumns();
    setColumns(
      cols.map((c) =>
        c.id === colId
          ? {
              ...c,
              cards: [
                ...c.cards,
                { id: uuidv4(), title, description: '', checklist: [] },
              ],
            }
          : c
      )
    );
  };

  const updateCard = (colId: string, cardId: string, patch: Partial<KanbanCard>) => {
    setColumns(
      getColumns().map((c) =>
        c.id === colId
          ? { ...c, cards: c.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)) }
          : c
      )
    );
  };

  const deleteCard = (colId: string, cardId: string) => {
    if (activeModalCardId === cardId) setActiveModalCardId(null);
    setColumns(
      getColumns().map((c) =>
        c.id === colId ? { ...c, cards: c.cards.filter((card) => card.id !== cardId) } : c
      )
    );
  };

  const moveCardToColumn = (cardId: string, fromColId: string, targetColId: string) => {
    if (fromColId === targetColId) return;
    const cols = getColumns();
    const fromCol = cols.find((c) => c.id === fromColId);
    if (!fromCol) return;
    const card = fromCol.cards.find((c) => c.id === cardId);
    if (!card) return;

    setColumns(
      cols.map((c) => {
        if (c.id === fromColId) {
          return { ...c, cards: c.cards.filter((cardItem) => cardItem.id !== cardId) };
        }
        if (c.id === targetColId) {
          return { ...c, cards: [...c.cards, card] };
        }
        return c;
      })
    );
  };

  const duplicateCard = (colId: string, card: KanbanCard) => {
    const cols = getColumns();
    const clonedCard: KanbanCard = {
      ...JSON.parse(JSON.stringify(card)),
      id: uuidv4(),
      title: `${card.title} (Copy)`,
    };
    setColumns(
      cols.map((c) =>
        c.id === colId ? { ...c, cards: [...c.cards, clonedCard] } : c
      )
    );
    setActiveModalCardId(clonedCard.id);
  };

  // Drag & drop handlers
  const handleDragStart = (colId: string, cardId: string) => {
    dragSrc.current = { colId, cardId };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColId: string, targetCardId?: string) => {
    if (!dragSrc.current) return;
    const { colId: srcColId, cardId: srcCardId } = dragSrc.current;
    dragSrc.current = null;

    const cols = getColumns();
    const srcCol = cols.find((c) => c.id === srcColId);
    if (!srcCol) return;
    const card = srcCol.cards.find((c) => c.id === srcCardId);
    if (!card) return;

    const newCols = cols.map((c) => {
      if (c.id === srcColId) return { ...c, cards: c.cards.filter((cardItem) => cardItem.id !== srcCardId) };
      return c;
    });

    setColumns(
      newCols.map((c) => {
        if (c.id === targetColId) {
          if (!targetCardId) return { ...c, cards: [...c.cards, card] };
          const idx = c.cards.findIndex((ca) => ca.id === targetCardId);
          const newCards = [...c.cards];
          newCards.splice(idx, 0, card);
          return { ...c, cards: newCards };
        }
        return c;
      })
    );
  };

  const columns = d.columns || [];

  // Find active modal card and its column
  let activeCard: KanbanCard | null = null;
  let activeColId: string | null = null;
  if (activeModalCardId) {
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === activeModalCardId);
      if (found) {
        activeCard = found;
        activeColId = col.id;
        break;
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col text-text-main transition-colors duration-500"
      style={{ background: currentTheme.background }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-3.5 border-b border-white/10 shrink-0 bg-black/40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <Columns3 size={18} style={{ color: currentTheme.accent }} />
          <input
            className="bg-transparent border-none outline-none text-lg font-bold text-text-main focus:bg-white/5 rounded px-2 py-0.5 -ml-2"
            value={d.title}
            onChange={(e) => updateKanbanTitle(nodeId, e.target.value)}
            placeholder="Board title"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-text-muted hover:text-text-main transition-colors"
              title="Change board background theme"
            >
              <Palette size={13} style={{ color: currentTheme.accent }} />
              <span>Theme: {currentTheme.name}</span>
            </button>

            {showThemePicker && (
              <div
                className="absolute top-full right-0 mt-2 w-52 bg-[#161724] border border-[#2c2e44] rounded-2xl p-2 shadow-2xl z-50 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted/60 px-2 py-1">
                  Board Background
                </div>
                {BOARD_THEMES.map((th) => (
                  <button
                    key={th.id}
                    className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors ${
                      th.id === currentTheme.id ? 'bg-white/15 text-text-main font-semibold' : 'hover:bg-white/5 text-text-muted'
                    }`}
                    onClick={() => {
                      updateKanbanTheme(nodeId, th.id);
                      setShowThemePicker(false);
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-sm"
                      style={{ background: th.background }}
                    />
                    <span>{th.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-text-muted/80 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Auto-saved</span>
          </div>

          <button
            onClick={closeOverlay}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-text-muted hover:text-text-main transition-colors"
            title="Press Esc to close"
          >
            <X size={14} />
            <kbd className="text-[10px] bg-white/10 text-text-muted/90 px-1 py-0.5 rounded font-mono">Esc</kbd>
          </button>
        </div>
      </div>

      {/* Board Columns Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex items-start space-x-5 p-8 h-full">
          {columns.map((col) => (
            <ColumnView
              key={col.id}
              col={col}
              onUpdateCol={(patch) => updateColumn(col.id, patch)}
              onDeleteCol={() => deleteColumn(col.id)}
              onAddCard={(title) => addCard(col.id, title)}
              onOpenCardModal={(card) => setActiveModalCardId(card.id)}
              onDeleteCard={(cardId) => deleteCard(col.id, cardId)}
              onDragCardStart={handleDragStart}
              onDragCardOver={handleDragOver}
              onDropCard={(targetColId, targetCardId) => handleDrop(targetColId, targetCardId)}
            />
          ))}

          {/* Add Column Button */}
          <button
            className="shrink-0 flex items-center space-x-2 px-5 py-3.5 rounded-2xl border-2 border-dashed border-white/15 hover:border-accent/80 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-main transition-all text-sm min-w-[200px] justify-center"
            onClick={addColumn}
          >
            <Plus size={16} />
            <span>Add column</span>
          </button>
        </div>
      </div>

      {/* Trello Card Detail Modal */}
      {activeCard && activeColId && (
        <CardDetailModal
          card={activeCard}
          columnId={activeColId}
          columns={columns}
          onUpdate={(patch) => updateCard(activeColId!, activeCard!.id, patch)}
          onMove={(targetColId) => moveCardToColumn(activeCard!.id, activeColId!, targetColId)}
          onDuplicate={() => duplicateCard(activeColId!, activeCard!)}
          onDelete={() => deleteCard(activeColId!, activeCard!.id)}
          onClose={() => setActiveModalCardId(null)}
        />
      )}
    </div>
  );
}
