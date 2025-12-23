# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StitchMerge is a Next.js 16 application that merges multi-page cross stitch pattern PDFs into a single unified image. Users upload PDFs where patterns are split across multiple pages (e.g., 4 quadrants with coordinate markers), and the app combines them into one complete pattern.

See `plan.md` for the full product specification and feature requirements.

## Commands

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm lint     # Run ESLint
pnpm start    # Start production server
```

## Architecture

### App Structure (Next.js App Router)

- `app/` - Next.js app router pages and layouts
- `app/page.tsx` - Main page with state machine: upload → processing → success/error
- `app/layout.tsx` - Root layout with fonts (DM Sans, Fraunces) and Vercel Analytics

### State Flow

The main page uses a state machine pattern with `AppState` type:

- `upload`: Shows DropZone component
- `processing`: Shows ProcessingState with animated progress
- `success`: Shows ResultsState with preview and download options
- `error`: Shows error message with retry

### Key Components

- `components/drop-zone.tsx` - Drag-and-drop PDF upload
- `components/processing-state.tsx` - Animated processing indicator
- `components/results-state.tsx` - Pattern preview with zoom, download buttons
- `components/header.tsx` / `components/footer.tsx` - Layout chrome

### UI Components

Uses shadcn/ui (new-york style) in `components/ui/`. Add new components via:

```bash
npx shadcn@latest add <component-name>
```

### Utilities

- `lib/utils.ts` - Contains `cn()` helper for Tailwind class merging
- `hooks/` - Custom React hooks (use-mobile, use-toast)

### Styling

- Tailwind CSS 4 with CSS variables for theming
- Font: DM Sans (body), Fraunces (headings via `font-serif`)
- Globals in `app/globals.css`

## Implementation Notes

The current codebase has UI scaffolding with simulated processing. The actual PDF processing needs to be implemented:

1. **PDF Parsing**: Use `pdfjs-dist` to render pages to canvas
2. **Grid Detection**: Detect pattern boundaries using coordinate markers (10, 20, 30... on axes)
3. **Pattern Merging**: Combine grid sections on a unified canvas based on coordinates
4. **Export**: Generate PNG/PDF downloads from merged canvas

Pattern pages have axis labels indicating stitch positions. Skip non-pattern pages (cover, instructions, color key).
