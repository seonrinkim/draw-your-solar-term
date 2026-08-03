"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";
import { DrawingRecord, fetchDrawings, subscribeToNewDrawings } from "@/lib/drawings";
import {
  BoundingBox,
  compositeQuadCentroid,
  getSegmentQuads,
  getStrokesPoints,
} from "@/lib/svgPath";

const WALL_THICKNESS = 200;
const HOVER_RADIUS = 160;
const HOVER_FORCE = 0.0012;
const QUAD_PADDING = 12; // canvas units of grabbable margin around each thin line segment
const FILL_RATIO_CAP = 0.8; // once occupied footprint hits ~80% of the screen, retire the oldest pieces

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

interface GravityGalleryProps {
  // Reserve this many px at the bottom of the container so the physics
  // floor sits above fixed UI (e.g. footer text), keeping the pile visible.
  bottomInset?: number;
}

export default function GravityGallery({ bottomInset = 0 }: GravityGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Map<string, Matter.Body>>(new Map());
  const elementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const wallsRef = useRef<Matter.Body[]>([]);
  const orderRef = useRef<string[]>([]); // insertion order, oldest first
  const occupiedAreaRef = useRef(0);
  const bottomInsetRef = useRef(bottomInset);
  const buildWallsRef = useRef<(() => void) | null>(null);
  const [cards, setCards] = useState<CardMeta[]>([]);

  useEffect(() => {
    bottomInsetRef.current = bottomInset;
    buildWallsRef.current?.();
  }, [bottomInset]);

  // Occupied-area bookkeeping happens at the call site (before removal),
  // since that's where we know the card's display width/height.
  const removeCard = useCallback((id: string) => {
    const engine = engineRef.current;
    const body = bodiesRef.current.get(id);
    if (engine && body) {
      Matter.World.remove(engine.world, body);
    }
    bodiesRef.current.delete(id);
    elementsRef.current.delete(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addBodyForDrawing = useCallback(
    (drawing: DrawingRecord, dropDelay = 0) => {
      const engine = engineRef.current;
      const container = containerRef.current;
      if (!engine || !container) return;
      if (bodiesRef.current.has(drawing.id)) return;

      // Thin rectangles along each drawn segment (compound parts), so
      // collision follows the actual line instead of a bounding box.
      const quads = getSegmentQuads(drawing.svg_paths, QUAD_PADDING);
      const rawPoints = getStrokesPoints(drawing.svg_paths);

      // Matter.js places a compound body so that the *area-weighted centroid
      // of its parts* lands at body.position — not any bounding-box center.
      // Anchoring our render box on that same centroid keeps the visible
      // SVG exactly where the physics body actually is.
      const anchor =
        quads.length > 0 ? compositeQuadCentroid(quads) : rawPoints[0] ?? { x: 0, y: 0 };

      let halfW = 20;
      let halfH = 20;
      const extentPoints = rawPoints.length ? rawPoints : [anchor];
      for (const p of extentPoints) {
        halfW = Math.max(halfW, Math.abs(p.x - anchor.x));
        halfH = Math.max(halfH, Math.abs(p.y - anchor.y));
      }
      const displayPad = 16;
      const bbox: BoundingBox = {
        minX: anchor.x - halfW - displayPad,
        minY: anchor.y - halfH - displayPad,
        width: (halfW + displayPad) * 2,
        height: (halfH + displayPad) * 2,
      };

      const { width, height } = displaySizeFor(bbox);
      const scale = width / bbox.width;

      const bounds = container.getBoundingClientRect();
      const x = Math.random() * (bounds.width - width * 2) + width;
      const y = -height - Math.random() * 400 - dropDelay * 40;
      const angle = (Math.random() - 0.5) * 0.6;

      const localQuads = quads.map((quad) =>
        quad.map((p) => ({
          x: (p.x - anchor.x) * scale,
          y: (p.y - anchor.y) * scale,
        }))
      );

      const physicsOptions = {
        restitution: 0.45,
        friction: 0.3,
        frictionAir: 0.012,
        density: 0.0015,
        label: drawing.id,
      };

      let body: Matter.Body;
      if (localQuads.length > 0) {
        body = Matter.Bodies.fromVertices(x, y, localQuads, physicsOptions);
        Matter.Body.setAngle(body, angle);
      } else {
        body = Matter.Bodies.rectangle(x, y, width, height, {
          ...physicsOptions,
          angle,
          chamfer: { radius: 6 },
        });
      }

      // A little spin on the way in so pieces tumble rather than fall flat.
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);

      bodiesRef.current.set(drawing.id, body);
      Matter.World.add(engine.world, body);
      orderRef.current.push(drawing.id);
      occupiedAreaRef.current += width * height;
      setCards((prev) => [...prev, { id: drawing.id, drawing, bbox, width, height }]);

      // Once the pile's footprint fills ~80% of the screen, retire the
      // oldest pieces so newer submissions keep visibly landing on top.
      const containerArea = bounds.width * bounds.height;
      while (
        occupiedAreaRef.current > containerArea * FILL_RATIO_CAP &&
        orderRef.current.length > 1
      ) {
        const oldestId = orderRef.current[0];
        const oldestCard = bodiesRef.current.get(oldestId);
        if (oldestCard) {
          const w = oldestCard.bounds.max.x - oldestCard.bounds.min.x;
          const h = oldestCard.bounds.max.y - oldestCard.bounds.min.y;
          occupiedAreaRef.current = Math.max(0, occupiedAreaRef.current - w * h);
        }
        orderRef.current.shift();
        removeCard(oldestId);
      }
    },
    [removeCard]
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
      const floorY = height - bottomInsetRef.current;
      wallsRef.current.forEach((w) => Matter.World.remove(engine.world, w));
      const floor = Matter.Bodies.rectangle(
        width / 2,
        floorY + WALL_THICKNESS / 2,
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

    buildWallsRef.current = buildWalls;
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
      orderRef.current = [];
      occupiedAreaRef.current = 0;
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
