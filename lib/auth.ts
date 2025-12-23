import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.POSTGRES_URL!,
    ssl: false
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "Cross Stitch-up <noreply@crossstitchup.com>",
        to: user.email,
        subject: "Reset your password - Cross Stitch-up",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c2410c;">Reset Your Password</h1>
            <p>Hi${user.name ? ` ${user.name}` : ""},</p>
            <p>We received a request to reset your password for your Cross Stitch-up account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${url}" style="display: inline-block; background-color: #c2410c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "Cross Stitch-up <noreply@crossstitchup.com>",
        to: user.email,
        subject: "Verify your email - Cross Stitch-up",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c2410c;">Welcome to Cross Stitch-up!</h1>
            <p>Hi${user.name ? ` ${user.name}` : ""},</p>
            <p>Thanks for signing up! Please verify your email address to get started.</p>
            <a href="${url}" style="display: inline-block; background-color: #c2410c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
            <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      });
    },
  },
});
