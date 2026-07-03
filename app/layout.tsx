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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://house-tasks-app.vercel.app",
  ),
  title: {
    default: "540A Cleaning",
    template: "%s | 540A Cleaning",
  },
  description: "Shared house tasks for 540A.",
  applicationName: "540A Cleaning",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "540A",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon-192.png"],
  },
  openGraph: {
    title: "540A Cleaning",
    description: "Today, week and month house tasks for 540A.",
    siteName: "540A Cleaning",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "540A Cleaning shared house tasks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "540A Cleaning",
    description: "Shared house tasks for 540A.",
    images: ["/opengraph-image"],
  },
};

export const viewport = {
  themeColor: "#020617",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${josefinSans.variable} ${roboto.variable}`}>{children}</body>
    </html>
  );
}
