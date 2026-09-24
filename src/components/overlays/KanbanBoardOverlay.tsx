'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { KanbanColumn, KanbanCard, KanbanNodeData } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { X, Plus, Trash2, Check, GripVertical } from 'lucide-react';

const CARD_COLORS = [
  'transparent', '#4A2B2B', '#4A3B22', '#2C3B2C', '#2B344A', '#3A2B4A',
];

// ─────────────────────────────────────────────────────────────────────────────
// Card component
// ─────────────────────────────────────────────────────────────────────────────
function CardItem({
  card,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  card: KanbanCard;
  onUpdate: (patch: Partial<KanbanCard>) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const toggleCheckItem = (itemId: string) => {
    const checklist = (card.checklist || []).map((it) =>
      it.id === itemId ? { ...it, done: !it.done } : it
    );
    onUpdate({ checklist });
  };

  const addCheckItem = () => {
    const checklist = [...(card.checklist || []), { id: uuidv4(), text: '', done: false }];
    onUpdate({ checklist });
  };

  const updateCheckItem = (itemId: string, text: string) => {
    const checklist = (card.checklist || []).map((it) =>
      it.id === itemId ? { ...it, text } : it
    );
    onUpdate({ checklist });
  };

  const removeCheckItem = (itemId: string) => {
    const checklist = (card.checklist || []).filter((it) => it.id !== itemId);
    onUpdate({ checklist });
  };

  return (
    <div
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#3a3a3a] transition-all group/card"
      style={{ borderLeft: card.color && card.color !== 'transparent' ? `3px solid ${card.color}` : undefined }}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-start justify-between space-x-2">
        <GripVertical size={12} className="text-text-muted/30 mt-0.5 shrink-0" />
        {editingTitle ? (
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-main"
            value={card.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
          />
        ) : (
          <span
            className="flex-1 text-sm text-text-main cursor-text"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {card.title || 'Untitled card'}
          </span>
        )}
        <div className="flex items-center space-x-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button
            className="text-text-muted/50 hover:text-text-main p-0.5"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '−' : '+'}
          </button>
          <button
            className="text-text-muted/50 hover:text-red-400 p-0.5"
            onClick={onDelete}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-[#2a2a2a] pt-3">
          {/* Description */}
          <textarea
            className="w-full bg-[#111] border border-[#2a2a2a] rounded p-2 text-xs text-text-muted outline-none resize-none focus:border-accent transition-colors"
            placeholder="Add description…"
            rows={2}
            value={card.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />

          {/* Color labels */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-text-muted/50 mr-1">Color:</span>
            {CARD_COLORS.map((c) => (
              <button
                key={c}
                className={`w-4 h-4 rounded-full border transition-transform hover:scale-110 ${card.color === c ? 'ring-2 ring-accent' : 'border-[#333]'}`}
                style={{ backgroundColor: c === 'transparent' ? '#333' : c }}
                onClick={() => onUpdate({ color: c })}
              />
            ))}
          </div>

          {/* Checklist */}
          <div className="space-y-1">
            {(card.checklist || []).map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <button
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${item.done ? 'bg-accent border-accent' : 'border-[#444] hover:border-accent'}`}
                  onClick={() => toggleCheckItem(item.id)}
                >
                  {item.done && <Check size={9} className="text-white" />}
                </button>
                <input
                  className={`flex-1 bg-transparent border-none outline-none text-xs ${item.done ? 'line-through text-text-muted' : 'text-text-main'}`}
                  value={item.text}
                  onChange={(e) => updateCheckItem(item.id, e.target.value)}
                  placeholder="Checklist item…"
                />
                <button className="text-text-muted/40 hover:text-red-400" onClick={() => removeCheckItem(item.id)}>
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              className="flex items-center space-x-1 text-xs text-text-muted/40 hover:text-accent transition-colors"
              onClick={addCheckItem}
            >
              <Plus size={10} />
              <span>Add item</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column component
// ─────────────────────────────────────────────────────────────────────────────
function ColumnView({
  col,
  onUpdateCol,
  onDeleteCol,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onDragCardStart,
  onDragCardOver,
  onDropCard,
}: {
  col: KanbanColumn;
  onUpdateCol: (patch: Partial<KanbanColumn>) => void;
  onDeleteCol: () => void;
  onAddCard: () => void;
  onUpdateCard: (cardId: string, patch: Partial<KanbanCard>) => void;
  onDeleteCard: (cardId: string) => void;
  onDragCardStart: (colId: string, cardId: string) => void;
  onDragCardOver: (e: React.DragEvent, colId: string, cardId?: string) => void;
  onDropCard: (targetColId: string, targetCardId?: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <div
      className="flex flex-col bg-[#141414] rounded-xl border border-[#222] min-w-[280px] max-w-[320px] shrink-0"
      onDragOver={(e) => onDragCardOver(e, col.id)}
      onDrop={() => onDropCard(col.id)}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
        {editingTitle ? (
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-text-main"
            value={col.title}
            onChange={(e) => onUpdateCol({ title: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
          />
        ) : (
          <h3
            className="text-sm font-semibold text-text-main cursor-text flex-1"
            onDoubleClick={() => setEditingTitle(true)}
          >
            {col.title}
          </h3>
        )}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-muted bg-[#222] rounded-full px-2 py-0.5">{col.cards.length}</span>
          <button
            className="text-text-muted/40 hover:text-red-400 transition-colors"
            onClick={onDeleteCol}
            title="Delete column"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100vh - 240px)' }}>
        {col.cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onUpdate={(patch) => onUpdateCard(card.id, patch)}
            onDelete={() => onDeleteCard(card.id)}
            onDragStart={() => onDragCardStart(col.id, card.id)}
            onDragOver={(e) => { e.preventDefault(); onDragCardOver(e, col.id, card.id); }}
            onDrop={() => onDropCard(col.id, card.id)}
          />
        ))}
      </div>

      {/* Add card */}
      <button
        className="flex items-center space-x-2 px-4 py-3 text-sm text-text-muted/50 hover:text-text-muted hover:bg-[#1a1a1a] transition-colors rounded-b-xl border-t border-[#222]"
        onClick={onAddCard}
      >
        <Plus size={14} />
        <span>Add card</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main overlay
// ─────────────────────────────────────────────────────────────────────────────
export function KanbanBoardOverlay({ nodeId }: { nodeId: string }) {
  const node = useStore((s) => s.nodes.find((n) => n.id === nodeId));
  const updateKanbanColumns = useStore((s) => s.updateKanbanColumns);
  const updateKanbanTitle = useStore((s) => s.updateKanbanTitle);
  const closeOverlay = useStore((s) => s.closeOverlay);

  const dragSrc = useRef<{ colId: string; cardId: string } | null>(null);

  // Capture phase Escape listener: guarantees Esc closes immediately without manual save button
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeOverlay();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [closeOverlay]);

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

  const addCard = (colId: string) => {
    const cols = getColumns();
    setColumns(cols.map((c) =>
      c.id === colId
        ? { ...c, cards: [...c.cards, { id: uuidv4(), title: '', description: '', checklist: [] }] }
        : c
    ));
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
    setColumns(
      getColumns().map((c) =>
        c.id === colId ? { ...c, cards: c.cards.filter((card) => card.id !== cardId) } : c
      )
    );
  };

  // Drag & drop
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
      if (c.id === srcColId) return { ...c, cards: c.cards.filter((card) => card.id !== srcCardId) };
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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0d0d0d] text-text-main">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-[#222] shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <input
            className="bg-transparent border-none outline-none text-lg font-semibold text-text-main"
            value={d.title}
            onChange={(e) => updateKanbanTitle(nodeId, e.target.value)}
            placeholder="Board title"
          />
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-text-muted/70 bg-[#161616] px-2.5 py-1 rounded-full border border-[#252525]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex items-start space-x-4 p-8 h-full">
          {columns.map((col) => (
            <ColumnView
              key={col.id}
              col={col}
              onUpdateCol={(patch) => updateColumn(col.id, patch)}
              onDeleteCol={() => deleteColumn(col.id)}
              onAddCard={() => addCard(col.id)}
              onUpdateCard={(cardId, patch) => updateCard(col.id, cardId, patch)}
              onDeleteCard={(cardId) => deleteCard(col.id, cardId)}
              onDragCardStart={handleDragStart}
              onDragCardOver={handleDragOver}
              onDropCard={(targetColId, targetCardId) => handleDrop(targetColId, targetCardId)}
            />
          ))}

          {/* Add column */}
          <button
            className="shrink-0 flex items-center space-x-2 px-5 py-3 rounded-xl border-2 border-dashed border-[#2a2a2a] hover:border-accent text-text-muted hover:text-accent transition-all text-sm min-w-[180px] justify-center"
            onClick={addColumn}
          >
            <Plus size={16} />
            <span>Add column</span>
          </button>
        </div>
      </div>
    </div>
  );
}
