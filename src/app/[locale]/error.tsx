'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/primitives';
import { Button, buttonClass } from '@/components/ui/button';

/**
 * The route-level error boundary.
 *
 * `reset()` re-renders the segment, which is the right first move for a
 * transient database hiccup — a cold Neon instance timing out on the first
 * query recovers on the second. The digest is shown because it is the only
 * thing that connects what a viewer saw to what the server logged.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');
  const tc = useTranslations('common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-xl sm:text-2xl">{t('serverTitle')}</h1>
      <p className="text-steel measure mt-3 text-xs">{t('serverBody')}</p>

      {error.digest && (
        <p className="numeric text-steel/70 mt-4 text-2xs" dir="ltr">
          {error.digest}
        </p>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="size-4" aria-hidden />
          {tc('retry')}
        </Button>
        <Link href="/" className={buttonClass('secondary', 'md')}>
          {t('goHome')}
        </Link>
      </div>
    </Container>
  );
}
