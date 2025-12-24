import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.POSTGRES_URL!,
        ssl: false,
    }),
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
