import { useState, useCallback } from "react";
import type { GridConfig, GridCreatorPhase } from "@/lib/tools/grid-creator";

interface UseGridPhaseOptions {
    onReset?: () => void;
}

interface UseGridPhaseReturn {
    phase: GridCreatorPhase;
    config: GridConfig | null;
    handleConfigSubmit: (config: GridConfig) => void;
    handleGridReady: () => void;
    handleReset: () => void;
}

/**
 * Hook for managing the Grid Creator phase state machine.
 *
 * Phases:
 * - config: User entering dimensions
 * - rendering: Grid being generated
 * - interactive: Grid ready for interaction
 */
export function useGridPhase(options?: UseGridPhaseOptions): UseGridPhaseReturn {
    const [phase, setPhase] = useState<GridCreatorPhase>("config");
    const [config, setConfig] = useState<GridConfig | null>(null);

    const handleConfigSubmit = useCallback((newConfig: GridConfig) => {
        setConfig(newConfig);
        setPhase("rendering");
    }, []);

    const handleGridReady = useCallback(() => {
        setPhase("interactive");
    }, []);

    const handleReset = useCallback(() => {
        setPhase("config");
        setConfig(null);
        options?.onReset?.();
    }, [options]);

    return {
        phase,
        config,
        handleConfigSubmit,
        handleGridReady,
        handleReset,
    };
}
