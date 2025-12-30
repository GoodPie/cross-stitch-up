# Task Completion Checklist

## Before Committing

Run the following command to ensure code quality:

```bash
pnpm lint:fix && pnpm format
```

This will:
1. Run ESLint with auto-fix for code issues
2. Format code with Prettier (including Tailwind class sorting)

## CI/CD Checks

GitHub Actions runs on PRs to `main`:
- `pnpm lint` - ESLint check
- `pnpm format:check` - Prettier format check

Both must pass for PR to be mergeable.

## Testing

If E2E tests exist for the changed feature:
```bash
pnpm e2e-test
```

## Build Verification

For significant changes, verify production build:
```bash
pnpm build
```

## Security Considerations

When writing code, avoid:
- Command injection
- XSS vulnerabilities
- SQL injection
- Other OWASP top 10 issues

If insecure code is written, fix immediately.

## Over-Engineering Prevention

- Only make directly requested changes
- Keep solutions simple and focused
- Don't add features beyond what was asked
- Don't add comments/docstrings to unchanged code
- Delete unused code completely (no `_vars` or `// removed` comments)
