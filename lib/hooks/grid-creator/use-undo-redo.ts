/**
 * useUndoRedo Hook
 *
 * Manages undo/redo history for grid cell operations using command pattern with delta storage.
 * Supports grouping multiple cell changes into single commands (for drag operations).
 */

import { useState, useCallback, useRef } from "react";
import type { CellState } from "@/lib/tools/grid-creator";
import type { CellDelta, CommandType, UndoCommand, UndoHistory } from "@/lib/tools/grid-creator/undo-types";
import { UNDO_CONSTRAINTS, createCommandId } from "@/lib/tools/grid-creator/undo-types";

interface UseUndoRedoOptions {
    /** Maximum commands to keep in history (default: UNDO_CONSTRAINTS.MAX_HISTORY_SIZE) */
    maxHistorySize?: number;
    /** Maximum total deltas across all history (default: UNDO_CONSTRAINTS.MAX_TOTAL_DELTAS) */
    maxTotalDeltas?: number;
}

interface UseUndoRedoReturn {
    /** Whether undo is available */
    canUndo: boolean;
    /** Whether redo is available */
    canRedo: boolean;
    /** Number of commands in undo stack */
    undoCount: number;
    /** Number of commands in redo stack */
    redoCount: number;

    /**
     * Start a new command. Call before making cell changes.
     * Must be followed by commitCommand() or cancelCommand().
     */
    startCommand: (type: CommandType) => void;

    /**
     * Record a cell change within the current command.
     * @param key - Cell key in "row-col" format
     * @param before - Cell state before change (undefined if cell didn't exist)
     * @param after - Cell state after change (undefined if cell was deleted)
     */
    addDelta: (key: string, before: CellState | undefined, after: CellState | undefined) => void;

    /**
     * Commit the current command to history.
     * If no deltas were added, no command is stored.
     */
    commitCommand: () => void;

    /**
     * Cancel the current command (discard uncommitted deltas).
     */
    cancelCommand: () => void;

    /**
     * Undo the most recent command.
     * @returns Array of deltas to apply (in reverse - use 'before' states), or null if nothing to undo
     */
    undo: () => CellDelta[] | null;

    /**
     * Redo the most recently undone command.
     * @returns Array of deltas to apply (use 'after' states), or null if nothing to redo
     */
    redo: () => CellDelta[] | null;

    /**
     * Clear all history. Call on grid reset/new grid.
     */
    clearHistory: () => void;
}

const INITIAL_HISTORY: UndoHistory = {
    past: [],
    future: [],
};

/**
 * Shallow equality check for CellState objects.
 * More efficient than JSON.stringify, especially during drag operations.
 */
function areCellStatesEqual(a: CellState | undefined, b: CellState | undefined): boolean {
    // Both undefined
    if (a === undefined && b === undefined) return true;
    // One undefined, one not
    if (a === undefined || b === undefined) return false;
    // Compare all properties directly
    return a.active === b.active && a.color === b.color && a.threadCode === b.threadCode && a.symbol === b.symbol;
}

/**
 * Count total deltas across all commands in history.
 */
function countTotalDeltas(history: UndoHistory): number {
    let count = 0;
    for (const cmd of history.past) {
        count += cmd.deltas.length;
    }
    for (const cmd of history.future) {
        count += cmd.deltas.length;
    }
    return count;
}

/**
 * Trim history to stay within constraints.
 * Removes oldest commands from past until within limits.
 */
function trimHistory(history: UndoHistory, maxHistorySize: number, maxTotalDeltas: number): UndoHistory {
    let { past } = history;
    const { future } = history;

    // Trim by command count
    if (past.length > maxHistorySize) {
        past = past.slice(past.length - maxHistorySize);
    }

    // Trim by total deltas
    let totalDeltas = countTotalDeltas({ past, future });
    while (totalDeltas > maxTotalDeltas && past.length > 0) {
        const removed = past.shift();
        if (removed) {
            totalDeltas -= removed.deltas.length;
        }
    }

    return { past, future };
}

