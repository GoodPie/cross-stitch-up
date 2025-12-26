"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

interface DroppableCellProps {
    readonly row: number;
    readonly col: number;
    readonly isOccupied: boolean;
    readonly children?: React.ReactNode;
}

export function DroppableCell({ row, col, isOccupied, children }: DroppableCellProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `cell-${row}-${col}`,
        data: {
            row,
            col,
        },
    });

    return (
        <div
            ref={setNodeRef}
            aria-label={`Drop zone row ${row + 1} column ${col + 1}`}
            className={`aspect-3/4 rounded-lg border-2 border-dashed transition-all duration-200 ${isOccupied ? "border-border border-solid p-0" : "border-muted-foreground/30"} ${isOver && !isOccupied ? "scale-[1.02] border-primary bg-primary/10" : ""} ${!isOccupied ? "flex items-center justify-center" : ""} `}
        >
            {isOccupied ? (
                children
            ) : (
                <div className="text-muted-foreground/50 text-center">
                    <Plus className="mx-auto mb-1 h-6 w-6" />
                    <span className="text-xs">Drop here</span>
                </div>
            )}
        </div>
    );
}
