"use client";

import type { ThreadColour } from "@/lib/tools/threads/types";
import { ThreadCard } from "./thread-card";

interface ThreadWithDistance extends ThreadColour {
    distance: number;
}

interface ThreadGridProps {
    readonly threads: ThreadWithDistance[];
    readonly selectedId: string | null;
    readonly onSelect: (id: string | null) => void;
    readonly showDistance: boolean;
}

export function ThreadGrid({ threads, selectedId, onSelect, showDistance }: ThreadGridProps) {
    if (threads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted mb-4 rounded-full p-4">
                    <svg
                        className="text-muted-foreground h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <h3 className="font-serif text-lg font-semibold">No threads found</h3>
                <p className="text-muted-foreground mt-1 text-sm">Try adjusting your search or filters</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {threads.map((thread) => (
                <ThreadCard
                    key={thread.id}
                    thread={thread}
                    isSelected={selectedId === thread.id}
                    onSelect={() => onSelect(selectedId === thread.id ? null : thread.id)}
                    showDistance={showDistance}
                />
            ))}
        </div>
    );
}
