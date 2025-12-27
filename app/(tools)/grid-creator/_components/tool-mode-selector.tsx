"use client";

import React from "react";
import { MousePointer2, Paintbrush, Eraser, Pipette } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ToolMode } from "@/lib/tools/grid-creator";

interface ToolModeSelectorProps {
    readonly mode: ToolMode;
    readonly onModeChange: (mode: ToolMode) => void;
    readonly hasSelectedColor: boolean;
}

const TOOL_CONFIG: {
    mode: ToolMode;
    icon: React.ElementType;
    label: string;
    shortcut: string;
    description: string;
}[] = [
    {
        mode: "select",
        icon: MousePointer2,
        label: "Select",
        shortcut: "V",
        description: "Toggle cells on/off",
    },
    {
        mode: "paint",
        icon: Paintbrush,
        label: "Paint",
        shortcut: "B",
        description: "Paint with selected color",
    },
    {
        mode: "erase",
        icon: Eraser,
        label: "Erase",
        shortcut: "E",
        description: "Remove cell color",
    },
    {
        mode: "eyedropper",
        icon: Pipette,
        label: "Eyedropper",
        shortcut: "I",
        description: "Pick color from cell",
    },
];

export function ToolModeSelector({ mode, onModeChange, hasSelectedColor }: ToolModeSelectorProps) {
    // Handle keyboard shortcuts
    React.useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ignore if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const key = e.key.toLowerCase();
            const tool = TOOL_CONFIG.find((t) => t.shortcut.toLowerCase() === key);

            if (tool) {
                e.preventDefault();
                onModeChange(tool.mode);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onModeChange]);

    return (
        <TooltipProvider delayDuration={300}>
            <div className="bg-background flex items-center gap-2 rounded-lg border p-1 shadow-sm">
                <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={(value) => {
                        if (value) onModeChange(value as ToolMode);
                    }}
                    aria-label="Select tool mode"
                >
                    {TOOL_CONFIG.map(({ mode: toolMode, icon: Icon, label, shortcut, description }) => {
                        const isDisabled = toolMode === "paint" && !hasSelectedColor;

                        return (
                            <Tooltip key={toolMode}>
                                <TooltipTrigger asChild>
                                    <ToggleGroupItem
                                        value={toolMode}
                                        aria-label={label}
                                        disabled={isDisabled}
                                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 w-8"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="flex flex-col items-center">
                                    <span className="font-medium">{label}</span>
                                    <span className="text-muted-foreground text-xs">
                                        {description}
                                        {isDisabled && " (select a color first)"}
                                    </span>
                                    <kbd className="bg-muted mt-1 rounded px-1.5 py-0.5 font-mono text-xs">
                                        {shortcut}
                                    </kbd>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </ToggleGroup>
            </div>
        </TooltipProvider>
    );
}
