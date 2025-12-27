"use client";

import { Palette } from "lucide-react";
import { SelectedColorDisplay } from "./selected-color-display";
import { RecentColors } from "./recent-colors";
import { ThreadBrowser } from "./thread-browser";
import type { SelectedColor, SymbolDefinition } from "@/lib/tools/grid-creator";
import type { ThreadColour } from "@/lib/tools/threads/types";

interface ColorPaletteProps {
    readonly threads: ThreadColour[];
    readonly brands: string[];
    readonly selectedColor: SelectedColor | null;
    readonly recentColors: SelectedColor[];
    readonly onColorSelect: (color: SelectedColor) => void;
    readonly onSymbolSelect: (symbol: SymbolDefinition) => void;
}

export function ColorPalette({
    threads,
    brands,
    selectedColor,
    recentColors,
    onColorSelect,
    onSymbolSelect,
}: ColorPaletteProps) {
    return (
        <div className="bg-background flex h-full w-64 flex-col border-l lg:w-72 xl:w-80">
            {/* Header */}
            <div className="border-b p-3">
                <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <h3 className="font-medium">Color Palette</h3>
                </div>
            </div>

            <SelectedColorDisplay selectedColor={selectedColor} onSymbolSelect={onSymbolSelect} />

            <RecentColors colors={recentColors} selectedColor={selectedColor} onColorSelect={onColorSelect} />

            <ThreadBrowser
                threads={threads}
                brands={brands}
                selectedColor={selectedColor}
                onColorSelect={onColorSelect}
            />
        </div>
    );
}
