"use client";

import { useRef, useState, useCallback } from "react";
import { pointsToSmoothPath, Point } from "@/lib/svgPath";
import { StrokePath } from "@/lib/drawings";
import { CANVAS_WIDTH, CANVAS_HEIGHT, PEN_WIDTH, TABLET_BREAKPOINT } from "@/lib/canvas";

interface DrawingCanvasProps {
  color: string;
  strokes: StrokePath[];
  onStrokesChange: (strokes: StrokePath[]) => void;
}

// Decide whether a pointer event should be allowed to draw, per input rules:
// - mouse always draws
// - stylus (pen) always draws
// - touch draws only on phone-width viewports; on tablet-width viewports
//   (>=768px) bare finger touch is ignored so only Apple Pencil registers.
function canDraw(pointerType: string): boolean {
  if (pointerType === "mouse" || pointerType === "pen") return true;
  if (pointerType === "touch") {
    return window.innerWidth < TABLET_BREAKPOINT;
  }
  return false;
}

export default function DrawingCanvas({
  color,
  strokes,
  onStrokesChange,
}: DrawingCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activePointerId = useRef<number | null>(null);
  const currentPoints = useRef<Point[]>([]);
  const [liveD, setLiveD] = useState<string>("");

  const toSvgPoint = useCallback((clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!canDraw(e.pointerType)) return;
      e.preventDefault();
      const svg = svgRef.current;
      if (svg) svg.setPointerCapture(e.pointerId);
      activePointerId.current = e.pointerId;
      const p = toSvgPoint(e.clientX, e.clientY);
      currentPoints.current = [p];
      setLiveD(pointsToSmoothPath(currentPoints.current));
    },
    [toSvgPoint]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (activePointerId.current !== e.pointerId) return;
      e.preventDefault();
      const p = toSvgPoint(e.clientX, e.clientY);
      currentPoints.current.push(p);
      setLiveD(pointsToSmoothPath(currentPoints.current));
    },
    [toSvgPoint]
  );

  const finishStroke = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (activePointerId.current !== e.pointerId) return;
      const svg = svgRef.current;
      if (svg && svg.hasPointerCapture(e.pointerId)) {
        svg.releasePointerCapture(e.pointerId);
      }
      activePointerId.current = null;
      if (currentPoints.current.length > 1) {
        const d = pointsToSmoothPath(currentPoints.current);
        onStrokesChange([...strokes, { d, width: PEN_WIDTH }]);
      }
      currentPoints.current = [];
      setLiveD("");
    },
    [strokes, onStrokesChange]
  );

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      className="w-full h-full touch-none select-none"
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
      onPointerLeave={finishStroke}
    >
      {strokes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          fill="none"
          stroke={color}
          strokeWidth={s.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {liveD && (
        <path
          d={liveD}
          fill="none"
          stroke={color}
          strokeWidth={PEN_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
