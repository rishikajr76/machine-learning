import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Code Reviewer | Multi-Agent Self-Correcting Code Analysis",
  description:
    "A multi-agent AI platform that reasons through bugs, critiques fixes, and refines code automatically using Chain-of-Thought and adversarial critique loops.",
  keywords: ["AI", "code review", "multi-agent", "LLM", "DevOps", "automated"],
  openGraph: {
    title: "AI Code Reviewer",
    description: "Multi-Agent AI Self-Correcting Code Review System",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
