"use client";

import { useEffect, useRef, useState } from "react";

type RectType = "artwork" | "context";
type Preset = "A5" | "A3";
type Orientation = "portrait" | "landscape";
type Corner = "n" | "s"; // context height handles only — width and artwork size are fixed

interface Rect {
  id: string;
  type: RectType;
  label: string;
  x: number; // % from left
  y: number; // % from top
  w: number; // % width
  h: number; // % height
  preset?: Preset;
  orientation?: Orientation;
}

type Interaction =
  | { kind: "draw"; startX: number; startY: number; fixedWidth: number }
  | { kind: "move"; id: string; startX: number; startY: number; orig: Rect }
  | { kind: "resize"; id: string; corner: Corner; orig: Rect };

interface GuideLines {
  vertical: number[];
  horizontal: number[];
}

const MIN_SIZE = 1; // percent, ignore accidental tiny drags
const SNAP_PX = 6; // snap distance in on-screen pixels, converted to % per axis at drag time
const DUPLICATE_OFFSET = 3; // percent offset so a duplicate doesn't land exactly on the original
const HANDLE_HIT_PX = 14; // generous click/tap target around each height-resize handle
const TYPE_COLOR: Record<RectType, string> = {
  artwork: "#120a00",
  context: "#969089",
};
const GUIDE_COLOR = "#ff3b8d";
const NO_GUIDES: GuideLines = { vertical: [], horizontal: [] };
const A_RATIO = Math.SQRT2; // every A-series page shares this height/width ratio

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// `widths[preset]` is the frame's short edge, as a percent of the canvas's WIDTH.
// The canvas's width-% and height-% axes aren't equal in real pixels (the wall
// photo itself is wide, not square), so naively swapping w/h for landscape — or
// computing h = w * A_RATIO directly — draws the wrong on-screen shape. Convert
// through containerAspect (canvas width px / height px) so the rendered box
// actually keeps the true A-series ratio regardless of the photo's own shape.
function presetSize(
  preset: Preset,
  orientation: Orientation,
  widths: Record<Preset, number>,
  containerAspect: number
): { w: number; h: number } {
  const shortPct = widths[preset];
  if (orientation === "portrait") {
    return { w: shortPct, h: shortPct * A_RATIO * containerAspect };
  }
  return { w: shortPct * A_RATIO, h: shortPct * containerAspect };
}

// Candidate snap positions along one axis: every other rect's start/center/end edge,
// plus the canvas's own left/center/right (or top/center/bottom) edges.
function buildCandidates(others: Rect[], axis: "x" | "y"): number[] {
  const candidates = [0, 50, 100];
  for (const r of others) {
    const start = axis === "x" ? r.x : r.y;
    const size = axis === "x" ? r.w : r.h;
    candidates.push(start, start + size / 2, start + size);
  }
  return candidates;
}

// Snap a single moving point (used when growing a context caption's height,
// and for the free edge while resizing).
function snapPoint(value: number, candidates: number[], threshold: number): { value: number; guide: number | null } {
  let best: { diff: number; c: number } | null = null;
  for (const c of candidates) {
    const diff = c - value;
    if (Math.abs(diff) <= threshold && (!best || Math.abs(diff) < Math.abs(best.diff))) {
      best = { diff, c };
    }
  }
  return best ? { value: best.c, guide: best.c } : { value, guide: null };
}

// Snap a moving rect's edge (used while dragging/moving): checks the rect's start,
// center, and end against every candidate and returns the single best match.
function snapMulti(points: number[], candidates: number[], threshold: number): { offset: number; guide: number } | null {
  let best: { diff: number; offset: number; guide: number } | null = null;
  for (const p of points) {
    for (const c of candidates) {
      const diff = c - p;
      if (Math.abs(diff) <= threshold && (!best || Math.abs(diff) < Math.abs(best.diff))) {
        best = { diff, offset: diff, guide: c };
      }
    }
  }
  return best;
}

