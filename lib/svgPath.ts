export interface Point {
  x: number;
  y: number;
}

// Quadratic-smoothed freehand path through midpoints, standard technique
// for turning raw pointer samples into a smooth stroke.
export function pointsToSmoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)} ${midX.toFixed(
      1
    )} ${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const NUMBER_RE = /-?\d+\.?\d*/g;

// Every path `d` string emitted by pointsToSmoothPath alternates x,y
// coordinates in sequence (M/L/Q all consume points pairwise), so pairing
// the extracted numbers sequentially reconstructs every coordinate.
export function getStrokesBoundingBox(
  strokes: { d: string }[],
  padding = 16
): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    const nums = stroke.d.match(NUMBER_RE);
    if (!nums) continue;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = parseFloat(nums[i]);
      const y = parseFloat(nums[i + 1]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, width: 40, height: 40 };
  }

  return {
    minX: minX - padding,
    minY: minY - padding,
    width: Math.max(maxX - minX + padding * 2, 1),
    height: Math.max(maxY - minY + padding * 2, 1),
  };
}

function extractPoints(d: string): Point[] {
  const nums = d.match(NUMBER_RE);
  if (!nums) return [];
  const pts: Point[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pts.push({ x: parseFloat(nums[i]), y: parseFloat(nums[i + 1]) });
  }
  return pts;
}

export function getStrokesPoints(strokes: { d: string }[]): Point[] {
  return strokes.flatMap((s) => extractPoints(s.d));
}

// Builds one thin rectangle ("quad") per line segment of every stroke, sized
// to the stroke's own width plus padding. Used as compound Matter.js parts
// so physics collision follows the actual drawn line instead of a bounding
// box or a blobby hull — and unlike a hull, a segment quad's area is always
// segment_length * width, so it never degenerates for straight lines.
export function getSegmentQuads(
  strokes: { d: string; width: number }[],
  extraPadding = 10
): Point[][] {
  const quads: Point[][] = [];

  for (const stroke of strokes) {
    const pts = extractPoints(stroke.d);
    const halfW = stroke.width / 2 + extraPadding;

    if (pts.length === 1) {
      const p = pts[0];
      quads.push([
        { x: p.x - halfW, y: p.y - halfW },
        { x: p.x + halfW, y: p.y - halfW },
        { x: p.x + halfW, y: p.y + halfW },
        { x: p.x - halfW, y: p.y + halfW },
      ]);
      continue;
    }

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.01) continue;
      const nx = (-dy / len) * halfW;
      const ny = (dx / len) * halfW;
      quads.push([
        { x: a.x + nx, y: a.y + ny },
        { x: b.x + nx, y: b.y + ny },
        { x: b.x - nx, y: b.y - ny },
        { x: a.x - nx, y: a.y - ny },
      ]);
    }
  }

  return quads;
}

// Area-weighted centroid across a set of quad parts — the same "composite
// body centroid" formula a physics engine uses to place a compound body, so
// using it as our render anchor keeps the drawing visually centered on
// exactly the point Matter.js treats as body.position. Each quad is a
// rectangle/parallelogram, so its own centroid is just the average of its
// 4 corners and its area comes from the shoelace formula.
export function compositeQuadCentroid(quads: Point[][]): Point {
  let totalArea = 0;
  let cx = 0;
  let cy = 0;

  for (const quad of quads) {
    let area = 0;
    for (let i = 0; i < quad.length; i++) {
      const p0 = quad[i];
      const p1 = quad[(i + 1) % quad.length];
      area += p0.x * p1.y - p1.x * p0.y;
    }
    area = Math.abs(area) / 2;

    const centroid = quad.reduce(
      (acc, p) => ({ x: acc.x + p.x / quad.length, y: acc.y + p.y / quad.length }),
      { x: 0, y: 0 }
    );

    cx += centroid.x * area;
    cy += centroid.y * area;
    totalArea += area;
  }

  if (totalArea < 1e-6) return { x: 0, y: 0 };
  return { x: cx / totalArea, y: cy / totalArea };
}
