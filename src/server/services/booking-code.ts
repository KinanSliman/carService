import { randomInt } from 'node:crypto';

/**
 * Booking codes are read aloud over the phone and typed into `/track` by hand,
 * so the alphabet excludes every pair a person confuses under pressure:
 * O/0, I/1/L, S/5, B/8, Z/2. What is left is 24 characters.
 */
const ALPHABET = '34679ACDEFGHJKMNPQRTUVWXY';
const PREFIX = 'KRJ';
const BODY_LENGTH = 4;

export const BOOKING_CODE_PATTERN = new RegExp(
  `^${PREFIX}-[${ALPHABET}]{${BODY_LENGTH}}$`,
);

function randomBody(): string {
  let out = '';
  for (let i = 0; i < BODY_LENGTH; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/** `KRJ-8F2A`-shaped. 25^4 ≈ 390k codes, which is ample for a demo. */
export function generateBookingCode(): string {
  return `${PREFIX}-${randomBody()}`;
}

/**
 * Retries against a caller-supplied existence check rather than catching a
 * unique-violation, so the caller decides what "taken" means — the seed checks
 * an in-memory set, the Server Action checks the table.
 *
 * Throws instead of returning null: a booking that cannot be given a code must
 * not be silently written without one.
 */
export async function generateUniqueBookingCode(
  isTaken: (code: string) => boolean | Promise<boolean>,
  maxAttempts = 12,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateBookingCode();
    if (!(await isTaken(code))) return code;
  }
  throw new Error(
    `Could not generate an unused booking code in ${maxAttempts} attempts.`,
  );
}

/** Accepts what a person actually types: spaces, lowercase, a missing dash. */
export function normaliseBookingCode(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[\s-]/g, '');
  if (cleaned.startsWith(PREFIX)) {
    return `${PREFIX}-${cleaned.slice(PREFIX.length)}`;
  }
  return `${PREFIX}-${cleaned}`;
}
