/**
 * Grid Creator Tool - Interaction Handler
 *
 * Handles all user interactions with the grid canvas:
 * - Coordinate translation (screen -> canvas -> cell)
 * - Mouse events (hover, click, pan)
 * - Touch events (tap, drag, pinch)
 */

import type { CellPosition, ViewportState, RenderConfig, GridConfig } from "./types";
import { VIEWPORT_CONSTRAINTS } from "./types";

/**
 * Convert screen coordinates to canvas coordinates.
 * Accounts for viewport offset, scale, and canvas position.
 *
 * @param clientX - Screen X coordinate (from mouse/touch event)
 * @param clientY - Screen Y coordinate (from mouse/touch event)
 * @param canvas - Canvas element
 * @param viewport - Current viewport state
 * @returns Canvas coordinates { canvasX, canvasY }
 */
export function screenToCanvas(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    viewport: ViewportState
): { canvasX: number; canvasY: number } {
    const rect = canvas.getBoundingClientRect();

    // Account for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / dpr / rect.width;
    const scaleY = canvas.height / dpr / rect.height;

    // Convert screen to canvas coordinates
    const canvasX = ((clientX - rect.left) * scaleX) / viewport.scale + viewport.offsetX;
    const canvasY = ((clientY - rect.top) * scaleY) / viewport.scale + viewport.offsetY;

    return { canvasX, canvasY };
}

/**
 * Get cell position from canvas coordinates.
 * Returns null if coordinates are outside the grid.
 *
 * @param canvasX - X coordinate in canvas space
 * @param canvasY - Y coordinate in canvas space
 * @param renderConfig - Render configuration
 * @param gridConfig - Grid configuration for bounds checking
 * @returns Cell position or null if outside grid
 */
export function getCellFromCoords(
    canvasX: number,
    canvasY: number,
    renderConfig: RenderConfig,
    gridConfig: GridConfig
): CellPosition | null {
    const { cellSize } = renderConfig;

    const col = Math.floor(canvasX / cellSize);
    const row = Math.floor(canvasY / cellSize);

    // Bounds check
    if (col < 0 || col >= gridConfig.width) return null;
    if (row < 0 || row >= gridConfig.height) return null;

    return { row, col };
}

export interface InteractionCallbacks {
    onHover: (cell: CellPosition | null) => void;
    onClick: (cell: CellPosition) => void;
    onPan: (deltaX: number, deltaY: number) => void;
    onZoom: (newScale: number, centerX: number, centerY: number) => void;
    /** Called when drag operation starts (for undo/redo command batching) */
    onDragStart?: (cell: CellPosition) => void;
    /** Called for each new cell during drag (cell already applied via onClick) */
    onDragMove?: (cell: CellPosition) => void;
    /** Called when drag operation ends */
    onDragEnd?: () => void;
}

export interface InteractionState {
    isPanning: boolean;
    lastPanX: number;
    lastPanY: number;
    initialPinchDistance: number | null;
    initialScale: number;
    /** Whether currently dragging (painting/erasing cells) */
    isDragging: boolean;
    /** Last cell during drag (to avoid duplicate callbacks) */
    lastDragCell: CellPosition | null;
}

/** Default initial state for interaction handler */
export const DEFAULT_INTERACTION_STATE: InteractionState = {
    isPanning: false,
    lastPanX: 0,
    lastPanY: 0,
    initialPinchDistance: null,
    initialScale: 1,
    isDragging: false,
    lastDragCell: null,
};

/**
 * Create and attach all interaction handlers to a canvas.
 * Returns a cleanup function to remove all event listeners.
 *
 * @param canvas - Canvas element to attach handlers to
 * @param getViewport - Function to retrieve current viewport state
 * @param getRenderConfig - Function to retrieve current render configuration
 * @param gridConfig - Grid configuration
 * @param callbacks - Callback functions for interactions
 * @param stateRef - Optional external state ref that persists across effect re-runs.
 *                   If provided, the ref's current value is used and mutated.
 *                   This prevents drag state from being lost when React effects re-run.
 * @returns Object with cleanup function
 */
