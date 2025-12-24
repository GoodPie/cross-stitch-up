"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { PageThumbnail } from "@/components/shared/page-thumbnail";
import type { PageRenderResult } from "@/lib/shared/types";
import type { GridCell } from "@/lib/tools/merge/types";

interface GridCanvasProps {
    readonly cells: GridCell[];
    readonly pages: PageRenderResult[];
    readonly onCellAdd: (pageNumber: number, row: number, col: number) => void;
    readonly onCellRemove: (row: number, col: number) => void;
    readonly gridDimensions: { rows: number; cols: number };
}

export function GridCanvas({ cells, pages, onCellAdd, onCellRemove, gridDimensions }: GridCanvasProps) {
    const [dragOverCell, setDragOverCell] = useState<{
        row: number;
        col: number;
    } | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent, row: number, col: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverCell({ row, col });
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverCell(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent, row: number, col: number) => {
            e.preventDefault();
            setDragOverCell(null);
            const pageNumber = Number.parseInt(e.dataTransfer.getData("text/plain"), 10);
            if (!Number.isNaN(pageNumber)) {
                onCellAdd(pageNumber, row, col);
            }
        },
        [onCellAdd]
    );

    const getCellContent = (row: number, col: number) => {
        const cell = cells.find((c) => c.row === row && c.col === col);
        if (cell) {
            const page = pages.find((p) => p.pageNumber === cell.pageNumber);
            if (page) {
                return (
                    <PageThumbnail
                        page={page}
                        isInGrid
                        gridPosition={{ row, col }}
                        onRemove={() => onCellRemove(row, col)}
                        draggable={false}
                    />
                );
            }
        }
        return null;
    };

    const isCellOccupied = (row: number, col: number) => {
        return cells.some((c) => c.row === row && c.col === col);
    };

    const isDragOver = (row: number, col: number) => {
        return dragOverCell?.row === row && dragOverCell?.col === col;
    };

    // Create grid cells
    const gridCells = [];
    for (let row = 0; row < gridDimensions.rows; row++) {
        for (let col = 0; col < gridDimensions.cols; col++) {
            const occupied = isCellOccupied(row, col);
            const isOver = isDragOver(row, col);

            gridCells.push(
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- drag-and-drop zone requires mouse interactions
                <div
                    aria-label={`Drop zone row ${row + 1} column ${col + 1}`}
                    key={`${row}-${col}`}
                    onDragOver={(e) => handleDragOver(e, row, col)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, row, col)}
                    className={`aspect-3/4 rounded-lg border-2 border-dashed transition-all duration-200 ${occupied ? "border-border border-solid p-0" : "border-muted-foreground/30"} ${isOver && !occupied ? "border-primary bg-primary/10 scale-[1.02]" : ""} ${!occupied ? "flex items-center justify-center" : ""} `}
                >
                    {occupied ? (
                        getCellContent(row, col)
                    ) : (
                        <div className="text-muted-foreground/50 text-center">
                            <Plus className="mx-auto mb-1 h-6 w-6" />
                            <span className="text-xs">Drop here</span>
                        </div>
                    )}
                </div>
            );
        }
    }

    return (
        <div
            className="grid gap-3"
            style={{
                gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
            }}
        >
            {gridCells}
        </div>
    );
}
