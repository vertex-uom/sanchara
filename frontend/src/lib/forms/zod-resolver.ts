import type { FieldErrors, Resolver } from "react-hook-form";
import type { z } from "zod";

// Minimal zod → react-hook-form bridge: the first message per top-level field.
// Used instead of @hookform/resolvers, which isn't installed.
export function zodResolver<T extends z.ZodType<Record<string, unknown>>>(schema: T): Resolver<z.infer<T>> {
  return async (values) => {
    const parsed = await schema.safeParseAsync(values);
    if (parsed.success) return { values: parsed.data, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "root");
      errors[key] ??= { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<z.infer<T>> };
  };
}
