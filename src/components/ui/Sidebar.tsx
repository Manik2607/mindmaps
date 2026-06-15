import React from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Trash2, X } from 'lucide-react';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const mapsList = useStore((state) => state.mapsList);
  const activeMapId = useStore((state) => state.activeMapId);
  const createMap = useStore((state) => state.createMap);
  const loadMap = useStore((state) => state.loadMap);
  const deleteMap = useStore((state) => state.deleteMap);

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-[#151515] border-r border-[#222] transform transition-transform duration-300 z-50 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#222]">
        <h2 className="text-sm font-semibold text-text-main">Your Maps</h2>
        <button onClick={onClose} className="text-text-muted hover:text-text-main">
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        <button
          onClick={() => {
            const id = createMap('New Map');
            loadMap(id, 'New Map', false);
          }}
          className="w-full flex items-center justify-center space-x-2 py-2 bg-node-fill hover:bg-[#2A2A2A] text-text-main rounded-md border border-[#333] transition-colors text-sm"
        >
          <Plus size={16} />
          <span>New Map</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {mapsList.map((map) => (
          <div
            key={map.id}
            className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
              activeMapId === map.id ? 'bg-[#2A2A2A] text-text-main' : 'hover:bg-[#1E1E1E] text-text-muted'
            }`}
            onClick={() => loadMap(map.id, map.name, false)}
          >
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm">{map.name}</span>
              <span className="text-[10px] opacity-50">
                {new Date(map.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete map "${map.name}"?`)) {
                  deleteMap(map.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {mapsList.length === 0 && (
          <div className="text-xs text-text-muted text-center mt-4">
            No maps yet.
          </div>
        )}
      </div>
    </div>
  );
}
