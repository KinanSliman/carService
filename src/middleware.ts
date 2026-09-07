import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Everything except Next internals, the cron route, and files with an
  // extension. Without the extension exclusion the middleware rewrites
  // /favicon.ico into /ar/favicon.ico and the icon 404s.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
