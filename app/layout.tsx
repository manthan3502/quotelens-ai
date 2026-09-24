import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuoteLens AI",
  description: "Compare the real cost, terms, and risks in vendor quotations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