export function createInteractionHandlers(
    canvas: HTMLCanvasElement,
    getViewport: () => ViewportState,
    getRenderConfig: () => RenderConfig,
    gridConfig: GridConfig,
    callbacks: InteractionCallbacks,
    stateRef?: { current: InteractionState }
): { cleanup: () => void } {
    // Use external state ref if provided (persists across effect re-runs),
    // otherwise create local state (will reset if effect re-runs)
    const state: InteractionState = stateRef?.current ?? {
        isPanning: false,
        lastPanX: 0,
        lastPanY: 0,
        initialPinchDistance: null,
        initialScale: 1,
        isDragging: false,
        lastDragCell: null,
    };

    // =========================================================================
    // Mouse Handlers
    // =========================================================================

    const handleMouseMove = (e: MouseEvent) => {
        const viewport = getViewport();
        const renderConfig = getRenderConfig();

        if (state.isPanning) {
            const deltaX = (e.clientX - state.lastPanX) / viewport.scale;
            const deltaY = (e.clientY - state.lastPanY) / viewport.scale;
            callbacks.onPan(-deltaX, -deltaY);
            state.lastPanX = e.clientX;
            state.lastPanY = e.clientY;
            return;
        }

        // Hover detection
        const { canvasX, canvasY } = screenToCanvas(e.clientX, e.clientY, canvas, viewport);
        const cell = getCellFromCoords(canvasX, canvasY, renderConfig, gridConfig);
        callbacks.onHover(cell);

        // Drag painting - if dragging and cell changed, apply to new cell
        if (state.isDragging && cell) {
            const lastCell = state.lastDragCell;
            if (!lastCell || lastCell.row !== cell.row || lastCell.col !== cell.col) {
                state.lastDragCell = cell;
                callbacks.onClick(cell);
                callbacks.onDragMove?.(cell);
            }
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        // Right click or middle click for panning
        if (e.button === 1 || e.button === 2) {
            state.isPanning = true;
            state.lastPanX = e.clientX;
            state.lastPanY = e.clientY;
            e.preventDefault();
            return;
        }

        // Left click - check if we can pan (zoomed in) or it's a cell click
        const viewport = getViewport();
        if (viewport.scale > 1 && e.shiftKey) {
            // Shift+click to pan when zoomed
            state.isPanning = true;
            state.lastPanX = e.clientX;
            state.lastPanY = e.clientY;
            return;
        }

        // Cell click - start drag operation
        const renderConfig = getRenderConfig();
        const { canvasX, canvasY } = screenToCanvas(e.clientX, e.clientY, canvas, viewport);
        const cell = getCellFromCoords(canvasX, canvasY, renderConfig, gridConfig);
        if (cell) {
            // Start drag and apply first cell
            state.isDragging = true;
            state.lastDragCell = cell;
            callbacks.onDragStart?.(cell);
            callbacks.onClick(cell);
        }
    };

    const handleMouseUp = () => {
        state.isPanning = false;
        if (state.isDragging) {
            state.isDragging = false;
            state.lastDragCell = null;
            callbacks.onDragEnd?.();
        }
    };

    const handleMouseLeave = () => {
        state.isPanning = false;
        if (state.isDragging) {
            state.isDragging = false;
            state.lastDragCell = null;
            callbacks.onDragEnd?.();
        }
        callbacks.onHover(null);
    };

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const viewport = getViewport();

        // Zoom with mouse wheel
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(
            VIEWPORT_CONSTRAINTS.MIN_SCALE,
            Math.min(VIEWPORT_CONSTRAINTS.MAX_SCALE, viewport.scale + zoomDelta)
        );

        if (newScale !== viewport.scale) {
            callbacks.onZoom(newScale, e.clientX, e.clientY);
        }
    };

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    };

    // =========================================================================
    // Touch Handlers
    // =========================================================================

    const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
            // Single touch - record start position for drag detection
            state.lastPanX = e.touches[0].clientX;
            state.lastPanY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            // Two touches - switch to pinch/pan mode
            state.initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
            state.initialScale = getViewport().scale;
            state.isPanning = true;
            // End any drag that was in progress
            if (state.isDragging) {
                state.isDragging = false;
                state.lastDragCell = null;
                callbacks.onDragEnd?.();
            }
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();

        if (e.touches.length === 2) {
            // Two-finger: pan and pinch zoom
            if (state.initialPinchDistance) {
                const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
                const scale = state.initialScale * (currentDistance / state.initialPinchDistance);
                const newScale = Math.max(
                    VIEWPORT_CONSTRAINTS.MIN_SCALE,
                    Math.min(VIEWPORT_CONSTRAINTS.MAX_SCALE, scale)
                );

                // Center point of pinch
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                callbacks.onZoom(newScale, centerX, centerY);
            }
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const viewport = getViewport();
            const renderConfig = getRenderConfig();
            const { canvasX, canvasY } = screenToCanvas(touch.clientX, touch.clientY, canvas, viewport);
            const cell = getCellFromCoords(canvasX, canvasY, renderConfig, gridConfig);

            if (state.isDragging) {
                // Continue drag - apply to new cell if changed
                if (cell) {
                    const lastCell = state.lastDragCell;
                    if (!lastCell || lastCell.row !== cell.row || lastCell.col !== cell.col) {
                        state.lastDragCell = cell;
                        callbacks.onClick(cell);
                        callbacks.onDragMove?.(cell);
                    }
                }
            } else {
                // Not yet dragging - detect if moved enough to start drag
                const dx = Math.abs(touch.clientX - state.lastPanX);
                const dy = Math.abs(touch.clientY - state.lastPanY);
                if (dx > 5 || dy > 5) {
                    // Start drag painting
                    state.isDragging = true;
                    if (cell) {
                        state.lastDragCell = cell;
                        callbacks.onDragStart?.(cell);
                        callbacks.onClick(cell);
                    }
                }
            }
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (e.touches.length === 0) {
            // All touches ended
            if (state.isDragging) {
                state.isDragging = false;
                state.lastDragCell = null;
                callbacks.onDragEnd?.();
            } else if (!state.isPanning && e.changedTouches.length === 1) {
                // This was a tap - treat as click with drag lifecycle
                const touch = e.changedTouches[0];
                const viewport = getViewport();
                const renderConfig = getRenderConfig();
                const { canvasX, canvasY } = screenToCanvas(touch.clientX, touch.clientY, canvas, viewport);
                const cell = getCellFromCoords(canvasX, canvasY, renderConfig, gridConfig);
                if (cell) {
                    callbacks.onDragStart?.(cell);
                    callbacks.onClick(cell);
                    callbacks.onDragEnd?.();
                }
            }
            state.isPanning = false;
            state.initialPinchDistance = null;
            callbacks.onHover(null);
        } else if (e.touches.length === 1) {
            // One touch remaining - reset for potential new gesture
            state.lastPanX = e.touches[0].clientX;
            state.lastPanY = e.touches[0].clientY;
            state.initialPinchDistance = null;
            state.isPanning = false;
        }
    };

    const handleTouchCancel = () => {
        // Reset state when touch is cancelled (e.g., iOS notification, gesture interruption)
        if (state.isDragging) {
            state.isDragging = false;
            state.lastDragCell = null;
            callbacks.onDragEnd?.();
        }
        state.isPanning = false;
        state.initialPinchDistance = null;
        callbacks.onHover(null);
    };

    // =========================================================================
    // Window-level handler for catching drags that end outside canvas
    // =========================================================================

    const handleWindowMouseUp = () => {
        if (state.isDragging) {
            state.isDragging = false;
            state.lastDragCell = null;
            callbacks.onDragEnd?.();
        }
        state.isPanning = false;
    };

    // =========================================================================
    // Attach Event Listeners
    // =========================================================================

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("contextmenu", handleContextMenu);

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    // Window-level listener for catching mouse releases outside canvas
    window.addEventListener("mouseup", handleWindowMouseUp);

    // =========================================================================
    // Cleanup Function
    // =========================================================================

    return {
        cleanup: () => {
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            canvas.removeEventListener("wheel", handleWheel);
            canvas.removeEventListener("contextmenu", handleContextMenu);

            canvas.removeEventListener("touchstart", handleTouchStart);
            canvas.removeEventListener("touchmove", handleTouchMove);
            canvas.removeEventListener("touchend", handleTouchEnd);
            canvas.removeEventListener("touchcancel", handleTouchCancel);

            window.removeEventListener("mouseup", handleWindowMouseUp);
        },
    };
}
