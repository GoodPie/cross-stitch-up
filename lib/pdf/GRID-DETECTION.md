# Grid Detection Algorithm

This document describes how `grid-extractor.ts` detects and extracts the cross-stitch pattern grid from PDF page renders.

## Overview

Cross-stitch pattern PDFs typically have a grid area surrounded by:
- Axis labels (stitch numbers: 10, 20, 30...)
- Page margins and headers
- Border lines delineating the grid

The algorithm detects the black border lines surrounding the grid and crops to inside them, removing axis numbers and margins.

## Detection Pipeline

```
┌─────────────────┐
│  Render PDF     │
│  page to canvas │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Find horizontal│ ◄── Scan top/bottom regions for long dark runs
│  border lines   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Find vertical  │ ◄── Use horizontal line endpoints as guide
│  border lines   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Verify corners │ ◄── Check L-shaped intersections
└────────┬────────┘
         ▼
┌─────────────────┐
│  Validate grid  │ ◄── Check internal line spacing regularity
│  structure      │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Return bounds  │
│  or fallback    │
└─────────────────┘
```

## Key Concepts

### Dark Pixel Detection

A pixel is considered "dark" (part of a border line) if all RGB channels are below a threshold (default: 50).

### Line Detection with Gap Tolerance

Border lines may have small gaps due to PDF rendering artifacts. The algorithm tolerates gaps up to `maxGapPixels` (default: 3) when scanning for continuous runs.

### Thickness Measurement

True border lines are typically 1-3 pixels thick. The algorithm measures line thickness by checking adjacent rows/columns for similar dark runs. This helps distinguish actual borders from thinner internal grid lines.

### Constrained Search

Rather than scanning the entire image:
- **Top border**: Scan only the upper 35% of the image
- **Bottom border**: Scan only the lower 35%
- **Left/Right borders**: Use horizontal line endpoints as hints

This both improves performance and reduces false positives from page content.

## Detection Steps

### 1. Find Horizontal Borders

Scan rows in the top and bottom regions looking for long horizontal dark runs:

```
Search region (top 35%):
┌────────────────────────┐
│   ← scan this area →   │
├────────────────────────┤
│                        │
│      (grid area)       │
│                        │
├────────────────────────┤
│   ← scan this area →   │
└────────────────────────┘
Search region (bottom 35%)
```

For each candidate line, calculate a confidence score based on:
- **Length score**: How much of the page width it spans (target: 80%+)
- **Thickness score**: Whether it matches expected border thickness

**Alignment Validation**: The top and bottom borders should have matching x-coordinates (start at same left position, end at same right position). This rejects table lines or other elements that don't form a complete grid border.

### 2. Find Vertical Borders

Use the horizontal line endpoints to guide vertical line detection:
- **Left border**: Search near where horizontal lines start
- **Right border**: Search near where horizontal lines end

Search tolerance: ±30 pixels from expected position.

If no vertical line is found (or it's misaligned), fall back to using the horizontal line endpoints directly.

### 3. Verify Corners

Check each corner for an L-shaped intersection:

```
Top-left corner:      Top-right corner:
    ─────►                ◄─────
    │                          │
    ▼                          ▼

Bottom-left corner:   Bottom-right corner:
    ▲                          ▲
    │                          │
    ─────►                ◄─────
```

Each corner is verified by checking:
1. Dark pixels at the corner point (with 5px tolerance)
2. Dark pixels extending horizontally (the arm)
3. Dark pixels extending vertically (the arm)

At least 60% of the arm pixels must be dark for each direction.

### 4. Check Border Alignment

Verify that the four detected lines form a proper rectangle by checking 8 alignment points:
- Top line endpoints should align with left/right border positions
- Bottom line endpoints should align with left/right border positions
- Left line endpoints should align with top/bottom border positions
- Right line endpoints should align with top/bottom border positions

Tolerance: 15 pixels per alignment point.

### 5. Validate Internal Grid Lines

If enabled, verify the detected area contains a regular grid by:
1. Finding internal horizontal/vertical lines within the bounds
2. Calculating spacing between consecutive lines
3. Checking if spacing is consistent (regularity check)

Regular spacing (within 10% tolerance) indicates a valid grid pattern.

### 6. Calculate Confidence

Final confidence is a weighted combination of:
- **Border confidence (30%)**: Average confidence of the four detected borders
- **Corner confidence (25%)**: Fraction of valid corners (0-4)
- **Alignment score (25%)**: How well borders form a rectangle
- **Grid line confidence (20%)**: Regularity of internal lines

Minimum threshold: 35% overall confidence.

## Fallback Behavior

If detection fails at any stage, the algorithm falls back to fixed margin percentages:
- Top/Bottom: 12%
- Left: 8%
- Right: 6%

This ensures some output even for unusual PDF layouts.

## Configuration

Key parameters in `GridDetectionConfig`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `darkPixelThreshold` | 50 | RGB threshold for dark pixels |
| `maxGapPixels` | 3 | Gap tolerance in line detection |
| `minBorderFraction` | 0.4 | Minimum line length as fraction of dimension |
| `expectedBorderThickness` | 2 | Expected border line thickness |
| `borderExpansion` | 0 | Pixels to expand bounds outward |

### Search Regions

| Parameter | Default | Description |
|-----------|---------|-------------|
| `topMaxY` | 0.35 | Top border: search from top to 35% |
| `bottomMinY` | 0.65 | Bottom border: search from 65% to bottom |
| `leftMaxX` | 0.30 | Left border: search from left to 30% |
| `rightMinX` | 0.70 | Right border: search from 70% to right |

## Debug Mode

Set `DEBUG_GRID_DETECTION = true` to enable:
- Console logging of detection steps
- Red border overlay on cropped output
- Corner marker visualization
- Detailed confidence score breakdown

## Exported Functions

| Function | Description |
|----------|-------------|
| `extractGridArea()` | Fixed-margin extraction (fallback) |
| `extractGridWithoutAxisNumbers()` | Main entry point with full detection |
| `detectGridBoundaries()` | Core detection algorithm |
| `cropToGrid()` | Crop canvas to detected bounds |
| `drawDebugBounds()` | Debug visualization helper |
