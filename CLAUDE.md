# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Param Img is a privacy-first, offline-capable PWA that resizes photos for Instagram Stories (9:21 aspect ratio). All processing happens locally in the browser—no server uploads required.

## Development Commands

```bash
bun install        # Install dependencies
bun run dev        # Start dev server (port 3000)
bun run build      # Production build
bun run test       # Run Vitest
bun run lint       # Run ESLint
bun run format     # Run Prettier
bun run check      # Lint + format fixes
```

## Architecture

### Tech Stack
- React 19 + TypeScript 5.7 with TanStack Start (file-based routing)
- Tailwind CSS 4 + shadcn/ui components
- Vite 7.1 + Bun package manager
- Vite PWA Plugin + Workbox for service worker

### Data Flow

```
User Input (Files/Dropzone)
        ↓
useImageSetup (prepareProcessedImages)
        ↓
IndexedDB Storage (immediate save)
        ↓
useStoryResizerState (useReducer for UI state)
        ↓
CSSPreview (GPU-accelerated preview via CSS filters)
        ↓
useImageExport (Canvas 2D → PNG for final export)
        ↓
Download/Share APIs
```

### Key Design Decisions

1. **CSS Preview vs Canvas Export**: UI preview uses CSS `filter: blur()` for GPU-accelerated real-time feedback. Canvas 2D is only used for final PNG export. This replaced an earlier PixiJS implementation.

2. **Zero-Transfer IndexedDB**: Images are saved to IndexedDB immediately after preparation. The Share Target handler reads from IndexedDB instead of receiving data URLs, eliminating large transfers between contexts.

3. **State Management**: `useStoryResizerState` hook uses `useReducer` as central store for all UI state (images, background type, blur percent, scale, border radius, etc.).

### Core Components

- **StoryResizer** (`src/components/story-resizer/story-resizer.tsx`): Root orchestrator managing panels and export
- **ImageCarousel** (`src/components/story-resizer/image-carousel.tsx`): Embla-carousel gallery with dropzone
- **CSSPreview** (`src/components/story-resizer/css-preview.tsx`): Real-time GPU-accelerated preview
- **Panel Components**: BlurPanel, AmbientPanel, ColorPanel, ResizePanel for settings

### Canvas Processing

- `src/lib/canvas-core.ts`: Generic drawing functions (work with both HTMLCanvasElement and OffscreenCanvas)
- `src/lib/canvas-utils.ts`: High-level processing orchestration, exports `processImageForStory()`

### PWA Features

- `src/sw.ts`: Service Worker with Workbox precaching + Share Target handler
- `src/components/pwa/`: Install prompt, reload prompt, PWA context provider
- Share Target stores files in IndexedDB for the main app to retrieve

### Constants (src/lib/types.ts)

- `STORY_ASPECT_RATIO = 9 / 21` (0.428...)
- Scale range: 50% to 100%
- Blur percentage: 0-25% of shorter image dimension
- Border radius options: None, Small (2.5%), Medium (5%), Large (10%)
- Background types: blur, black, white, custom, ambient

## Export Strategies

The `useImageExport` hook implements multiple download strategies:
1. **File System Access API** (Desktop Chrome/Edge): True completion detection via `showSaveFilePicker`
2. **Blob URL Fallback** (Mobile/Safari): `createObjectURL` + anchor click
3. **Web Share API** (iOS/Android): `navigator.share({ files: [...] })`
