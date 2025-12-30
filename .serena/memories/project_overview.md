# Cross Stitch-up - Project Overview

## Purpose

A Next.js application providing tools for cross stitch pattern work.

## Current Tools

1. **Pattern Merge Tool** (`/merge`) - Merges multi-page pattern PDFs into a single unified image
2. **Thread Colors Tool** (`/threads`) - Browse and search 1000+ thread colors from various brands (DMC, Anchor, Sullivans)
3. **Account Settings** (`/account`) - User profile management (protected route)

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4, CSS variables for theming
- **UI Components**: shadcn/ui (new-york style)
- **Fonts**: DM Sans (body), Fraunces (headings via `font-serif`)
- **Auth**: Better Auth with PostgreSQL storage
- **Database**: Supabase + PostgreSQL
- **Email**: Resend for transactional emails
- **Monitoring**: Sentry for error tracking
- **Drag-and-Drop**: @dnd-kit
- **PDF Processing**: pdfjs-dist (client-side only)

## Key Directories

```
app/
  (auth)/                     # Auth routes (login, register, etc.)
  (tools)/                    # Tool routes with shared layout
    merge/, threads/, account/
  api/                        # API routes
components/
  ui/                         # shadcn/ui components
  auth/                       # Auth-specific components
  shared/                     # Reusable tool components
  layout/                     # Header, footer, tool-card
lib/
  auth.ts, auth-client.ts     # Better Auth config
  supabase/                   # Supabase clients
  tools/                      # Tool-specific logic
    registry.ts               # Tool metadata for landing page
    merge/, threads/
```

## Privacy

- PDF processing happens client-side; files never leave the browser
- User data protected via authentication
