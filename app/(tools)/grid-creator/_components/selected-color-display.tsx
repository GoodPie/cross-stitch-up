"use client";

import { Label } from "@/components/ui/label";
import { SymbolPicker } from "./symbol-picker";
import type { SelectedColor, SymbolDefinition } from "@/lib/tools/grid-creator";

interface SelectedColorDisplayProps {
    readonly selectedColor: SelectedColor | null;
    readonly onSymbolSelect: (symbol: SymbolDefinition) => void;
}

export function SelectedColorDisplay({ selectedColor, onSymbolSelect }: SelectedColorDisplayProps) {
    return (
        <div className="border-b p-3">
            <Label className="text-muted-foreground mb-2 block text-xs uppercase">Selected Color</Label>
            {selectedColor ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-md border shadow-sm"
                            style={{ backgroundColor: selectedColor.hex }}
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium">{selectedColor.name}</p>
                            <p className="text-muted-foreground truncate text-xs">{selectedColor.threadCode}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">Symbol:</span>
                        <SymbolPicker
                            selectedSymbol={selectedColor.symbol || null}
                            onSymbolSelect={onSymbolSelect}
                            backgroundColor={selectedColor.hex}
                        />
                    </div>
                </div>
            ) : (
                <div className="text-muted-foreground flex h-10 items-center text-sm">No color selected</div>
            )}
        </div>
    );
}
