import { useState, useCallback } from "react";
import type { SelectedColor, SymbolDefinition, ToolMode } from "@/lib/tools/grid-creator";
import { PALETTE_CONSTRAINTS, DEFAULT_SELECTED_COLOR } from "@/lib/tools/grid-creator";

interface UseColorSelectionOptions {
    onToolModeChange?: (mode: ToolMode) => void;
}

interface UseColorSelectionReturn {
    selectedColor: SelectedColor | null;
    recentColors: SelectedColor[];
    colorSymbolMap: Map<string, string>;
    handleColorSelect: (color: SelectedColor) => void;
    handleSymbolSelect: (symbol: SymbolDefinition) => void;
    handleEyedrop: (color: SelectedColor | null) => void;
    resetColorSelection: () => void;
}

/**
 * Hook for managing color selection state.
 *
 * Handles:
 * - Current selected color with symbol mapping
 * - Recent colors list (max 16)
 * - Color-to-symbol mapping for consistent display
 * - Eyedropper picking from canvas
 */
export function useColorSelection(options?: UseColorSelectionOptions): UseColorSelectionReturn {
    const [selectedColor, setSelectedColor] = useState<SelectedColor | null>(DEFAULT_SELECTED_COLOR);
    const [recentColors, setRecentColors] = useState<SelectedColor[]>([DEFAULT_SELECTED_COLOR]);
    const [colorSymbolMap, setColorSymbolMap] = useState<Map<string, string>>(new Map());

    const handleColorSelect = useCallback(
        (color: SelectedColor) => {
            // Include symbol from the map if one exists for this color
            const symbol = colorSymbolMap.get(color.hex);
            const colorWithSymbol = symbol ? { ...color, symbol } : color;

            setSelectedColor(colorWithSymbol);

            // Add to recent colors (avoid duplicates, max 16)
            setRecentColors((prev) => {
                const filtered = prev.filter((c) => c.hex !== colorWithSymbol.hex);
                const updated = [colorWithSymbol, ...filtered];
                return updated.slice(0, PALETTE_CONSTRAINTS.MAX_RECENT_COLORS);
            });

            // Auto-switch to paint mode when selecting a color
            options?.onToolModeChange?.("paint");
        },
        [colorSymbolMap, options]
    );

    const handleSymbolSelect = useCallback(
        (symbol: SymbolDefinition) => {
            if (!selectedColor) return;

            // Update the color-symbol mapping
            setColorSymbolMap((prev) => {
                const newMap = new Map(prev);
                newMap.set(selectedColor.hex, symbol.character);
                return newMap;
            });

            // Update current selected color with the symbol
            setSelectedColor((prev) => (prev ? { ...prev, symbol: symbol.character } : null));

            // Also update recent colors to include the new symbol
            setRecentColors((prev) =>
                prev.map((c) => (c.hex === selectedColor.hex ? { ...c, symbol: symbol.character } : c))
            );
        },
        [selectedColor]
    );

    const handleEyedrop = useCallback(
        (color: SelectedColor | null) => {
            if (color) {
                setSelectedColor(color);

                // Add to recent colors
                setRecentColors((prev) => {
                    const filtered = prev.filter((c) => c.hex !== color.hex);
                    const updated = [color, ...filtered];
                    return updated.slice(0, PALETTE_CONSTRAINTS.MAX_RECENT_COLORS);
                });

                // Switch to paint mode after picking
                options?.onToolModeChange?.("paint");
            }
        },
        [options]
    );

    const resetColorSelection = useCallback(() => {
        setSelectedColor(DEFAULT_SELECTED_COLOR);
        setRecentColors([DEFAULT_SELECTED_COLOR]);
        setColorSymbolMap(new Map());
    }, []);

    return {
        selectedColor,
        recentColors,
        colorSymbolMap,
        handleColorSelect,
        handleSymbolSelect,
        handleEyedrop,
        resetColorSelection,
    };
}
