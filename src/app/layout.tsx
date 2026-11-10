import type { Metadata } from "next";
import Link from "next/link";
import { TRPCProvider } from "@/trpc/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Simple task manager built with Next.js 15 and tRPC",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>
          <header className="header">
            <Link href="/" className="brand">
              Tasks
            </Link>
            <Link href="/tasks/new" className="button">
              New task
            </Link>
          </header>
          <main className="main">{children}</main>
        </TRPCProvider>
      </body>
    </html>
  );
}
