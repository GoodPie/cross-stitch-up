import { useState, useEffect, useRef } from "react";

interface ContainerSize {
    width: number;
    height: number;
}

interface UseContainerSizeReturn {
    containerRef: React.RefObject<HTMLDivElement | null>;
    containerSize: ContainerSize;
}

/**
 * Hook for tracking container dimensions using ResizeObserver.
 *
 * Provides responsive container sizing without polling.
 */
export function useContainerSize(): UseContainerSizeReturn {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerSize, setContainerSize] = useState<ContainerSize>({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ width, height });
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return {
        containerRef,
        containerSize,
    };
}
