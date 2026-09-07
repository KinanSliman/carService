import { z } from 'zod';

/**
 * One schema per form, shared between the client form and the Server Action.
 * The action re-parses rather than trusting the client's parse — the form is a
 * convenience, the action is the boundary.
 *
 * Errors are returned as message *keys*, not sentences. The action has no
 * locale, and returning Arabic from the server would strand the English build;
 * the client resolves the key through next-intl.
 */

/**
 * Qatari mobile numbers are eight digits starting 3, 5, 6 or 7. Accepts the
 * +974 prefix and any spacing a person types, and normalises to bare digits.
 */
export const qatariPhone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-()]/g, '').replace(/^(\+?974)/, ''))
  .pipe(z.string().regex(/^[3567]\d{7}$/, 'phoneInvalid'));

export const bookingCodeInput = z
  .string()
  .trim()
  .min(1, 'required')
  .max(16, 'codeInvalid');

export const last4 = z
  .string()
  .trim()
  .regex(/^\d{4}$/, 'last4Invalid');

export const deliveryMode = z.enum(['at_center', 'mobile', 'pickup']);

export const createBookingSchema = z.object({
  // Sent as a comma-joined list because a Server Action receiving FormData
  // gets strings; splitting here keeps the parse in one place.
  serviceSlugs: z
    .string()
    .min(1, 'selectService')
    .transform((value) => value.split(',').map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(z.string().min(1)).min(1, 'selectService').max(8, 'selectService')),
  providerSlug: z.string().min(1, 'selectWorkshop'),
  mode: deliveryMode,
  /** ISO instant produced by the slot picker. */
  scheduledAt: z
    .string()
    .min(1, 'selectSlot')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'selectSlot')
    .transform((value) => new Date(value)),
  contactName: z
    .string()
    .trim()
    .min(3, 'nameTooShort')
    .max(80, 'nameTooLong'),
  contactPhone: qatariPhone,
  vehicleLabel: z.string().trim().min(3, 'vehicleRequired').max(80, 'vehicleRequired'),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value ? value : null)),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const lookupBookingSchema = z.object({
  code: bookingCodeInput,
  last4,
});

/**
 * Flattens a ZodError into `{ field: messageKey }`. Only the first error per
 * field survives, because a field can only show one message.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== 'string' || out[field]) continue;
    out[field] = issue.message;
  }
  return out;
}
