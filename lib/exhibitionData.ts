import compiled from "@/data/exhibition/compiled.json";
import type { Language } from "@/lib/i18n";

export interface ExhibitionArtwork {
  id: string;
  type: "artwork";
  x: number;
  y: number;
  w: number;
  h: number;
  number: string;
  photo: string | null;
  country: string;
  season: string;
  photographer: string;
  date: string;
  pastPresent: string;
  i18n: Record<Language, { title: string; desc: string }>;
}

export interface ExhibitionContext {
  id: string;
  type: "context";
  x: number;
  y: number;
  w: number;
  h: number;
  number: string;
  source: string;
  relatedArtworkIds: string[];
  relatedContextIds: string[];
  i18n: Partial<Record<Language, { desc: string }>>;
}

export type ExhibitionItem = ExhibitionArtwork | ExhibitionContext;

interface ExhibitionData {
  wallImage: string;
  items: ExhibitionItem[];
}

const data = compiled as ExhibitionData;

export const wallImage = data.wallImage;
export const exhibitionItems: ExhibitionItem[] = data.items;

const byId = new Map(exhibitionItems.map((item) => [item.id, item]));

export function getExhibitionItem(id: string): ExhibitionItem | undefined {
  return byId.get(id);
}

export const artworkItems: ExhibitionArtwork[] = exhibitionItems.filter(
  (item): item is ExhibitionArtwork => item.type === "artwork"
);

export function getArtwork(id: string): ExhibitionArtwork | undefined {
  const item = byId.get(id);
  return item?.type === "artwork" ? item : undefined;
}

const FALLBACK_ORDER: Language[] = ["en", "ko", "nl"];

// Several archive photos only have a caption in their original language (a
// Dutch archive scan with no Korean/English title, or vice versa). Rather
// than showing blank text when viewing in another language, fall back to
// whichever language actually has content.
export function pickLocalized(
  i18n: Partial<Record<Language, { title?: string; desc?: string }>>,
  language: Language,
  field: "title" | "desc"
): string {
  const order = [language, ...FALLBACK_ORDER.filter((l) => l !== language)];
  for (const lang of order) {
    const value = i18n[lang]?.[field];
    if (value) return value;
  }
  return "";
}
