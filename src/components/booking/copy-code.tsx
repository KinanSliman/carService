'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Copy-to-clipboard with an announced result.
 *
 * `navigator.clipboard` is unavailable on an insecure origin and can be denied
 * outright, so a failure leaves the button in its resting state rather than
 * claiming success — a "Copied" that did not copy is worse than no button.
 */
export function CopyCode({
  code,
  label,
  copiedLabel,
}: {
  code: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      variant="secondary"
      size="sm"
      className="gap-2"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? (
        <Check className="text-ok size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </Button>
  );
}
