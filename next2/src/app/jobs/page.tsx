import { Suspense } from 'react';
import Jobs from '@/views/Jobs';

export default function Page() {
  return (
    <Suspense
      fallback={<p className="p-8 text-sm text-muted">Loading jobs…</p>}
    >
      <Jobs />
    </Suspense>
  );
}
