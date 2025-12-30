# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cross Stitch-up is a Next.js 16 application providing tools for cross stitch pattern work. The app currently offers:

- **Pattern Merge Tool** (`/merge`) - Merges multi-page pattern PDFs into a single unified image
- **Thread Colors Tool** (`/threads`) - Browse and search 1000+ thread colors from various brands (DMC, Anchor, Sullivans)
- **Account Settings** (`/account`) - User profile management (protected route)

See `plan.md` for the full product specification and feature requirements.

## Commands

```bash
pnpm dev           # Start development server
pnpm build         # Production build
pnpm start         # Start production server
pnpm lint          # Run ESLint
pnpm lint:fix      # Run ESLint with auto-fix
pnpm format        # Format code with Prettier
pnpm format:check  # Check formatting without changes
pnpm e2e-test      # Run Playwright E2E tests
```

## Linting & Formatting

Uses ESLint 9 (flat config) and Prettier with Tailwind plugin.

- **ESLint config**: `eslint.config.js` - includes rules for JS, JSON, Markdown, and CSS
- **Prettier config**: `.prettierrc` - uses Tailwind class sorting plugin
- **CI**: GitHub Actions runs both `lint` and `format:check` on PRs to `main`

Run `pnpm lint:fix && pnpm format` before committing to fix issues automatically.

## Architecture

### Multi-Tool Structure

The app uses a route-based architecture for multiple tools:

```text
app/
  page.tsx                    # Landing page (tool selector)
  layout.tsx                  # Root layout with fonts/analytics
  (auth)/                     # Auth route group
    login/                    # Login page
    register/                 # Registration page
    verify-email/             # Email verification
    forgot-password/          # Password recovery
    reset-password/           # Password reset
  (tools)/                    # Route group for tools
    layout.tsx                # Shared tool layout (header, footer)
    merge/                    # Pattern merge tool
      page.tsx
      _components/
    threads/                  # Thread colors browser
      page.tsx
      _components/
    account/                  # User account settings (protected)
      page.tsx
      _components/
  api/
    auth/[...all]/route.ts    # Better Auth catch-all handler
    threads/route.ts          # Thread colors API

components/
  ui/                         # shadcn/ui components
  auth/                       # Auth-specific components
    login-form.tsx
    register-form.tsx
    social-login.tsx
    user-menu.tsx
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
  auth.ts                     # Better Auth server config
  auth-client.ts              # Better Auth React client
  email.ts                    # Resend email utilities
  supabase/
    client.ts                 # Browser Supabase client
    server.ts                 # Server Supabase client
  shared/                     # Shared utilities
    pdf-loader.ts             # PDF rendering to canvas
    types.ts                  # Shared types
  export/                     # Export utilities
  tools/
    registry.ts               # Tool metadata for landing page
    merge/                    # Merge tool logic
      index.ts
      types.ts
      grid-extractor.ts
    threads/                  # Thread colors logic
      types.ts
      color-utils.ts          # Color distance, similarity algorithms

emails/                       # React Email templates
  verification-email.tsx
  reset-password-email.tsx

supabase/
  migrations/                 # Database migrations
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
- `selecting`: Arrange pages in grid layout (uses @dnd-kit for drag-and-drop)
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

## Database

### Supabase + PostgreSQL

The app uses Supabase for database and auth token storage:

- **Client**: `lib/supabase/client.ts` - Browser client with anon key (RLS enabled)
- **Server**: `lib/supabase/server.ts` - Server-side client
- **Migrations**: `supabase/migrations/` - SQL migration files

### Tables

- `thread_colours` - Thread color catalog with RGB/hex values, brand, color codes
- Better Auth tables (user, session, account, verification) - managed by Better Auth

### Running Migrations

Migrations are managed via Supabase CLI. Apply with:

```bash
npx supabase db push
```

## Authentication (Better Auth)

Uses [Better Auth](https://www.better-auth.com/) with PostgreSQL storage.

### Configuration

- **Server config**: `lib/auth.ts` - Providers, database, email settings
- **Client hooks**: `lib/auth-client.ts` - React hooks via `createAuthClient()`

### Features

- Email/password with email verification
- Google OAuth
- Password reset via email
- Session management

### Auth Pages

Located in `app/(auth)/`:

- `/login` - Email + Google OAuth login
- `/register` - Account creation with verification
- `/verify-email` - Email verification handler
- `/forgot-password` - Initiate password reset
- `/reset-password` - Complete password reset

### Protected Routes

Use per-page auth checks for protected routes:

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

    return <PageContent user={session.user} />;
}
```

### Client-Side Auth

```tsx
"use client";
import { authClient } from "@/lib/auth-client";

// Get session
const { data: session } = authClient.useSession();

// Sign out
await authClient.signOut();
```

## Email (Resend)

Transactional emails via [Resend](https://resend.com/):

- **Config**: `lib/email.ts`
- **Templates**: `emails/` directory (React Email components)
- **From address**: `Cross Stitch-up <noreply@crossstitchup.com>`

## API Routes

| Endpoint             | Method | Description                                             |
| -------------------- | ------ | ------------------------------------------------------- |
| `/api/auth/[...all]` | ALL    | Better Auth handler (login, register, session, etc.)    |
| `/api/threads`       | GET    | Thread colors with pagination, caching (1hr revalidate) |

## Monitoring (Sentry)

Error tracking via Sentry:

- **Server config**: `sentry.server.config.ts`
- **Edge config**: `sentry.edge.config.ts`
- **Client**: `instrumentation-client.ts`
- **Tunnel**: `/monitoring` route for bypassing ad blockers

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Better Auth
BETTER_AUTH_SECRET=          # Auth encryption secret
BETTER_AUTH_URL=             # App URL (http://localhost:3000)

# OAuth
GOOGLE_CLIENT_ID=            # Google OAuth client ID
GOOGLE_CLIENT_SECRET=        # Google OAuth secret

# Database
POSTGRES_URL=                # PostgreSQL connection string

# Supabase
NEXT_PUBLIC_SUPABASE_URL=    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key

# Email
RESEND_API_KEY=              # Resend API key

# Monitoring
SENTRY_AUTH_TOKEN=           # Sentry auth token (build-time)
```

## Key Patterns

- **Client components**: Use `"use client"` directive for interactive components
- **Dynamic imports**: PDF processing uses dynamic imports to avoid SSR issues with pdfjs-dist
- **Privacy-first**: PDF processing happens client-side; files never leave the browser
- **Drag-and-drop**: Uses @dnd-kit for accessible, mobile-friendly drag-and-drop
- **Color algorithms**: Thread similarity uses CIE76 color distance formula in `lib/tools/threads/color-utils.ts`

## Key Dependencies

| Package                 | Purpose                  |
| ----------------------- | ------------------------ |
| `better-auth`           | Authentication framework |
| `@supabase/supabase-js` | Database client          |
| `resend`                | Transactional email      |
| `@sentry/nextjs`        | Error monitoring         |
| `@dnd-kit/core`         | Drag-and-drop            |
| `pdfjs-dist`            | PDF parsing/rendering    |
| `recharts`              | Charts/graphs            |

## Active Technologies

- TypeScript 5.x with Next.js 16 (React 19) + React 19, Tailwind CSS 4, shadcn/ui (new-york style) (001-grid-creator)
- N/A (client-side only, no persistence for this iteration) (001-grid-creator)
- TypeScript 5.x with Next.js 16 (React 19) + React 19, Tailwind CSS 4, shadcn/ui (new-york style), HTML5 Canvas API (001-grid-creator)
