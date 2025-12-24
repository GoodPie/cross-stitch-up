"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signIn, sendVerificationEmail } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordInput } from "./password-input";

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isResending, setIsResending] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [emailNotVerified, setEmailNotVerified] = React.useState(false);
    const [resendSuccess, setResendSuccess] = React.useState(false);

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(data: LoginInput) {
        setIsLoading(true);
        setError(null);
        setEmailNotVerified(false);
        setResendSuccess(false);

        const { error: signInError } = await signIn.email({
            email: data.email,
            password: data.password,
        });

        setIsLoading(false);

        if (signInError) {
            if (signInError.code === "EMAIL_NOT_VERIFIED") {
                setEmailNotVerified(true);
                setError("Please verify your email before signing in.");
            } else if (signInError.code === "INVALID_EMAIL_OR_PASSWORD" || signInError.code === "INVALID_PASSWORD") {
                setError("Invalid email or password.");
            } else {
                setError(signInError.message || "Something went wrong. Please try again.");
            }
            return;
        }

        router.push("/");
        router.refresh();
    }

    async function handleResendVerification() {
        const email = form.getValues("email");
        if (!email) return;

        setIsResending(true);
        setResendSuccess(false);

        await sendVerificationEmail({
            email,
            callbackURL: "/",
        });

        setIsResending(false);
        setResendSuccess(true);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <Alert variant={emailNotVerified ? "default" : "destructive"}>
                        <AlertDescription>
                            {error}
                            {emailNotVerified && (
                                <div className="mt-2">
                                    {resendSuccess ? (
                                        <p className="text-sm text-green-600">
                                            Verification email sent! Check your inbox.
                                        </p>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0"
                                            onClick={handleResendVerification}
                                            disabled={isResending}
                                        >
                                            {isResending ? (
                                                <>
                                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                "Resend verification email"
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="Enter your email" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Password</FormLabel>
                                <Link
                                    href="/forgot-password"
                                    className="text-muted-foreground hover:text-primary text-sm"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <FormControl>
                                <PasswordInput
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                </Button>
            </form>
        </Form>
    );
}
