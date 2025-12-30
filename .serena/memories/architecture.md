# Architecture

## Multi-Tool Structure

The app uses a route-based architecture for multiple independent tools:

```
app/(tools)/               # Route group with shared layout
  layout.tsx               # Shared header, footer
  merge/                   # Pattern merge tool
  threads/                 # Thread colors browser
  account/                 # User account (protected)
```

### Adding New Tools
1. Create `app/(tools)/[tool-name]/page.tsx`
2. Create `app/(tools)/[tool-name]/_components/`
3. Create `lib/tools/[tool-name]/`
4. Add entry to `lib/tools/registry.ts`

## Merge Tool State Machine

The merge tool uses a state machine pattern for its workflow:

```
config → upload → selecting → processing → success/error
```

| State | Description |
|-------|-------------|
| `config` | Enter pattern dimensions (rows × columns) |
| `upload` | Drag-and-drop PDF upload |
| `selecting` | Arrange pages in grid layout (uses @dnd-kit) |
| `processing` | Extract and merge grids |
| `success` | Preview with zoom, export options |
| `error` | Error with retry option |

## Thread Colors Algorithm

- Uses CIE76 color distance formula for similarity
- Implementation in `lib/tools/threads/color-utils.ts`
- Supports multiple brands: DMC, Anchor, Sullivans

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...all]` | ALL | Better Auth handler |
| `/api/threads` | GET | Thread colors with pagination (1hr cache) |

## Key Patterns

- **Client-side PDF**: Processing happens in browser, files never uploaded
- **Dynamic imports**: PDF library loaded dynamically to avoid SSR issues
- **Route groups**: `(auth)` and `(tools)` for layout organization
- **Tool registry**: Centralized tool metadata in `lib/tools/registry.ts`
