'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/ui/Layout';
import { useStore } from '@/store/useStore';
import { ReactFlowProvider } from '@xyflow/react';

export default function Home() {
  const loadMapsList = useStore((state) => state.loadMapsList);
  const loadMap = useStore((state) => state.loadMap);
  const createMap = useStore((state) => state.createMap);
  const activeMapId = useStore((state) => state.activeMapId);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Bootstrap from localStorage
    loadMapsList();
    // eslint-disable-next-line
    setInitialized(true);
  }, [loadMapsList]);

  useEffect(() => {
    if (!initialized) return;
    
    // If we just initialized and have no active map
    if (!activeMapId) {
      // Find the most recently updated map
      const mostRecent = useStore.getState().mapsList[0];
      if (mostRecent) {
        loadMap(mostRecent.id, mostRecent.name, false);
      } else {
        // No maps at all, create 'Home'
        const id = createMap('Home');
        loadMap(id, 'Home', false);
      }
    }
  }, [initialized, activeMapId, loadMap, createMap]);

  if (!initialized) return null; // Avoid hydration mismatch for localStorage data

  return (
    <ReactFlowProvider>
      <Layout />
    </ReactFlowProvider>
  );
}
