"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type {
    GridConfig,
    ViewportState,
    CellState,
    CellPosition,
    ToolMode,
    SelectedColor,
    ViewMode,
    CommandType,
} from "@/lib/tools/grid-creator";
import { DEFAULT_VIEW_MODE } from "@/lib/tools/grid-creator";
import {
    DEFAULT_VIEWPORT,
    VIEWPORT_CONSTRAINTS,
    calculateRenderConfig,
    createInteractionHandlers,
    DEFAULT_INTERACTION_STATE,
    getCommandTypeFromToolMode,
    type InteractionState,
} from "@/lib/tools/grid-creator";
import {
    useContainerSize,
    useGridCells,
    useGridCanvasRender,
    useToolActions,
} from "@/lib/hooks/grid-creator";

interface GridCanvasProps {
    readonly config: GridConfig;
    readonly viewport?: ViewportState;
    readonly viewMode?: ViewMode;
    readonly toolMode?: ToolMode;
    readonly selectedColor?: SelectedColor | null;
    /** External cells state - syncs on reference change (for undo/redo) */
    readonly cells?: Map<string, CellState>;
    readonly onCellClick?: (position: CellPosition) => void;
    readonly onHoveredCellChange?: (position: CellPosition | null) => void;
    readonly onViewportChange?: (viewport: ViewportState) => void;
    /** Called when cells change (for persistence) */
    readonly onCellsChange?: (cells: Map<string, CellState>) => void;
    readonly onReady?: () => void;
    readonly onEyedrop?: (color: SelectedColor | null) => void;
    /** Called when a command starts (for undo/redo) */
    readonly onCommandStart?: (type: CommandType) => void;
    /** Called for each cell delta during a command */
    readonly onCommandDelta?: (key: string, before: CellState | undefined, after: CellState | undefined) => void;
    /** Called when a command ends */
    readonly onCommandCommit?: () => void;
}

