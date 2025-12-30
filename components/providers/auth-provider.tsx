"use client";

import * as React from "react";
import { useSession, signIn } from "@/lib/auth-client";

interface AuthProviderProps {
    readonly children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { data: session, isPending } = useSession();
    const hasInitializedRef = React.useRef(false);

    React.useEffect(() => {
        // Only run once, after session check completes
        if (isPending || hasInitializedRef.current) return;
        hasInitializedRef.current = true; // Set immediately to prevent race conditions

        // No session exists - create anonymous one
        // This also runs after logout, creating a fresh anonymous session
        if (!session) {
            signIn.anonymous().catch((error) => {
                // Silent failure - user can still use app without session
                console.error("Failed to create anonymous session:", error);
            });
        }
    }, [session, isPending]);

    return <>{children}</>;
}
