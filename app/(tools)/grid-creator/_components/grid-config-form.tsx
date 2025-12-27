"use client";

import React, { useState } from "react";
import { ArrowRight, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfigFormCard } from "@/components/shared/config-form-card";
import { ConfigFormHeader } from "@/components/shared/config-form-header";
import { DimensionPresetSelect } from "@/components/shared/dimension-preset-select";
import { DimensionInputs } from "@/components/shared/dimension-inputs";
import { TipsCard } from "@/components/shared/tips-card";
import { parsePreset, validateDimension } from "@/lib/shared/dimension-utils";
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

const TIPS = [
    "Start with a smaller grid (50x50) to practice your design",
    "Maximum grid size is 500x500 for optimal performance",
    "You can zoom and pan to navigate larger grids",
];

const CONSTRAINTS = {
    min: GRID_CONFIG_CONSTRAINTS.MIN_DIMENSION,
    max: GRID_CONFIG_CONSTRAINTS.MAX_DIMENSION,
};

export function GridConfigForm({ onSubmit }: GridConfigFormProps) {
    const [width, setWidth] = useState<string>(String(GRID_CONFIG_CONSTRAINTS.DEFAULT_WIDTH));
    const [height, setHeight] = useState<string>(String(GRID_CONFIG_CONSTRAINTS.DEFAULT_HEIGHT));
    const [preset, setPreset] = useState<string>("50x50");
    const [errors, setErrors] = useState<{ width?: string; height?: string }>({});

    const handlePresetChange = (value: string) => {
        setPreset(value);
        const parsed = parsePreset(value);
        if (parsed) {
            setWidth(String(parsed.width));
            setHeight(String(parsed.height));
            setErrors({});
        }
    };

    const handleWidthChange = (value: string) => {
        setWidth(value);
        setPreset("custom");
        const error = validateDimension(value, "Width", CONSTRAINTS);
        setErrors((prev) => ({ ...prev, width: error }));
    };

    const handleHeightChange = (value: string) => {
        setHeight(value);
        setPreset("custom");
        const error = validateDimension(value, "Height", CONSTRAINTS);
        setErrors((prev) => ({ ...prev, height: error }));
    };

    const widthNum = Number.parseInt(width, 10);
    const heightNum = Number.parseInt(height, 10);
    const isValid =
        !errors.width &&
        !errors.height &&
        widthNum >= CONSTRAINTS.min &&
        widthNum <= CONSTRAINTS.max &&
        heightNum >= CONSTRAINTS.min &&
        heightNum <= CONSTRAINTS.max;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onSubmit({ width: widthNum, height: heightNum });
        }
    };

    return (
        <div className="space-y-6">
            <ConfigFormCard>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <ConfigFormHeader
                        icon={<Grid3X3 className="h-8 w-8" />}
                        title="Grid Dimensions"
                        description="Enter the size of your cross stitch grid in stitches (1-500)"
                    />
                    <div className="mx-auto max-w-md space-y-6">
                        <DimensionPresetSelect presets={PRESETS} value={preset} onValueChange={handlePresetChange} />
                        <DimensionInputs
                            width={width}
                            height={height}
                            onWidthChange={handleWidthChange}
                            onHeightChange={handleHeightChange}
                            widthError={errors.width}
                            heightError={errors.height}
                            min={CONSTRAINTS.min}
                            max={CONSTRAINTS.max}
                        />
                        <Button type="submit" size="lg" disabled={!isValid} className="w-full">
                            Create Grid
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </ConfigFormCard>
            <TipsCard title="Grid Creation Tips" tips={TIPS} />
        </div>
    );
}