export function GridCanvas({
    config,
    viewport: externalViewport,
    viewMode = DEFAULT_VIEW_MODE,
    toolMode = "select",
    selectedColor,
    cells: externalCells,
    onCellClick,
    onHoveredCellChange,
    onViewportChange,
    onCellsChange,
    onReady,
    onEyedrop,
    onCommandStart,
    onCommandDelta,
    onCommandCommit,
}: GridCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Interaction state ref - persists across effect re-runs to maintain drag state
    const interactionStateRef = useRef<InteractionState>({ ...DEFAULT_INTERACTION_STATE });

    // Container size tracking
    const { containerRef, containerSize } = useContainerSize();

    // Internal viewport only used when uncontrolled
    const [internalViewport, setInternalViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);
    const [hoveredCell, setHoveredCell] = useState<CellPosition | null>(null);

    // Derive effective viewport - external takes precedence (controlled/uncontrolled pattern)
    const viewport = externalViewport ?? internalViewport;

    // Cells state with controlled/uncontrolled pattern
    const { cells, cellsRef, setCells } = useGridCells({
        externalCells,
        onCellsChange,
    });

    // Refs for undo/redo callbacks (avoid stale closures)
    const onCommandStartRef = useRef(onCommandStart);
    const onCommandDeltaRef = useRef(onCommandDelta);
    const onCommandCommitRef = useRef(onCommandCommit);

    // Update undo/redo refs when callbacks change
    useEffect(() => {
        onCommandStartRef.current = onCommandStart;
    }, [onCommandStart]);

    useEffect(() => {
        onCommandDeltaRef.current = onCommandDelta;
    }, [onCommandDelta]);

    useEffect(() => {
        onCommandCommitRef.current = onCommandCommit;
    }, [onCommandCommit]);

    // Memoized render config
    const renderConfig = useMemo(() => {
        if (containerSize.width === 0 || containerSize.height === 0) {
            return null;
        }
        return calculateRenderConfig(config, containerSize.width, containerSize.height, viewMode);
    }, [config, containerSize, viewMode]);

    // Canvas rendering with DPI scaling and hover optimization
    const { isReady, viewportRef, renderConfigRef } = useGridCanvasRender({
        canvasRef,
        config,
        renderConfig,
        viewport,
        cells,
        cellsRef,
        hoveredCell,
        onReady,
    });

    // Tool-specific cell actions
    const { handleCellClick } = useToolActions({
        toolMode,
        selectedColor,
        cellsRef,
        setCells,
        onCellClick,
        onEyedrop,
        onCommandDeltaRef,
    });

    // Handle hover change
    const handleHover = useCallback(
        (cell: CellPosition | null) => {
            setHoveredCell(cell);
            onHoveredCellChange?.(cell);
        },
        [onHoveredCellChange]
    );

    // Handle pan - works in both controlled and uncontrolled modes
    const handlePan = useCallback(
        (deltaX: number, deltaY: number) => {
            const currentRenderConfig = renderConfigRef.current;
            if (!currentRenderConfig) return;

            // Calculate max pan bounds based on canvas size and current zoom
            const { canvasWidth, canvasHeight } = currentRenderConfig;
            const currentScale = viewportRef.current.scale;
            const visibleWidth = canvasWidth / currentScale;
            const visibleHeight = canvasHeight / currentScale;
            const maxOffsetX = Math.max(0, canvasWidth - visibleWidth);
            const maxOffsetY = Math.max(0, canvasHeight - visibleHeight);

            const newViewport = {
                ...viewportRef.current,
                offsetX: Math.max(0, Math.min(maxOffsetX, viewportRef.current.offsetX + deltaX)),
                offsetY: Math.max(0, Math.min(maxOffsetY, viewportRef.current.offsetY + deltaY)),
            };

            if (externalViewport) {
                // Controlled mode - notify parent
                onViewportChange?.(newViewport);
            } else {
                // Uncontrolled mode - update internal state
                setInternalViewport(newViewport);
            }
        },
        [externalViewport, onViewportChange, viewportRef, renderConfigRef]
    );

    const handleZoom = useCallback(
        (newScale: number, centerX: number, centerY: number) => {
            const canvas = canvasRef.current;
            if (!canvas || !renderConfigRef.current) return;

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            // Calculate the world point under the mouse before zoom
            const mouseX =
                ((centerX - rect.left) * (canvas.width / dpr / rect.width)) / viewportRef.current.scale +
                viewportRef.current.offsetX;
            const mouseY =
                ((centerY - rect.top) * (canvas.height / dpr / rect.height)) / viewportRef.current.scale +
                viewportRef.current.offsetY;

            // Calculate new offset so the same world point stays under mouse
            const newOffsetX = mouseX - ((centerX - rect.left) * (canvas.width / dpr / rect.width)) / newScale;
            const newOffsetY = mouseY - ((centerY - rect.top) * (canvas.height / dpr / rect.height)) / newScale;

            const newViewport = {
                scale: newScale,
                offsetX: Math.max(0, newOffsetX),
                offsetY: Math.max(0, newOffsetY),
            };

            if (externalViewport) {
                // Controlled mode - notify parent
                onViewportChange?.(newViewport);
            } else {
                // Uncontrolled mode - update internal state
                setInternalViewport(newViewport);
            }
        },
        [externalViewport, onViewportChange, viewportRef, renderConfigRef]
    );

    // Notify parent of viewport changes (only in uncontrolled mode)
    useEffect(() => {
        if (!externalViewport) {
            onViewportChange?.(internalViewport);
        }
    }, [internalViewport, externalViewport, onViewportChange]);

    // Drag handlers for undo/redo command lifecycle
    const handleDragStart = useCallback(() => {
        // Don't start command for eyedropper (it doesn't modify cells)
        if (toolMode !== "eyedropper") {
            onCommandStartRef.current?.(getCommandTypeFromToolMode(toolMode));
        }
    }, [toolMode]);

    const handleDragEnd = useCallback(() => {
        // Don't commit command for eyedropper (it doesn't modify cells)
        if (toolMode !== "eyedropper") {
            onCommandCommitRef.current?.();
        }
    }, [toolMode]);

    // Set up interaction handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !renderConfig) return;

        const getViewport = () => viewportRef.current;
        const getRenderConfig = () => renderConfigRef.current!;

        const { cleanup } = createInteractionHandlers(
            canvas,
            getViewport,
            getRenderConfig,
            config,
            {
                onHover: handleHover,
                onClick: handleCellClick,
                onPan: handlePan,
                onZoom: handleZoom,
                onDragStart: handleDragStart,
                onDragEnd: handleDragEnd,
            },
            interactionStateRef
        );

        return cleanup;
    }, [config, renderConfig, handleHover, handleCellClick, handlePan, handleZoom, handleDragStart, handleDragEnd, viewportRef, renderConfigRef]);

    return (
        <div
            ref={containerRef}
            className="bg-muted/30 relative flex h-full w-full items-center justify-center overflow-hidden"
        >
            <canvas
                ref={canvasRef}
                className="touch-none"
                aria-label={`Cross stitch grid, ${config.width} columns by ${config.height} rows`}
            />
            {!isReady && (
                <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
                    <div className="text-muted-foreground">Generating grid...</div>
                </div>
            )}
        </div>
    );
}

// Export the reset viewport constant for use by parent
export { DEFAULT_VIEWPORT, VIEWPORT_CONSTRAINTS };
