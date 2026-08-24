import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FluxWall | Cyber Defense Command Center",
  description: "High-Performance Edge Anti-DDoS, Rate Limiting & Bot Mitigation Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
