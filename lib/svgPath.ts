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

export function getStrokesPoints(strokes: { d: string }[]): Point[] {
  const points: Point[] = [];
  for (const stroke of strokes) {
    const nums = stroke.d.match(NUMBER_RE);
    if (!nums) continue;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      points.push({ x: parseFloat(nums[i]), y: parseFloat(nums[i + 1]) });
    }
  }
  return points;
}

// Andrew's monotone chain: O(n log n) convex hull, returned counter-clockwise.
export function convexHull(points: Point[]): Point[] {
  const pts = Array.from(
    new Map(points.map((p) => [`${p.x},${p.y}`, p])).values()
  ).sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  if (pts.length < 3) return pts;

  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Point[] = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function polygonArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    area += p0.x * p1.y - p1.x * p0.y;
  }
  return Math.abs(area) / 2;
}

// Pushes each hull vertex outward from the centroid so the collision
// boundary has some breathing room beyond the raw stroke centerline.
export function padHull(hull: Point[], centroid: Point, amount: number): Point[] {
  return hull.map((p) => {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) return p;
    return {
      x: p.x + (dx / dist) * amount,
      y: p.y + (dy / dist) * amount,
    };
  });
}

export function centroidOf(points: Point[]): Point {
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

// Area-weighted polygon centroid (shoelace formula) — the same calculation
// Matter.js uses internally, so using it for our render anchor keeps the
// SVG visually centered on exactly the point Matter treats as body.position.
export function polygonCentroid(points: Point[]): Point {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    const cross = p0.x * p1.y - p1.x * p0.y;
    area += cross;
    cx += (p0.x + p1.x) * cross;
    cy += (p0.y + p1.y) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-6) return centroidOf(points);
  return { x: cx / (6 * area), y: cy / (6 * area) };
}
