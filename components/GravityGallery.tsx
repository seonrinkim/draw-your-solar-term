"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";
import { DrawingRecord, fetchDrawings, subscribeToNewDrawings } from "@/lib/drawings";
import {
  BoundingBox,
  Point,
  centroidOf,
  convexHull,
  getStrokesPoints,
  padHull,
  polygonArea,
  polygonCentroid,
} from "@/lib/svgPath";

const WALL_THICKNESS = 200;
const HOVER_RADIUS = 160;
const HOVER_FORCE = 0.0012;
const HULL_PADDING = 14; // canvas units of breathing room around the raw stroke points
// Below this hull area (canvas units²) a "convex hull" is too thin/sliver-like
// to trust as a physics body — near-zero mass makes it numerically unstable
// (bodies can fly off to absurd positions). Fall back to a rectangle instead.
const MIN_HULL_AREA = 400;

// Map a stroke's bounding-box longest side (in canvas units) to an
// on-screen size, so small doodles stay small and bigger ones stay bigger.
const SRC_MIN = 60;
const SRC_MAX = 500;
const DISPLAY_MIN = 55;
const DISPLAY_MAX = 150;

interface CardMeta {
  id: string;
  drawing: DrawingRecord;
  bbox: BoundingBox;
  width: number;
  height: number;
}

function displaySizeFor(bbox: BoundingBox): { width: number; height: number } {
  const longest = Math.max(bbox.width, bbox.height);
  const t = Math.min(Math.max((longest - SRC_MIN) / (SRC_MAX - SRC_MIN), 0), 1);
  const targetLongest = DISPLAY_MIN + t * (DISPLAY_MAX - DISPLAY_MIN);
  const scale = targetLongest / longest;
  return { width: bbox.width * scale, height: bbox.height * scale };
}

