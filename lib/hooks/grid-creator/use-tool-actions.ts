import { useCallback } from "react";
import type { ToolMode, CellState, CellPosition, SelectedColor } from "@/lib/tools/grid-creator";
import { cellKey } from "@/lib/tools/grid-creator";

export interface UseToolActionsOptions {
    toolMode: ToolMode;
    selectedColor?: SelectedColor | null;
    cellsRef: React.RefObject<Map<string, CellState>>;
    setCells: React.Dispatch<React.SetStateAction<Map<string, CellState>>>;
    onCellClick?: (position: CellPosition) => void;
    onEyedrop?: (color: SelectedColor | null) => void;
    /** Ref to command delta callback (for undo/redo) */
    onCommandDeltaRef: React.RefObject<
        ((key: string, before: CellState | undefined, after: CellState | undefined) => void) | undefined
    >;
}

interface UseToolActionsReturn {
    /** Handle cell click based on current tool mode */
    handleCellClick: (position: CellPosition) => void;
}

/**
 * Hook for tool-specific cell modifications.
 *
 * Handles:
 * - Select mode: Toggle cell on/off
 * - Paint mode: Apply selected color and symbol
 * - Erase mode: Remove cell
 * - Eyedropper mode: Pick color from cell
 *
 * Records deltas for undo/redo system.
 */
export function useToolActions({
    toolMode,
    selectedColor,
    cellsRef,
    setCells,
    onCellClick,
    onEyedrop,
    onCommandDeltaRef,
}: UseToolActionsOptions): UseToolActionsReturn {
    const handleCellClick = useCallback(
        (position: CellPosition) => {
            const key = cellKey(position);
            const beforeState = cellsRef.current.get(key);

            switch (toolMode) {
                case "select":
                    // Toggle cell on/off (legacy behavior)
                    setCells((prev) => {
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
                        setCells((prev) => {
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
                    setCells((prev) => {
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
        [toolMode, selectedColor, cellsRef, setCells, onCellClick, onEyedrop, onCommandDeltaRef]
    );

    return {
        handleCellClick,
    };
}
