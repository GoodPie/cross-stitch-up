"use client";

import { PageThumbnail } from "@/components/shared/page-thumbnail";
import { DroppableCell } from "./droppable-cell";
import type { PageRenderResult, PageInfo } from "@/lib/shared/types";
import type { GridCell, ServerGridCell } from "@/lib/tools/merge/types";

interface GridCanvasProps {
    readonly cells: (GridCell | ServerGridCell)[];
    readonly pages: PageRenderResult[] | PageInfo[];
    readonly onCellRemove: (row: number, col: number) => void;
    readonly gridDimensions: { rows: number; cols: number };
}

export function GridCanvas({ cells, pages, onCellRemove, gridDimensions }: GridCanvasProps) {
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

    // Create grid cells
    const gridCells = [];
    for (let row = 0; row < gridDimensions.rows; row++) {
        for (let col = 0; col < gridDimensions.cols; col++) {
            const occupied = isCellOccupied(row, col);

            gridCells.push(
                <DroppableCell key={`${row}-${col}`} row={row} col={col} isOccupied={occupied}>
                    {getCellContent(row, col)}
                </DroppableCell>
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
