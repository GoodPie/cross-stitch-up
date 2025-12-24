import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Reset Password - Cross Stitch-up",
  description: "Set a new password for your Cross Stitch-up account",
};

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter a new password for your account"
    >
      <Suspense fallback={<LoadingState />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
