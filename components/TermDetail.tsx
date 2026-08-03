"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SolarTerm } from "@/lib/terms";
import { getContrastText } from "@/lib/color";

export default function TermDetail({ term }: { term: SolarTerm }) {
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const textColor = getContrastText(term.color);

  return (
    <main className="flex-1 pt-24 pb-16 px-5 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-3xl px-6 py-10 sm:px-10 sm:py-14 mb-8"
          style={{ backgroundColor: term.color, color: textColor }}
        >
          <p className="text-sm opacity-80 mb-3">{term.date}</p>
          <h1 className="text-3xl sm:text-4xl mb-1">
            {term.hangul} <span className="opacity-90">{term.romanized}</span>
          </h1>
          <p className="text-base sm:text-lg opacity-90 mb-6">
            {term.english}
          </p>
          <p className="text-sm sm:text-base leading-relaxed opacity-95">
            {term.description}
          </p>
        </div>

        <p className="text-sm sm:text-base leading-relaxed opacity-80 mb-8">
          Draw something that captures the feeling of{" "}
          <strong>{term.hangul} · {term.english}</strong> — its color, its
          mood, its moment in the year. Anything goes, as long as it&apos;s a
          simple line drawing in this term&apos;s color.
        </p>

        <label className="flex items-start gap-3 text-sm sm:text-base leading-relaxed mb-8 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 accent-ink shrink-0"
          />
          <span className="opacity-80">
            Your drawing, nickname, and note may be used in Season
            Diplomats&apos; marketing materials and products. I understand
            and agree to this use.
          </span>
        </label>

        <button
          disabled={!agreed}
          onClick={() => router.push(`/draw/${term.slug}/canvas`)}
          className="w-full sm:w-auto px-8 py-3 rounded-full text-base transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ backgroundColor: term.color, color: textColor }}
        >
          Let&apos;s draw!
        </button>
      </div>
    </main>
  );
}
