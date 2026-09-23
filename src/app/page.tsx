'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/ui/Layout';
import { useStore } from '@/store/useStore';
import { ReactFlowProvider } from '@xyflow/react';

export default function Home() {
  const loadWorkspace = useStore((s) => s.loadWorkspace);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Bootstrap from IndexedDB
    loadWorkspace().finally(() => setInitialized(true));
  }, [loadWorkspace]);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-sm text-text-muted">Loading workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <Layout />
    </ReactFlowProvider>
  );
}
