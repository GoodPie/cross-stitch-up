# Code Conventions

## React/Next.js
- Use `"use client"` directive for interactive components
- Use dynamic imports for PDF processing to avoid SSR issues with pdfjs-dist
- Server components are the default; only use client components when necessary

## Component Organization
- shadcn/ui components in `components/ui/` (new-york style)
- Add new shadcn components via: `npx shadcn@latest add <component-name>`
- Tool-specific components in `app/(tools)/[tool-name]/_components/`
- Shared reusable components in `components/shared/`

## Styling
- Tailwind CSS 4 with CSS variables for theming
- Globals in `app/globals.css`
- Use `cn()` helper from `lib/utils.ts` for conditional classes

## File Naming
- Components: PascalCase (e.g., `PageThumbnail.tsx`)
- Utilities/hooks: kebab-case (e.g., `color-utils.ts`)
- Route folders: kebab-case (e.g., `forgot-password/`)

## TypeScript
- Strict typing enabled
- Types in dedicated `types.ts` files within each tool directory
- Shared types in `lib/shared/types.ts`

## Drag-and-Drop
- Use @dnd-kit for accessible, mobile-friendly drag-and-drop
- Pattern: sortable contexts with DnD sensors

## Authentication
- Protected routes use per-page auth checks
- Use `auth.api.getSession()` server-side
- Use `authClient.useSession()` client-side

## No Emojis
- Avoid emojis in code and documentation unless explicitly requested
