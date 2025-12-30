# PDF Processing Refactor - Server-Side Page Rendering

## Problem

Client-side crashes when processing 50+ page PDFs due to memory exhaustion. All pages rendered to canvas at 2.5x scale and stored in React state (800MB-1.2GB for large PDFs).

## Solution

Move PDF processing to server-side using **page rendering** (not embedded image extraction, since PDFs may be vector-based). Port the grid detection algorithm to run server-side with Sharp.

> **Validated**: PDFs don't always contain extractable embedded images. Server-side page rendering with mupdf-wasm handles both vector and raster PDFs.

---

## Architecture

```
Client                                 Server (Vercel Pro - 60s timeout)
------                                 ------------------------------------
1. Upload PDF ──────────────────────→ POST /api/merge/upload
                                         ├── Render pages with mupdf-wasm
                                         ├── Generate thumbnails (200px)
                                         └── Store in Vercel Blob
2. Receive thumbnails + URLs ←────── { jobId, pages: PageInfo[] }

3. User arranges pages (lightweight)

4. Merge request ───────────────────→ POST /api/merge/process
                                         ├── Fetch selected page images
                                         ├── Run grid detection (ported)
                                         ├── Crop axis numbers
                                         └── Merge with Sharp
5. Receive merged URL ←────────────── { resultUrl, previewUrl }

6. Cleanup request ─────────────────→ DELETE /api/merge/cleanup
                                         └── Remove all blobs for jobId
```

---

## New Dependencies

```bash
# Add
pnpm add @vercel/blob mupdf sharp nanoid

# Keep (evaluate removal after full migration)
# pdfjs-dist - may still be used for client-side preview
```

**Environment variable:**

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

---

## Files to Create

### 1. `lib/server/pdf-renderer.ts`

Render PDF pages to images using `mupdf-wasm`:

- `renderPdfPages(pdfBuffer, jobId)` → Renders all pages, uploads to Blob
- Returns `PageInfo[]` with thumbnail and full-res URLs
- Handles both vector and raster PDFs

### 2. `lib/server/grid-detector.ts`

**Port grid-extractor.ts algorithm to Sharp:**

- `detectGridBounds(imageBuffer, config)` → GridBounds
- `cropToGrid(imageBuffer, bounds)` → Buffer
- Uses Sharp's `raw()` for pixel access instead of canvas getImageData
- Preserves confidence scoring and fallback logic

### 3. `lib/server/image-merger.ts`

Merge images using `sharp`:

- `mergeImages(jobId, cells, gridConfig, overlapPixels)` → merged URL
- Uses `sharp().composite()` for grid arrangement
- Handles 3px overlap between adjacent grids

### 4. `lib/server/blob-storage.ts`

Vercel Blob utilities:

- `uploadImage(buffer, path)` → URL
- `deleteByPrefix(jobId)` → cleanup all job artifacts

### 5. `app/api/merge/upload/route.ts`

```typescript
export const maxDuration = 60;
// POST: FormData with PDF file
// Returns: { jobId, pages: PageInfo[], totalPages }
```

### 6. `app/api/merge/process/route.ts`

```typescript
export const maxDuration = 60;
// POST: { jobId, arrangement, stitchConfig }
// Returns: { resultUrl, previewUrl, dimensions }
```

### 7. `app/api/merge/cleanup/route.ts`

```typescript
// DELETE: { jobId }
// Returns: { deleted: number }
```

---

## Files to Modify

### `lib/shared/types.ts`

Add new server response type:

```typescript
// NEW - Server response type
export interface PageInfo {
    pageNumber: number;
    thumbnailUrl: string; // 200px thumbnail in Blob
    imageUrl: string; // Full resolution in Blob
    width: number;
    height: number;
}

// KEEP - For backward compatibility during migration
export interface PageRenderResult {
    pageNumber: number;
    canvas: HTMLCanvasElement; // DEPRECATED - remove after migration
    width: number;
    height: number;
}
```

### `lib/tools/merge/types.ts`

Change `HTMLCanvasElement` references to URLs:

```typescript
// CHANGE: GridCell
export interface GridCell {
    row: number;
    col: number;
    pageNumber: number;
    imageUrl: string; // Was: canvas: HTMLCanvasElement
}

// CHANGE: MergeResult
export interface MergeResult {
    resultUrl: string; // Was: canvas + imageUrl
    previewUrl: string; // New: smaller preview
    pagesMerged: number;
    dimensions: { width: number; height: number };
    originalFilename?: string;
}

// KEEP: DetectedGridPage (server-side only, uses Sharp buffers)
// KEEP: GridBounds, GridArrangement, StitchConfig, GridDetectionConfig
```

### `app/(tools)/merge/page.tsx`

- Replace `pdfPages: PageRenderResult[]` with `pages: PageInfo[]`
- Add `jobId: string` state
- Replace `loadAndRenderPdf()` with fetch to `/api/merge/upload`
- Replace `processSelectedPages()` with fetch to `/api/merge/process`
- Add cleanup on reset/unmount

### `app/(tools)/merge/_components/page-selector.tsx`

- Accept `PageInfo[]` instead of `PageRenderResult[]`
- Update `GridCell` creation to use `imageUrl`

