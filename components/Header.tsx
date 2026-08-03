"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // The home page renders its own title alongside the nav controls so
  // they can share a single row and stay vertically aligned.
  if (pathname === "/") return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5 pointer-events-none">
      <Link
        href="/"
        className="pointer-events-auto text-base sm:text-lg tracking-tight text-ink hover:opacity-70 transition-opacity"
      >
        Van het Seizoen
      </Link>
    </header>
  );
}
