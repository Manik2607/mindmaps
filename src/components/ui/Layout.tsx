import React, { useState, useCallback } from 'react';
import { useStore, useTemporalStore } from '@/store/useStore';
import { Search, Map as MapIcon, Maximize, ZoomIn, ZoomOut, Download, Upload, Pencil } from 'lucide-react';
import { MindMapCanvas } from '@/components/canvas/MindMapCanvas';
import { Sidebar } from './Sidebar';
import { SearchModal } from './SearchModal';
import { useReactFlow } from '@xyflow/react';
import { toPng } from 'html-to-image';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const activeMapId = useStore((state) => state.activeMapId);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const loadMap = useStore((state) => state.loadMap);
  const createMap = useStore((state) => state.createMap);
  const renameMap = useStore((state) => state.renameMap);
  const mapsList = useStore((state) => state.mapsList);

  const activeMapName = mapsList.find(m => m.id === activeMapId)?.name || 'Home';
  
  const [isRenamingMap, setIsRenamingMap] = useState(false);
  const [mapNameInput, setMapNameInput] = useState('');

  const handleRenameSubmit = () => {
    if (mapNameInput.trim() && mapNameInput.trim() !== activeMapName) {
      renameMap(activeMapId, mapNameInput.trim());
    }
    setIsRenamingMap(false);
  };

  const { undo, redo } = useTemporalStore((state) => state);
  const { zoomIn, zoomOut, fitView, setNodes, getNodes } = useReactFlow();

  // Export as PNG
  const exportPng = useCallback(() => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    
    // Fit view first so everything is captured nicely
    fitView({ padding: 0.2, duration: 200 });

    setTimeout(() => {
      toPng(el, {
        backgroundColor: '#0D0D0D',
        width: el.scrollWidth,
        height: el.scrollHeight,
      }).then((dataUrl) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `mindmap-${activeMapId}.png`;
        a.click();
      });
    }, 300);
  }, [activeMapId, fitView]);

  // Export as JSON
  const exportJson = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${activeMapId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, activeMapId]);

  // Import from JSON
  const importJson = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.nodes && parsed.edges) {
          const newId = createMap(file.name.replace('.json', ''));
          loadMap(newId, file.name.replace('.json', ''));
          // Small delay to let Zustand update active map, then overwrite nodes/edges
          setTimeout(() => {
            useStore.setState({ nodes: parsed.nodes, edges: parsed.edges });
          }, 100);
        } else {
          alert('Invalid map format.');
        }
      } catch {
        alert('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  }, [createMap, loadMap]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
           (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSearchOpen(true);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportPng();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        // Select all nodes
        setNodes(getNodes().map(n => ({ ...n, selected: true })));
      }
      
      if (e.key === 'Escape') {
        // Deselect all
        setNodes(getNodes().map(n => ({ ...n, selected: false })));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, exportPng, setNodes, getNodes]);

  return (
    <div className="flex h-screen w-full relative overflow-hidden bg-canvas text-text-main font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Canvas Area */}
      <main className="flex-1 relative">
        <MindMapCanvas />
      </main>

      {/* Top Left Chrome */}
      <div className="absolute top-4 left-4 z-10 flex flex-col pointer-events-auto">
        <h1 className="text-xs font-semibold text-text-muted mb-1 select-none pointer-events-none">MindMaps</h1>
        {isRenamingMap ? (
          <input
            autoFocus
            className="bg-node-fill border border-accent text-text-main text-sm rounded px-2 py-1 outline-none min-w-[150px] shadow-lg"
            value={mapNameInput}
            onChange={(e) => setMapNameInput(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setIsRenamingMap(false);
            }}
          />
        ) : (
          <div 
            className="text-lg font-serif text-text-main cursor-text hover:text-accent transition-colors flex items-center space-x-2 group"
            onDoubleClick={() => {
              setMapNameInput(activeMapName);
              setIsRenamingMap(true);
            }}
            title="Double-click to rename"
          >
            <span>{activeMapName}</span>
            <span 
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
              onClick={() => {
                setMapNameInput(activeMapName);
                setIsRenamingMap(true);
              }}
            >
              <Pencil size={12} className="text-text-muted hover:text-accent" />
            </span>
          </div>
        )}
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-node-fill border border-node-border hover:border-node-border-hover transition-colors text-text-muted hover:text-text-main"
          title="Maps List"
        >
          <MapIcon size={18} />
        </button>
        <button 
          onClick={() => setSearchOpen(true)}
          className="p-2 rounded-md bg-node-fill border border-node-border hover:border-node-border-hover transition-colors text-text-muted hover:text-text-main"
          title="Search ( / )"
        >
          <Search size={18} />
        </button>
        <div className="w-px h-6 bg-node-border self-center mx-1" />
        <button 
          onClick={exportJson}
          className="p-2 rounded-md bg-node-fill border border-node-border hover:border-node-border-hover transition-colors text-text-muted hover:text-text-main"
          title="Export JSON"
        >
          <Download size={18} />
        </button>
        <label 
          className="p-2 rounded-md bg-node-fill border border-node-border hover:border-node-border-hover transition-colors text-text-muted hover:text-text-main cursor-pointer flex items-center justify-center"
          title="Import JSON"
        >
          <Upload size={18} />
          <input type="file" accept=".json" className="hidden" onChange={importJson} />
        </label>
        <div className="w-px h-6 bg-node-border self-center mx-1" />
        <button 
          onClick={() => fitView({ duration: 400 })}
          className="p-2 rounded-md bg-node-fill border border-node-border hover:border-node-border-hover transition-colors text-text-muted hover:text-text-main"
          title="Fit View"
        >
          <Maximize size={18} />
        </button>
        <button 
          onClick={() => zoomIn({ duration: 200 })}
          className="p-2 rounded-md bg-node-fill border border-node-border hover:border-node-border-hover transition-colors text-text-muted hover:text-text-main"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button 
          onClick={() => zoomOut({ duration: 200 })}
          className="p-2 rounded-md bg-node-fill border border-node-border hover:border-node-border-hover transition-colors text-text-muted hover:text-text-main"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
