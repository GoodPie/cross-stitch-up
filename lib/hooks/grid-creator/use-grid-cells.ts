import { useState, useEffect, useRef } from "react";
import type { CellState } from "@/lib/tools/grid-creator";

export interface UseGridCellsOptions {
    /** External cells state - syncs on reference change (for undo/redo) */
    externalCells?: Map<string, CellState>;
    /** Called when cells change (for persistence) */
    onCellsChange?: (cells: Map<string, CellState>) => void;
}

interface UseGridCellsReturn {
    /** Current cells state */
    cells: Map<string, CellState>;
    /** Ref for synchronous access (avoids stale closures) */
    cellsRef: React.RefObject<Map<string, CellState>>;
    /** Set cells directly (for tool actions) */
    setCells: React.Dispatch<React.SetStateAction<Map<string, CellState>>>;
}

/**
 * Hook for managing cells state with controlled/uncontrolled pattern.
 *
 * Handles:
 * - Internal cells state with external sync for undo/redo
 * - cellsRef for synchronous access in event handlers
 * - Notifying parent of cells changes for persistence
 *
 * The external cells sync uses the React-recommended pattern:
 * updating state during render based on prop reference changes.
 * See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
 */
export function useGridCells({ externalCells, onCellsChange }: UseGridCellsOptions = {}): UseGridCellsReturn {
    // Internal cells state - initialized from external if provided
    const [internalCells, setInternalCells] = useState<Map<string, CellState>>(() => externalCells ?? new Map());

    // Ref for synchronous access (avoids stale closures in event handlers)
    const cellsRef = useRef(internalCells);

    // Track previous external cells for detecting external changes (undo/redo)
    const [prevExternalCells, setPrevExternalCells] = useState(externalCells);

    // Sync from external cells when reference changes (for undo/redo)
    // Uses React-recommended pattern: updating state during render based on props
    // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    if (externalCells !== prevExternalCells) {
        setPrevExternalCells(externalCells);
        setInternalCells(externalCells ?? new Map());
    }

    // Update ref when state changes
    useEffect(() => {
        cellsRef.current = internalCells;
    }, [internalCells]);

    // Notify parent when cells change (for persistence)
    useEffect(() => {
        onCellsChange?.(internalCells);
    }, [internalCells, onCellsChange]);

    return {
        cells: internalCells,
        cellsRef,
        setCells: setInternalCells,
    };
}
