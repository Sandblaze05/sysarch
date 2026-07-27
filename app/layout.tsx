import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NavProfile from "@/components/NavProfile";
import Logo from "@/components/Logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "sysarch",
  description: "Learn system design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="absolute flex items-center justify-between top-0 left-[10%] translate-x-[-10%] z-999">
          <Logo />
        </div>
        <div className="absolute flex items-center justify-between top-0 left-1/2 translate-x-[-50%] z-999">
          <Navbar />
        </div>
        <div className="absolute flex items-center justify-between top-0 right-[5%] sm:right-[10%] translate-x-[-10%] z-999">
          <NavProfile />
        </div>
        {children}
      </body>
    </html>
  );
}
