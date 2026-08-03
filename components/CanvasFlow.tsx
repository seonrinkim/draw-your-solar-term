"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SolarTerm } from "@/lib/terms";
import { StrokePath, submitDrawing } from "@/lib/drawings";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas";
import { mirrorToGoogle } from "@/lib/mirror";
import { useLanguage } from "@/lib/i18n";
import DrawingCanvas from "@/components/DrawingCanvas";

type Step = "draw" | "submit";
const CANVAS_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT;

export default function CanvasFlow({ term }: { term: SolarTerm }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("draw");
  const [strokes, setStrokes] = useState<StrokePath[]>([]);
  const [nickname, setNickname] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Measure the available area ourselves (rather than relying on CSS
  // aspect-ratio auto-sizing inside a centered flex box, which doesn't
  // reliably fill available space without an explicit sizing basis) so
  // the canvas always uses as much of the screen as it can while keeping
  // its A6 ratio and never needing to scroll.
  const fitRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 320, height: 320 / CANVAS_ASPECT });

  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;

    const measure = () => {
      const { width: availW, height: availH } = el.getBoundingClientRect();
      if (availW <= 0 || availH <= 0) return;
      const containerAspect = availW / availH;
      if (containerAspect > CANVAS_ASPECT) {
        setCanvasSize({ width: availH * CANVAS_ASPECT, height: availH });
      } else {
        setCanvasSize({ width: availW, height: availW / CANVAS_ASPECT });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const undo = () => setStrokes((s) => s.slice(0, -1));
  const clear = () => setStrokes([]);

  const handleSubmit = async () => {
    if (!nickname.trim() || !note.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitDrawing({
        term_slug: term.slug,
        color: term.color,
        svg_paths: strokes,
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        nickname: nickname.trim(),
        note: note.trim(),
        consent: true,
      });
      mirrorToGoogle({
        term,
        strokes,
        nickname: nickname.trim(),
        note: note.trim(),
      });
      router.push("/");
    } catch {
      setError(t.errorMessage);
      setSubmitting(false);
    }
  };

  if (step === "submit") {
    return (
      <main className="flex-1 pt-24 pb-16 px-5 sm:px-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setStep("draw")}
            className="text-sm opacity-60 hover:opacity-100 mb-6"
          >
            {t.backToDrawing}
          </button>

          <div className="flex items-center gap-2 mb-6">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: term.color }}
            />
            <h1 className="text-xl">
              {term.hangul} {term.romanized}
            </h1>
          </div>

          <label className="block text-sm opacity-70 mb-2">{t.nicknameLabel}</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 40))}
            placeholder={t.nicknamePlaceholder}
            className="w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-3 text-base mb-5 outline-none focus:border-ink/40"
          />

          <label className="block text-sm opacity-70 mb-2">{t.noteLabel}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            placeholder={t.notePlaceholder}
            rows={4}
            className="w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-3 text-base mb-2 outline-none focus:border-ink/40 resize-none"
          />
          <p className="text-xs opacity-50 mb-6 text-right">
            {note.length}/280
          </p>

          {error && (
            <p className="text-sm text-persimmon mb-4">{error}</p>
          )}

          <button
            disabled={!nickname.trim() || !note.trim() || submitting}
            onClick={handleSubmit}
            className="w-full px-8 py-3 rounded-full text-base transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: term.color, color: "#F4F0E6" }}
          >
            {submitting ? "Sending..." : "Let's show your masterpiece!"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] pt-20 pb-4 px-5 sm:px-8 flex flex-col overflow-hidden">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: term.color }}
            />
            <span className="text-sm sm:text-base">
              {term.hangul} {term.romanized}
            </span>
          </div>
          <button
            disabled={strokes.length === 0}
            onClick={() => setStep("submit")}
            className="px-5 py-2 rounded-full text-sm sm:text-base transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: term.color, color: "#F4F0E6" }}
          >
            I&apos;m done!
          </button>
        </div>

        <div ref={fitRef} className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(39,32,24,0.08)] overflow-hidden"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          >
            <DrawingCanvas
              color={term.color}
              strokes={strokes}
              onStrokesChange={setStrokes}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-3 shrink-0">
          <button
            onClick={undo}
            disabled={strokes.length === 0}
            className="text-sm opacity-70 hover:opacity-100 disabled:opacity-25"
          >
            {t.undo}
          </button>
          <span className="opacity-20">|</span>
          <button
            onClick={clear}
            disabled={strokes.length === 0}
            className="text-sm opacity-70 hover:opacity-100 disabled:opacity-25"
          >
            {t.clear}
          </button>
        </div>
      </div>
    </main>
  );
}
