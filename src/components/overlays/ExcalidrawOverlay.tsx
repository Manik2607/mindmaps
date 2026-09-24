'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { ExcalidrawNodeData } from '@/types';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
import '@excalidraw/excalidraw/index.css';

// Lazy-load Excalidraw — ssr:false is critical (it uses browser APIs)
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full space-y-3 text-text-muted">
        <div className="w-6 h-6 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
        <span className="text-sm">Loading drawing board…</span>
      </div>
    ),
  }
);

export function ExcalidrawOverlay({ nodeId }: { nodeId: string }) {
  const node = useStore((s) => s.nodes.find((n) => n.id === nodeId));
  const updateExcalidrawData = useStore((s) => s.updateExcalidrawData);
  const closeOverlay = useStore((s) => s.closeOverlay);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawAPIRef = useRef<any>(null);
  const isClosingRef = useRef(false);

  const handleClose = useCallback(async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (excalidrawAPIRef.current) {
      try {
        const api = excalidrawAPIRef.current;
        const elements = api.getSceneElements();
        const appState = api.getAppState();

        // Generate thumbnail PNG
        let thumbnail: string | undefined;
        try {
          const { exportToBlob } = await import('@excalidraw/excalidraw');
          const blob = await exportToBlob({
            elements,
            appState: {
              ...appState,
              exportWithDarkMode: true,
              exportBackground: true,
              viewBackgroundColor: '#ffffff',
            },
            getDimensions: () => ({ width: 900, height: 600, scale: 1 }),
            files: api.getFiles(),
          });
          thumbnail = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (thumbErr) {
          console.warn('[ExcalidrawOverlay] thumbnail export failed:', thumbErr);
        }

        updateExcalidrawData(
          nodeId,
          Array.from(elements),
          { ...appState, theme: 'dark', viewBackgroundColor: '#ffffff' },
          thumbnail
        );
      } catch (e) {
        console.error('[ExcalidrawOverlay] save error', e);
      }
    }
    closeOverlay();
  }, [nodeId, updateExcalidrawData, closeOverlay]);

  // Capture phase Escape listener: guarantees Esc closes and saves even when Excalidraw canvas is active
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [handleClose]);

  if (!node || node.data.kind !== 'excalidraw') return null;
  const d = node.data as ExcalidrawNodeData;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#121212' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#222] shrink-0 bg-[#0d0d0d]">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-sm font-semibold text-text-main">{d.title || 'Drawing'}</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-text-muted/70 bg-[#161616] px-2.5 py-1 rounded-full border border-[#252525]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Auto-saved</span>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#2e2e2e] text-xs text-text-muted hover:text-text-main transition-colors"
            title="Press Esc to close (auto-saved)"
          >
            <X size={14} />
            <kbd className="text-[10px] bg-[#2a2a2a] text-text-muted/80 px-1 py-0.5 rounded font-mono">Esc</kbd>
          </button>
        </div>
      </div>

      {/* Excalidraw canvas */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, height: '100%' }}>
        <Excalidraw
          theme="dark"
          excalidrawAPI={(api) => {
            excalidrawAPIRef.current = api;
          }}
          initialData={{
            elements: d.elements ?? [],
            appState: {
              ...(d.appState ?? {}),
              theme: 'dark',
              viewBackgroundColor: '#ffffff',
            },
            scrollToContent: true,
          }}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: false,
              clearCanvas: true,
              export: { saveFileToDisk: true },
              loadScene: true,
              saveToActiveFile: false,
              toggleTheme: false,
              saveAsImage: true,
            },
          }}
        />
      </div>
    </div>
  );
}
