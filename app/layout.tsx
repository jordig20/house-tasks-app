import type { Metadata } from "next";
import { Inter, Josefin_Sans, Roboto } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "600", "700", "900"],
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  weight: ["600", "700"],
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "540A Cleaning | Shared house tasks",
  description: "A mobile-first shared cleaning task tracker for 540A.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${josefinSans.variable} ${roboto.variable}`}>{children}</body>
    </html>
  );
}
