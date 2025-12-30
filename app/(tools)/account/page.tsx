import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountSettings } from "./_components/account-settings";

export const metadata = {
    title: "Account Settings - Cross Stitch-up",
    description: "Manage your Cross Stitch-up account settings",
};

export default async function AccountPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Anonymous users should create an account to access settings
    if (session.user.isAnonymous) {
        redirect("/register?message=create-account");
    }

    return (
        <div className="container max-w-2xl py-10">
            <AccountSettings user={session.user} />
        </div>
    );
}
