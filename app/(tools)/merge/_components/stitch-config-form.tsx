"use client";

import React, { useState } from "react";
import { ArrowRight, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StitchConfig } from "@/lib/tools/merge/types";

interface StitchConfigProps {
  onContinue: (config: StitchConfig) => void;
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

  const widthNum = parseInt(width, 10);
  const heightNum = parseInt(height, 10);
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
        <div className="rounded-2xl border-2 border-muted-foreground/30 p-8 md:p-12 text-center">
          {/* Cross-stitch corner decorations */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-secondary-foreground/20 rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-secondary-foreground/20 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-secondary-foreground/20 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-secondary-foreground/20 rounded-br" />

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-accent-foreground">
                <Grid3X3 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
                  Pattern Dimensions
                </h2>
                <p className="text-muted-foreground">
                  Enter the total size of your cross stitch pattern in stitches
                </p>
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-6">
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

              <Button
                type="submit"
                size="lg"
                disabled={!isValid}
                className="w-full"
              >
                Continue to Upload
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Tips section */}
      <div className="bg-accent/50 rounded-xl p-4 border border-border/50">
        <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span> Where to find dimensions
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Check the pattern cover page or info sheet</li>
          <li>• Look for &#34;Design Size&#34; or &#34;Stitch Count&#34;</li>
          <li>• Usually listed as width × height (e.g., 200 × 150)</li>
        </ul>
      </div>
    </div>
  );
}
