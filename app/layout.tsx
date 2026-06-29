import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "540A Cleaning | Shared house tasks",
  description: "A mobile-first shared cleaning task tracker for 540A.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
