"use client";

import React, { useState } from "react";
import { ArrowRight, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GridConfig } from "@/lib/tools/grid-creator";
import { GRID_CONFIG_CONSTRAINTS } from "@/lib/tools/grid-creator";

interface GridConfigFormProps {
    readonly onSubmit: (config: GridConfig) => void;
}

const PRESETS = [
    { label: "Custom", value: "custom" },
    { label: "25 x 25 (Small)", value: "25x25" },
    { label: "50 x 50 (Default)", value: "50x50" },
    { label: "100 x 100", value: "100x100" },
    { label: "150 x 100", value: "150x100" },
    { label: "150 x 150", value: "150x150" },
    { label: "200 x 150", value: "200x150" },
    { label: "200 x 200", value: "200x200" },
    { label: "300 x 300", value: "300x300" },
    { label: "500 x 500 (Max)", value: "500x500" },
];

function parsePreset(value: string): { width: number; height: number } | null {
    if (value === "custom") return null;
    const [w, h] = value.split("x").map(Number);
    return { width: w, height: h };
}

export function GridConfigForm({ onSubmit }: GridConfigFormProps) {
    const [width, setWidth] = useState<string>(String(GRID_CONFIG_CONSTRAINTS.DEFAULT_WIDTH));
    const [height, setHeight] = useState<string>(String(GRID_CONFIG_CONSTRAINTS.DEFAULT_HEIGHT));
    const [preset, setPreset] = useState<string>("50x50");
    const [errors, setErrors] = useState<{
        width?: string;
        height?: string;
    }>({});

    const handlePresetChange = (value: string) => {
        setPreset(value);
        const parsed = parsePreset(value);
        if (parsed) {
            setWidth(String(parsed.width));
            setHeight(String(parsed.height));
            setErrors({});
        }
    };

    const validateDimension = (value: string, fieldName: string): string | undefined => {
        const trimmed = value.trim();

        // Check for non-numeric characters (parseInt would accept "50abc" as 50)
        if (!/^\d+$/.test(trimmed)) {
            return `${fieldName} must be a valid number`;
        }

        const num = Number.parseInt(trimmed, 10);
        if (Number.isNaN(num)) {
            return `${fieldName} must be a number`;
        }
        if (num < GRID_CONFIG_CONSTRAINTS.MIN_DIMENSION) {
            return `${fieldName} must be at least ${GRID_CONFIG_CONSTRAINTS.MIN_DIMENSION}`;
        }
        if (num > GRID_CONFIG_CONSTRAINTS.MAX_DIMENSION) {
            return `${fieldName} must be at most ${GRID_CONFIG_CONSTRAINTS.MAX_DIMENSION}`;
        }
        return undefined;
    };

    const handleWidthChange = (value: string) => {
        setWidth(value);
        setPreset("custom");
        const error = validateDimension(value, "Width");
        setErrors((prev) => ({ ...prev, width: error }));
    };

    const handleHeightChange = (value: string) => {
        setHeight(value);
        setPreset("custom");
        const error = validateDimension(value, "Height");
        setErrors((prev) => ({ ...prev, height: error }));
    };

    const widthNum = Number.parseInt(width, 10);
    const heightNum = Number.parseInt(height, 10);
    const isValid =
        !errors.width &&
        !errors.height &&
        widthNum >= GRID_CONFIG_CONSTRAINTS.MIN_DIMENSION &&
        widthNum <= GRID_CONFIG_CONSTRAINTS.MAX_DIMENSION &&
        heightNum >= GRID_CONFIG_CONSTRAINTS.MIN_DIMENSION &&
        heightNum <= GRID_CONFIG_CONSTRAINTS.MAX_DIMENSION;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onSubmit({ width: widthNum, height: heightNum });
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative">
                <div className="border-muted-foreground/30 rounded-2xl border-2 p-8 text-center md:p-12">
                    {/* Cross-stitch corner decorations */}
                    <div className="border-secondary-foreground/20 absolute top-3 left-3 h-6 w-6 rounded-tl border-t-2 border-l-2" />
                    <div className="border-secondary-foreground/20 absolute top-3 right-3 h-6 w-6 rounded-tr border-t-2 border-r-2" />
                    <div className="border-secondary-foreground/20 absolute bottom-3 left-3 h-6 w-6 rounded-bl border-b-2 border-l-2" />
                    <div className="border-secondary-foreground/20 absolute right-3 bottom-3 h-6 w-6 rounded-br border-r-2 border-b-2" />

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <div className="bg-accent text-accent-foreground inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                                <Grid3X3 className="h-8 w-8" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-foreground font-serif text-xl font-semibold md:text-2xl">
                                    Grid Dimensions
                                </h2>
                                <p className="text-muted-foreground">
                                    Enter the size of your cross stitch grid in stitches (1-500)
                                </p>
                            </div>
                        </div>

                        <div className="mx-auto max-w-md space-y-6">
                            {/* Preset selector */}
                            <div className="space-y-2">
                                <Label htmlFor="preset">Common Sizes</Label>
                                <Select value={preset} onValueChange={handlePresetChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a preset..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRESETS.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dimension inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="width">Width (stitches)</Label>
                                    <Input
                                        id="width"
                                        type="number"
                                        min={GRID_CONFIG_CONSTRAINTS.MIN_DIMENSION}
                                        max={GRID_CONFIG_CONSTRAINTS.MAX_DIMENSION}
                                        placeholder="e.g., 50"
                                        value={width}
                                        onChange={(e) => handleWidthChange(e.target.value)}
                                        aria-invalid={!!errors.width}
                                        aria-describedby={errors.width ? "width-error" : undefined}
                                    />
                                    {errors.width && (
                                        <p id="width-error" className="text-destructive text-sm">
                                            {errors.width}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="height">Height (stitches)</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        min={GRID_CONFIG_CONSTRAINTS.MIN_DIMENSION}
                                        max={GRID_CONFIG_CONSTRAINTS.MAX_DIMENSION}
                                        placeholder="e.g., 50"
                                        value={height}
                                        onChange={(e) => handleHeightChange(e.target.value)}
                                        aria-invalid={!!errors.height}
                                        aria-describedby={errors.height ? "height-error" : undefined}
                                    />
                                    {errors.height && (
                                        <p id="height-error" className="text-destructive text-sm">
                                            {errors.height}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" size="lg" disabled={!isValid} className="w-full">
                                Create Grid
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tips section */}
            <div className="border-border/50 bg-accent/50 rounded-xl border p-4">
                <h3 className="text-foreground mb-2 flex items-center gap-2 font-medium">
                    <span className="text-lg">💡</span> Grid Creation Tips
                </h3>
                <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Start with a smaller grid (50x50) to practice your design</li>
                    <li>• Maximum grid size is 500x500 for optimal performance</li>
                    <li>• You can zoom and pan to navigate larger grids</li>
                </ul>
            </div>
        </div>
    );
}
