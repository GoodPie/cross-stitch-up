import { RefreshCw, Palette, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly onToolModeChange: (mode: ToolMode) => void;
    readonly onViewModeChange: (mode: ViewMode) => void;
    readonly onZoomIn: () => void;
    readonly onZoomOut: () => void;
    readonly onResetView: () => void;
    readonly onReset: () => void;
    readonly onTogglePalette: () => void;
    readonly onUndo: () => void;
    readonly onRedo: () => void;
}

export function GridCreatorToolbar({
    config,
    isInteractive,
    toolMode,
    viewMode,
    viewport,
    selectedColor,
    canUndo,
    canRedo,
    onToolModeChange,
    onViewModeChange,
    onZoomIn,
    onZoomOut,
    onResetView,
    onReset,
    onTogglePalette,
    onUndo,
    onRedo,
}: GridCreatorToolbarProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:gap-6">
            <div className="flex items-center gap-4">
                <div className="text-muted-foreground text-sm">
                    <span className="text-foreground font-medium">
                        {config.width} x {config.height}
                    </span>{" "}
                    grid
                </div>

                {/* Tool Mode Selector */}
                {isInteractive && (
                    <ToolModeSelector
                        mode={toolMode}
                        onModeChange={onToolModeChange}
                        hasSelectedColor={selectedColor !== null}
                    />
                )}

                {/* View Mode Selector */}
                {isInteractive && <ViewModeSelector mode={viewMode} onModeChange={onViewModeChange} />}

                {/* Undo/Redo Buttons */}
                {isInteractive && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onUndo}
                            disabled={!canUndo}
                            aria-label="Undo (Ctrl+Z)"
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRedo}
                            disabled={!canRedo}
                            aria-label="Redo (Ctrl+Y)"
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Selected Color Indicator (mobile) */}
                {isInteractive && selectedColor && (
                    <div className="flex items-center gap-2 md:hidden">
                        <div
                            className="h-8 w-8 rounded border shadow-sm"
                            style={{ backgroundColor: selectedColor.hex }}
                        />
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

                {/* New Grid Button with Confirmation */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">New Grid</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Create New Grid?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will discard your current grid and any unsaved changes. This action cannot be
                                undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onReset}>Create New Grid</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