export default function ExhibitionEditorPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawType, setDrawType] = useState<RectType>("artwork");
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [guides, setGuides] = useState<GuideLines>(NO_GUIDES);

  // Artwork: a fixed A5/A3 size you stamp down and then just reposition.
  const [artworkPreset, setArtworkPreset] = useState<Preset>("A5");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [presetWidths, setPresetWidths] = useState<Record<Preset, number>>({ A5: 8, A3: 16 });

  // Context: every caption shares this width; only height varies per instance.
  const [contextWidth, setContextWidth] = useState(12);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const counterRef = useRef<{ artwork: number; context: number }>({ artwork: 0, context: 0 });

  const selected = rects.find((r) => r.id === selectedId) ?? null;
  const containerAspect = naturalSize ? naturalSize.w / naturalSize.h : 1;

  // If the browser serves the image from cache, it can finish loading (and fire
  // its native "load" event) before React attaches the onLoad handler below, so
  // the callback would otherwise never run. Check the already-loaded case too.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
    }
  }, [imageSrc]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toPercent = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const bounds = el.getBoundingClientRect();
    const x = clamp(((clientX - bounds.left) / bounds.width) * 100, 0, 100);
    const y = clamp(((clientY - bounds.top) / bounds.height) * 100, 0, 100);
    return { x, y };
  };

  // Snap thresholds in percent, derived from a fixed pixel distance so they stay
  // consistent regardless of how large the image is rendered.
  const snapThresholds = () => {
    const el = containerRef.current;
    if (!el) return { x: 0.5, y: 0.5 };
    const bounds = el.getBoundingClientRect();
    return { x: (SNAP_PX / bounds.width) * 100, y: (SNAP_PX / bounds.height) * 100 };
  };

  const nextId = (type: RectType) => {
    counterRef.current[type] += 1;
    return `${type}-${String(counterRef.current[type]).padStart(2, "0")}`;
  };

  const hitRect = (px: number, py: number): Rect | null => {
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return r;
    }
    return null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    const { x, y } = toPercent(e.clientX, e.clientY);

    // Resize handles have their own onMouseDown (see the rect list below) that
    // stops propagation, so a click reaching this far was never on a handle.
    if (selected && x >= selected.x && x <= selected.x + selected.w && y >= selected.y && y <= selected.y + selected.h) {
      interactionRef.current = { kind: "move", id: selected.id, startX: x, startY: y, orig: selected };
      return;
    }

    const hit = hitRect(x, y);
    if (hit) {
      setSelectedId(hit.id);
      interactionRef.current = { kind: "move", id: hit.id, startX: x, startY: y, orig: hit };
      return;
    }

    setSelectedId(null);

    if (drawType === "artwork") {
      // Stamp down a rect at the preset's fixed size, centered on the click,
      // and immediately start moving it — so a click-drag places it in one motion.
      const size = presetSize(artworkPreset, orientation, presetWidths, containerAspect);
      const rx = clamp(x - size.w / 2, 0, 100 - size.w);
      const ry = clamp(y - size.h / 2, 0, 100 - size.h);
      const id = nextId("artwork");
      const newRect: Rect = {
        id,
        type: "artwork",
        label: "",
        x: rx,
        y: ry,
        w: size.w,
        h: size.h,
        preset: artworkPreset,
        orientation,
      };
      setRects((prev) => [...prev, newRect]);
      setSelectedId(id);
      interactionRef.current = { kind: "move", id, startX: x, startY: y, orig: newRect };
      return;
    }

    // Context: width is locked to the shared setting; only the vertical drag
    // sets the height, so the left edge is fixed at (a snapped) click position.
    const threshold = snapThresholds();
    const xCandidates = buildCandidates(rects, "x");
    const snappedX = snapPoint(x, xCandidates, threshold.x);
    const x0 = clamp(snappedX.value, 0, 100 - contextWidth);
    interactionRef.current = { kind: "draw", startX: x0, startY: y, fixedWidth: contextWidth };
    setDraft({ x: x0, y, w: contextWidth, h: 0 });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    const { x: rawX, y: rawY } = toPercent(e.clientX, e.clientY);
    const threshold = snapThresholds();

    if (interaction.kind === "draw") {
      const yCandidates = buildCandidates(rects, "y");
      const snappedY = snapPoint(rawY, yCandidates, threshold.y);
      const y = snappedY.value;
      const y0 = Math.min(interaction.startY, y);
      const h = Math.abs(y - interaction.startY);
      setDraft({ x: interaction.startX, y: y0, w: interaction.fixedWidth, h });
      setGuides({ vertical: [], horizontal: snappedY.guide !== null ? [snappedY.guide] : [] });
      return;
    }

    if (interaction.kind === "move") {
      const dx = rawX - interaction.startX;
      const dy = rawY - interaction.startY;
      const { orig } = interaction;
      let nx = clamp(orig.x + dx, 0, 100 - orig.w);
      let ny = clamp(orig.y + dy, 0, 100 - orig.h);

      const others = rects.filter((r) => r.id !== interaction.id);
      const xCandidates = buildCandidates(others, "x");
      const yCandidates = buildCandidates(others, "y");

      const nextGuides: GuideLines = { vertical: [], horizontal: [] };

      const xSnap = snapMulti([nx, nx + orig.w / 2, nx + orig.w], xCandidates, threshold.x);
      if (xSnap) {
        nx = clamp(nx + xSnap.offset, 0, 100 - orig.w);
        nextGuides.vertical.push(xSnap.guide);
      }
      const ySnap = snapMulti([ny, ny + orig.h / 2, ny + orig.h], yCandidates, threshold.y);
      if (ySnap) {
        ny = clamp(ny + ySnap.offset, 0, 100 - orig.h);
        nextGuides.horizontal.push(ySnap.guide);
      }

      setRects((prev) => prev.map((r) => (r.id === interaction.id ? { ...r, x: nx, y: ny } : r)));
      setGuides(nextGuides);
      return;
    }

    if (interaction.kind === "resize") {
      // Context only: the handle moves just the top or bottom edge, height changes,
      // x/width never do.
      const { orig, corner } = interaction;
      const others = rects.filter((r) => r.id !== interaction.id);
      const yCandidates = buildCandidates(others, "y");
      const ySnap = snapPoint(rawY, yCandidates, threshold.y);

      let ry = orig.y;
      let rh = orig.h;
      if (corner === "s") {
        const bottom = clamp(Math.max(ySnap.value, orig.y + MIN_SIZE), 0, 100);
        rh = bottom - orig.y;
      } else {
        const bottom = orig.y + orig.h;
        const top = clamp(Math.min(ySnap.value, bottom - MIN_SIZE), 0, 100);
        ry = top;
        rh = bottom - top;
      }

      setRects((prev) => prev.map((r) => (r.id === interaction.id ? { ...r, y: ry, h: rh } : r)));
      setGuides({ vertical: [], horizontal: ySnap.guide !== null ? [ySnap.guide] : [] });
    }
  };

  const onMouseUp = () => {
    const interaction = interactionRef.current;
    if (interaction?.kind === "draw" && draft) {
      if (draft.h >= MIN_SIZE) {
        const id = nextId("context");
        const newRect: Rect = { id, type: "context", label: "", ...draft };
        setRects((prev) => [...prev, newRect]);
        setSelectedId(id);
      }
    }
    interactionRef.current = null;
    setDraft(null);
    setGuides(NO_GUIDES);
  };

  const updateSelected = (patch: Partial<Rect>) => {
    if (!selectedId) return;
    setRects((prev) => prev.map((r) => (r.id === selectedId ? { ...r, ...patch } : r)));
  };

  // Reapply a preset/orientation to the selected artwork, keeping it centered
  // on its current spot — a quick fix for the odd frame that needs a nudge.
  const applyPresetToSelected = (preset: Preset, newOrientation: Orientation) => {
    if (!selected || selected.type !== "artwork") return;
    const size = presetSize(preset, newOrientation, presetWidths, containerAspect);
    const cx = selected.x + selected.w / 2;
    const cy = selected.y + selected.h / 2;
    const nx = clamp(cx - size.w / 2, 0, 100 - size.w);
    const ny = clamp(cy - size.h / 2, 0, 100 - size.h);
    updateSelected({ x: nx, y: ny, w: size.w, h: size.h, preset, orientation: newOrientation });
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const id = nextId(selected.type);
    const nx = clamp(selected.x + DUPLICATE_OFFSET, 0, 100 - selected.w);
    const ny = clamp(selected.y + DUPLICATE_OFFSET, 0, 100 - selected.h);
    const copy: Rect = { ...selected, id, x: nx, y: ny };
    setRects((prev) => [...prev, copy]);
    setSelectedId(id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setRects((prev) => prev.filter((r) => r.id !== selectedId));
    setSelectedId(null);
  };

  const exportJson = () => {
    const data = rects.map(({ id, type, label, x, y, w, h }) => ({
      id,
      type,
      label,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      w: Math.round(w * 100) / 100,
      h: Math.round(h * 100) / 100,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exhibition-layout.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Rect[];
        setRects(parsed);
        counterRef.current = { artwork: 0, context: 0 };
        for (const r of parsed) {
          const match = r.id.match(/-(\d+)$/);
          const num = match ? parseInt(match[1], 10) : 0;
          if (r.type === "artwork") counterRef.current.artwork = Math.max(counterRef.current.artwork, num);
          if (r.type === "context") counterRef.current.context = Math.max(counterRef.current.context, num);
        }
      } catch {
        alert("JSON 파일을 읽을 수 없습니다.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen w-full bg-hanji text-ink p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">전시 배치도 좌표 지정 도구</h1>
        <p className="text-sm opacity-60 mt-1">
          작품은 A5/A3 사이즈를 고르고 캔버스를 클릭하면 그 크기 그대로 놓여요 — 그대로 드래그해서
          위치만 옮기면 됩니다. 컨텍스트는 폭이 고정된 채로 드래그한 만큼만 높이가 생기고, 선택한 뒤
          &quot;복제&quot;로 계속 복사해서 높이만 조절해 쓰면 돼요. 다른 사각형·캔버스의 모서리·중앙에
          가까워지면 자동으로 스냅되고 분홍색 가이드라인이 표시됩니다. (이 도구는 로컬에서만 동작하며
          이미지를 어디로도 업로드하지 않습니다.)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="px-4 py-2 rounded-full bg-ink text-hanji text-sm cursor-pointer hover:opacity-85 transition-opacity">
          배치도 사진 열기
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>

        <div className="flex rounded-full bg-ink/5 p-1 text-sm">
          <button
            onClick={() => setDrawType("artwork")}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              drawType === "artwork" ? "bg-ink text-hanji" : "opacity-60 hover:opacity-100"
            }`}
          >
            작품 배치
          </button>
          <button
            onClick={() => setDrawType("context")}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              drawType === "context" ? "bg-ink text-hanji" : "opacity-60 hover:opacity-100"
            }`}
          >
            컨텍스트 배치
          </button>
        </div>

        <button
          onClick={exportJson}
          disabled={rects.length === 0}
          className="px-4 py-2 rounded-full text-sm bg-celadon text-ink disabled:opacity-30 hover:opacity-85 transition-opacity"
        >
          JSON 내보내기
        </button>

        <label className="px-4 py-2 rounded-full bg-ink/5 text-sm cursor-pointer hover:bg-ink/10 transition-colors">
          JSON 불러오기
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
          />
        </label>
      </div>

      {drawType === "artwork" ? (
        <div className="flex flex-wrap items-center gap-3 -mt-1">
          <div className="flex rounded-full bg-ink/5 p-1 text-xs">
            {(["A5", "A3"] as Preset[]).map((p) => (
              <button
                key={p}
                onClick={() => setArtworkPreset(p)}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  artworkPreset === p ? "bg-ink text-hanji" : "opacity-60 hover:opacity-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex rounded-full bg-ink/5 p-1 text-xs">
            {(["portrait", "landscape"] as Orientation[]).map((o) => (
              <button
                key={o}
                onClick={() => setOrientation(o)}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  orientation === o ? "bg-ink text-hanji" : "opacity-60 hover:opacity-100"
                }`}
              >
                {o === "portrait" ? "세로" : "가로"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs opacity-70">
            A5 폭%
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={presetWidths.A5}
              onChange={(e) => setPresetWidths((prev) => ({ ...prev, A5: Number(e.target.value) || prev.A5 }))}
              className="w-16 border border-ink/20 rounded px-2 py-1 bg-white"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs opacity-70">
            A3 폭%
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={presetWidths.A3}
              onChange={(e) => setPresetWidths((prev) => ({ ...prev, A3: Number(e.target.value) || prev.A3 }))}
              className="w-16 border border-ink/20 rounded px-2 py-1 bg-white"
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 -mt-1">
          <label className="flex items-center gap-1.5 text-xs opacity-70">
            컨텍스트 폭%
            <input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={contextWidth}
              onChange={(e) => setContextWidth(Number(e.target.value) || contextWidth)}
              className="w-16 border border-ink/20 rounded px-2 py-1 bg-white"
            />
          </label>
          <span className="text-xs opacity-40">캔버스를 위아래로 드래그하면 이 폭 그대로 높이만 생겨요</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div
          ref={containerRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="relative w-full lg:flex-1 border border-ink/20 select-none bg-white overflow-hidden"
          style={{
            aspectRatio: naturalSize ? `${naturalSize.w} / ${naturalSize.h}` : undefined,
            minHeight: naturalSize ? undefined : 400,
            cursor: imageSrc ? "crosshair" : "default",
          }}
        >
          {imageSrc ? (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="배치도"
              className="w-full h-full block pointer-events-none"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm opacity-40">
              배치도 사진을 먼저 열어주세요
            </div>
          )}

          {rects.map((r) => (
            <div
              key={r.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedId(r.id);
                const { x, y } = toPercent(e.clientX, e.clientY);
                interactionRef.current = { kind: "move", id: r.id, startX: x, startY: y, orig: r };
              }}
              className="absolute"
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                width: `${r.w}%`,
                height: `${r.h}%`,
                border: `2px solid ${TYPE_COLOR[r.type]}`,
                background: r.id === selectedId ? `${TYPE_COLOR[r.type]}22` : "transparent",
                boxSizing: "border-box",
              }}
            >
              <span
                className="absolute -top-5 left-0 text-[10px] px-1 rounded whitespace-nowrap"
                style={{ background: TYPE_COLOR[r.type], color: r.type === "context" ? "#120a00" : "#FFFBEF" }}
              >
                {r.id}
              </span>
              {r.id === selectedId && r.type === "context" && (
                <>
                  {(["n", "s"] as Corner[]).map((corner) => (
                    <div
                      key={corner}
                      // Stops propagation here so the rect's own onMouseDown (which
                      // always starts a move) never gets a chance to run first —
                      // otherwise clicking exactly on the handle would just move it.
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        interactionRef.current = { kind: "resize", id: r.id, corner, orig: r };
                      }}
                      className="absolute flex items-center justify-center"
                      style={{
                        left: "50%",
                        top: corner === "n" ? -HANDLE_HIT_PX : undefined,
                        bottom: corner === "s" ? -HANDLE_HIT_PX : undefined,
                        width: HANDLE_HIT_PX * 2,
                        height: HANDLE_HIT_PX * 2,
                        marginLeft: -HANDLE_HIT_PX,
                        cursor: "ns-resize",
                      }}
                    >
                      <div className="bg-white border border-ink" style={{ width: 24, height: 8 }} />
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}

          {draft && (
            <div
              className="absolute border-2 border-dashed pointer-events-none"
              style={{
                left: `${draft.x}%`,
                top: `${draft.y}%`,
                width: `${draft.w}%`,
                height: `${draft.h}%`,
                borderColor: TYPE_COLOR.context,
              }}
            />
          )}

          {guides.vertical.map((gx) => (
            <div
              key={`v-${gx}`}
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: `${gx}%`, width: 1, background: GUIDE_COLOR }}
            />
          ))}
          {guides.horizontal.map((gy) => (
            <div
              key={`h-${gy}`}
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: `${gy}%`, height: 1, background: GUIDE_COLOR }}
            />
          ))}
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-3">
          <h2 className="text-sm font-medium">
            사각형 목록 <span className="opacity-40">({rects.length})</span>
          </h2>

          {selected && (
            <div className="border border-ink/20 rounded-lg p-3 flex flex-col gap-2 bg-white/40">
              <div className="text-xs opacity-60">선택됨 · {selected.type}</div>
              <label className="text-xs flex flex-col gap-1">
                id
                <input
                  value={selected.id}
                  onChange={(e) => updateSelected({ id: e.target.value })}
                  className="border border-ink/20 rounded px-2 py-1 text-sm bg-white"
                />
              </label>
              <label className="text-xs flex flex-col gap-1">
                라벨 (메모용, 예: 작품명 또는 컨텍스트 제목)
                <input
                  value={selected.label}
                  onChange={(e) => updateSelected({ label: e.target.value })}
                  className="border border-ink/20 rounded px-2 py-1 text-sm bg-white"
                />
              </label>

              {selected.type === "artwork" && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-60">사이즈 재적용</span>
                  <div className="flex gap-2">
                    {(["A5", "A3"] as Preset[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => applyPresetToSelected(p, selected.orientation ?? orientation)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                          selected.preset === p ? "bg-ink text-hanji" : "bg-ink/5 hover:bg-ink/10"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    {(["portrait", "landscape"] as Orientation[]).map((o) => (
                      <button
                        key={o}
                        onClick={() => applyPresetToSelected(selected.preset ?? artworkPreset, o)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                          selected.orientation === o ? "bg-ink text-hanji" : "bg-ink/5 hover:bg-ink/10"
                        }`}
                      >
                        {o === "portrait" ? "세로" : "가로"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={duplicateSelected}
                  className="text-xs px-3 py-1.5 rounded-full bg-celadon/30 hover:bg-celadon/50 transition-colors"
                >
                  복제
                </button>
                <button
                  onClick={deleteSelected}
                  className="text-xs px-3 py-1.5 rounded-full bg-persimmon/10 text-persimmon hover:bg-persimmon/20 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          )}

          <ul className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
            {rects.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${
                    r.id === selectedId ? "bg-ink text-hanji" : "hover:bg-ink/5"
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: TYPE_COLOR[r.type] }}
                  />
                  <span className="truncate">
                    {r.id} {r.label && `— ${r.label}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
