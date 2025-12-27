"use client";

import React from "react";
import { Palette, Type, Layers } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ViewMode } from "@/lib/tools/grid-creator";

interface ViewModeSelectorProps {
    readonly mode: ViewMode;
    readonly onModeChange: (mode: ViewMode) => void;
}

const VIEW_MODE_CONFIG: {
    mode: ViewMode;
    icon: React.ElementType;
    label: string;
    shortcut: string;
    description: string;
}[] = [
    {
        mode: "color",
        icon: Palette,
        label: "Color",
        shortcut: "1",
        description: "Show cell colors only",
    },
    {
        mode: "symbol",
        icon: Type,
        label: "Symbol",
        shortcut: "2",
        description: "Show symbols only",
    },
    {
        mode: "both",
        icon: Layers,
        label: "Both",
        shortcut: "3",
        description: "Show colors with symbols",
    },
];

export function ViewModeSelector({ mode, onModeChange }: ViewModeSelectorProps) {
    // Handle keyboard shortcuts
    React.useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ignore if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const key = e.key;
            const viewMode = VIEW_MODE_CONFIG.find((v) => v.shortcut === key);

            if (viewMode) {
                e.preventDefault();
                onModeChange(viewMode.mode);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onModeChange]);

    return (
        <TooltipProvider delayDuration={300}>
            <div className="bg-background flex items-center gap-2 rounded-lg border p-1 shadow-sm">
                <span className="text-muted-foreground px-2 text-xs font-medium">View</span>
                <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={(value) => {
                        if (value) onModeChange(value as ViewMode);
                    }}
                    aria-label="Select view mode"
                >
                    {VIEW_MODE_CONFIG.map(({ mode: viewMode, icon: Icon, label, shortcut, description }) => (
                        <Tooltip key={viewMode}>
                            <TooltipTrigger asChild>
                                <ToggleGroupItem
                                    value={viewMode}
                                    aria-label={label}
                                    className="aria-checked:bg-primary aria-checked:text-primary-foreground aria-checked:ring-primary/30 h-8 w-8 transition-all aria-checked:shadow-sm aria-checked:ring-2 aria-checked:ring-offset-1"
                                >
                                    <Icon className="h-4 w-4" />
                                </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="flex flex-col items-center">
                                <span className="font-medium">{label}</span>
                                <span className="text-muted-foreground text-xs">{description}</span>
                                <kbd className="bg-muted mt-1 rounded px-1.5 py-0.5 font-mono text-xs">{shortcut}</kbd>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </ToggleGroup>
            </div>
        </TooltipProvider>
    );
}
