"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { verifyEmail } from "@/lib/auth-client";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

type VerificationState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = React.useState<VerificationState>("loading");
  const [error, setError] = React.useState<string | null>(null);
  const hasRun = React.useRef(false);

  React.useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function verify() {
      if (!token) {
        setState("error");
        setError("No verification token provided.");
        return;
      }

      const { error: verifyError } = await verifyEmail({
        query: { token },
      });

      if (verifyError) {
        setState("error");
        if (
          verifyError.code === "INVALID_TOKEN" ||
          verifyError.code === "TOKEN_EXPIRED"
        ) {
          setError(
            "This verification link is invalid or has expired. Please request a new one.",
          );
        } else {
          setError(
            verifyError.message || "Something went wrong. Please try again.",
          );
        }
        return;
      }

      setState("success");
      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    }

    verify();
  }, [token, router]);

  if (state === "loading") {
    return (
      <div className="text-center space-y-4 py-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Verification failed</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-green-600" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Email verified!</h3>
        <p className="text-muted-foreground text-sm">
          Your email has been verified. Redirecting you to the home page...
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Email Verification">
      <React.Suspense
        fallback={
          <div className="text-center space-y-4 py-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </React.Suspense>
    </AuthCard>
  );
}
