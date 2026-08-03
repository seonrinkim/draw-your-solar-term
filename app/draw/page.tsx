"use client";

import Link from "next/link";
import { SOLAR_TERMS, Season, formatTermDate } from "@/lib/terms";
import { getContrastText } from "@/lib/color";
import { useLanguage } from "@/lib/i18n";

const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

export default function DrawSelectPage() {
  const { language, t } = useLanguage();
  const seasonLabels: Record<Season, string> = {
    spring: t.seasonSpring,
    summer: t.seasonSummer,
    autumn: t.seasonAutumn,
    winter: t.seasonWinter,
  };

  return (
    <main className="flex-1 pt-24 pb-16 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl mb-2">{t.selectHeading}</h1>
        <p className="text-sm sm:text-base opacity-70 mb-10">{t.selectIntro}</p>

        {SEASONS.map((season) => (
          <section key={season} className="mb-10">
            <h2 className="text-sm sm:text-base opacity-60 mb-3 tracking-wide">
              {seasonLabels[season]}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {SOLAR_TERMS.filter((term) => term.season === season).map((term) => (
                <Link
                  key={term.slug}
                  href={`/draw/${term.slug}`}
                  className="group aspect-square rounded-2xl flex flex-col justify-between p-3 transition-transform hover:scale-[1.03]"
                  style={{
                    backgroundColor: term.color,
                    color: getContrastText(term.color),
                  }}
                >
                  <span className="text-xs opacity-80">
                    {formatTermDate(term.date, language)}
                  </span>
                  <div>
                    <div className="text-base font-medium">
                      {term.hangul}
                    </div>
                    <div className="text-xs opacity-90">
                      {term.romanized}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