export default function GravityGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Map<string, Matter.Body>>(new Map());
  const elementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const wallsRef = useRef<Matter.Body[]>([]);
  const [cards, setCards] = useState<CardMeta[]>([]);

  const addBodyForDrawing = useCallback(
    (drawing: DrawingRecord, dropDelay = 0) => {
      const engine = engineRef.current;
      const container = containerRef.current;
      if (!engine || !container) return;
      if (bodiesRef.current.has(drawing.id)) return;

      // Build a convex hull around the actual stroke points so pieces
      // collide with each other roughly along their own drawn silhouette
      // instead of a rectangular card bounding box.
      const rawPoints = getStrokesPoints(drawing.svg_paths);
      const hull = rawPoints.length >= 3 ? convexHull(rawPoints) : [];
      const usableHull = hull.length >= 3 && polygonArea(hull) >= MIN_HULL_AREA;

      const centroid = usableHull
        ? polygonCentroid(hull)
        : centroidOf(rawPoints.length ? rawPoints : [{ x: 0, y: 0 }]);
      const paddedHull = usableHull ? padHull(hull, centroid, HULL_PADDING) : hull;

      const sourcePoints: Point[] =
        paddedHull.length >= 3 ? paddedHull : rawPoints.length ? rawPoints : [{ x: 0, y: 0 }];
      let halfW = 20;
      let halfH = 20;
      for (const p of sourcePoints) {
        halfW = Math.max(halfW, Math.abs(p.x - centroid.x));
        halfH = Math.max(halfH, Math.abs(p.y - centroid.y));
      }
      const bbox: BoundingBox = {
        minX: centroid.x - halfW,
        minY: centroid.y - halfH,
        width: halfW * 2,
        height: halfH * 2,
      };

      const { width, height } = displaySizeFor(bbox);
      const scale = width / bbox.width;

      const bounds = container.getBoundingClientRect();
      const x = Math.random() * (bounds.width - width * 2) + width;
      const y = -height - Math.random() * 400 - dropDelay * 40;
      const angle = (Math.random() - 0.5) * 0.6;

      let body: Matter.Body;
      if (usableHull) {
        const localVerts = paddedHull.map((p) => ({
          x: (p.x - centroid.x) * scale,
          y: (p.y - centroid.y) * scale,
        }));
        body = Matter.Bodies.fromVertices(x, y, [localVerts], {
          restitution: 0.25,
          friction: 0.55,
          frictionAir: 0.02,
          density: 0.0015,
          label: drawing.id,
        });
        Matter.Body.setAngle(body, angle);
      } else {
        body = Matter.Bodies.rectangle(x, y, width, height, {
          angle,
          chamfer: { radius: 8 },
          restitution: 0.25,
          friction: 0.55,
          frictionAir: 0.02,
          density: 0.0015,
          label: drawing.id,
        });
      }

      bodiesRef.current.set(drawing.id, body);
      Matter.World.add(engine.world, body);
      setCards((prev) => [...prev, { id: drawing.id, drawing, bbox, width, height }]);
    },
    []
  );

  // Set up the physics world once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = Matter.Engine.create();
    engine.gravity.y = 1;
    engineRef.current = engine;

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    const buildWalls = () => {
      const { width, height } = container.getBoundingClientRect();
      wallsRef.current.forEach((w) => Matter.World.remove(engine.world, w));
      const floor = Matter.Bodies.rectangle(
        width / 2,
        height + WALL_THICKNESS / 2,
        width * 3,
        WALL_THICKNESS,
        { isStatic: true }
      );
      const left = Matter.Bodies.rectangle(
        -WALL_THICKNESS / 2,
        height / 2,
        WALL_THICKNESS,
        height * 4,
        { isStatic: true }
      );
      const right = Matter.Bodies.rectangle(
        width + WALL_THICKNESS / 2,
        height / 2,
        WALL_THICKNESS,
        height * 4,
        { isStatic: true }
      );
      wallsRef.current = [floor, left, right];
      Matter.World.add(engine.world, wallsRef.current);
    };

    buildWalls();
    const onResize = () => buildWalls();
    window.addEventListener("resize", onResize);

    // Mouse/touch drag-to-move, works for both desktop click-drag and
    // mobile touch-drag out of the box via Matter's Mouse module.
    const mouse = Matter.Mouse.create(container);
    mouse.pixelRatio = window.devicePixelRatio || 1;
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.15, damping: 0.15, render: { visible: false } },
    });
    Matter.World.add(engine.world, mouseConstraint);

    // Desktop-only passive hover repulsion: nearby cards drift away from
    // the cursor as it moves, without needing a click/drag.
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const bounds = container.getBoundingClientRect();
      const cx = e.clientX - bounds.left;
      const cy = e.clientY - bounds.top;
      bodiesRef.current.forEach((body) => {
        const dx = body.position.x - cx;
        const dy = body.position.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HOVER_RADIUS && dist > 0.01) {
          const strength = (1 - dist / HOVER_RADIUS) * HOVER_FORCE;
          Matter.Body.applyForce(body, body.position, {
            x: (dx / dist) * strength,
            y: (dy / dist) * strength,
          });
        }
      });
    };
    container.addEventListener("pointermove", onPointerMove);

    // Sync DOM transforms to physics bodies every frame without
    // triggering React re-renders.
    const syncPositions = () => {
      bodiesRef.current.forEach((body, id) => {
        const el = elementsRef.current.get(id);
        if (!el) return;
        el.style.transform = `translate3d(${body.position.x}px, ${body.position.y}px, 0) rotate(${body.angle}rad) translate(-50%, -50%)`;
      });
      rafRef.current = requestAnimationFrame(syncPositions);
    };
    const rafRef = { current: 0 };
    rafRef.current = requestAnimationFrame(syncPositions);

    // Initial load of existing drawings, staggered so they cascade in.
    fetchDrawings().then((drawings) => {
      drawings
        .slice()
        .reverse()
        .forEach((d, i) => addBodyForDrawing(d, i));
    });

    const unsubscribe = subscribeToNewDrawings((drawing) => {
      addBodyForDrawing(drawing);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(rafRef.current);
      unsubscribe();
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      bodiesRef.current.clear();
      elementsRef.current.clear();
      setCards([]);
    };
  }, [addBodyForDrawing]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden touch-none">
      {cards.map((card) => (
        <div
          key={card.id}
          ref={(el) => {
            if (el) elementsRef.current.set(card.id, el);
            else elementsRef.current.delete(card.id);
          }}
          className="absolute top-0 left-0 will-change-transform cursor-grab active:cursor-grabbing drop-shadow-[0_2px_6px_rgba(39,32,24,0.25)]"
          style={{ width: card.width, height: card.height }}
          title={`${card.drawing.nickname} — ${card.drawing.note}`}
        >
          <svg
            viewBox={`${card.bbox.minX} ${card.bbox.minY} ${card.bbox.width} ${card.bbox.height}`}
            className="w-full h-full overflow-visible"
          >
            {card.drawing.svg_paths.map((s, i) => (
              <path
                key={i}
                d={s.d}
                fill="none"
                stroke={card.drawing.color}
                strokeWidth={s.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        </div>
      ))}
    </div>
  );
}
