import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "HOS Response Kit",
  description: "Family Reunification Map for humanitarian response operations.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HOS",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1713",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${ibmPlexMono.variable} h-full font-primary`}>
        {children}
      </body>
    </html>
  );
}
