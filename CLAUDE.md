# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StitchMerge is a Next.js 16 application providing tools for cross stitch pattern work. The primary tool merges multi-page pattern PDFs into a single unified image.

See `plan.md` for the full product specification and feature requirements.

## Commands

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm lint     # Run ESLint
pnpm start    # Start production server
```

## Architecture

### Multi-Tool Structure

The app uses a route-based architecture for multiple tools:

```text
app/
  page.tsx                    # Landing page (tool selector)
  layout.tsx                  # Root layout with fonts/analytics
  (tools)/                    # Route group for tools
    layout.tsx                # Shared tool layout (header, footer)
    merge/
      page.tsx                # Merge tool page
      _components/            # Merge-specific components
        page-selector.tsx
        grid-canvas.tsx
        stitch-config-form.tsx
        results-state.tsx

components/
  ui/                         # shadcn/ui components
  shared/                     # Reusable tool components
    drop-zone.tsx
    processing-state.tsx
    page-thumbnail.tsx
    export-dialog.tsx
  layout/                     # Layout components
    header.tsx
    footer.tsx
    tool-card.tsx

lib/
  utils.ts                    # Tailwind cn() helper
  shared/                     # Shared utilities
    pdf-loader.ts             # PDF rendering to canvas
    types.ts                  # Shared types (PageRenderResult, ToolMetadata)
  export/                     # Export utilities
  tools/
    registry.ts               # Tool metadata for landing page
    merge/                    # Merge tool logic
      index.ts                # processSelectedPages()
      types.ts                # Merge-specific types
      grid-extractor.ts       # Grid detection algorithm
```

### Adding New Tools

1. Create `app/(tools)/[tool-name]/page.tsx`
2. Create `app/(tools)/[tool-name]/_components/`
3. Create `lib/tools/[tool-name]/`
4. Add entry to `lib/tools/registry.ts`

### State Flow (Merge Tool)

Uses a state machine pattern: `config → upload → selecting → processing → success/error`

- `config`: Enter pattern dimensions
- `upload`: Drag-and-drop PDF upload
- `selecting`: Arrange pages in grid layout
- `processing`: Extract and merge grids
- `success`: Preview with zoom, export options
- `error`: Error with retry

### UI Components

Uses shadcn/ui (new-york style) in `components/ui/`. Add new components via:

```bash
npx shadcn@latest add <component-name>
```

### Styling

- Tailwind CSS 4 with CSS variables for theming
- Font: DM Sans (body), Fraunces (headings via `font-serif`)
- Globals in `app/globals.css`

## Key Patterns

- **Client components**: Use `"use client"` directive for interactive components
- **Dynamic imports**: PDF processing uses dynamic imports to avoid SSR issues with pdfjs-dist
- **Privacy-first**: All processing happens client-side; files never leave the browser

### Authentication (Better Auth)

Use per-page auth checks for protected routes. This keeps auth logic co-located and allows granular control:

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Optional: check roles, permissions, etc.
    // if (session.user.role !== "admin") redirect("/unauthorized");

    return <PageContent user={session.user} />;
}
```
