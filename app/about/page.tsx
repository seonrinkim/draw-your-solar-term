"use client";

import { useLanguage } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="flex-1 pt-24 pb-16 px-5 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <section className="mb-12">
          <h1 className="text-2xl sm:text-3xl mb-5">{t.aboutHeading1}</h1>
          <p className="text-sm sm:text-base leading-relaxed opacity-80 mb-4">
            {t.aboutIntro1}
          </p>
          <p className="text-sm sm:text-base leading-relaxed opacity-80">
            {t.aboutIntro2}
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl mb-5">{t.aboutHeading2}</h2>
          <p className="text-sm sm:text-base leading-relaxed opacity-80 mb-4">
            {t.aboutProjectBody1}
          </p>
          <p className="text-sm sm:text-base leading-relaxed opacity-80 mb-6">
            {t.aboutProjectBody2}
          </p>
          <p className="text-sm sm:text-base leading-relaxed opacity-80">
            {t.aboutSchedule}
          </p>
        </section>

        <p className="text-xs sm:text-sm opacity-40">{t.aboutCopyright}</p>
      </div>
    </main>
  );
}
