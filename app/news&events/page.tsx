"use client";

import { Suspense } from "react";
import NewsAndEventsPageContent from "@/components/news-events/news-events-content";

// ─── Default export ────────────────────────────────────────────────────────
// useSearchParams() requires a <Suspense> boundary in the Next.js App Router,
// otherwise the build will fail/warn. Keep this wrapper as the page's
// default export.
export default function NewsAndEventsPage() {
  return (
    <Suspense fallback={null}>
      <NewsAndEventsPageContent />
    </Suspense>
  );
}
