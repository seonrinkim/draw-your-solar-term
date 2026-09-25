"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { pickLocalized, type ExhibitionArtwork } from "@/lib/exhibitionData";

interface Props {
  photos: ExhibitionArtwork[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  captionText?: string;
  captionSource?: string;
}

// Shared "photo left, caption right" detail view for both an artwork's own
// caption and a context card's related photos + translated caption. When
// `captionText` is passed (context mode) it overrides each photo's own text.
export default function ExhibitionDetail({
  photos,
  index,
  onIndexChange,
  onClose,
  captionText,
  captionSource,
}: Props) {
  const { language, t } = useLanguage();
  const photo = photos[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") onIndexChange((index + 1) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onIndexChange, onClose]);

  if (!photo) return null;

  const title = pickLocalized(photo.i18n, language, "title");
  const desc = pickLocalized(photo.i18n, language, "desc");
  const hasOwnCaption = !captionText && (title || desc);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-sm border-2 border-exhibit-line bg-white sm:h-[85vh] sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-exhibit-line hover:bg-white"
        >
          ✕
        </button>

        <div className="relative flex h-64 shrink-0 items-center justify-center bg-white sm:h-full sm:w-3/5">
          {photos.length > 1 && (
            <button
              onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg text-exhibit-line hover:bg-white"
            >
              ‹
            </button>
          )}
          {photo.photo && (
            <Image
              key={photo.id}
              src={photo.photo}
              alt={title || photo.number}
              fill
              sizes="(max-width: 640px) 100vw, 60vw"
              className="object-contain p-3"
            />
          )}
          {photos.length > 1 && (
            <button
              onClick={() => onIndexChange((index + 1) % photos.length)}
              aria-label="Next"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg text-exhibit-line hover:bg-white"
            >
              ›
            </button>
          )}
          {photos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-exhibit-line/60">
              {index + 1} / {photos.length}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {captionText ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-exhibit-line sm:text-base">
              {captionText}
            </p>
          ) : hasOwnCaption ? (
            <>
              {title && (
                <h2 className="mb-3 text-lg font-medium text-exhibit-line sm:text-xl">{title}</h2>
              )}
              {desc && (
                <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-exhibit-line/90">
                  {desc}
                </p>
              )}
            </>
          ) : null}

          <dl className="mt-4 space-y-1 border-t border-exhibit-line/20 pt-4 text-xs text-exhibit-line/60">
            {photo.photographer && (
              <div>
                <dt className="inline font-medium">{photo.photographer}</dt>
                {photo.date && <dd className="inline">, {photo.date}</dd>}
              </div>
            )}
            {captionSource && <div>{captionSource}</div>}
          </dl>

          {t.downloadLabel && photo.photo && (
            <a
              href={photo.photo}
              download
              className="mt-6 inline-block rounded-full border border-exhibit-line px-4 py-2 text-xs text-exhibit-line hover:bg-exhibit-line hover:text-white transition-colors"
            >
              {t.downloadLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
