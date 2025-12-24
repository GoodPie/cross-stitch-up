"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
    readonly user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

function getInitials(name?: string | null, email?: string | null): string {
    if (name) {
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${(parts.at(-1) || "0")[0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return "U";
}

export function UserMenu({ user }: UserMenuProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    async function handleSignOut() {
        setIsLoading(true);
        await signOut();
        router.push("/");
        router.refresh();
    }

    const initials = getInitials(user.name, user.email);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full p-0">
                    {user.image ? (
                        <Image
                            src={user.image}
                            alt={user.name || "User"}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center rounded-full object-cover text-sm font-medium">
                            {initials}
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-150">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        {user.name && <p className="text-sm leading-none font-medium">{user.name}</p>}
                        {user.email && <p className="text-muted-foreground text-xs leading-none">{user.email}</p>}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/account">
                        <User className="mr-2 h-4 w-4" />
                        <span>Account settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} disabled={isLoading} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoading ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
