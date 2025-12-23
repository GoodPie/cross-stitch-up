# Grid Detection Algorithm

This document describes how `grid-extractor.ts` detects and extracts the cross-stitch pattern grid from PDF page renders.

## Overview

Cross-stitch pattern PDFs typically have a grid area surrounded by:

- Axis labels (stitch numbers: 10, 20, 30...)
- Page margins and headers
- Border lines delineating the grid

The algorithm detects the black border lines surrounding the grid and crops to inside them, removing axis numbers and margins.

## Code Structure

The module is organized into logical sections:

```
┌─────────────────────────────────────────────────────┐
│ 1. CONSTANTS                                        │
│    CONFIDENCE, ALIGNMENT, LINE_DETECTION,           │
│    CORNER, GRID_SPACING                             │
├─────────────────────────────────────────────────────┤
│ 2. TYPES                                            │
│    ScanDirection, DarkRun, LineCandidate,           │
│    ImageContext, DetectedBorders, etc.              │
├─────────────────────────────────────────────────────┤
│ 3. PIXEL ANALYSIS                                   │
│    createImageContext(), isDarkPixel()              │
├─────────────────────────────────────────────────────┤
│ 4. LINE DETECTION                                   │
│    findLongestDarkRun(), measureLineThickness(),    │
│    calculateLineConfidence(), findBorderCandidates()│
├─────────────────────────────────────────────────────┤
│ 5. BORDER FINDING                                   │
│    findHorizontalBorders(), findVerticalBorders(),  │
│    findVerticalBorderNear(), resolveVerticalBorders()│
├─────────────────────────────────────────────────────┤
│ 6. VALIDATION                                       │
│    verifyCorner(), validateCorners(),               │
│    checkBorderAlignment()                           │
├─────────────────────────────────────────────────────┤
│ 7. INTERNAL GRID LINE DETECTION                     │
│    findInternalGridLines(), analyzeGridLineSpacing()│
├─────────────────────────────────────────────────────┤
│ 8. CONFIDENCE SCORING                               │
│    calculateOverallConfidence(),                    │
│    calculateGridLineConfidence()                    │
├─────────────────────────────────────────────────────┤
│ 9. PUBLIC API                                       │
│    extractGridArea(), extractGridWithoutAxisNumbers()│
│    cropToGrid(), drawDebugBounds(),                 │
│    detectGridBoundaries()                           │
└─────────────────────────────────────────────────────┘
```

## Detection Pipeline

```
┌─────────────────┐
│  Render PDF     │
│  page to canvas │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Create         │
│  ImageContext   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Find horizontal│ ◄── Scan top/bottom regions for long dark runs
│  borders        │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Find vertical  │ ◄── Use horizontal line endpoints as guide
│  borders        │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Resolve        │ ◄── Create synthetic borders if needed
│  vertical       │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Validate       │ ◄── Check alignment and corners
└────────┬────────┘
         ▼
┌─────────────────┐
│  Calculate      │ ◄── Weighted confidence score
│  confidence     │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Return bounds  │
│  or fallback    │
└─────────────────┘
```

## Key Types

### ImageContext

Bundles image data for analysis:

```typescript
interface ImageContext {
  data: Uint8ClampedArray; // RGBA pixel data
  width: number;
  height: number;
  config: GridDetectionConfig;
}
```

### LineCandidate

Represents a detected border line:

```typescript
interface LineCandidate {
  position: number; // Row (y) for horizontal, column (x) for vertical
  runStart: number; // Where the dark run starts
  runLength: number; // Length of the dark run
  thickness: number; // Adjacent rows/cols with similar runs
  confidence: number; // Score (0-1)
}
```

### DetectedBorders

All four borders of the grid:

```typescript
interface DetectedBorders {
  top: LineCandidate;
  bottom: LineCandidate;
  left: LineCandidate;
  right: LineCandidate;
}
```

## Constants

All magic numbers are centralized in typed constant objects:

### CONFIDENCE

Weights and thresholds for scoring:
| Constant | Value | Description |
|----------|-------|-------------|
| `LENGTH_WEIGHT` | 0.6 | Weight for line length in confidence |
| `THICKNESS_WEIGHT` | 0.4 | Weight for line thickness |
| `MIN_CANDIDATE` | 0.4 | Minimum confidence for border candidates |
| `MIN_OVERALL` | 0.35 | Minimum overall confidence to accept |
| `BORDER_WEIGHT` | 0.3 | Weight of border confidence in final score |
| `CORNER_WEIGHT` | 0.25 | Weight of corner validation |
| `ALIGNMENT_WEIGHT` | 0.25 | Weight of alignment score |
| `GRID_LINE_WEIGHT` | 0.2 | Weight of internal grid regularity |

### ALIGNMENT

