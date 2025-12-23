import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Create Account - Cross Stitch-up",
  description: "Create a new Cross Stitch-up account",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Enter your details below to create your account"
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
