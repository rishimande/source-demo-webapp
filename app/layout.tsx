import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Energy Device & Credit Verification",
  description: "Inergy Source Intelligence – Demo",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-white">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-auto min-h-16 items-center justify-between px-4 sm:px-6 py-3 sm:py-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 truncate">
                  Energy Device & Credit Verification
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Inergy Source Intelligence – Demo
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 sm:px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span className="hidden sm:inline">Online</span>
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

