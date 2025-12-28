"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type {
    GridConfig,
    ViewportState,
    CellState,
    CellPosition,
    RenderConfig,
    ToolMode,
    SelectedColor,
    ViewMode,
    CommandType,
} from "@/lib/tools/grid-creator";
import { DEFAULT_VIEW_MODE } from "@/lib/tools/grid-creator";
import {
    DEFAULT_VIEWPORT,
    VIEWPORT_CONSTRAINTS,
    cellKey,
    calculateRenderConfig,
    renderGrid,
    renderCell,
    createInteractionHandlers,
    DEFAULT_INTERACTION_STATE,
    type InteractionState,
} from "@/lib/tools/grid-creator";

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
    const containerRef = useRef<HTMLDivElement>(null);

    // Interaction state ref - persists across effect re-runs to maintain drag state
    const interactionStateRef = useRef<InteractionState>({ ...DEFAULT_INTERACTION_STATE });

    // State - internal viewport only used when uncontrolled
    const [internalViewport, setInternalViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);
    const [internalCells, setInternalCells] = useState<Map<string, CellState>>(() => externalCells ?? new Map());
    const [hoveredCell, setHoveredCell] = useState<CellPosition | null>(null);
    const [containerSize, setContainerSize] = useState<{
        width: number;
        height: number;
    }>({ width: 0, height: 0 });
    const [isReady, setIsReady] = useState(false);

    // Derive effective viewport - external takes precedence (controlled/uncontrolled pattern)
    const viewport = externalViewport ?? internalViewport;

    // Refs for interaction handlers (avoid stale closure issues)
    const viewportRef = useRef(viewport);
    const renderConfigRef = useRef<RenderConfig | null>(null);
    const prevHoveredCellRef = useRef<CellPosition | null>(null);
    const cellsRef = useRef(internalCells);

    // Refs for undo/redo callbacks (avoid stale closures)
    const onCommandStartRef = useRef(onCommandStart);
    const onCommandDeltaRef = useRef(onCommandDelta);
    const onCommandCommitRef = useRef(onCommandCommit);

    // Track previous external cells for detecting external changes (undo/redo)
    const [prevExternalCells, setPrevExternalCells] = useState(externalCells);

    // Sync from external cells when reference changes (for undo/redo)
    // This pattern is React-recommended: updating state during render based on props
    // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    if (externalCells !== prevExternalCells) {
        setPrevExternalCells(externalCells);
        setInternalCells(externalCells ?? new Map());
    }

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

    // Update refs when state changes
    useEffect(() => {
        viewportRef.current = viewport;
    }, [viewport]);

    useEffect(() => {
        cellsRef.current = internalCells;
    }, [internalCells]);

    // Notify parent when cells change (for persistence)
    useEffect(() => {
        onCellsChange?.(internalCells);
    }, [internalCells, onCellsChange]);

    // Memoized render config
    const renderConfig = useMemo(() => {
        if (containerSize.width === 0 || containerSize.height === 0) {
            return null;
        }
        return calculateRenderConfig(config, containerSize.width, containerSize.height, viewMode);
    }, [config, containerSize, viewMode]);

    // Update renderConfigRef
    useEffect(() => {
        renderConfigRef.current = renderConfig;
    }, [renderConfig]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ width, height });
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !renderConfig) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        // Handle device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const { canvasWidth, canvasHeight } = renderConfig;

        // Set actual canvas dimensions (physical pixels)
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;

        // Set display size (CSS pixels)
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        // Scale context for high DPI
        ctx.scale(dpr, dpr);

        // Apply viewport transformations for zoom and pan
        ctx.save();
        ctx.scale(viewport.scale, viewport.scale);
        ctx.translate(-viewport.offsetX, -viewport.offsetY);

        // Render the grid without hover highlight (hover is handled by separate effect)
        renderGrid(ctx, config, renderConfig, viewport, internalCells, null);

        // Reset hover ref - let hover effect re-apply highlight after full render
        prevHoveredCellRef.current = null;

        ctx.restore();

        // Mark as ready after first render
        if (!isReady) {
            setIsReady(true);
            onReady?.();
        }
    }, [renderConfig, config, viewport, internalCells, isReady, onReady]);

    // Render on any state change
    useEffect(() => {
        // Use requestAnimationFrame for smooth rendering
        const frameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frameId);
    }, [render]);

    // =========================================================================
    // Optimized hover rendering - incremental updates for hover-only changes
    // =========================================================================

    useEffect(() => {
        const canvas = canvasRef.current;
        const currentRenderConfig = renderConfigRef.current;
        if (!canvas || !currentRenderConfig || !isReady) return;

        const prevHovered = prevHoveredCellRef.current;
        const currentHovered = hoveredCell;

        // Skip if hover hasn't changed
        if (prevHovered?.row === currentHovered?.row && prevHovered?.col === currentHovered?.col) {
            return;
        }

        // Get canvas context
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const currentViewport = viewportRef.current;
        const currentCells = cellsRef.current;

        // Apply transformations
        // Note: dpr scale is already applied by main render and persists on the canvas
        // Only apply viewport transforms here
        ctx.save();
        ctx.scale(currentViewport.scale, currentViewport.scale);
        ctx.translate(-currentViewport.offsetX, -currentViewport.offsetY);

        // Re-render previous hovered cell (remove highlight)
        if (prevHovered) {
            const prevCellState = currentCells.get(cellKey(prevHovered));
            renderCell(ctx, prevHovered, prevCellState, currentRenderConfig, false, currentViewport.scale);
        }

        // Render new hovered cell (add highlight)
        if (currentHovered) {
            const currentCellState = currentCells.get(cellKey(currentHovered));
            renderCell(ctx, currentHovered, currentCellState, currentRenderConfig, true, currentViewport.scale);
        }

        ctx.restore();

        // Update ref
        prevHoveredCellRef.current = currentHovered;
    }, [hoveredCell, isReady]);

    // Handle cell click based on current tool mode
    const handleCellClick = useCallback(
        (position: CellPosition) => {
            const key = cellKey(position);
            const beforeState = cellsRef.current.get(key);

            switch (toolMode) {
                case "select":
                    // Toggle cell on/off (legacy behavior)
                    setInternalCells((prev) => {
                        const newCells = new Map(prev);
                        const current = newCells.get(key);
                        if (current?.active) {
                            newCells.delete(key);
                            // Record delta: cell removed
                            onCommandDeltaRef.current?.(key, beforeState, undefined);
                        } else {
                            const afterState: CellState = { active: true };
                            newCells.set(key, afterState);
                            // Record delta: cell added
                            onCommandDeltaRef.current?.(key, beforeState, afterState);
                        }
                        return newCells;
                    });
                    break;

                case "paint":
                    // Apply selected color and symbol to cell
                    if (selectedColor) {
                        const afterState: CellState = {
                            active: true,
                            color: selectedColor.hex,
                            threadCode: selectedColor.threadCode,
                            symbol: selectedColor.symbol,
                        };
                        setInternalCells((prev) => {
                            const newCells = new Map(prev);
                            newCells.set(key, afterState);
                            return newCells;
                        });
                        // Record delta: cell painted
                        onCommandDeltaRef.current?.(key, beforeState, afterState);
                    }
                    break;

                case "erase":
                    // Remove cell
                    setInternalCells((prev) => {
                        const newCells = new Map(prev);
                        newCells.delete(key);
                        return newCells;
                    });
                    // Record delta: cell erased
                    onCommandDeltaRef.current?.(key, beforeState, undefined);
                    break;

                case "eyedropper":
                    // Pick color and symbol from cell (no undo needed)
                    {
                        const cellState = cellsRef.current.get(key);
                        if (cellState?.color && cellState?.threadCode) {
                            // Extract brand and name from threadCode (e.g., "DMC 310")
                            const [brand, ...codeParts] = cellState.threadCode.split(" ");
                            onEyedrop?.({
                                hex: cellState.color,
                                threadCode: cellState.threadCode,
                                name: `${brand} ${codeParts.join(" ")}`,
                                brand: brand || "Unknown",
                                symbol: cellState.symbol,
                            });
                        } else {
                            onEyedrop?.(null);
                        }
                    }
                    break;
            }

            onCellClick?.(position);
        },
        [toolMode, selectedColor, onCellClick, onEyedrop]
    );

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
        [externalViewport, onViewportChange]
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
        [externalViewport, onViewportChange]
    );

    // Notify parent of viewport changes (only in uncontrolled mode)
    useEffect(() => {
        if (!externalViewport) {
            onViewportChange?.(internalViewport);
        }
    }, [internalViewport, externalViewport, onViewportChange]);

    // Map tool mode to command type for undo/redo
    const getCommandType = useCallback((): CommandType => {
        switch (toolMode) {
            case "paint":
                return "paint";
            case "erase":
                return "erase";
            default:
                return "select";
        }
    }, [toolMode]);

    // Drag handlers for undo/redo command lifecycle
    const handleDragStart = useCallback(() => {
        // Don't start command for eyedropper (it doesn't modify cells)
        if (toolMode !== "eyedropper") {
            onCommandStartRef.current?.(getCommandType());
        }
    }, [toolMode, getCommandType]);

    const handleDragEnd = useCallback(() => {
        // Don't commit command for eyedropper (it doesn't modify cells)
        if (toolMode !== "eyedropper") {
            onCommandCommitRef.current?.();
        }
    }, [toolMode]);

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
    }, [config, renderConfig, handleHover, handleCellClick, handlePan, handleZoom, handleDragStart, handleDragEnd]);

    // Expose reset function via parent callback if needed
    // This is done via the viewport change - parent can set viewport to DEFAULT_VIEWPORT

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
