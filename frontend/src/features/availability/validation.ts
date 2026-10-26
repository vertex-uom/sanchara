import type { FieldErrors, Resolver } from "react-hook-form";
import { z } from "zod";
import { isIsoDate } from "@/lib/format/dates";

export const MAX_GUESTS = 20;

// `today` is the Colombo date ("YYYY-MM-DD"); arrival may be today, not earlier.
export function searchSchema(today: string) {
  return z
    .object({
      arrival: z.string().refine(isIsoDate, "Choose an arrival date."),
      departure: z.string().refine(isIsoDate, "Choose a departure date."),
      guests: z
        .number({ error: "Choose the number of guests." })
        .int()
        .min(1, "At least 1 guest.")
        .max(MAX_GUESTS, `Up to ${MAX_GUESTS} guests.`),
      roomTypeId: z.string().min(1),
    })
    .superRefine((values, ctx) => {
      if (values.arrival < today) {
        ctx.addIssue({ code: "custom", path: ["arrival"], message: "Arrival can't be in the past." });
      }
      if (values.departure <= values.arrival) {
        ctx.addIssue({ code: "custom", path: ["departure"], message: "Departure must be after arrival." });
      }
    });
}

export type SearchValues = z.infer<ReturnType<typeof searchSchema>>;

// Block dates form. Reason and note are added with their step.
export const blockFormSchema = z
  .object({
    unitIds: z.array(z.string()).min(1, "Select at least one unit."),
    startDate: z.string().refine(isIsoDate, "Choose a start date."),
    endDate: z.string().refine(isIsoDate, "Choose an end date."),
  })
  .superRefine((values, ctx) => {
    if (values.endDate < values.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date can't be before the start date." });
    }
  });

export type BlockFormValues = z.infer<typeof blockFormSchema>;

// Minimal zod → react-hook-form bridge: the first message per top-level field.
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
