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
    <div className="from-background via-background to-muted/30 flex min-h-screen flex-col items-center justify-center bg-linear-to-br px-4 py-8">
      <Link
        href="/"
        className="mb-8 flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-xl">
          <Scissors className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-foreground font-serif text-2xl font-bold">
            Cross Stitch-up
          </h1>
          <p className="text-muted-foreground text-xs">
            Tools for cross stitch enthusiasts
          </p>
        </div>
      </Link>

      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && (
          <CardFooter className="text-muted-foreground flex flex-col gap-4 text-center text-sm">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
