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
import type { StitchConfig } from "@/lib/tools/merge/types";

interface StitchConfigProps {
    readonly onContinue: (config: StitchConfig) => void;
}

const PRESETS = [
    { label: "Custom", value: "custom" },
    { label: "100 x 100", value: "100x100" },
    { label: "150 x 100", value: "150x100" },
    { label: "150 x 150", value: "150x150" },
    { label: "200 x 150", value: "200x150" },
    { label: "200 x 200", value: "200x200" },
    { label: "250 x 200", value: "250x200" },
    { label: "300 x 200", value: "300x200" },
    { label: "300 x 300", value: "300x300" },
];

const TIPS = [
    "Check the pattern cover page or info sheet",
    'Look for "Design Size" or "Stitch Count"',
    "Usually listed as width x height (e.g., 200 x 150)",
];

const CONSTRAINTS = {
    min: 1,
    max: 1000,
};

export function StitchConfigForm({ onContinue }: StitchConfigProps) {
    const [width, setWidth] = useState<string>("");
    const [height, setHeight] = useState<string>("");
    const [preset, setPreset] = useState<string>("custom");
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
            onContinue({ width: widthNum, height: heightNum });
        }
    };

    return (
        <div className="space-y-6">
            <ConfigFormCard>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <ConfigFormHeader
                        icon={<Grid3X3 className="h-8 w-8" />}
                        title="Pattern Dimensions"
                        description="Enter the total size of your cross stitch pattern in stitches"
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
                            widthPlaceholder="e.g., 200"
                            heightPlaceholder="e.g., 150"
                        />
                        <Button type="submit" size="lg" disabled={!isValid} className="w-full">
                            Continue to Upload
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </ConfigFormCard>
            <TipsCard title="Where to find dimensions" tips={TIPS} />
        </div>
    );
}
