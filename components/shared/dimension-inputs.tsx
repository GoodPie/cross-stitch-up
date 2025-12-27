"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DimensionInputsProps {
    readonly width: string;
    readonly height: string;
    readonly onWidthChange: (value: string) => void;
    readonly onHeightChange: (value: string) => void;
    readonly widthError?: string;
    readonly heightError?: string;
    readonly min?: number;
    readonly max?: number;
    readonly widthPlaceholder?: string;
    readonly heightPlaceholder?: string;
}

/**
 * Width and height input pair with optional validation errors.
 */
export function DimensionInputs({
    width,
    height,
    onWidthChange,
    onHeightChange,
    widthError,
    heightError,
    min = 1,
    max,
    widthPlaceholder = "e.g., 50",
    heightPlaceholder = "e.g., 50",
}: DimensionInputsProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="width">Width (stitches)</Label>
                <Input
                    id="width"
                    type="number"
                    min={min}
                    max={max}
                    placeholder={widthPlaceholder}
                    value={width}
                    onChange={(e) => onWidthChange(e.target.value)}
                    aria-invalid={!!widthError}
                    aria-describedby={widthError ? "width-error" : undefined}
                />
                {widthError && (
                    <p id="width-error" className="text-destructive text-sm">
                        {widthError}
                    </p>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="height">Height (stitches)</Label>
                <Input
                    id="height"
                    type="number"
                    min={min}
                    max={max}
                    placeholder={heightPlaceholder}
                    value={height}
                    onChange={(e) => onHeightChange(e.target.value)}
                    aria-invalid={!!heightError}
                    aria-describedby={heightError ? "height-error" : undefined}
                />
                {heightError && (
                    <p id="height-error" className="text-destructive text-sm">
                        {heightError}
                    </p>
                )}
            </div>
        </div>
    );
}
