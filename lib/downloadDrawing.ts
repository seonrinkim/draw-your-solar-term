import { DrawingRecord } from "@/lib/drawings";
import { getStrokesBoundingBox } from "@/lib/svgPath";

const CANVAS_WIDTH = 1080;
const IMAGE_HEIGHT = 1080;
const IMAGE_PADDING = 56;
const TEXT_PADDING = 64;
const TITLE_SIZE = 40;
const BODY_SIZE = 32;
const LINE_HEIGHT = 46;
const BACKGROUND = "#FCFCFB"; // matches the page's --background, same as the feed card
const TEXT_COLOR = "#272018";

// Canvas has no built-in text wrapping, and character-level wrapping (rather
// than word-level) is what correctly wraps Korean/Dutch/English text alike
// without special-casing scripts that don't use spaces between words.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const ch of text) {
    const next = current + ch;
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current);
      current = ch;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function resolveFontFamily(): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-pretendard")
    .trim();
  return value || "sans-serif";
}

// Renders a drawing plus its nickname, solar term, and note onto a canvas
// and triggers a browser download of the resulting PNG — a self-contained
// "postcard" version of a feed card for people to save and share.
export async function downloadDrawingImage(
  drawing: DrawingRecord,
  termLabel: string
): Promise<void> {
  if (typeof document === "undefined") return;
  await document.fonts.ready;
  const fontFamily = resolveFontFamily();

  const bbox = getStrokesBoundingBox(drawing.svg_paths, 24);
  const note = drawing.note?.trim() ?? "";
  const titleText = [drawing.nickname, termLabel].filter(Boolean).join(" · ");
  const maxTextWidth = CANVAS_WIDTH - TEXT_PADDING * 2;

  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return;
  measure.font = `${BODY_SIZE}px ${fontFamily}`;
  const noteLines = note ? wrapText(measure, note, maxTextWidth) : [];

  const captionHeight =
    TEXT_PADDING +
    TITLE_SIZE +
    (noteLines.length ? 20 + noteLines.length * LINE_HEIGHT : 0) +
    TEXT_PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = IMAGE_HEIGHT + captionHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const availW = CANVAS_WIDTH - IMAGE_PADDING * 2;
  const availH = IMAGE_HEIGHT - IMAGE_PADDING * 2;
  const scale = Math.min(availW / bbox.width, availH / bbox.height);
  const offsetX = IMAGE_PADDING + (availW - bbox.width * scale) / 2 - bbox.minX * scale;
  const offsetY = IMAGE_PADDING + (availH - bbox.height * scale) / 2 - bbox.minY * scale;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.strokeStyle = drawing.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of drawing.svg_paths) {
    ctx.lineWidth = stroke.width;
    ctx.stroke(new Path2D(stroke.d));
  }
  ctx.restore();

  ctx.fillStyle = TEXT_COLOR;
  ctx.textBaseline = "alphabetic";
  ctx.font = `500 ${TITLE_SIZE}px ${fontFamily}`;
  let cursorY = IMAGE_HEIGHT + TEXT_PADDING + TITLE_SIZE * 0.8;
  ctx.fillText(titleText, TEXT_PADDING, cursorY);

  if (noteLines.length) {
    ctx.font = `${BODY_SIZE}px ${fontFamily}`;
    ctx.globalAlpha = 0.75;
    cursorY += 20;
    for (const line of noteLines) {
      cursorY += LINE_HEIGHT;
      ctx.fillText(line, TEXT_PADDING, cursorY);
    }
    ctx.globalAlpha = 1;
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const filename = `${titleText || "drawing"}.png`.replace(/\s+/g, "_");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
