/**
 * Grid Creator Tool - Utility Functions
 *
 * Utility functions for grid operations:
 * - cellKey/parseKey: Cell position key generation for Map storage
 * - clampViewport: Constrain viewport values to valid ranges
 * - getVisibleRange: Calculate visible cell range for render culling
 */

import type { CellPosition, GridConfig, ViewportState, VisibleRange } from "./types";
import { VIEWPORT_CONSTRAINTS } from "./types";

/**
 * Generate a unique key for a cell position.
 * Used as Map key for cell state storage.
 */
export function cellKey(pos: CellPosition): string {
    return `${pos.row}-${pos.col}`;
}

/**
 * Parse a cell key back to position.
 */
export function parseKey(key: string): CellPosition {
    const [row, col] = key.split("-").map(Number);
    return { row, col };
}

/**
 * Clamp viewport values to valid ranges.
 */
export function clampViewport(viewport: ViewportState): ViewportState {
    return {
        scale: Math.max(VIEWPORT_CONSTRAINTS.MIN_SCALE, Math.min(VIEWPORT_CONSTRAINTS.MAX_SCALE, viewport.scale)),
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY,
    };
}

/**
 * Calculate visible cell range from viewport state.
 * Used for render culling - only draw visible cells.
 */
export function getVisibleRange(
    viewport: ViewportState,
    gridConfig: GridConfig,
    cellSize: number,
    canvasWidth: number,
    canvasHeight: number
): VisibleRange {
    const startCol = Math.max(0, Math.floor(viewport.offsetX / cellSize));
    const startRow = Math.max(0, Math.floor(viewport.offsetY / cellSize));
    const endCol = Math.min(
        gridConfig.width - 1,
        Math.ceil((viewport.offsetX + canvasWidth / viewport.scale) / cellSize)
    );
    const endRow = Math.min(
        gridConfig.height - 1,
        Math.ceil((viewport.offsetY + canvasHeight / viewport.scale) / cellSize)
    );
    return { startCol, startRow, endCol, endRow };
}
