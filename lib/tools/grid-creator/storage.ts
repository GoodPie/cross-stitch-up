/**
 * Grid Creator - localStorage Persistence
 *
 * Handles saving and restoring grid state across page refreshes.
 * Uses Map serialization to handle cells and colorSymbolMap.
 */

import type { GridConfig, CellState, ViewportState, SelectedColor, ToolMode, ViewMode } from "./types";

// Storage configuration
const STORAGE_KEY = "grid-creator-state";
const STORAGE_VERSION = 1;

/**
 * Serialized state format for localStorage.
 * Maps are converted to entry arrays for JSON compatibility.
 */
export interface PersistedGridState {
    version: number;
    savedAt: number;
    config: GridConfig;
    cells: [string, CellState][];
    viewport: ViewportState;
    selectedColor: SelectedColor | null;
    recentColors: SelectedColor[];
    colorSymbolMap: [string, string][];
    toolMode: ToolMode;
    viewMode: ViewMode;
}

/**
 * Runtime state format used by the application.
 * Maps are restored to their native form.
 */
export interface GridState {
    config: GridConfig;
    cells: Map<string, CellState>;
    viewport: ViewportState;
    selectedColor: SelectedColor | null;
    recentColors: SelectedColor[];
    colorSymbolMap: Map<string, string>;
    toolMode: ToolMode;
    viewMode: ViewMode;
}

/**
 * Check if localStorage is available (SSR safety).
 */
function isStorageAvailable(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const testKey = "__storage_test__";
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

/**
 * Serialize a Map to an array of entries for JSON storage.
 */
function serializeMap<K, V>(map: Map<K, V>): [K, V][] {
    return Array.from(map.entries());
}

/**
 * Deserialize an array of entries back to a Map.
 */
function deserializeMap<K, V>(entries: [K, V][]): Map<K, V> {
    return new Map(entries);
}

/**
 * Validate the structure of persisted state.
 * Returns true if the data has the expected shape.
 */
function isValidPersistedState(data: unknown): data is PersistedGridState {
    if (!data || typeof data !== "object") return false;

    const state = data as Record<string, unknown>;

    // Check required fields exist
    if (typeof state.version !== "number") return false;
    if (typeof state.savedAt !== "number") return false;

    // Check config
    if (!state.config || typeof state.config !== "object") return false;
    const config = state.config as Record<string, unknown>;
    if (typeof config.width !== "number" || typeof config.height !== "number") return false;

    // Check arrays
    if (!Array.isArray(state.cells)) return false;
    if (!Array.isArray(state.recentColors)) return false;
    if (!Array.isArray(state.colorSymbolMap)) return false;

    // Check viewport
    if (!state.viewport || typeof state.viewport !== "object") return false;
    const viewport = state.viewport as Record<string, unknown>;
    if (
        typeof viewport.scale !== "number" ||
        typeof viewport.offsetX !== "number" ||
        typeof viewport.offsetY !== "number"
    )
        return false;

    // Check tool and view modes
    if (!["select", "paint", "erase", "eyedropper"].includes(state.toolMode as string)) return false;
    return ["color", "symbol", "both"].includes(state.viewMode as string);
}

/**
 * Convert runtime state to serializable format.
 */
function serializeState(state: GridState): PersistedGridState {
    return {
        version: STORAGE_VERSION,
        savedAt: Date.now(),
        config: state.config,
        cells: serializeMap(state.cells),
        viewport: state.viewport,
        selectedColor: state.selectedColor,
        recentColors: state.recentColors,
        colorSymbolMap: serializeMap(state.colorSymbolMap),
        toolMode: state.toolMode,
        viewMode: state.viewMode,
    };
}

/**
 * Convert serialized format back to runtime state.
 */
function deserializeState(data: PersistedGridState): GridState {
    return {
        config: data.config,
        cells: deserializeMap(data.cells),
        viewport: data.viewport,
        selectedColor: data.selectedColor,
        recentColors: data.recentColors,
        colorSymbolMap: deserializeMap(data.colorSymbolMap),
        toolMode: data.toolMode,
        viewMode: data.viewMode,
    };
}

/**
 * Save grid state to localStorage.
 * Handles serialization of Maps and error cases.
 */
export function saveState(state: GridState): void {
    if (!isStorageAvailable()) return;

    try {
        const serialized = serializeState(state);
        const json = JSON.stringify(serialized);
        localStorage.setItem(STORAGE_KEY, json);
    } catch (error) {
        // Log but don't throw - saving is best-effort
        console.error("[GridCreator] Failed to save state:", error);
    }
}

/**
 * Load grid state from localStorage.
 * Returns null if no state exists or if state is invalid.
 */
export function loadState(): GridState | null {
    if (!isStorageAvailable()) return null;

    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return null;

        const parsed = JSON.parse(json);

        // Validate structure
        if (!isValidPersistedState(parsed)) {
            console.warn("[GridCreator] Invalid persisted state, clearing");
            clearState();
            return null;
        }

        // Check version for future migrations
        if (parsed.version !== STORAGE_VERSION) {
            console.warn(`[GridCreator] State version mismatch (${parsed.version} vs ${STORAGE_VERSION}), clearing`);
            clearState();
            return null;
        }

        return deserializeState(parsed);
    } catch (error) {
        console.error("[GridCreator] Failed to load state:", error);
        clearState();
        return null;
    }
}

/**
 * Clear persisted state from localStorage.
 */
export function clearState(): void {
    if (!isStorageAvailable()) return;

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("[GridCreator] Failed to clear state:", error);
    }
}

/**
 * Check if persisted state exists in localStorage.
 */
export function hasPersistedState(): boolean {
    if (!isStorageAvailable()) return false;

    try {
        return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
        return false;
    }
}
