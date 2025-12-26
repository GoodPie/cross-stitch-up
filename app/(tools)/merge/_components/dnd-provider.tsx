"use client";

import { useState, useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import type { PageRenderResult } from "@/lib/shared/types";

interface MergeDndProviderProps {
    readonly children: React.ReactNode;
    readonly pages: PageRenderResult[];
    readonly onDrop: (pageNumber: number, row: number, col: number) => void;
}

export function MergeDndProvider({ children, pages, onDrop }: MergeDndProviderProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    // Configure sensors with activation constraints
    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: {
            distance: 5, // 5px movement required to start drag
        },
    });

    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: {
            delay: 200, // 200ms hold to start drag
            tolerance: 5, // 5px movement tolerance during delay
        },
    });

    const sensors = useSensors(mouseSensor, touchSensor);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    }, []);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);

            if (over && active) {
                // Extract page number from draggable id (format: "page-{pageNumber}")
                const pageNumber = Number.parseInt(String(active.id).replace("page-", ""), 10);

                // Extract row/col from droppable id (format: "cell-{row}-{col}")
                const [, rowStr, colStr] = String(over.id).split("-");
                const row = Number.parseInt(rowStr, 10);
                const col = Number.parseInt(colStr, 10);

                if (!Number.isNaN(pageNumber) && !Number.isNaN(row) && !Number.isNaN(col)) {
                    onDrop(pageNumber, row, col);
                }
            }
        },
        [onDrop]
    );

    // Find the active page for the DragOverlay
    const activePage = activeId
        ? pages.find((p) => p.pageNumber === Number.parseInt(activeId.replace("page-", ""), 10))
        : null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {children}
            <DragOverlay>{activePage ? <DragOverlayContent page={activePage} /> : null}</DragOverlay>
        </DndContext>
    );
}

// Separate component for overlay content
function DragOverlayContent({ page }: { readonly page: PageRenderResult }) {
    const imageUrl = page.canvas.toDataURL("image/jpeg", 0.8);

    return (
        <div className="border-primary bg-background relative aspect-3/4 w-24 rounded-lg border-2 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element -- canvas data URL for drag preview */}
            <img
                src={imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full rounded-lg object-cover opacity-90"
            />
            <div className="bg-background/90 absolute top-1 left-1 rounded px-1.5 py-0.5 text-xs font-medium">
                Page {page.pageNumber}
            </div>
        </div>
    );
}
