import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
    title: "Forgot Password - Cross Stitch-up",
    description: "Reset your Cross Stitch-up password",
};

export default function ForgotPasswordPage() {
    return (
        <AuthCard
            title="Forgot your password?"
            description="Enter your email and we'll send you a reset link"
            footer={
                <p>
                    Remember your password?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            }
        >
            <ForgotPasswordForm />
        </AuthCard>
    );
}
