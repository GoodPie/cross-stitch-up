interface AnimatedGridProps {
    readonly rows?: number;
    readonly cols?: number;
    readonly dotSize?: number;
}

export function AnimatedGrid({ rows = 5, cols = 5, dotSize = 12 }: AnimatedGridProps) {
    return (
        <div className="flex justify-center gap-1">
            {Array.from({ length: cols }).map((_, colIndex) => (
                <div key={`col-${colIndex.toString()}`} className="flex flex-col gap-1">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div
                            key={`dot-${colIndex.toString()}-${rowIndex.toString()}`}
                            className="bg-primary/20 rounded-sm"
                            style={{
                                width: dotSize,
                                height: dotSize,
                                animation: `pulse 1.5s ease-in-out infinite`,
                                animationDelay: `${(colIndex + rowIndex) * 0.1}s`,
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
