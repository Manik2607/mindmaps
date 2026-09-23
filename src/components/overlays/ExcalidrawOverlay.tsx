'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { ExcalidrawNodeData } from '@/types';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
// eslint-disable-next-line @typescript-eslint/no-require-imports
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

  const handleClose = useCallback(async () => {
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

  // Escape key to close (only when Excalidraw itself doesn't have focus on a text field)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const active = document.activeElement;
        const inExcalidrawInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement;
        if (!inExcalidrawInput) handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
        <button
          onClick={handleClose}
          className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333] text-sm text-text-muted hover:text-text-main transition-colors"
        >
          <X size={14} />
          <span>Done</span>
        </button>
      </div>

      {/* Excalidraw canvas — must have explicit height for the canvas to measure its viewport */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, height: '100%' }}>
        <Excalidraw
          theme="dark"
          excalidrawAPI={(api) => {
            excalidrawAPIRef.current = api;
            try {
              api.updateScene({
                appState: {
                  theme: 'dark',
                  viewBackgroundColor: '#ffffff',
                },
              });
            } catch {
              // ignore
            }
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
