import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/email-layout";

interface VerificationEmailProps {
    userName?: string;
    verificationUrl: string;
}

export function VerificationEmail({ userName, verificationUrl }: VerificationEmailProps) {
    return (
        <EmailLayout preview="Verify your email address for Cross Stitch-up">
            <Section style={content}>
                <Heading style={heading}>Welcome to Cross Stitch-up!</Heading>
                <Text style={paragraph}>Hi{userName ? ` ${userName}` : ""},</Text>
                <Text style={paragraph}>
                    Thanks for signing up! Please verify your email address to get started with our cross stitch tools.
                </Text>
                <Section style={buttonContainer}>
                    <Button style={button} href={verificationUrl}>
                        Verify Email
                    </Button>
                </Section>
                <Text style={note}>
                    If you didn&apos;t create an account with Cross Stitch-up, you can safely ignore this email.
                </Text>
            </Section>
        </EmailLayout>
    );
}

export default VerificationEmail;

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

const note = {
    color: "#666666",
    fontSize: "14px",
    lineHeight: "20px",
    margin: "24px 0 0 0",
};
