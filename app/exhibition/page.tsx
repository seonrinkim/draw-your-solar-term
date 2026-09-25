"use client";

import { useMemo, useState } from "react";
import ExhibitionWall from "@/components/ExhibitionWall";
import ExhibitionDetail from "@/components/ExhibitionDetail";
import {
  artworkItems,
  getArtwork,
  getExhibitionItem,
  type ExhibitionArtwork,
  type ExhibitionItem,
} from "@/lib/exhibitionData";
import { LANGUAGES, Language, useLanguage } from "@/lib/i18n";

const LANGUAGE_LABELS: Record<Language, string> = { en: "EN", ko: "KO", nl: "NL" };

type Selection =
  | { kind: "artwork"; id: string }
  | { kind: "context"; id: string };

export default function ExhibitionPage() {
  const { language, setLanguage } = useLanguage();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [index, setIndex] = useState(0);

  const handleSelect = (item: ExhibitionItem) => {
    setIndex(0);
    setSelection(item.type === "artwork" ? { kind: "artwork", id: item.id } : { kind: "context", id: item.id });
  };

  const detail = useMemo(() => {
    if (!selection) return null;

    if (selection.kind === "artwork") {
      return { photos: artworkItems, captionText: undefined, captionSource: undefined };
    }

    const context = getExhibitionItem(selection.id);
    if (!context || context.type !== "context") return null;
    const photos = context.relatedArtworkIds
      .map((id) => getArtwork(id))
      .filter((a): a is ExhibitionArtwork => Boolean(a));
    if (photos.length === 0) return null;
    return {
      photos,
      captionText: context.i18n[language]?.desc,
      captionSource: context.source,
    };
  }, [selection, language]);

  const activeIndex =
    selection?.kind === "artwork" && detail
      ? detail.photos.findIndex((a) => a.id === selection.id)
      : index;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-white">
      {/* Matches Header.tsx's own fixed top row exactly (same px/py) so the
          site-wide "Van het Seizoen" link on the left and this language
          switcher line up on the same baseline. */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 flex justify-end px-5 py-4 sm:px-8 sm:py-5">
        <div className="pointer-events-auto flex rounded-full bg-ink/5 p-1 text-xs sm:text-sm">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                language === lang ? "bg-ink text-hanji" : "opacity-60 hover:opacity-100"
              }`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-full w-full px-2 pb-4 pt-16 sm:px-6 sm:pt-20">
        <ExhibitionWall onSelect={handleSelect} />
      </div>

      {detail && (
        <ExhibitionDetail
          photos={detail.photos}
          index={activeIndex === -1 ? 0 : activeIndex}
          onIndexChange={(next) => {
            if (selection?.kind === "artwork") {
              setSelection({ kind: "artwork", id: detail.photos[next].id });
            } else {
              setIndex(next);
            }
          }}
          onClose={() => setSelection(null)}
          captionText={detail.captionText}
          captionSource={detail.captionSource}
        />
      )}
    </div>
  );
}
