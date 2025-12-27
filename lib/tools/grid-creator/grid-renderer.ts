/**
 * Grid Creator Tool - Canvas Renderer
 *
 * Handles all canvas rendering for the grid including:
 * - Grid lines (regular and major every 10 cells)
 * - Cell fills (background, active, hovered)
 * - Viewport culling for performance
 */

import type { GridConfig, CellPosition, CellState, ViewportState, RenderConfig, VisibleRange } from "./types";
import { DEFAULT_RENDER_COLORS, RENDER_CONSTRAINTS, getVisibleRange } from "./types";

/**
 * Calculate render configuration based on grid config and container dimensions.
 * Cell size is dynamically calculated to fit the container while meeting minimum requirements.
 */
export function calculateRenderConfig(
    config: GridConfig,
    containerWidth: number,
    containerHeight: number
): RenderConfig {
    // Calculate cell size to fit container, respecting min/max constraints
    const maxCellWidth = containerWidth / config.width;
    const maxCellHeight = containerHeight / config.height;
    const idealCellSize = Math.min(maxCellWidth, maxCellHeight);

    const cellSize = Math.max(
        RENDER_CONSTRAINTS.MIN_CELL_SIZE,
        Math.min(RENDER_CONSTRAINTS.MAX_CELL_SIZE, Math.floor(idealCellSize))
    );

    // Calculate actual canvas dimensions
    const canvasWidth = cellSize * config.width;
    const canvasHeight = cellSize * config.height;

    return {
        cellSize,
        canvasWidth,
        canvasHeight,
        lineWidth: RENDER_CONSTRAINTS.LINE_WIDTH,
        colors: { ...DEFAULT_RENDER_COLORS },
    };
}

/**
 * Render the entire grid to the canvas.
 * Uses viewport culling to only render visible cells for performance.
 *
 * @param ctx - Canvas 2D rendering context
 * @param config - Grid configuration
 * @param renderConfig - Render configuration
 * @param viewport - Current viewport state
 * @param cells - Map of cell states (sparse storage)
 * @param hoveredCell - Currently hovered cell position (or null)
 */
export function renderGrid(
    ctx: CanvasRenderingContext2D,
    config: GridConfig,
    renderConfig: RenderConfig,
    viewport: ViewportState,
    cells: Map<string, CellState>,
    hoveredCell: CellPosition | null
): void {
    const { cellSize, canvasWidth, canvasHeight, colors } = renderConfig;

    // Clear canvas with background color
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate visible range for viewport culling
    const visibleRange = getVisibleRange(viewport, config, cellSize, canvasWidth, canvasHeight);

    // Render active and hovered cells
    renderCells(ctx, cells, hoveredCell, renderConfig, visibleRange);

    // Render grid lines on top
    renderGridLines(ctx, config, renderConfig);
}

/**
 * Render all cells within the visible range.
 */
function renderCells(
    ctx: CanvasRenderingContext2D,
    cells: Map<string, CellState>,
    hoveredCell: CellPosition | null,
    renderConfig: RenderConfig,
    visibleRange: VisibleRange
): void {
    const { cellSize, colors } = renderConfig;

    // First pass: render active cells
    ctx.fillStyle = colors.activeCell;
    for (const [key, state] of cells.entries()) {
        if (!state.active) continue;

        const [row, col] = key.split("-").map(Number);

        // Skip if outside visible range
        if (
            row < visibleRange.startRow ||
            row > visibleRange.endRow ||
            col < visibleRange.startCol ||
            col > visibleRange.endCol
        ) {
            continue;
        }

        const x = col * cellSize;
        const y = row * cellSize;
        ctx.fillRect(x, y, cellSize, cellSize);
    }

    // Second pass: render hovered cell (on top of active)
    if (hoveredCell) {
        const { row, col } = hoveredCell;
        if (
            row >= visibleRange.startRow &&
            row <= visibleRange.endRow &&
            col >= visibleRange.startCol &&
            col <= visibleRange.endCol
        ) {
            ctx.fillStyle = colors.hoverHighlight;
            const x = col * cellSize;
            const y = row * cellSize;
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    }
}

/**
 * Render grid lines (regular and major).
 */
function renderGridLines(ctx: CanvasRenderingContext2D, config: GridConfig, renderConfig: RenderConfig): void {
    const { cellSize, canvasWidth, canvasHeight, lineWidth, colors } = renderConfig;

    // Draw all vertical lines
    for (let col = 0; col <= config.width; col++) {
        const x = Math.floor(col * cellSize) + 0.5; // +0.5 for crisp 1px lines
        const isMajor = col % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0;

        ctx.strokeStyle = isMajor ? colors.majorGridLine : colors.gridLine;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }

    // Draw all horizontal lines
    for (let row = 0; row <= config.height; row++) {
        const y = Math.floor(row * cellSize) + 0.5;
        const isMajor = row % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0;

        ctx.strokeStyle = isMajor ? colors.majorGridLine : colors.gridLine;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }
}

/**
 * Render a single cell.
 * Used for incremental updates when only one cell changes.
 *
 * @param ctx - Canvas 2D rendering context
 * @param position - Cell position to render
 * @param state - Cell state (undefined means default/inactive)
 * @param renderConfig - Render configuration
 * @param isHovered - Whether this cell is currently hovered
 */
export function renderCell(
    ctx: CanvasRenderingContext2D,
    position: CellPosition,
    state: CellState | undefined,
    renderConfig: RenderConfig,
    isHovered: boolean
): void {
    const { cellSize, colors } = renderConfig;
    const { row, col } = position;

    const x = col * cellSize;
    const y = row * cellSize;

    // Determine fill color based on state
    let fillColor = colors.background;
    if (state?.active) {
        fillColor = colors.activeCell;
    }
    if (isHovered) {
        fillColor = colors.hoverHighlight;
    }

    // Fill cell
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, cellSize, cellSize);

    // Redraw cell borders
    const isMajorCol =
        col % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0 || (col + 1) % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0;
    const isMajorRow =
        row % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0 || (row + 1) % RENDER_CONSTRAINTS.MAJOR_LINE_INTERVAL === 0;

    ctx.strokeStyle = isMajorCol || isMajorRow ? colors.majorGridLine : colors.gridLine;
    ctx.lineWidth = renderConfig.lineWidth;
    ctx.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);
}

