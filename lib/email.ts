import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { VerificationEmail } from "@/emails/verification-email";
import { ResetPasswordEmail } from "@/emails/reset-password-email";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Cross Stitch-up <noreply@crossstitchup.com>";

export async function sendVerificationEmail({
    to,
    userName,
    verificationUrl,
}: {
    to: string;
    userName?: string;
    verificationUrl: string;
}): Promise<void> {
    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: "Verify your email - Cross Stitch-up",
        react: VerificationEmail({ userName, verificationUrl }),
    });

    if (error) {
        Sentry.captureException(error, {
            tags: { emailType: "verification" },
            extra: { to, userName },
        });
        throw error;
    }
}

export async function sendPasswordResetEmail({
    to,
    userName,
    resetUrl,
}: {
    to: string;
    userName?: string;
    resetUrl: string;
}): Promise<void> {
    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: "Reset your password - Cross Stitch-up",
        react: ResetPasswordEmail({ userName, resetUrl }),
    });

    if (error) {
        Sentry.captureException(error, {
            tags: { emailType: "password-reset" },
            extra: { to, userName },
        });
        throw error;
    }
}
