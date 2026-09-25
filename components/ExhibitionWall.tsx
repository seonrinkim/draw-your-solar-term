"use client";

import { useEffect, useRef, useState } from "react";
import { exhibitionItems, type ExhibitionItem } from "@/lib/exhibitionData";

const WALL_RATIO = 2000 / 826; // the recorded layout's width:height, kept even with no photo behind it

interface Props {
  onSelect: (item: ExhibitionItem) => void;
}

export default function ExhibitionWall({ onSelect }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Fit the layout entirely inside whatever space is available (both axes),
  // rather than letting it overflow and require scrolling.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      if (width / height > WALL_RATIO) {
        setSize({ width: height * WALL_RATIO, height });
      } else {
        setSize({ width, height: width / WALL_RATIO });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="flex h-full w-full items-center justify-center">
      <div className="relative" style={{ width: size.width || "100%", height: size.height || "auto" }}>
        {exhibitionItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            aria-label={item.type === "artwork" ? item.number : `context ${item.number}`}
            className="absolute box-border transition-opacity hover:opacity-70"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.w}%`,
              height: `${item.h}%`,
              border: item.type === "artwork" ? "1.5px solid var(--color-exhibit-line)" : "none",
              background: item.type === "context" ? "var(--color-exhibit-fill)" : "transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}
