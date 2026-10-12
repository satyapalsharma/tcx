import { Suspense } from 'react';
import JobAnalytics from '@/views/JobAnalytics';

export default function Page() {
  return <Suspense fallback={<main className="mx-auto max-w-5xl p-8 text-sm text-muted">Loading job analytics…</main>}><JobAnalytics /></Suspense>;
}
