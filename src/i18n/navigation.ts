import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware replacements for next/link and next/navigation. Importing the
 * originals bypasses the locale prefix and silently drops the user back to
 * Arabic — use these everywhere instead.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
