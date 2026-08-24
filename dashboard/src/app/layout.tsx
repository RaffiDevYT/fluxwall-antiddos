import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FluxWall | Cyber Defense Command Center",
  description: "High-Performance Edge Anti-DDoS, Rate Limiting & Bot Mitigation Dashboard",
};

export const viewport: Viewport = {
  themeColor: "#080b11",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="antialiased min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
