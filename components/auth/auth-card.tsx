import * as React from "react";
import Link from "next/link";
import { Scissors } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-linear-to-br from-background via-background to-muted/30">
      <Link
        href="/"
        className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
          <Scissors className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Cross Stitch-up
          </h1>
          <p className="text-xs text-muted-foreground">
            Tools for cross stitch enthusiasts
          </p>
        </div>
      </Link>

      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && (
          <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
