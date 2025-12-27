import { GridCanvas } from "./grid-canvas";
import { GridCellTooltip } from "./grid-cell-tooltip";
import type {
    GridConfig,
    CellPosition,
    CellState,
    ViewportState,
    ViewMode,
    ToolMode,
    SelectedColor,
} from "@/lib/tools/grid-creator";

interface GridWorkspaceProps {
    readonly config: GridConfig;
    readonly isInteractive: boolean;
    readonly isRendering: boolean;
    readonly viewport: ViewportState;
    readonly viewMode: ViewMode;
    readonly toolMode: ToolMode;
    readonly selectedColor: SelectedColor | null;
    readonly hoveredCell: CellPosition | null;
    readonly initialCells?: Map<string, CellState>;
    readonly onReady: () => void;
    readonly onViewportChange: (viewport: ViewportState) => void;
    readonly onHoveredCellChange: (cell: CellPosition | null) => void;
    readonly onCellsChange?: (cells: Map<string, CellState>) => void;
    readonly onEyedrop: (color: SelectedColor | null) => void;
}

export function GridWorkspace({
    config,
    isInteractive,
    isRendering,
    viewport,
    viewMode,
    toolMode,
    selectedColor,
    hoveredCell,
    initialCells,
    onReady,
    onViewportChange,
    onHoveredCellChange,
    onCellsChange,
    onEyedrop,
}: GridWorkspaceProps) {
    return (
        <div className="bg-muted/30 relative min-h-0 flex-1 overflow-hidden rounded-lg border">
            <GridCanvas
                config={config}
                viewport={viewport}
                viewMode={viewMode}
                toolMode={toolMode}
                selectedColor={selectedColor}
                initialCells={initialCells}
                onReady={onReady}
                onViewportChange={onViewportChange}
                onHoveredCellChange={onHoveredCellChange}
                onCellsChange={onCellsChange}
                onEyedrop={onEyedrop}
            />

            {isInteractive && <GridCellTooltip position={hoveredCell} />}

            {/* Loading overlay */}
            {isRendering && (
                <div className="bg-background/50 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                        <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                        <p className="text-muted-foreground text-sm">Generating grid...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
