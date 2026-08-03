import Link from "next/link";
import GravityGallery from "@/components/GravityGallery";

export default function Home() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <GravityGallery />

      <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 flex justify-end px-5 py-4 sm:px-8 sm:py-5">
        <Link
          href="/draw"
          className="pointer-events-auto px-5 py-2.5 rounded-full text-sm sm:text-base bg-ink text-hanji hover:opacity-85 transition-opacity"
        >
          I want to draw!
        </Link>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-30 flex justify-center px-5 text-center">
        <p className="text-xs sm:text-sm opacity-40">
          22 September – 4 October 2026 | 09:00 – 21:00 | Amsterdam House of
          Arts &amp; Crafts (Oudeschans 21, 1011 KS Amsterdam)
        </p>
      </div>
    </div>
  );
}
