"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";
import { DrawingRecord, fetchDrawings, subscribeToNewDrawings } from "@/lib/drawings";
import { BoundingBox, getStrokesBoundingBox } from "@/lib/svgPath";

const WALL_THICKNESS = 200;
const HOVER_RADIUS = 160;
const HOVER_TAP_SPEED = 4.5; // one-off velocity kick when the cursor first brushes a card, at point-blank range
const BBOX_PADDING = 16; // canvas units of margin around each drawing's ink
const FILL_RATIO_CAP = 0.8; // once occupied footprint hits ~80% of the screen, retire the oldest pieces
const TOOLTIP_HOVER_DELAY = 900; // ms the mouse must rest on a card before its caption appears
const TAP_MOVE_TOLERANCE = 10; // px of finger movement still counted as a tap, not a drag

interface TooltipState {
  id: string;
  nickname: string;
  note: string;
  x: number; // viewport px, center of the card
  y: number; // viewport px, top edge of the card
}

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
  const sizesRef = useRef<Map<string, { width: number; height: number }>>(new Map());
  const wallsRef = useRef<Matter.Body[]>([]);
  const orderRef = useRef<string[]>([]); // insertion order, oldest first
  const occupiedAreaRef = useRef(0);
  const bottomInsetRef = useRef(bottomInset);
  const buildWallsRef = useRef<(() => void) | null>(null);
  const floorYRef = useRef(Infinity);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const tappedIdsRef = useRef<Set<string>>(new Set()); // ids currently inside the hover radius, already tapped
  const tooltipTimeoutRef = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [cards, setCards] = useState<CardMeta[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Tap/click anywhere outside a card closes its caption. Each card's own
  // click/touchend handler stops propagation, so this only ever sees
  // "outside" taps. Both events are listened for: Matter's Mouse module
  // calls preventDefault() on every touchstart/touchend inside the gallery
  // (see the mouseConstraint setup below), which suppresses the browser's
  // synthetic click on touch devices, so "click" alone never fires on mobile.
  useEffect(() => {
    if (!tooltip) return;
    const closeTooltip = () => setTooltip(null);
    window.addEventListener("click", closeTooltip);
    window.addEventListener("touchend", closeTooltip);
    return () => {
      window.removeEventListener("click", closeTooltip);
      window.removeEventListener("touchend", closeTooltip);
    };
  }, [tooltip]);

  // Keep the caption bubble on-screen for cards near an edge. `tooltip.x/y`
  // anchor to the card (center-x, top-y) and the bubble is normally centered
  // above that via a translate — for a card near the left/right/top edge
  // that pushes the bubble half off-screen. Runs after layout (so the
  // bubble's real rendered width/height is known, since it varies with
  // caption length) but before paint, and sets the transform imperatively
  // rather than through state so nudging it doesn't cost an extra render.
  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!tooltip || !el) return;
    const EDGE_PADDING = 12;
    const baseTransform = "translate(-50%, calc(-100% - 10px))";
    el.style.transform = baseTransform;
    const rect = el.getBoundingClientRect();
    let dx = 0;
    if (rect.left < EDGE_PADDING) {
      dx = EDGE_PADDING - rect.left;
    } else if (rect.right > window.innerWidth - EDGE_PADDING) {
      dx = window.innerWidth - EDGE_PADDING - rect.right;
    }
    let dy = 0;
    if (rect.top < EDGE_PADDING) {
      dy = EDGE_PADDING - rect.top;
    }
    if (dx !== 0 || dy !== 0) {
      el.style.transform = `translate(calc(-50% + ${dx}px), calc(-100% - 10px + ${dy}px))`;
    }
  }, [tooltip]);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current !== null) window.clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

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
    sizesRef.current.delete(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addBodyForDrawing = useCallback(
    (drawing: DrawingRecord, dropDelay = 0) => {
      const engine = engineRef.current;
      const container = containerRef.current;
      if (!engine || !container) return;
      if (bodiesRef.current.has(drawing.id)) return;

      // A solid rectangle around the drawing's ink — this is the physics
      // body's actual collision shape, so pieces rest against each other
      // like real cards instead of nesting through each other's empty
      // (undrawn) space, which is what a thin per-line collision shape
      // would otherwise allow.
      const bbox: BoundingBox = getStrokesBoundingBox(drawing.svg_paths, BBOX_PADDING);

      const { width, height } = displaySizeFor(bbox);

      const bounds = container.getBoundingClientRect();
      const x = Math.random() * (bounds.width - width * 2) + width;
      const y = -height - Math.random() * 400 - dropDelay * 40;
      const angle = (Math.random() - 0.5) * 0.6;

      const body = Matter.Bodies.rectangle(x, y, width, height, {
        restitution: 0.45,
        friction: 0.3,
        frictionAir: 0.012,
        density: 0.0015,
        label: drawing.id,
        angle,
        chamfer: { radius: 8 },
      });

      // A little spin on the way in so pieces tumble rather than fall flat.
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);

      bodiesRef.current.set(drawing.id, body);
      sizesRef.current.set(drawing.id, { width, height });
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

    const engine = Matter.Engine.create({
      // Higher than default iteration counts so that overlapping spawns
      // (two drawings landing close together) get resolved gently over
      // several steps instead of one large corrective impulse.
      positionIterations: 10,
      velocityIterations: 8,
    });
    engine.gravity.y = 1;
    engineRef.current = engine;

    // A spawn-overlap correction can otherwise fling a body fast enough to
    // tunnel straight through the floor within a single physics step, so it
    // lands off-screen and never settles. Matter.js has no continuous
    // collision detection, so instead of a single ~16.7ms step per frame we
    // run several smaller substeps — each one moves every body less,
    // leaving collision detection enough chances to catch it before it
    // skips through the floor — and clamp velocity as a second safety net.
    const SUBSTEPS = 4;
    const FIXED_DELTA = 1000 / 60 / SUBSTEPS;
    const MAX_SPEED = 40;
    const onAfterUpdate = () => {
      const floorY = floorYRef.current;
      bodiesRef.current.forEach((body) => {
        const speed = Matter.Vector.magnitude(body.velocity);
        if (speed > MAX_SPEED) {
          const scale = MAX_SPEED / speed;
          Matter.Body.setVelocity(body, {
            x: body.velocity.x * scale,
            y: body.velocity.y * scale,
          });
        }

        // Hard backstop: whatever the solver did (deep spawn overlaps can
        // still leave a body partially sunk into the floor even with
        // substeps and a velocity cap), never let a body's lowest point
        // rest below the floor line — pop it back up and kill any
        // remaining downward velocity.
        let lowestY = -Infinity;
        for (const v of body.vertices) {
          if (v.y > lowestY) lowestY = v.y;
        }
        if (lowestY > floorY) {
          Matter.Body.translate(body, { x: 0, y: floorY - lowestY });
          if (body.velocity.y > 0) {
            Matter.Body.setVelocity(body, { x: body.velocity.x, y: 0 });
          }
        }
      });
    };
    Matter.Events.on(engine, "afterUpdate", onAfterUpdate);

    // Mouse/touch drag-to-move, works for both desktop click-drag and
    // mobile touch-drag out of the box via Matter's Mouse module.
    //
    // Note: no `mouse.pixelRatio` override here. Matter's Mouse divides the
    // raw cursor offset by pixelRatio, which is meant for a <canvas> whose
    // backing store is rendered at devicePixelRatio while displayed at CSS
    // size. This gallery is plain DOM — body positions, walls, and the
    // hover math all use getBoundingClientRect() CSS pixels 1:1 — so
    // setting pixelRatio to devicePixelRatio (e.g. 2 on Retina) would halve
    // the effective cursor position and break drag hit-testing everywhere
    // outside the top-left quadrant. Matter's own default of 1 is correct.
    const mouse = Matter.Mouse.create(container);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.15, damping: 0.15, render: { visible: false } },
    });
    Matter.World.add(engine.world, mouseConstraint);

    // Desktop-only passive hover: cards get a single light "tap" the
    // instant the cursor brushes within HOVER_RADIUS, distinct from drag,
    // which is a full grab-and-throw via the mouse constraint above.
    // Evaluated once per physics substep (below), keyed off the latest
    // known pointer position, rather than from the pointermove event
    // itself, so it runs at a steady, fixed cadence instead of the
    // browser's uneven pointermove timing.
    //
    // Two things make this read as a tap rather than a shove:
    // - it's edge-triggered (tappedIdsRef), firing once per approach
    //   instead of continuously for as long as the cursor stays close —
    //   a continuous push has nowhere to stop, so it reads as the card
    //   fleeing rather than a card getting nudged
    // - it nudges velocity directly (Body.setVelocity) rather than calling
    //   Body.applyForce: once a few cards are resting against each other,
    //   the contact/friction resistance from neighbors needs real force to
    //   overcome, and a small continuous *force* mostly gets absorbed by
    //   that resistance — the card doesn't move at all, which is exactly
    //   what made hover feel broken once the pile had more than one card.
    //   Setting velocity directly doesn't need to "win" against friction,
    //   it just is the card's velocity for the next step.
    // The currently-dragged body is skipped so hover doesn't fight the
    // drag constraint while you're holding a card near the cursor.
    const applyHoverRepulsion = () => {
      const pointer = pointerRef.current;
      const tapped = tappedIdsRef.current;
      if (!pointer) {
        tapped.clear();
        return;
      }
      bodiesRef.current.forEach((body, id) => {
        if (body === mouseConstraint.body) {
          tapped.delete(id);
          return;
        }
        const dx = body.position.x - pointer.x;
        const dy = body.position.y - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const inRange = dist < HOVER_RADIUS && dist > 0.01;
        if (!inRange) {
          tapped.delete(id);
          return;
        }
        if (tapped.has(id)) return;
        tapped.add(id);
        const strength = (1 - dist / HOVER_RADIUS) * HOVER_TAP_SPEED;
        Matter.Body.setVelocity(body, {
          x: body.velocity.x + (dx / dist) * strength,
          y: body.velocity.y + (dy / dist) * strength,
        });
      });
    };

    let physicsRafId = 0;
    const stepPhysics = () => {
      for (let i = 0; i < SUBSTEPS; i++) {
        applyHoverRepulsion();
        Matter.Engine.update(engine, FIXED_DELTA);
      }
      physicsRafId = requestAnimationFrame(stepPhysics);
    };
    physicsRafId = requestAnimationFrame(stepPhysics);

    const buildWalls = () => {
      const { width, height } = container.getBoundingClientRect();
      const floorY = height - bottomInsetRef.current;
      floorYRef.current = floorY;
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

    // Track the desktop cursor position; the repulsion force itself is
    // applied per physics substep in stepPhysics (see applyHoverRepulsion).
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const bounds = container.getBoundingClientRect();
      pointerRef.current = { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
    };
    const onPointerLeave = () => {
      pointerRef.current = null;
    };
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    // Sync DOM transforms to physics bodies every frame without
    // triggering React re-renders.
    //
    // This computes the top-left offset in plain pixels rather than
    // combining rotate() with a percentage-based translate(-50%,-50%):
    // that combination is resolved around the *rotated* box's own
    // transform-origin, so for a non-square card it silently drifts the
    // visual position away from body.position by up to a full width/height
    // once the card has spun away from 0° — exactly the "spins and ends up
    // somewhere else" symptom. transform-origin already defaults to the
    // element's center, so translating by (x - width/2, y - height/2) and
    // then rotating keeps the rotation pivot at body.position for any angle.
    const syncPositions = () => {
      bodiesRef.current.forEach((body, id) => {
        const el = elementsRef.current.get(id);
        const size = sizesRef.current.get(id);
        if (!el || !size) return;
        const left = body.position.x - size.width / 2;
        const top = body.position.y - size.height / 2;
        el.style.transform = `translate3d(${left}px, ${top}px, 0) rotate(${body.angle}rad)`;
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
      container.removeEventListener("pointerleave", onPointerLeave);
      cancelAnimationFrame(rafRef.current);
      unsubscribe();
      Matter.Events.off(engine, "afterUpdate", onAfterUpdate);
      cancelAnimationFrame(physicsRafId);
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
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            if (tooltipTimeoutRef.current !== null) window.clearTimeout(tooltipTimeoutRef.current);
            tooltipTimeoutRef.current = window.setTimeout(() => {
              const rect = el.getBoundingClientRect();
              setTooltip({
                id: card.id,
                nickname: card.drawing.nickname,
                note: card.drawing.note,
                x: rect.left + rect.width / 2,
                y: rect.top,
              });
            }, TOOLTIP_HOVER_DELAY);
          }}
          onMouseLeave={() => {
            if (tooltipTimeoutRef.current !== null) {
              window.clearTimeout(tooltipTimeoutRef.current);
              tooltipTimeoutRef.current = null;
            }
            setTooltip((prev) => (prev?.id === card.id ? null : prev));
          }}
          onClick={(e) => {
            // Desktop: reveal immediately on click too, not just after the
            // hover delay. stopPropagation keeps the window-level "click
            // outside closes it" listener from firing for this same tap.
            e.stopPropagation();
            if (tooltipTimeoutRef.current !== null) {
              window.clearTimeout(tooltipTimeoutRef.current);
              tooltipTimeoutRef.current = null;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip((prev) =>
              prev?.id === card.id
                ? null
                : {
                    id: card.id,
                    nickname: card.drawing.nickname,
                    note: card.drawing.note,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  }
            );
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(e) => {
            // Mobile has no hover, and Matter's Mouse module preventDefaults
            // every touch in this container (see the tooltip-close effect
            // above), which silently kills the synthetic click event browsers
            // would otherwise fire — so tapping a card never reached the
            // onClick handler above. This is the only way a tap reveals the
            // caption on touch devices. stopPropagation keeps the
            // window-level "tap outside closes it" listener from firing for
            // this same tap. A small movement tolerance tells a tap apart
            // from a drag-to-throw gesture on the card.
            e.stopPropagation();
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (!start) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.sqrt(dx * dx + dy * dy) > TAP_MOVE_TOLERANCE) return;
            if (tooltipTimeoutRef.current !== null) {
              window.clearTimeout(tooltipTimeoutRef.current);
              tooltipTimeoutRef.current = null;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip((prev) =>
              prev?.id === card.id
                ? null
                : {
                    id: card.id,
                    nickname: card.drawing.nickname,
                    note: card.drawing.note,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  }
            );
          }}
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
      {tooltip && (
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-50 max-w-[65vw] rounded-lg bg-ink px-3 py-2 text-xs text-hanji shadow-lg sm:max-w-xs sm:text-sm"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-medium">{tooltip.nickname}</div>
          <div className="opacity-80">{tooltip.note}</div>
        </div>
      )}
    </div>
  );
}