### `components/shared/page-thumbnail.tsx`

- Accept `thumbnailUrl: string` prop
- Render `<Image src={thumbnailUrl} />` instead of canvas.toDataURL()
- Remove useMemo canvas conversion

### `app/(tools)/merge/_components/results-state.tsx`

- Use `resultUrl` from blob
- Download directly from blob URL

### `components/shared/export-dialog.tsx`

- Accept `imageUrl: string` and `dimensions` instead of canvas
- Fetch image for client-side resize if needed, or offer direct download

---

## Files to Delete (After Migration Complete)

| File                       | Lines | Reason                            |
| -------------------------- | ----- | --------------------------------- |
| `lib/shared/pdf-loader.ts` | ~50   | Replaced by server-side rendering |
| `lib/tools/merge/index.ts` | ~143  | Replaced by API calls             |

**PORT, don't delete:** `lib/tools/merge/grid-extractor.ts` (~1026 lines) → Port to `lib/server/grid-detector.ts`

---

## Implementation Phases

### Phase 1: Server Infrastructure

1. Install dependencies: `@vercel/blob`, `mupdf`, `sharp`, `nanoid`
2. Create `lib/server/blob-storage.ts`
3. Create `lib/server/pdf-renderer.ts`
4. Create API route: `app/api/merge/upload/route.ts`
5. Test: Upload PDF, verify thumbnails in Blob

### Phase 2: Grid Detection Port

1. Create `lib/server/grid-detector.ts`
    - Port `detectGridBoundaries()` algorithm
    - Use Sharp `raw()` for pixel access
    - Keep same confidence scoring logic
2. Create `lib/server/image-merger.ts`
3. Create API route: `app/api/merge/process/route.ts`
4. Test: Process pages, verify grid detection accuracy

### Phase 3: Type Updates

1. Add `PageInfo` to `lib/shared/types.ts`
2. Update `GridCell` in `lib/tools/merge/types.ts`
3. Update `MergeResult` in `lib/tools/merge/types.ts`

### Phase 4: Component Updates

1. Update `page-thumbnail.tsx` - URL-based rendering
2. Update `page-selector.tsx` - new props
3. Update `results-state.tsx` - blob URLs
4. Update `export-dialog.tsx` - URL-based export

### Phase 5: Page Integration

1. Refactor `app/(tools)/merge/page.tsx` - API-based flow
2. Add cleanup API call on reset/unmount
3. Create `app/api/merge/cleanup/route.ts`

### Phase 6: Cleanup

1. Delete `lib/shared/pdf-loader.ts`
2. Delete `lib/tools/merge/index.ts`
3. Evaluate removing `pdfjs-dist` dependency

---

## API Contracts

### POST `/api/merge/upload`

```typescript
// Request: FormData with 'file' field (PDF)

// Response
{
    jobId: string;
    pages: Array<{
        pageNumber: number;
        thumbnailUrl: string;
        imageUrl: string;
        width: number;
        height: number;
    }>;
    totalPages: number;
}
```

### POST `/api/merge/process`

```typescript
// Request
{
  jobId: string;
  arrangement: {
    rows: number;
    cols: number;
    cells: Array<{ row: number; col: number; pageNumber: number }>;
  };
  stitchConfig: { width: number; height: number };
  overlapPixels?: number; // Default: 3
}

// Response
{
  jobId: string;
  resultUrl: string;
  previewUrl: string;
  dimensions: { width: number; height: number };
}
```

### DELETE `/api/merge/cleanup`

```typescript
// Request
{
    jobId: string;
}

// Response
{
    deleted: number;
}
```

---

## Edge Cases

### PDFs with vector graphics

mupdf-wasm renders vectors to raster - handled automatically. No special handling needed.

### Large PDFs (100+ pages)

- Render pages in batches of 10 with progress updates
- Stream progress via response or polling endpoint
- 60s Vercel Pro timeout should handle most cases

### Orphaned blobs

- Set 1-hour TTL on blob uploads
- Cleanup endpoint for explicit deletion
- Consider cron job for stale job cleanup

### Grid detection fails

- Keep fallback to fixed margins (12% top/bottom, 8% left, 6% right)
- Return confidence score to client for user warning

---

## Testing Checklist

- [ ] Upload 50-page PDF without crash
- [ ] Upload 100-page PDF within 60s timeout
- [ ] Thumbnails display correctly in selector
- [ ] Grid detection accuracy matches current client-side
- [ ] Various row/col arrangements work
- [ ] Merged image quality matches current
- [ ] Export (PNG download) works
- [ ] Cleanup removes all blobs
- [ ] Error handling for invalid PDFs
- [ ] Memory usage on server stays bounded

---

## Validation Notes

**Changes from original plan:**

1. **Page rendering, not image extraction** - PDFs may be vector-based, so embedded image extraction doesn't work reliably
2. **Grid detection algorithm preserved** - Ported to Sharp instead of deleted
3. **mupdf-wasm instead of unpdf** - Better rendering quality for both vector and raster PDFs
4. **Vercel Pro 60s timeout** - No chunking needed for most cases
5. **Keep pdfjs-dist temporarily** - Evaluate removal after full migration
