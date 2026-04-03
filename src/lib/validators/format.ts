/**
 * Validation helpers — shared Zod error formatting for API routes.
 *
 * Converts Zod validation errors into a flat array that can be
 * included in the API error response `details` field.
 */

/** Format a ZodError into a flat array of { field, message } */
export function formatZodErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): Array<{ field: string; message: string }> {
  const flat = error.flatten();
  return Object.entries(flat.fieldErrors).map(
    ([field, messages]) => ({ field, message: messages.join(", ") }),
  );
}
