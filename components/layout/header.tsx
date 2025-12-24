"use client";

import Link from "next/link";
import { Scissors, ChevronLeft } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/auth/user-menu";

interface HeaderProps {
    readonly toolName?: string;
    readonly showBackLink?: boolean;
}

function AuthSection() {
    const { data: session, isPending } = useSession();

    if (isPending) {
        return <Skeleton className="h-9 w-9 rounded-full" />;
    }

    if (session?.user) {
        return <UserMenu user={session.user} />;
    }

    return (
        <>
            <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
            </Button>
        </>
    );
}

export function Header({ toolName, showBackLink }: HeaderProps) {
    return (
        <header className="border-border/50 bg-card/50 sticky top-0 z-10 border-b backdrop-blur-sm">
            <div className="container mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
                {showBackLink && (
                    <Link
                        href="/"
                        className="bg-accent hover:bg-accent/80 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                        aria-label="Back to tools"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                )}
                <Link href="/" className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl">
                        <Scissors className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-foreground font-serif text-xl font-bold">
                            Cross Stitch-up
                        </h1>
                        <p className="text-muted-foreground text-xs">
                            {toolName || "Tools for cross stitch enthusiasts"}
                        </p>
                    </div>
                </Link>

                <div className="ml-auto flex items-center gap-2">
                    <AuthSection />
                </div>
            </div>
        </header>
    );
}
