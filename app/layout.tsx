import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "@/components/Header";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/Pretendard-Regular.woff2",
  variable: "--font-pretendard",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Van het Seizoen",
  description:
    "24 solar terms, 24 colors — draw along with the Korean seasons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-ink">
        <LanguageProvider>
          <Header />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
