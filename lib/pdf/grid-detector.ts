import type { GridPosition } from './types'

/**
 * Determines the grid position based on page index for StitchBox-style patterns.
 *
 * StitchBox PDFs use a 2x2 layout where pages are ordered:
 * - Page 0: Top-left (coordinates 50→10 X, 50→1 Y)
 * - Page 1: Top-right (coordinates 10→50 X, 50→1 Y)
 * - Page 2: Bottom-left (coordinates 50→10 X, 1→50 Y)
 * - Page 3: Bottom-right (coordinates 10→50 X, 1→50 Y)
 */
export function determineGridPosition(pageIndex: number, totalPages: number): GridPosition {
  // For 4-page patterns (2x2 grid) - most common StitchBox format
  if (totalPages === 4) {
    const positions: GridPosition[] = [
      { row: 0, col: 0 }, // top-left
      { row: 0, col: 1 }, // top-right
      { row: 1, col: 0 }, // bottom-left
      { row: 1, col: 1 }, // bottom-right
    ]
    return positions[pageIndex] || { row: 0, col: 0 }
  }

  // For 2-page patterns (1x2 or 2x1 layout)
  if (totalPages === 2) {
    // Assume horizontal split (left/right)
    return { row: 0, col: pageIndex }
  }

  // For 6-page patterns (2x3 or 3x2 layout)
  if (totalPages === 6) {
    // Assume 2 rows x 3 columns
    const cols = 3
    return {
      row: Math.floor(pageIndex / cols),
      col: pageIndex % cols,
    }
  }

  // For 9-page patterns (3x3 layout)
  if (totalPages === 9) {
    const cols = 3
    return {
      row: Math.floor(pageIndex / cols),
      col: pageIndex % cols,
    }
  }

  // Generic fallback: calculate based on square-ish grid
  const cols = Math.ceil(Math.sqrt(totalPages))
  return {
    row: Math.floor(pageIndex / cols),
    col: pageIndex % cols,
  }
}

/**
 * Get the grid dimensions (rows x cols) based on page count
 */
export function getGridDimensions(totalPages: number): { rows: number; cols: number } {
  if (totalPages === 4) return { rows: 2, cols: 2 }
  if (totalPages === 2) return { rows: 1, cols: 2 }
  if (totalPages === 6) return { rows: 2, cols: 3 }
  if (totalPages === 9) return { rows: 3, cols: 3 }

  // Generic fallback
  const cols = Math.ceil(Math.sqrt(totalPages))
  const rows = Math.ceil(totalPages / cols)
  return { rows, cols }
}