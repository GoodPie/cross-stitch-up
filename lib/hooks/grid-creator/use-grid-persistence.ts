"use client";

/**
 * Grid Creator - Persistence Hook
 *
 * Provides debounced auto-save and state restoration for the grid creator.
 * Handles SSR safety and coordinates state across multiple hooks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { saveState, loadState, clearState, type GridState } from "@/lib/tools/grid-creator/storage";

export interface UseGridPersistenceOptions {
    /** Debounce delay in milliseconds (default: 500) */
    debounceMs?: number;
}

export interface UseGridPersistenceReturn {
    /** Whether initial state restoration is in progress (always false on client) */
    isRestoring: boolean;
    /** Initial state loaded from storage (null if none or on server) */
    initialState: GridState | null;
    /** Save partial state updates (debounced) */
    saveState: (state: Partial<GridState>) => void;
    /** Clear all persisted state */
    clearPersistedState: () => void;
}

// Cache for client-side state - loaded once per page load
let cachedState: GridState | null | undefined = undefined;
let cacheLoaded = false;

function getInitialState(): GridState | null {
    // Only load once per page, cache the result
    if (!cacheLoaded && typeof window !== "undefined") {
        cachedState = loadState();
        cacheLoaded = true;
    }
    return cachedState ?? null;
}

/**
 * Hook for managing grid state persistence to localStorage.
 *
 * Features:
 * - Auto-loads state on mount (SSR-safe via lazy state initializer)
 * - Debounced saving to avoid performance issues
 * - Partial state updates are merged before saving
 *
 * @example
 * ```tsx
 * const { initialState, saveState, clearPersistedState } = useGridPersistence();
 *
 * // Use initialState to hydrate component state
 * const [config] = useState(initialState?.config ?? defaultConfig);
 *
 * // Save on state changes
 * useEffect(() => {
 *   saveState({ cells, config });
 * }, [cells, config, saveState]);
 *
 * // Clear on "New Grid"
 * const handleReset = () => {
 *   clearPersistedState();
 *   // ... reset other state
 * };
 * ```
 */
export function useGridPersistence(options: UseGridPersistenceOptions = {}): UseGridPersistenceReturn {
    const { debounceMs = 500 } = options;

    // Load initial state from cache using lazy initializer (SSR-safe)
    // On server: returns null (typeof window === "undefined")
    // On client: loads from localStorage once, caches for all future calls
    const [initialState] = useState<GridState | null>(getInitialState);

    // Refs for debouncing
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingStateRef = useRef<Partial<GridState>>({});
    const currentStateRef = useRef<GridState | null>(initialState);

    // Debounced save function
    const debouncedSave = useCallback(
        (partialState: Partial<GridState>) => {
            // Merge with pending state
            pendingStateRef.current = {
                ...pendingStateRef.current,
                ...partialState,
            };

            // Clear existing timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Set new debounced save
            saveTimeoutRef.current = setTimeout(() => {
                // Merge pending updates with current full state
                const fullState = {
                    ...currentStateRef.current,
                    ...pendingStateRef.current,
                } as GridState;

                // Ensure we have all required fields before saving
                if (fullState.config && fullState.cells) {
                    saveState(fullState);
                    currentStateRef.current = fullState;
                }

                pendingStateRef.current = {};
            }, debounceMs);
        },
        [debounceMs]
    );

    // Clear persisted state
    const clearPersistedState = useCallback(() => {
        // Cancel any pending save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        pendingStateRef.current = {};
        currentStateRef.current = null;
        // Clear the cache so next page load starts fresh
        cachedState = null;
        cacheLoaded = false;
        clearState();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Flush any pending saves before unmount
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (Object.keys(pendingStateRef.current).length > 0) {
                const fullState = {
                    ...currentStateRef.current,
                    ...pendingStateRef.current,
                } as GridState;
                if (fullState.config && fullState.cells) {
                    saveState(fullState);
                }
            }
        };
    }, []);

    return {
        // With lazy state initializer, state is loaded synchronously on client
        // so isRestoring is always false
        isRestoring: false,
        initialState,
        saveState: debouncedSave,
        clearPersistedState,
    };
}
