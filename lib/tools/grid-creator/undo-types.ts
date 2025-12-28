/**
 * Grid Creator Tool - Undo/Redo Types
 *
 * Types and constants for the undo/redo system using command pattern with delta storage.
 */

import type { CellState } from "./types";

/**
 * Represents a single cell change within a command.
 * Stores both before and after states for bi-directional traversal.
 */
export interface CellDelta {
    /** Cell key in "row-col" format */
    key: string;
    /** State before the change (undefined = cell didn't exist) */
    before: CellState | undefined;
    /** State after the change (undefined = cell was deleted) */
    after: CellState | undefined;
}

/**
 * Type of operation for the command.
 */
export type CommandType = "paint" | "erase" | "select";

/**
 * A command represents a single undoable operation.
 * Can contain multiple cell changes (e.g., drag-painting).
 */
export interface UndoCommand {
    /** Unique identifier for debugging/logging */
    id: string;
    /** Timestamp for ordering/debugging */
    timestamp: number;
    /** Type of operation for potential UI hints */
    type: CommandType;
    /** All cell changes in this operation */
    deltas: CellDelta[];
}

/**
 * History state structure.
 */
export interface UndoHistory {
    /** Past commands (most recent at end) */
    past: UndoCommand[];
    /** Future commands for redo (most recent at start) */
    future: UndoCommand[];
}

/**
 * Constants for history management.
 */
export const UNDO_CONSTRAINTS = {
    /** Maximum number of commands in history */
    MAX_HISTORY_SIZE: 100,
    /** Maximum total deltas across all history (memory guard) */
    MAX_TOTAL_DELTAS: 10000,
} as const;

/**
 * Helper to create a unique command ID.
 */
export function createCommandId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
