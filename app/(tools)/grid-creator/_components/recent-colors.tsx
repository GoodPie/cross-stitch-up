"use client";

import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ColorSwatch } from "./color-swatch";
import type { SelectedColor } from "@/lib/tools/grid-creator";

interface RecentColorsProps {
    readonly colors: SelectedColor[];
    readonly selectedColor: SelectedColor | null;
    readonly onColorSelect: (color: SelectedColor) => void;
}

export function RecentColors({ colors, selectedColor, onColorSelect }: RecentColorsProps) {
    if (colors.length === 0) {
        return null;
    }

    return (
        <div className="border-b p-3">
            <Label className="text-muted-foreground mb-2 block text-xs uppercase">Recent Colors</Label>
            <div className="flex flex-wrap gap-1">
                <TooltipProvider delayDuration={200}>
                    {colors.map((color) => (
                        <ColorSwatch
                            key={color.threadCode}
                            color={color.hex}
                            label={color.name}
                            sublabel={color.threadCode}
                            isSelected={selectedColor?.hex === color.hex}
                            size="sm"
                            onClick={() => onColorSelect(color)}
                        />
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
}
