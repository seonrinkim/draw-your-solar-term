import { Language } from "@/lib/i18n";

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2592000;
const YEAR = 31536000;

// Coarse relative-time label ("2h ago"), matching the granularity typical
// of a social feed rather than an exact duration.
export function formatRelativeTime(dateIso: string, language: Language): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000));

  if (diffSec < MINUTE) {
    return language === "ko" ? "방금 전" : language === "nl" ? "zojuist" : "just now";
  }
  if (diffSec < HOUR) {
    const n = Math.floor(diffSec / MINUTE);
    return language === "ko" ? `${n}분 전` : language === "nl" ? `${n}m geleden` : `${n}m ago`;
  }
  if (diffSec < DAY) {
    const n = Math.floor(diffSec / HOUR);
    return language === "ko" ? `${n}시간 전` : language === "nl" ? `${n}u geleden` : `${n}h ago`;
  }
  if (diffSec < WEEK) {
    const n = Math.floor(diffSec / DAY);
    return language === "ko" ? `${n}일 전` : language === "nl" ? `${n}d geleden` : `${n}d ago`;
  }
  if (diffSec < MONTH) {
    const n = Math.floor(diffSec / WEEK);
    return language === "ko" ? `${n}주 전` : language === "nl" ? `${n}w geleden` : `${n}w ago`;
  }
  if (diffSec < YEAR) {
    const n = Math.floor(diffSec / MONTH);
    return language === "ko" ? `${n}개월 전` : language === "nl" ? `${n}mnd geleden` : `${n}mo ago`;
  }
  const n = Math.floor(diffSec / YEAR);
  return language === "ko" ? `${n}년 전` : language === "nl" ? `${n}j geleden` : `${n}y ago`;
}
