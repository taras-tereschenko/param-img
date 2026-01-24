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
bun run check      # Lint + format with auto-fix (run this FIRST)
```

**Verification workflow**: Always run `bun run check` first—it runs Prettier and ESLint with `--fix` to auto-fix issues. Then run `bun run lint` only if needed for remaining errors.

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

## Authentication & Payments

### Architecture

- **Better Auth** - User authentication (Google OAuth)
- **Drizzle ORM** - Type-safe database queries (Neon Postgres)
- **Polar** - Payment processing and credit metering

Users authenticate via Google OAuth through Better Auth. When they purchase credits, a Polar customer is created and linked to their Better Auth user record via `polarCustomerId`.

### Database

Uses Neon Postgres with Drizzle ORM. Run migrations with:

```bash
bunx drizzle-kit generate   # Generate migration files
bunx drizzle-kit migrate    # Apply migrations
bunx drizzle-kit studio     # Open Drizzle Studio
```

### Environment Variables

```env
# Database (Neon Postgres)
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=         # Random string for JWT signing
BETTER_AUTH_URL=            # http://localhost:3000 or production URL

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Polar (Payments and credit metering)
POLAR_ACCESS_TOKEN=
POLAR_ORGANIZATION_ID=
POLAR_WEBHOOK_SECRET=
POLAR_METER_ID=
POLAR_PRODUCT_STARTER_ID=
POLAR_PRODUCT_STANDARD_ID=
POLAR_PRODUCT_PRO_ID=

# Gemini API
GEMINI_API_KEY=

# Upstash (Rate Limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Web application**
6. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to your `.env`

## Coding Guidelines

### Strict Rules

- **NEVER use ESLint disable comments** (`eslint-disable`, `eslint-disable-next-line`, etc.)
- **NEVER use TypeScript ignore comments** (`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`)
- If lint/type errors occur, fix the actual code or refactor the approach

### TypeScript Best Practices

**NEVER use type casting** (`as Type`, `<Type>value`) - it bypasses TypeScript's safety and hides bugs.

Instead, use these safe alternatives:

1. **Type guards for runtime checks:**

   ```typescript
   // ❌ Bad: casting
   const name = value as string;

   // ✅ Good: type guard
   if (typeof value === "string") {
     const name = value; // TypeScript knows it's string
   }
   ```

2. **Zod for external/untrusted data** (API responses, localStorage, URL params):

   ```typescript
   // ❌ Bad: casting parsed JSON
   const data = JSON.parse(str) as UserData;

   // ✅ Good: Zod validation
   const UserSchema = z.object({ name: z.string(), age: z.number() });
   const result = UserSchema.safeParse(JSON.parse(str));
   if (result.success) {
     const data = result.data; // Fully typed and validated
   }
   ```

3. **Discriminated unions with type predicates:**

   ```typescript
   // ✅ Good: type predicate for complex checks
   function hasResponse(error: Error): error is Error & { response: Response } {
     return "response" in error && error.response instanceof Response;
   }
   ```

4. **Fix types at source** - if you need to cast, the type definition is wrong. Fix it upstream.

5. **Use `unknown` instead of `any`** - forces explicit narrowing:

   ```typescript
   // ❌ Bad
   function process(data: any) { ... }

   // ✅ Good
   function process(data: unknown) {
     if (typeof data === "object" && data !== null) { ... }
   }
   ```

6. **`satisfies` for type checking without widening:**
   ```typescript
   // ✅ Good: validates type while preserving literal types
   const config = { port: 3000 } satisfies ServerConfig;
   ```

### Preferences

- **Use Bun APIs** wherever possible (Bun.file, Bun.serve, Bun.password, etc.)
- Prefer Bun over Node.js APIs when alternatives exist
- **Use Zod schemas** as single source of truth for validated types
