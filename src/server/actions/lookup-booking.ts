'use server';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { bookings } from '@/db/schema';
import { LOOKUP_LIMIT, checkRateLimit, clientKey } from '@/server/rate-limit';
import { fieldErrors, lookupBookingSchema } from '@/server/validation';
import { normaliseBookingCode } from '@/server/services/booking-code';

export type LookupState =
  | { status: 'idle' }
  | { status: 'error'; formError?: string; fieldErrors?: Record<string, string> }
  | { status: 'found'; code: string };

/**
 * Lookup by code plus the last four digits of the phone. Two facts, neither
 * secret on its own, which is exactly as strong as this needs to be — and the
 * UI says so rather than implying it is authentication.
 *
 * The rate limit matters more here than on the write path: a four-character
 * code over a 25-letter alphabet is guessable given enough attempts, and this
 * is the endpoint that would be used to do it.
 */
export async function lookupBooking(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  const parsed = lookupBookingSchema.safeParse({
    code: formData.get('code'),
    last4: formData.get('last4'),
  });

  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrors(parsed.error) };
  }

  const limit = checkRateLimit(await clientKey(), LOOKUP_LIMIT);
  if (!limit.ok) {
    return { status: 'error', formError: 'tooManyRequests' };
  }

  const code = normaliseBookingCode(parsed.data.code);

  const found = await db.query.bookings.findFirst({
    where: and(eq(bookings.code, code), eq(bookings.phoneLast4, parsed.data.last4)),
    columns: { code: true },
  });

  // One message whether the code is wrong, the digits are wrong, or both.
  // Distinguishing them would turn this into an oracle for valid codes.
  if (!found) {
    return { status: 'error', formError: 'notFound' };
  }

  return { status: 'found', code: found.code };
}
