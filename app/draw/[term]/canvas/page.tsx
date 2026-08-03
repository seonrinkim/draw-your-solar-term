import { notFound } from "next/navigation";
import { getTermBySlug, SOLAR_TERMS } from "@/lib/terms";
import CanvasFlow from "@/components/CanvasFlow";

export function generateStaticParams() {
  return SOLAR_TERMS.map((t) => ({ term: t.slug }));
}

export default async function CanvasPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term: slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) notFound();

  return <CanvasFlow term={term} />;
}
