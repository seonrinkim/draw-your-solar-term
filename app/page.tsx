"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import GravityGallery from "@/components/GravityGallery";
import { LANGUAGES, Language, useLanguage } from "@/lib/i18n";

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "EN",
  ko: "KO",
  nl: "NL",
};

const FOOTER_GAP = 4; // breathing room between the drawing pile and the footer text

export default function Home() {
  const { language, setLanguage } = useLanguage();
  const footerRef = useRef<HTMLParagraphElement>(null);
  const [bottomInset, setBottomInset] = useState(0);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setBottomInset(Math.max(0, window.innerHeight - rect.top + FOOTER_GAP));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <GravityGallery bottomInset={bottomInset} />

      <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 flex items-center justify-end gap-3 px-5 py-4 sm:px-8 sm:py-5">
        <div className="pointer-events-auto flex rounded-full bg-ink/5 p-1 text-xs sm:text-sm">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                language === lang
                  ? "bg-ink text-hanji"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
        <Link
          href="/draw"
          className="pointer-events-auto px-5 py-2.5 rounded-full text-sm sm:text-base bg-ink text-hanji hover:opacity-85 transition-opacity"
        >
          I want to draw!
        </Link>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-30 flex justify-center px-5 text-center">
        <p ref={footerRef} className="text-xs sm:text-sm opacity-40">
          22 September – 4 October 2026 | 09:00 – 21:00 | Amsterdam House of
          Arts &amp; Crafts (Oudeschans 21, 1011 KS Amsterdam)
        </p>
      </div>
    </div>
  );
}