Tolerances for border alignment:
| Constant | Value | Description |
|----------|-------|-------------|
| `WELL_ALIGNED_PX` | 15 | Pixels for "well aligned" top/bottom |
| `ACCEPTABLE_PX` | 30 | Pixels for "acceptable" alignment |
| `BORDER_TOLERANCE_PX` | 15 | Tolerance for rectangle validation |
| `VERTICAL_SEARCH_TOLERANCE` | 30 | Search range for vertical borders |

### LINE_DETECTION

Line scanning parameters:
| Constant | Value | Description |
|----------|-------|-------------|
| `MIN_LENGTH_FRACTION` | 0.8 | Minimum line as fraction of dimension |
| `RUN_MATCH_FRACTION` | 0.9 | Match threshold for thickness check |
| `LINE_GAP_THRESHOLD` | 3 | Pixels between distinct lines |

### CORNER

Corner verification:
| Constant | Value | Description |
|----------|-------|-------------|
| `POSITION_TOLERANCE` | 5 | Pixels to search for corner point |
| `ARM_CHECK_TOLERANCE` | 2 | Pixels around arm to check |
| `MIN_ARM_RATIO` | 0.6 | Minimum arm coverage (60%) |

## Key Functions

### Pixel Analysis

**`createImageContext(canvas, config)`**
Creates an `ImageContext` from a canvas, extracting pixel data.

**`isDarkPixel(ctx, x, y)`**
Returns true if the pixel at (x, y) is below the dark threshold on all RGB channels.

### Line Detection

**`findLongestDarkRun(ctx, position, direction)`**
Unified function for scanning rows or columns. Returns the longest continuous dark run with gap tolerance.

**`measureLineThickness(ctx, position, run, direction)`**
Measures how many adjacent rows/columns have similar dark runs.

**`findBorderCandidates(ctx, startPos, endPos, direction, scanForward)`**
Scans a region for potential border lines, returning all candidates above the confidence threshold.

### Border Finding

**`findHorizontalBorders(ctx)`**
Finds top and bottom borders with alignment validation between them.

**`findVerticalBorders(ctx, horizontalBorders)`**
Finds left and right borders, using horizontal endpoints as guides when available.

**`resolveVerticalBorders(ctx, horizontal, vertical)`**
Creates synthetic vertical borders from horizontal line endpoints if detection failed.

### Validation

**`verifyCorner(ctx, x, y, cornerType)`**
Checks for L-shaped intersection at corner point.

**`validateCorners(ctx, borders)`**
Validates all four corners, returning count of valid ones.

**`checkBorderAlignment(borders)`**
Checks if borders form a proper rectangle (8-point alignment check).

### Confidence Scoring

**`calculateOverallConfidence(borders, validCorners, alignmentScore, gridLineConfidence)`**
Weighted combination of all signals:

- Border confidence: 30%
- Corner confidence: 25%
- Alignment score: 25%
- Grid line regularity: 20%

**`calculateGridLineConfidence(ctx, bounds)`**
Analyzes internal grid lines for regular spacing.

## Public API

| Function                                         | Description                        |
| ------------------------------------------------ | ---------------------------------- |
| `extractGridArea(canvas)`                        | Fixed-margin extraction (fallback) |
| `extractGridWithoutAxisNumbers(canvas, config?)` | Main entry point with detection    |
| `detectGridBoundaries(canvas, config)`           | Core detection algorithm           |
| `cropToGrid(canvas, bounds)`                     | Crop canvas to detected bounds     |
| `drawDebugBounds(canvas, bounds)`                | Debug visualization helper         |

## Debug Mode

Set `DEBUG_GRID_DETECTION = true` to enable:

- Console logging of detection steps
- Red border overlay on cropped output
- Detailed confidence score breakdown

## Configuration

The `GridDetectionConfig` type allows customizing detection:

```typescript
interface GridDetectionConfig {
  darkPixelThreshold: number; // RGB threshold (default: 50)
  maxGapPixels: number; // Gap tolerance (default: 3)
  minBorderFraction: number; // Min line length (default: 0.4)
  borderExpansion: number; // Pixels to expand bounds (default: 0)
  expectedBorderThickness: number; // Expected thickness (default: 2)
  thicknessTolerance: number; // Thickness variance (default: 2)
  searchRegions: {
    topMaxY: number; // Top search limit (default: 0.35)
    bottomMinY: number; // Bottom search start (default: 0.65)
    leftMaxX: number; // Left search limit (default: 0.30)
    rightMinX: number; // Right search start (default: 0.70)
  };
  cornerDetection: {
    cornerSize: number; // Arm length to check (default: 10)
    minCornerDensity: number; // Unused (default: 0.3)
  };
  gridLineVerification: {
    enabled: boolean; // Enable internal line check (default: true)
    minInternalLines: number; // Min lines needed (default: 2)
    spacingTolerance: number; // Spacing variance (default: 0.1)
  };
}
```

## Fallback Behavior

If detection fails at any stage (missing borders, low confidence, etc.), the algorithm falls back to fixed margin percentages:

- Top/Bottom: 12%
- Left: 8%
- Right: 6%

This ensures usable output even for unusual PDF layouts.
