import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HouseFlow | Shared cleaning tracker",
  description: "A mobile-first shared house cleaning task tracker built with Next.js.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
