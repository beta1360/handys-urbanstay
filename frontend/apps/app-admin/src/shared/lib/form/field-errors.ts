import type { z } from "zod";

export type FieldMessage = { field: string; message: string };

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

export function toIssueFieldMessages(error: z.ZodError): FieldMessage[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join("."),
    message: issue.message,
  }));
}

export function toFieldErrors<Field extends string>(
  fields: readonly Field[],
  fieldMessages: readonly FieldMessage[],
) {
  const errors: FieldErrors<Field> = {};
  for (const { field, message } of fieldMessages) {
    const formField = fields.find((candidate) => candidate === field);
    if (formField !== undefined) {
      errors[formField] ??= message;
    }
  }
  return errors;
}

export function hasFieldError<Field extends string>(
  fields: readonly Field[],
  errors: FieldErrors<Field>,
) {
  return fields.some((field) => errors[field]);
}

export function focusFirstInvalidField<Field extends string>(
  form: HTMLFormElement | null,
  fields: readonly Field[],
  errors: FieldErrors<Field>,
) {
  const firstInvalidField = fields.find((field) => errors[field]);
  if (firstInvalidField === undefined) {
    return;
  }
  const input = form?.elements.namedItem(firstInvalidField);
  if (input instanceof HTMLElement) {
    input.focus();
  }
}
