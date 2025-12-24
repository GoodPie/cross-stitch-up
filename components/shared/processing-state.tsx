import { AnimatedGrid } from "./animated-grid";

interface ProcessingStateProps {
    readonly stage: string;
}

export function ProcessingState({ stage }: ProcessingStateProps) {
    return (
        <div className="space-y-8 py-12 text-center">
            {/* Animated stitching indicator */}
            <div className="relative inline-flex items-center justify-center">
                <div className="border-accent h-24 w-24 rounded-full border-4">
                    <div className="border-primary absolute inset-0 animate-spin rounded-full border-4 border-t-transparent" />
                </div>
                {/* Needle icon */}
                <div className="absolute">
                    <svg
                        className="text-primary h-8 w-8 animate-pulse"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M12 2v10m0 0l-3-3m3 3l3-3" />
                        <circle cx="12" cy="19" r="3" fill="currentColor" />
                    </svg>
                </div>
            </div>

            {/* Animated grid pattern */}
            <AnimatedGrid />

            <div className="space-y-2">
                <h2 className="text-foreground font-serif text-xl font-semibold">Stitching together your pattern...</h2>
                <p className="text-primary font-medium">{stage}</p>
            </div>

            <p className="text-muted-foreground text-sm">This may take a moment depending on the PDF size</p>
        </div>
    );
}
