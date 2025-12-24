"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";

interface AccountSettingsProps {
    readonly user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
}

export function AccountSettings({ user }: AccountSettingsProps) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold">Account Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    {/* Future tabs can be added here */}
                    {/* <TabsTrigger value="security">Security</TabsTrigger> */}
                    {/* <TabsTrigger value="preferences">Preferences</TabsTrigger> */}
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your profile information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfileForm user={user} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
