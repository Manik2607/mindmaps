'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useReactFlow } from '@xyflow/react';
import {
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  Pencil,
  Layers,
  Search,
  CheckCircle2,
} from 'lucide-react';

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface WorkspaceSwitcherProps {
  className?: string;
  variant?: 'topbar' | 'sidebar';
}

export function WorkspaceSwitcher({ variant = 'topbar' }: WorkspaceSwitcherProps) {
  const currentWorkspaceId = useStore((s) => s.currentWorkspaceId);
  const workspaceName = useStore((s) => s.workspaceName);
  const workspacesList = useStore((s) => s.workspacesList);
  const switchWorkspace = useStore((s) => s.switchWorkspace);
  const createNewWorkspace = useStore((s) => s.createNewWorkspace);
  const renameWorkspace = useStore((s) => s.renameWorkspace);
  const deleteWorkspace = useStore((s) => s.deleteWorkspace);
  const duplicateWorkspace = useStore((s) => s.duplicateWorkspace);

  const { fitView } = useReactFlow();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
        setIsCreating(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setEditingId(null);
        setIsCreating(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectWorkspace = async (id: string) => {
    if (id === currentWorkspaceId) {
      setIsOpen(false);
      return;
    }
    await switchWorkspace(id);
    setIsOpen(false);
    setTimeout(() => {
      fitView({ duration: 300, padding: 0.2 });
    }, 100);
  };

  const handleCreate = async () => {
    const name = newWorkspaceName.trim() || undefined;
    await createNewWorkspace(name);
    setIsCreating(false);
    setNewWorkspaceName('');
    setIsOpen(false);
    setTimeout(() => {
      fitView({ duration: 300, padding: 0.2 });
    }, 100);
  };

  const handleStartRename = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      renameWorkspace(editName.trim(), id);
    }
    setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (workspacesList.length <= 1) return;
    await deleteWorkspace(id);
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await duplicateWorkspace(id);
    setIsOpen(false);
    setTimeout(() => {
      fitView({ duration: 300, padding: 0.2 });
    }, 100);
  };

  const filteredWorkspaces = workspacesList.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger Button */}
      {variant === 'topbar' ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg transition-all ${
            isOpen
              ? 'bg-[#222] text-text-main ring-1 ring-accent/30'
              : 'hover:bg-[#1a1a1a] text-text-main'
          }`}
          title="Switch workspace"
        >
          <span className="text-sm font-semibold max-w-[180px] truncate">{workspaceName}</span>
          <ChevronDown
            size={13}
            className={`text-text-muted transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-accent' : ''
            }`}
          />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] border border-[#222] transition-colors group text-left"
          title="Switch workspace"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <Layers size={13} className="text-accent shrink-0" />
            <span className="text-xs font-semibold text-text-main truncate">{workspaceName}</span>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <span className="text-[10px] text-text-muted/60 bg-[#222] px-1.5 py-0.5 rounded font-mono">
              {workspacesList.length}
            </span>
            <ChevronDown size={12} className="text-text-muted group-hover:text-text-main transition-colors" />
          </div>
        </button>
      )}

      {/* Popover Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 bg-[#121212] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            variant === 'sidebar' ? 'left-0 w-60' : 'left-0 w-72'
          }`}
          style={{
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#222]">
            <div className="flex items-center space-x-2">
              <Layers size={13} className="text-accent" />
              <span className="text-xs font-semibold text-text-main">Workspaces</span>
              <span className="text-[10px] text-text-muted bg-[#1e1e1e] px-1.5 py-0.2 rounded-full">
                {workspacesList.length}
              </span>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-1 text-xs text-accent hover:text-accent/80 font-medium px-2 py-0.5 rounded hover:bg-accent/10 transition-colors"
              title="Create new workspace"
            >
              <Plus size={13} />
              <span>New</span>
            </button>
          </div>

          {/* New Workspace Inline Creator */}
          {isCreating && (
            <div className="p-2 border-b border-[#222] bg-[#161616]">
              <div className="flex items-center space-x-1.5">
                <input
                  autoFocus
                  className="flex-1 bg-[#0d0d0d] border border-accent text-text-main text-xs rounded-lg px-2.5 py-1.5 outline-none placeholder-text-muted/40"
                  placeholder="Workspace name…"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                />
                <button
                  onClick={handleCreate}
                  className="px-2.5 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/90 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Search if more than 3 workspaces */}
          {workspacesList.length > 3 && (
            <div className="px-2 py-1.5 border-b border-[#222]">
              <div className="flex items-center space-x-2 bg-[#181818] rounded-lg px-2.5 py-1 border border-[#262626]">
                <Search size={12} className="text-text-muted/50 shrink-0" />
                <input
                  className="w-full bg-transparent border-none outline-none text-xs text-text-main placeholder-text-muted/40"
                  placeholder="Filter workspaces…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Workspaces List */}
          <div className="max-h-64 overflow-y-auto py-1 px-1.5 space-y-0.5">
            {filteredWorkspaces.map((ws) => {
              const isActive = ws.id === currentWorkspaceId;
              const isEditing = editingId === ws.id;

              return (
                <div
                  key={ws.id}
                  onClick={() => !isEditing && handleSelectWorkspace(ws.id)}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-accent/15 border border-accent/30 text-text-main'
                      : 'hover:bg-[#1a1a1a] text-text-muted hover:text-text-main'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                    {isActive ? (
                      <CheckCircle2 size={14} className="text-accent shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-[#333] shrink-0 group-hover:border-[#555]" />
                    )}

                    {isEditing ? (
                      <input
                        autoFocus
                        className="flex-1 bg-[#1e1e1e] border border-accent text-text-main text-xs rounded px-1.5 py-0.5 outline-none"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => handleSaveRename(ws.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(ws.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`text-xs font-medium truncate ${
                              isActive ? 'text-text-main font-semibold' : ''
                            }`}
                          >
                            {ws.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted/60 block">
                          {ws.nodeCount || 0} nodes • {formatTimeAgo(ws.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions on hover */}
                  {!isEditing && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => handleStartRename(e, ws.id, ws.name)}
                        className="p-1 rounded hover:bg-[#2a2a2a] text-text-muted hover:text-text-main transition-colors"
                        title="Rename"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(e, ws.id)}
                        className="p-1 rounded hover:bg-[#2a2a2a] text-text-muted hover:text-text-main transition-colors"
                        title="Duplicate"
                      >
                        <Copy size={11} />
                      </button>
                      {workspacesList.length > 1 && (
                        <button
                          onClick={(e) => handleDelete(e, ws.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
                          title="Delete workspace"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredWorkspaces.length === 0 && (
              <p className="text-center text-xs text-text-muted/40 py-4">No workspaces found</p>
            )}
          </div>

          {/* Footer: Create Workspace Shortcut */}
          <div className="p-1.5 border-t border-[#222] mt-1">
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222] text-xs text-text-muted hover:text-text-main transition-colors border border-[#2a2a2a]"
            >
              <Plus size={12} />
              <span>Create Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