export function useUndoRedo(options: UseUndoRedoOptions = {}): UseUndoRedoReturn {
    const { maxHistorySize = UNDO_CONSTRAINTS.MAX_HISTORY_SIZE, maxTotalDeltas = UNDO_CONSTRAINTS.MAX_TOTAL_DELTAS } =
        options;

    const [history, setHistory] = useState<UndoHistory>(INITIAL_HISTORY);

    // Ref for synchronous access to history (avoids stale closure issues in undo/redo)
    // Note: We manually update historyRef in all mutation functions, no useEffect sync needed
    const historyRef = useRef<UndoHistory>(INITIAL_HISTORY);

    // Current command being built (not yet committed)
    const pendingCommandRef = useRef<{
        type: CommandType;
        deltas: CellDelta[];
        seenKeys: Set<string>;
    } | null>(null);

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;
    const undoCount = history.past.length;
    const redoCount = history.future.length;

    // Internal helper to commit pending command to history (used by both commitCommand and startCommand)
    const commitPendingToHistory = useCallback(() => {
        const pending = pendingCommandRef.current;
        if (!pending || pending.deltas.length === 0) {
            pendingCommandRef.current = null;
            return;
        }

        const command: UndoCommand = {
            id: createCommandId(),
            timestamp: Date.now(),
            type: pending.type,
            deltas: pending.deltas,
        };

        pendingCommandRef.current = null;

        // Update history - use ref for synchronous read, compute new state, update both ref and state
        const newHistory: UndoHistory = {
            past: [...historyRef.current.past, command],
            // Clear future when new command is added (standard undo behavior)
            future: [],
        };
        const trimmed = trimHistory(newHistory, maxHistorySize, maxTotalDeltas);

        historyRef.current = trimmed;
        setHistory(trimmed);
    }, [maxHistorySize, maxTotalDeltas]);

    const startCommand = useCallback(
        (type: CommandType) => {
            // If there's already a pending command with deltas, commit it first
            if (pendingCommandRef.current && pendingCommandRef.current.deltas.length > 0) {
                console.warn("useUndoRedo: Starting new command while previous command is pending. Auto-committing.");
                commitPendingToHistory();
            }

            pendingCommandRef.current = {
                type,
                deltas: [],
                seenKeys: new Set(),
            };
        },
        [commitPendingToHistory]
    );

    const addDelta = useCallback((key: string, before: CellState | undefined, after: CellState | undefined) => {
        const pending = pendingCommandRef.current;
        if (!pending) {
            console.warn("useUndoRedo: addDelta called without startCommand");
            return;
        }

        // Skip if we've already recorded this cell in this command
        // (for drag operations where user might move back over same cell)
        if (pending.seenKeys.has(key)) {
            return;
        }

        // Skip no-op changes
        if (areCellStatesEqual(before, after)) {
            return;
        }

        pending.seenKeys.add(key);
        pending.deltas.push({ key, before, after });
    }, []);

    const commitCommand = commitPendingToHistory;

    const cancelCommand = useCallback(() => {
        pendingCommandRef.current = null;
    }, []);

    const undo = useCallback((): CellDelta[] | null => {
        // Commit any pending command first so we undo the most recent action
        if (pendingCommandRef.current && pendingCommandRef.current.deltas.length > 0) {
            commitPendingToHistory();
        }

        const currentHistory = historyRef.current;
        if (currentHistory.past.length === 0) {
            return null;
        }

        const command = currentHistory.past.at(-1)!;

        const newHistory: UndoHistory = {
            past: currentHistory.past.slice(0, -1),
            future: [command, ...currentHistory.future],
        };

        historyRef.current = newHistory;
        setHistory(newHistory);

        return command.deltas;
    }, [commitPendingToHistory]);

    const redo = useCallback((): CellDelta[] | null => {
        const currentHistory = historyRef.current;
        if (currentHistory.future.length === 0) {
            return null;
        }

        const command = currentHistory.future[0];

        const newHistory: UndoHistory = {
            past: [...currentHistory.past, command],
            future: currentHistory.future.slice(1),
        };

        historyRef.current = newHistory;
        setHistory(newHistory);

        return command.deltas;
    }, []);

    const clearHistory = useCallback(() => {
        historyRef.current = INITIAL_HISTORY;
        setHistory(INITIAL_HISTORY);
        pendingCommandRef.current = null;
    }, []);

    return {
        canUndo,
        canRedo,
        undoCount,
        redoCount,
        startCommand,
        addDelta,
        commitCommand,
        cancelCommand,
        undo,
        redo,
        clearHistory,
    };
}
