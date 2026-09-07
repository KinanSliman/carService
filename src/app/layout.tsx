import type { ReactNode } from 'react';
import './globals.css';

/**
 * The real shell lives in `[locale]/layout.tsx`, which is the only place that
 * knows the locale and therefore the `dir` and `lang` of the document. This
 * root exists because Next requires one; it must not render `<html>` itself.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
