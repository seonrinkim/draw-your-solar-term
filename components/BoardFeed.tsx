"use client";

import { useEffect, useState } from "react";
import { DrawingRecord, fetchDrawings, subscribeToNewDrawings } from "@/lib/drawings";
import { getStrokesBoundingBox } from "@/lib/svgPath";
import { getTermBySlug } from "@/lib/terms";
import { localizeTerm } from "@/lib/termTranslations";
import { useLanguage } from "@/lib/i18n";
import { formatRelativeTime } from "@/lib/time";
import { downloadDrawingImage } from "@/lib/downloadDrawing";

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 19h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BoardFeed() {
  const { language, t } = useLanguage();
  const [drawings, setDrawings] = useState<DrawingRecord[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDrawings().then(setDrawings);
    const unsubscribe = subscribeToNewDrawings((drawing) => {
      setDrawings((prev) => [drawing, ...prev]);
    });
    return unsubscribe;
  }, []);

  const handleDownload = async (drawing: DrawingRecord, termLabel: string) => {
    setDownloadingId(drawing.id);
    try {
      await downloadDrawingImage(drawing, termLabel);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-5 pt-32 pb-24 sm:px-8 sm:pt-36">
      {drawings.map((drawing) => {
        const term = getTermBySlug(drawing.term_slug);
        const termLabel = term ? localizeTerm(term, language).hangul : drawing.term_slug;
        const bbox = getStrokesBoundingBox(drawing.svg_paths, 24);

        return (
          <article key={drawing.id} className="border-b border-ink/10 py-6 first:pt-0 last:border-b-0">
            <div className="aspect-square w-full overflow-hidden rounded-2xl">
              <svg
                viewBox={`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`}
                className="h-full w-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {drawing.svg_paths.map((s, i) => (
                  <path
                    key={i}
                    d={s.d}
                    fill="none"
                    stroke={drawing.color}
                    strokeWidth={s.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <h3 className="text-sm sm:text-base font-medium tracking-tight">
                {drawing.nickname} · {termLabel}
              </h3>
              <button
                onClick={() => handleDownload(drawing, termLabel)}
                disabled={downloadingId === drawing.id}
                aria-label={t.downloadLabel}
                title={t.downloadLabel}
                className="shrink-0 text-ink opacity-60 hover:opacity-100 transition-opacity disabled:opacity-20"
              >
                <DownloadIcon />
              </button>
            </div>

            {drawing.note && (
              <p className="mt-1.5 text-sm leading-relaxed opacity-70">{drawing.note}</p>
            )}

            <p className="mt-2 text-xs opacity-40">{formatRelativeTime(drawing.created_at, language)}</p>
          </article>
        );
      })}

      {drawings.length === 0 && (
        <p className="py-16 text-center text-sm opacity-40">{t.emptyGalleryMessage}</p>
      )}
    </div>
  );
}
