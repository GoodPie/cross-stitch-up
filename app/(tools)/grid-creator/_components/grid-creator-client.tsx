"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGridPhase, useGridViewport, useColorSelection, useGridPersistence } from "@/lib/hooks/grid-creator";
import { GridConfigForm } from "./grid-config-form";
import { GridCreatorHeader } from "./grid-creator-header";
import { GridCreatorToolbar } from "./grid-creator-toolbar";
import { GridWorkspace } from "./grid-workspace";
import { PaletteSidebar } from "./palette-sidebar";
import type { CellPosition, CellState, ToolMode, ViewMode } from "@/lib/tools/grid-creator";
import { DEFAULT_VIEW_MODE } from "@/lib/tools/grid-creator";
import type { ThreadColour } from "@/lib/tools/threads/types";

interface GridCreatorClientProps {
    readonly threads: ThreadColour[];
    readonly brands: string[];
}

export function GridCreatorClient({ threads, brands }: GridCreatorClientProps) {
    // Persistence hook - must be called first to get initial state
    const { initialState, saveState, clearPersistedState } = useGridPersistence();

    // Tool mode state
    const [toolMode, setToolMode] = useState<ToolMode>(initialState?.toolMode ?? "paint");

    // View mode for symbol/color display
    const [viewMode, setViewMode] = useState<ViewMode>(initialState?.viewMode ?? DEFAULT_VIEW_MODE);

    // Hovered cell for tooltip
    const [hoveredCell, setHoveredCell] = useState<CellPosition | null>(null);

    // Sidebar visibility on mobile
    const [showPalette, setShowPalette] = useState(false);

    // Track cells for persistence (lifted from GridCanvas)
    const cellsRef = useRef<Map<string, CellState>>(initialState?.cells ?? new Map());

    // Custom hooks for state management with initial values from persistence
    const { viewport, handleZoomIn, handleZoomOut, handleResetView, handleViewportChange, resetViewport } =
        useGridViewport({
            initialViewport: initialState?.viewport,
        });

    const {
        selectedColor,
        recentColors,
        colorSymbolMap,
        handleColorSelect,
        handleSymbolSelect,
        handleEyedrop,
        resetColorSelection,
    } = useColorSelection({
        initialSelectedColor: initialState?.selectedColor,
        initialRecentColors: initialState?.recentColors,
        initialColorSymbolMap: initialState?.colorSymbolMap,
        onToolModeChange: setToolMode,
    });

    const { phase, config, handleConfigSubmit, handleGridReady, handleReset } = useGridPhase({
        // If we have a saved config, skip to interactive phase
        initialPhase: initialState?.config ? "interactive" : "config",
        initialConfig: initialState?.config,
        onReset: () => {
            resetViewport();
            resetColorSelection();
            setHoveredCell(null);
            setToolMode("select");
            setViewMode(DEFAULT_VIEW_MODE);
            cellsRef.current = new Map();
            // Clear persisted state when resetting
            clearPersistedState();
        },
    });

    const handleHoveredCellChange = useCallback((cell: CellPosition | null) => {
        setHoveredCell(cell);
    }, []);

    const handleTogglePalette = useCallback(() => {
        setShowPalette((prev) => !prev);
    }, []);

    const handleClosePalette = useCallback(() => {
        setShowPalette(false);
    }, []);

    // Handle cells change from canvas (for persistence)
    const handleCellsChange = useCallback(
        (cells: Map<string, CellState>) => {
            cellsRef.current = cells;
            // Save cells to persistence
            if (config) {
                saveState({ cells });
            }
        },
        [config, saveState]
    );

    // Save state when any persisted value changes
    useEffect(() => {
        // Don't save if no config (still in config phase)
        if (!config) return;

        saveState({
            config,
            viewport,
            selectedColor,
            recentColors,
            colorSymbolMap,
            toolMode,
            viewMode,
            cells: cellsRef.current,
        });
    }, [config, viewport, selectedColor, recentColors, colorSymbolMap, toolMode, viewMode, saveState]);

    const isInteractive = phase === "interactive";
    const isRendering = phase === "rendering";

    // Config phase - centered layout matching merge tool
    if (phase === "config") {
        return (
            <div className="container mx-auto max-w-4xl">
                <GridConfigForm onSubmit={handleConfigSubmit} />
            </div>
        );
    }

    // Rendering/Interactive phase - workspace layout
    return (
        <div className="flex h-[calc(100vh-12rem)] min-h-[600px] gap-0 md:gap-4 lg:gap-6">
            {/* Main Content */}
            <div className="flex min-w-0 flex-1 flex-col">
                <GridCreatorHeader />

                {(isRendering || isInteractive) && config && (
                    <div className="flex min-h-0 flex-1 flex-col space-y-4">
                        <GridCreatorToolbar
                            config={config}
                            isInteractive={isInteractive}
                            toolMode={toolMode}
                            viewMode={viewMode}
                            viewport={viewport}
                            selectedColor={selectedColor}
                            onToolModeChange={setToolMode}
                            onViewModeChange={setViewMode}
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            onResetView={handleResetView}
                            onReset={handleReset}
                            onTogglePalette={handleTogglePalette}
                        />

                        <GridWorkspace
                            config={config}
                            isInteractive={isInteractive}
                            isRendering={isRendering}
                            viewport={viewport}
                            viewMode={viewMode}
                            toolMode={toolMode}
                            selectedColor={selectedColor}
                            hoveredCell={hoveredCell}
                            initialCells={initialState?.cells}
                            onReady={handleGridReady}
                            onViewportChange={handleViewportChange}
                            onHoveredCellChange={handleHoveredCellChange}
                            onCellsChange={handleCellsChange}
                            onEyedrop={handleEyedrop}
                        />
                    </div>
                )}
            </div>

            {/* Color Palette Sidebar */}
            {isInteractive && config && (
                <PaletteSidebar
                    threads={threads}
                    brands={brands}
                    selectedColor={selectedColor}
                    recentColors={recentColors}
                    showPalette={showPalette}
                    onColorSelect={handleColorSelect}
                    onSymbolSelect={handleSymbolSelect}
                    onClose={handleClosePalette}
                />
            )}
        </div>
    );
}
