import * as Sentry from "@sentry/nextjs";

import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { anonymous } from "better-auth/plugins";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.POSTGRES_URL!,
        ssl: false,
    }),
    plugins: [
        anonymous({
            onLinkAccount: async ({ anonymousUser, newUser }) => {
                // Future: migrate user data here when we have user-specific data
                Sentry.captureMessage(`Anonymous user ${anonymousUser.user.id} linked to ${newUser.user.id}`);
            },
        }),
    ],
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            await sendPasswordResetEmail({
                to: user.email,
                userName: user.name,
                resetUrl: url,
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendVerificationEmail({
                to: user.email,
                userName: user.name,
                verificationUrl: url,
            });
        },
    },
});
