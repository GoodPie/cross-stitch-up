import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
    title: "Create Account - Cross Stitch-up",
    description: "Create a new Cross Stitch-up account",
};

interface RegisterPageProps {
    readonly searchParams: Promise<{ message?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
    const { message } = await searchParams;
    const isFromAccountRedirect = message === "create-account";

    return (
        <AuthCard
            title="Create an account"
            description={
                isFromAccountRedirect
                    ? "Create an account to access your account settings and save your preferences"
                    : "Enter your details below to create your account"
            }
            footer={
                <p>
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            }
        >
            <RegisterForm />
        </AuthCard>
    );
}
