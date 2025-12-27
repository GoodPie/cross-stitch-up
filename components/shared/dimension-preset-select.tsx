"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DimensionPreset } from "@/lib/shared/dimension-utils";

interface DimensionPresetSelectProps {
    readonly presets: DimensionPreset[];
    readonly value: string;
    readonly onValueChange: (value: string) => void;
    readonly label?: string;
}

/**
 * Dropdown for selecting common dimension presets.
 */
export function DimensionPresetSelect({
    presets,
    value,
    onValueChange,
    label = "Common Sizes",
}: DimensionPresetSelectProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="preset">{label}</Label>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a preset..." />
                </SelectTrigger>
                <SelectContent>
                    {presets.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                            {p.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
