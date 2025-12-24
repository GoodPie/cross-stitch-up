import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
    title: "Sign In - Cross Stitch-up",
    description: "Sign in to your Cross Stitch-up account",
};

export default function LoginPage() {
    return (
        <AuthCard
            title="Welcome back"
            description="Enter your credentials to sign in to your account"
            footer={
                <p>
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                        Sign up
                    </Link>
                </p>
            }
        >
            <LoginForm />
        </AuthCard>
    );
}
