"use client";

import React, { useState } from "react";
import { ArrowRight, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StitchConfig } from "@/lib/tools/merge/types";

interface StitchConfigProps {
    readonly onContinue: (config: StitchConfig) => void;
}

const PRESETS = [
    { label: "Custom", value: "custom" },
    { label: "100 × 100", value: "100x100" },
    { label: "150 × 100", value: "150x100" },
    { label: "150 × 150", value: "150x150" },
    { label: "200 × 150", value: "200x150" },
    { label: "200 × 200", value: "200x200" },
    { label: "250 × 200", value: "250x200" },
    { label: "300 × 200", value: "300x200" },
    { label: "300 × 300", value: "300x300" },
];

function parsePreset(value: string): { width: number; height: number } | null {
    if (value === "custom") return null;
    const [w, h] = value.split("x").map(Number);
    return { width: w, height: h };
}

export function StitchConfigForm({ onContinue }: StitchConfigProps) {
    const [width, setWidth] = useState<string>("");
    const [height, setHeight] = useState<string>("");
    const [preset, setPreset] = useState<string>("custom");

    const handlePresetChange = (value: string) => {
        setPreset(value);
        const parsed = parsePreset(value);
        if (parsed) {
            setWidth(String(parsed.width));
            setHeight(String(parsed.height));
        }
    };

    const handleWidthChange = (value: string) => {
        setWidth(value);
        setPreset("custom");
    };

    const handleHeightChange = (value: string) => {
        setHeight(value);
        setPreset("custom");
    };

    const widthNum = Number.parseInt(width, 10);
    const heightNum = Number.parseInt(height, 10);
    const isValid = widthNum > 0 && heightNum > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onContinue({ width: widthNum, height: heightNum });
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
                                    Pattern Dimensions
                                </h2>
                                <p className="text-muted-foreground">
                                    Enter the total size of your cross stitch pattern in stitches
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
                                        min="1"
                                        placeholder="e.g., 200"
                                        value={width}
                                        onChange={(e) => handleWidthChange(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="height">Height (stitches)</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        min="1"
                                        placeholder="e.g., 150"
                                        value={height}
                                        onChange={(e) => handleHeightChange(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button type="submit" size="lg" disabled={!isValid} className="w-full">
                                Continue to Upload
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tips section */}
            <div className="bg-accent/50 border-border/50 rounded-xl border p-4">
                <h3 className="text-foreground mb-2 flex items-center gap-2 font-medium">
                    <span className="text-lg">💡</span> Where to find dimensions
                </h3>
                <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Check the pattern cover page or info sheet</li>
                    <li>• Look for &#34;Design Size&#34; or &#34;Stitch Count&#34;</li>
                    <li>• Usually listed as width × height (e.g., 200 × 150)</li>
                </ul>
            </div>
        </div>
    );
}
