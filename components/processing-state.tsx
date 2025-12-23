interface ProcessingStateProps {
  stage: string
}

export function ProcessingState({ stage }: ProcessingStateProps) {
  return (
    <div className="text-center space-y-8 py-12">
      {/* Animated stitching indicator */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border-4 border-accent">
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        {/* Needle icon */}
        <div className="absolute">
          <svg
            className="w-8 h-8 text-primary animate-pulse"
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
      <div className="flex justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="w-3 h-3 rounded-sm bg-primary/20"
                style={{
                  animation: `pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${(i + j) * 0.1}s`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-serif font-semibold text-foreground">Stitching together your pattern...</h2>
        <p className="text-primary font-medium">{stage}</p>
      </div>

      <p className="text-sm text-muted-foreground">This may take a moment depending on the PDF size</p>
    </div>
  )
}
