import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/email-layout";

interface ResetPasswordEmailProps {
    userName?: string;
    resetUrl: string;
}

export function ResetPasswordEmail({ userName, resetUrl }: ResetPasswordEmailProps) {
    return (
        <EmailLayout preview="Reset your password for Cross Stitch-up">
            <Section style={content}>
                <Heading style={heading}>Reset Your Password</Heading>
                <Text style={paragraph}>Hi{userName ? ` ${userName}` : ""},</Text>
                <Text style={paragraph}>
                    We received a request to reset your password for your Cross Stitch-up account. Click the button
                    below to set a new password.
                </Text>
                <Section style={buttonContainer}>
                    <Button style={button} href={resetUrl}>
                        Reset Password
                    </Button>
                </Section>
                <Text style={expiry}>This link will expire in 1 hour.</Text>
                <Text style={note}>
                    If you didn&apos;t request a password reset, you can safely ignore this email. Your password will
                    remain unchanged.
                </Text>
            </Section>
        </EmailLayout>
    );
}

export default ResetPasswordEmail;

const content = {
    padding: "32px 24px",
};

const heading = {
    color: "#c2410c",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0 0 24px 0",
};

const paragraph = {
    color: "#333333",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 16px 0",
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#c2410c",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    padding: "12px 24px",
    display: "inline-block",
};

const expiry = {
    color: "#666666",
    fontSize: "14px",
    lineHeight: "20px",
    margin: "0 0 16px 0",
    textAlign: "center" as const,
};

const note = {
    color: "#666666",
    fontSize: "14px",
    lineHeight: "20px",
    margin: "24px 0 0 0",
};
