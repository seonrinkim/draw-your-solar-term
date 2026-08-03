"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SolarTerm, formatTermDate } from "@/lib/terms";
import { getContrastText } from "@/lib/color";
import { useLanguage } from "@/lib/i18n";
import { localizeTerm } from "@/lib/termTranslations";

export default function TermDetail({ term }: { term: SolarTerm }) {
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const textColor = getContrastText(term.color);
  const { language, t } = useLanguage();
  const localized = localizeTerm(term, language);

  return (
    <main className="flex-1 pt-24 pb-16 px-5 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-3xl px-6 py-10 sm:px-10 sm:py-14 mb-8"
          style={{ backgroundColor: term.color, color: textColor }}
        >
          <p className="text-sm opacity-80 mb-3">
            {formatTermDate(term.date, language)}
          </p>
          <h1 className="text-3xl sm:text-4xl mb-1">
            {term.hangul} <span className="opacity-90">{term.romanized}</span>
          </h1>
          <p className="text-base sm:text-lg opacity-90 mb-6">
            {localized.english}
          </p>
          <p className="text-sm sm:text-base leading-relaxed opacity-95">
            {localized.description}
          </p>
        </div>

        <h2 className="text-xs sm:text-sm uppercase tracking-wide opacity-50 mb-2">
          {t.wisdomHeading}
        </h2>
        <p className="text-sm sm:text-base leading-relaxed opacity-80 mb-8">
          {localized.wisdom}
        </p>

        <p className="text-sm sm:text-base leading-relaxed opacity-80 mb-8">
          {t.drawPromptPrefix}
          <strong>
            {term.hangul} {term.romanized}
          </strong>
          {t.drawPromptSuffix}
        </p>

        <label className="flex items-start gap-3 text-sm sm:text-base leading-relaxed mb-8 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 accent-ink shrink-0"
          />
          <span className="opacity-80">{t.consentText}</span>
        </label>

        <button
          disabled={!agreed}
          onClick={() => router.push(`/draw/${term.slug}/canvas`)}
          className="w-full sm:w-auto px-8 py-3 rounded-full text-base transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ backgroundColor: term.color, color: textColor }}
        >
          Draw!
        </button>
      </div>
    </main>
  );
}
