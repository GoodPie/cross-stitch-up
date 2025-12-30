# Suggested Commands

## Development
```bash
pnpm dev           # Start development server (http://localhost:3000)
pnpm build         # Production build
pnpm start         # Start production server
```

## Code Quality
```bash
pnpm lint          # Run ESLint
pnpm lint:fix      # Run ESLint with auto-fix
pnpm format        # Format code with Prettier
pnpm format:check  # Check formatting without changes
```

## Testing
```bash
pnpm e2e-test      # Run Playwright E2E tests
```

## Pre-Commit Workflow
```bash
pnpm lint:fix && pnpm format
```

## Add shadcn/ui Components
```bash
npx shadcn@latest add <component-name>
```

## Database Migrations
```bash
npx supabase db push
```

## System Commands (Darwin/macOS)
- `ls` - List directory contents
- `find` - Search for files
- `grep` - Search file contents
- `git` - Version control
