import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SeedBoot from "@/components/SeedBoot";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workly",
  description: "Gerencie Nubank, Caixa e VR/VA Hub4play em um só lugar.",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <SeedBoot />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
