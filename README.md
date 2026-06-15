# MindMaps

MindMaps is a spatial thought-mapping canvas web app built with Next.js (App Router), TypeScript, Tailwind CSS, and React Flow. It is designed to be a fast, quiet, and frictionless tool for mapping out thoughts, similar to Excalidraw but optimized for text nodes and connections.

## Features

- **Infinite Canvas**: Fully zoomable and pannable canvas with no boundaries.
- **Premium Dark Aesthetic**: Carefully crafted dark mode utilizing `#0D0D0D` canvas, `#1E1E1E` nodes, and `DM Serif Display` typography.
- **Offline & Private**: Everything is saved automatically to your browser's `localStorage`. No accounts, no cloud sync, no tracking.
- **Inline Node Details**: Need to write more than a label? Press `Tab` when a node is selected (or while editing its label) to open a multi-line details text area right inside the node.
- **Export & Import**: Export your maps as pristine PNGs or raw JSON data. Import JSON files to resume your work later.
- **Global Search**: Instantly search across the current map and fly the camera directly to the matching node.
- **Undo / Redo History**: Powered by `zundo`, keep track of your last 50 actions effortlessly.

## Controls & Keyboard Shortcuts

MindMaps is heavily optimized for a frictionless workflow. Use the following controls to navigate and build:

### Mouse Controls
| Action | Mouse |
| :--- | :--- |
| **Create Node** | Double-click anywhere on the empty canvas. |
| **Edit Node Label** | Double-click an existing node to edit its text. |
| **Edit Node Details** | Double-click the details text below the label, or press `Tab` on the node. |
| **Connect Nodes** | Hover over a node, click and drag from the appearance of the N/S/E/W dots, and drop onto another node. |
| **Edit Connection Label** | Double-click an existing connection line. |
| **Pan Canvas** | Click and drag on empty canvas space (or hold `Space` and drag). |
| **Zoom Canvas** | Scroll wheel up/down. |
| **Group Selection** | Click and drag on empty canvas space while holding `Shift` to draw a selection rectangle. |

### Keyboard Shortcuts
| Action | Shortcut |
| :--- | :--- |
| **Undo** | `Cmd/Ctrl + Z` |
| **Redo** | `Cmd/Ctrl + Shift + Z` |
| **Select All** | `Cmd/Ctrl + A` |
| **Export PNG** | `Cmd/Ctrl + E` |
| **Search Nodes** | `/` (Forward Slash) |
| **Edit Node Details** | Press `Tab` while a node is selected or while editing its label. |
| **Delete Node/Edge** | `Backspace` or `Delete` (when selected) |
| **Deselect All** | `Escape` |

## Getting Started

First, install the dependencies if you haven't already:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start mapping your thoughts.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Canvas Rendering**: `@xyflow/react` (React Flow)
- **State Management**: `zustand` (with `zundo` for temporal history)
- **Icons**: `lucide-react`

## Deployment

MindMaps is built as a standard Next.js application and can be easily deployed to [Vercel](https://vercel.com) (the creators of Next.js), which provides the most seamless experience.

1. Push your code to a GitHub repository.
2. Log in to Vercel and click **Add New Project**.
3. Import your GitHub repository.
4. Leave all build settings as default (`npm run build`).
5. Click **Deploy**.

Because MindMaps relies entirely on `localStorage` for its database, there are absolutely no backend databases, environment variables, or authentication providers to configure! It will work out-of-the-box on any static or serverless hosting provider.
