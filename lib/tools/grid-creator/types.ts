/**
 * Grid Creator Tool - Type Definitions
 *
 * All types for the Grid Creator tool including:
 * - GridConfig: User-provided grid dimensions
 * - CellPosition: Cell coordinates with utilities
 * - CellState: Individual cell state
 * - ViewportState: Zoom/pan camera state
 * - VisibleRange: Viewport culling calculations
 * - GridState: Complete application state
 * - RenderConfig: Canvas rendering configuration
 */

/**
 * Configuration for grid creation.
 * Validated before grid generation.
 */
export interface GridConfig {
    /** Grid width in stitches (cells). Range: 1-500 */
    width: number;

    /** Grid height in stitches (cells). Range: 1-500 */
    height: number;
}

/**
 * Validation rules for GridConfig
 */
export const GRID_CONFIG_CONSTRAINTS = {
    MIN_DIMENSION: 1,
    MAX_DIMENSION: 500,
    DEFAULT_WIDTH: 50,
    DEFAULT_HEIGHT: 50,
} as const;

/**
 * Position of a cell in the grid.
 * Zero-indexed: (0,0) is top-left.
 */
export interface CellPosition {
    /** Row index (0 = top) */
    row: number;

    /** Column index (0 = left) */
    col: number;
}

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
 * State of a single grid cell.
 * Sparse storage - only non-default cells are stored.
 */
export interface CellState {
    /** Whether the cell has been activated (clicked) */
    active: boolean;

    // Future expansion:
    // color?: string;
    // symbol?: string;
    // threadCode?: string;
}

/**
 * Default cell state (not stored in Map).
 */
export const DEFAULT_CELL_STATE: CellState = {
    active: false,
};

/**
 * Viewport state for canvas navigation.
 * Uses world coordinates for position, scale for zoom.
 */
export interface ViewportState {
    /** Zoom/scale level. 1.0 = 100%, range 0.1-4.0 */
    scale: number;

    /** Horizontal offset in world coordinates (pixels at scale=1) */
    offsetX: number;

    /** Vertical offset in world coordinates (pixels at scale=1) */
    offsetY: number;
}

export const DEFAULT_VIEWPORT: ViewportState = {
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
};

export const VIEWPORT_CONSTRAINTS = {
    MIN_SCALE: 0.1,
    MAX_SCALE: 4.0,
    SCALE_STEP: 0.1,
} as const;

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
 * Range of cells currently visible in viewport.
 * Used for render culling - only draw visible cells.
 */
export interface VisibleRange {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
}

/**
 * Calculate visible cell range from viewport state.
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

/**
 * Application phases for Grid Creator.
 */
export type GridCreatorPhase =
    | "config" // User entering dimensions
    | "rendering" // Grid being generated
    | "interactive"; // Grid ready for interaction

/**
 * Complete application state for Grid Creator.
 */
export interface GridState {
    /** Current phase in the state machine */
    phase: GridCreatorPhase;

    /** Grid configuration (null until set) */
    config: GridConfig | null;

    /** Viewport/camera state */
    viewport: ViewportState;

    /** Cell states (sparse - only non-default cells stored) */
    cells: Map<string, CellState>;

    /** Currently hovered cell (null if none) */
    hoveredCell: CellPosition | null;
}

/**
 * Validate that an unknown value is a valid GridConfig.
 */
export function validateGridConfig(config: unknown): config is GridConfig {
    if (typeof config !== "object" || config === null) return false;
    const { width, height } = config as Record<string, unknown>;

    return (
        typeof width === "number" &&
        typeof height === "number" &&
        Number.isInteger(width) &&
        Number.isInteger(height) &&
        width >= GRID_CONFIG_CONSTRAINTS.MIN_DIMENSION &&
        width <= GRID_CONFIG_CONSTRAINTS.MAX_DIMENSION &&
        height >= GRID_CONFIG_CONSTRAINTS.MIN_DIMENSION &&
        height <= GRID_CONFIG_CONSTRAINTS.MAX_DIMENSION
    );
}

/**
 * Colors for grid rendering.
 */
export interface RenderColors {
    background: string;
    gridLine: string;
    majorGridLine: string;
    hoverHighlight: string;
    activeCell: string;
}

/**
 * Computed rendering configuration.
 * Derived from GridConfig and container dimensions.
 */
export interface RenderConfig {
    /** Size of each cell in pixels */
    cellSize: number;

    /** Total canvas width in pixels */
    canvasWidth: number;

    /** Total canvas height in pixels */
    canvasHeight: number;

    /** Grid line width in pixels */
    lineWidth: number;

    /** Colors for rendering */
    colors: RenderColors;
}

export const DEFAULT_RENDER_COLORS: RenderColors = {
    background: "#ffffff",
    gridLine: "#d1d5db",
    majorGridLine: "#9ca3af",
    hoverHighlight: "#dbeafe",
    activeCell: "#93c5fd",
};

export const RENDER_CONSTRAINTS = {
    MIN_CELL_SIZE: 8, // Minimum for touch targets
    MAX_CELL_SIZE: 50, // Maximum before wasting space
    LINE_WIDTH: 1,
    MAJOR_LINE_INTERVAL: 10, // Every 10th line is major
} as const;
