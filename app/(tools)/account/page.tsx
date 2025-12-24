import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountSettings } from "./_components/account-settings";

export const metadata = {
    title: "Account Settings - StitchMerge",
    description: "Manage your StitchMerge account settings",
};

export default async function AccountPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="container max-w-2xl py-10">
            <AccountSettings user={session.user} />
        </div>
    );
}
