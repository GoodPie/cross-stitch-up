"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { profileSchema, type ProfileInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ProfileFormProps {
    readonly user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    const form = useForm<ProfileInput>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name || "",
        },
    });

    async function onSubmit(data: ProfileInput) {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        const { error: updateError } = await authClient.updateUser({
            name: data.name,
        });

        setIsLoading(false);

        if (updateError) {
            setError(updateError.message || "Failed to update profile. Please try again.");
            return;
        }

        setSuccess(true);
        router.refresh();

        setTimeout(() => setSuccess(false), 3000);
    }

    const watchedName = useWatch({ control: form.control, name: "name" });
    const hasChanges = watchedName !== (user.name || "");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>Profile updated successfully!</AlertDescription>
                    </Alert>
                )}

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter your name" autoComplete="name" {...field} />
                            </FormControl>
                            <FormDescription>This is the name displayed on your profile</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <FormLabel>Email</FormLabel>
                    <Input value={user.email} disabled className="bg-muted" />
                    <p className="text-muted-foreground text-sm">Email cannot be changed</p>
                </div>

                <Button type="submit" disabled={isLoading || !hasChanges}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save changes
                </Button>
            </form>
        </Form>
    );
}
