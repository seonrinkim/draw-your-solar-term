"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SolarTerm } from "@/lib/terms";
import { StrokePath, submitDrawing } from "@/lib/drawings";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas";
import DrawingCanvas from "@/components/DrawingCanvas";

type Step = "draw" | "submit";

export default function CanvasFlow({ term }: { term: SolarTerm }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("draw");
  const [strokes, setStrokes] = useState<StrokePath[]>([]);
  const [nickname, setNickname] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push("/");
    } catch {
      setError("Something went wrong while submitting. Please try again.");
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
            ← Back to drawing
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

          <label className="block text-sm opacity-70 mb-2">Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 40))}
            placeholder="What should we call you?"
            className="w-full rounded-xl border border-ink/15 bg-white/60 px-4 py-3 text-base mb-5 outline-none focus:border-ink/40"
          />

          <label className="block text-sm opacity-70 mb-2">
            Why did you draw this?
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            placeholder="A short note about your drawing..."
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
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col min-h-0">
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

        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(39,32,24,0.08)] overflow-hidden"
            style={{
              aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
              maxWidth: "100%",
              maxHeight: "100%",
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
            Undo
          </button>
          <span className="opacity-20">|</span>
          <button
            onClick={clear}
            disabled={strokes.length === 0}
            className="text-sm opacity-70 hover:opacity-100 disabled:opacity-25"
          >
            Clear
          </button>
        </div>
      </div>
    </main>
  );
}
