import { ColorPalette } from "./color-palette";
import type { SelectedColor, SymbolDefinition } from "@/lib/tools/grid-creator";
import type { ThreadColour } from "@/lib/tools/threads/types";

interface PaletteSidebarProps {
    readonly threads: ThreadColour[];
    readonly brands: string[];
    readonly selectedColor: SelectedColor | null;
    readonly recentColors: SelectedColor[];
    readonly showPalette: boolean;
    readonly onColorSelect: (color: SelectedColor) => void;
    readonly onSymbolSelect: (symbol: SymbolDefinition) => void;
    readonly onClose: () => void;
}

export function PaletteSidebar({
    threads,
    brands,
    selectedColor,
    recentColors,
    showPalette,
    onColorSelect,
    onSymbolSelect,
    onClose,
}: PaletteSidebarProps) {
    return (
        <div
            className={`${showPalette ? "fixed inset-x-0 top-[72px] bottom-0 z-50 md:relative md:inset-auto md:top-auto" : "hidden md:block"}`}
        >
            {/* Mobile backdrop */}
            {showPalette && (
                <button
                    type="button"
                    className="bg-background/80 absolute inset-0 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                    aria-label="Close color palette"
                />
            )}

            {/* Palette */}
            <div className="pointer-events-none relative h-full md:static">
                <div className="pointer-events-auto absolute right-0 h-full md:static">
                    <ColorPalette
                        threads={threads}
                        brands={brands}
                        selectedColor={selectedColor}
                        recentColors={recentColors}
                        onColorSelect={onColorSelect}
                        onSymbolSelect={onSymbolSelect}
                    />
                </div>
            </div>
        </div>
    );
}
