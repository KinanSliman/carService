import { Container, Skeleton } from '@/components/ui/primitives';

/**
 * The skeleton mirrors the real layout — header, filter row, then a grid of
 * cards at the same size and count. A centred spinner tells you to wait; this
 * tells you what is arriving, and it keeps the page from jumping when it does.
 */
export default function WorkshopsLoading() {
  return (
    <Container>
      <div className="pt-8 pb-6 sm:pt-12 sm:pb-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="mt-3 flex gap-2">
        <Skeleton className="rounded-chip h-9 w-24" />
        <Skeleton className="rounded-chip h-9 w-28" />
        <Skeleton className="rounded-chip h-9 w-24" />
      </div>

      <ul className="mt-7 grid gap-3 pb-14 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <li key={index}>
            <div className="border-line rounded-card bg-surface border p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="rounded-card size-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-3 w-32" />
              <div className="mt-3 flex gap-1.5">
                <Skeleton className="rounded-chip h-5 w-16" />
                <Skeleton className="rounded-chip h-5 w-16" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
