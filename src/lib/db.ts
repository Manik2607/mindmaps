import { openDB, IDBPDatabase } from 'idb';
import { AppNode, AppEdge, Workspace } from '@/types';

const DB_NAME = 'flowy-workspace';
const DB_VERSION = 1;
const WORKSPACE_STORE = 'workspace';
const NODE_CONTENT_STORE = 'node_content';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(WORKSPACE_STORE)) {
          db.createObjectStore(WORKSPACE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(NODE_CONTENT_STORE)) {
          db.createObjectStore(NODE_CONTENT_STORE, { keyPath: 'nodeId' });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadWorkspace(): Promise<{ nodes: AppNode[]; edges: AppEdge[]; name: string } | null> {
  try {
    const db = await getDB();
    const workspace: Workspace | undefined = await db.get(WORKSPACE_STORE, 'main');
    if (!workspace) return null;
    return { nodes: workspace.nodes, edges: workspace.edges, name: workspace.name };
  } catch (e) {
    console.error('[db] loadWorkspace error', e);
    return null;
  }
}

export async function saveWorkspace(nodes: AppNode[], edges: AppEdge[], name: string): Promise<void> {
  try {
    const db = await getDB();
    const workspace: Workspace = {
      id: 'main',
      name,
      nodes,
      edges,
      updatedAt: Date.now(),
    };
    await db.put(WORKSPACE_STORE, workspace);
  } catch (e) {
    console.error('[db] saveWorkspace error', e);
  }
}

// Large content stored separately (e.g. base64 images, excalidraw elements)
// Not currently used separately — all content is in node data — but available for future use
export async function getNodeContent(nodeId: string): Promise<unknown> {
  const db = await getDB();
  const row = await db.get(NODE_CONTENT_STORE, nodeId);
  return row?.content ?? null;
}

export async function setNodeContent(nodeId: string, content: unknown): Promise<void> {
  const db = await getDB();
  await db.put(NODE_CONTENT_STORE, { nodeId, content });
}

export async function deleteNodeContent(nodeId: string): Promise<void> {
  const db = await getDB();
  await db.delete(NODE_CONTENT_STORE, nodeId);
}
