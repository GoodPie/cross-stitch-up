import { RefreshCw, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolModeSelector } from "./tool-mode-selector";
import { ViewModeSelector } from "./view-mode-selector";
import { GridControls } from "./grid-controls";
import type { GridConfig, ToolMode, ViewMode, ViewportState, SelectedColor } from "@/lib/tools/grid-creator";

interface GridCreatorToolbarProps {
    readonly config: GridConfig;
    readonly isInteractive: boolean;
    readonly toolMode: ToolMode;
    readonly viewMode: ViewMode;
    readonly viewport: ViewportState;
    readonly selectedColor: SelectedColor | null;
    readonly onToolModeChange: (mode: ToolMode) => void;
    readonly onViewModeChange: (mode: ViewMode) => void;
    readonly onZoomIn: () => void;
    readonly onZoomOut: () => void;
    readonly onResetView: () => void;
    readonly onReset: () => void;
    readonly onTogglePalette: () => void;
}

export function GridCreatorToolbar({
    config,
    isInteractive,
    toolMode,
    viewMode,
    viewport,
    selectedColor,
    onToolModeChange,
    onViewModeChange,
    onZoomIn,
    onZoomOut,
    onResetView,
    onReset,
    onTogglePalette,
}: GridCreatorToolbarProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 px-4">
            <div className="flex items-center gap-4">
                <div className="text-muted-foreground text-sm">
                    <span className="text-foreground font-medium">
                        {config.width} x {config.height}
                    </span>{" "}
                    grid
                </div>

                {/* Tool Mode Selector */}
                {isInteractive && (
                    <ToolModeSelector mode={toolMode} onModeChange={onToolModeChange} hasSelectedColor={selectedColor !== null} />
                )}

                {/* View Mode Selector */}
                {isInteractive && <ViewModeSelector mode={viewMode} onModeChange={onViewModeChange} />}
            </div>

            <div className="flex items-center gap-2">
                {/* Selected Color Indicator (mobile) */}
                {isInteractive && selectedColor && (
                    <div className="flex items-center gap-2 md:hidden">
                        <div className="h-8 w-8 rounded border shadow-sm" style={{ backgroundColor: selectedColor.hex }} />
                    </div>
                )}

                {/* Palette Toggle (mobile) */}
                {isInteractive && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onTogglePalette}
                        className="md:hidden"
                        aria-label="Toggle color palette"
                    >
                        <Palette className="h-4 w-4" />
                    </Button>
                )}

                {/* Zoom Controls */}
                <GridControls scale={viewport.scale} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onResetView} />

                {/* New Grid Button */}
                <Button variant="outline" onClick={onReset} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">New Grid</span>
                </Button>
            </div>
        </div>
    );
}
