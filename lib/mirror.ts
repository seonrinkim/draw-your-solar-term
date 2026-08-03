import { StrokePath } from "@/lib/drawings";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas";
import { SolarTerm } from "@/lib/terms";

const MIRROR_URL = process.env.NEXT_PUBLIC_MIRROR_URL;
const MIRROR_SECRET = process.env.NEXT_PUBLIC_MIRROR_SECRET;

// Rasterizes the vector strokes to a transparent-background PNG, at 2x the
// canvas's own resolution for a crisp image when used in marketing/print.
function strokesToPngDataUrl(
  strokes: StrokePath[],
  color: string,
  scale = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const width = CANVAS_WIDTH * scale;
    const height = CANVAS_HEIGHT * scale;
    const pathsMarkup = strokes
      .map(
        (s) =>
          `<path d="${s.d}" fill="none" stroke="${color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round" />`
      )
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" width="${width}" height="${height}">${pathsMarkup}</svg>`;
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Could not rasterize SVG"));
    img.src = svgDataUrl;
  });
}

interface MirrorParams {
  term: SolarTerm;
  strokes: StrokePath[];
  nickname: string;
  note: string;
}

// Best-effort mirror to the studio's Google Sheet + Drive folder, alongside
// the real Supabase submission. Never throws — a failure here shouldn't
// block or fail the user's actual submission.
export function mirrorToGoogle(params: MirrorParams): void {
  if (!MIRROR_URL) return;

  strokesToPngDataUrl(params.strokes, params.term.color)
    .then((imageBase64) =>
      fetch(MIRROR_URL, {
        method: "POST",
        // text/plain avoids a CORS preflight against the Apps Script
        // endpoint; the body is still parsed as JSON server-side.
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret: MIRROR_SECRET,
          termSlug: params.term.slug,
          termHangul: params.term.hangul,
          termEnglish: params.term.english,
          nickname: params.nickname,
          note: params.note,
          imageBase64,
        }),
      })
    )
    .catch((err) => {
      console.warn("Mirror to Google Sheet/Drive failed", err);
    });
}
