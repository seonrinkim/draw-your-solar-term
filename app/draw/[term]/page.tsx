import { notFound } from "next/navigation";
import { getTermBySlug, SOLAR_TERMS } from "@/lib/terms";
import TermDetail from "@/components/TermDetail";

export function generateStaticParams() {
  return SOLAR_TERMS.map((t) => ({ term: t.slug }));
}

export default async function TermPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term: slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) notFound();

  return <TermDetail term={term} />;
}
