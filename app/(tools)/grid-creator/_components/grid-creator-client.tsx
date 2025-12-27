"use client";

import { useState, useCallback } from "react";
import { useGridPhase, useGridViewport, useColorSelection } from "@/lib/hooks/grid-creator";
import { GridConfigForm } from "./grid-config-form";
import { GridCreatorHeader } from "./grid-creator-header";
import { GridCreatorToolbar } from "./grid-creator-toolbar";
import { GridWorkspace } from "./grid-workspace";
import { PaletteSidebar } from "./palette-sidebar";
import type { CellPosition, ToolMode, ViewMode } from "@/lib/tools/grid-creator";
import { DEFAULT_VIEW_MODE } from "@/lib/tools/grid-creator";
import type { ThreadColour } from "@/lib/tools/threads/types";

interface GridCreatorClientProps {
    readonly threads: ThreadColour[];
    readonly brands: string[];
}

export function GridCreatorClient({ threads, brands }: GridCreatorClientProps) {
    // Tool mode state
    const [toolMode, setToolMode] = useState<ToolMode>("paint");

    // View mode for symbol/color display
    const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);

    // Hovered cell for tooltip
    const [hoveredCell, setHoveredCell] = useState<CellPosition | null>(null);

    // Sidebar visibility on mobile
    const [showPalette, setShowPalette] = useState(false);

    // Custom hooks for state management
    const { viewport, handleZoomIn, handleZoomOut, handleResetView, handleViewportChange, resetViewport } =
        useGridViewport();

    const { selectedColor, recentColors, handleColorSelect, handleSymbolSelect, handleEyedrop, resetColorSelection } =
        useColorSelection({
            onToolModeChange: setToolMode,
        });

    const { phase, config, handleConfigSubmit, handleGridReady, handleReset } = useGridPhase({
        onReset: () => {
            resetViewport();
            resetColorSelection();
            setHoveredCell(null);
            setToolMode("select");
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

    const isInteractive = phase === "interactive";
    const isRendering = phase === "rendering";

    return (
        <div className="flex h-[calc(100vh-12rem)] min-h-[600px] gap-0">
            {/* Main Content */}
            <div className="flex min-w-0 flex-1 flex-col">
                <GridCreatorHeader />

                {/* Config Phase */}
                {phase === "config" && (
                    <div className="mx-auto w-full max-w-md">
                        <GridConfigForm onSubmit={handleConfigSubmit} />
                    </div>
                )}

                {/* Rendering/Interactive Phase */}
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
                            onReady={handleGridReady}
                            onViewportChange={handleViewportChange}
                            onHoveredCellChange={handleHoveredCellChange}
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
