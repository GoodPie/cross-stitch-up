import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
    preview: string;
    children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={logo}>Cross Stitch-up</Text>
                    </Section>
                    {children}
                    <Section style={footer}>
                        <Text style={footerText}>Cross Stitch-up - Tools for cross stitch enthusiasts</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const body = {
    backgroundColor: "#faf5f0",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    margin: "0",
    padding: "0",
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "0",
    maxWidth: "600px",
    borderRadius: "8px",
    marginTop: "40px",
    marginBottom: "40px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const header = {
    backgroundColor: "#c2410c",
    padding: "24px",
    borderRadius: "8px 8px 0 0",
};

const logo = {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "700",
    margin: "0",
    textAlign: "center" as const,
};

const footer = {
    padding: "24px",
    borderTop: "1px solid #e5e5e5",
};

const footerText = {
    color: "#666666",
    fontSize: "12px",
    textAlign: "center" as const,
    margin: "0",
};
