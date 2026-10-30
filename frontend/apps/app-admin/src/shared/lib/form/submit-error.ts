import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { getApiError } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";

export const FORM_ALERT = "root.server";

type SubmitErrorTarget<T extends FieldValues> = {
  fields: readonly Path<T>[];
  setError: UseFormSetError<T>;
  fieldOfCode?: Partial<Record<string, Path<T>>>;
};

export function showSubmitError<T extends FieldValues>(
  error: unknown,
  { fields, setError, fieldOfCode = {} }: SubmitErrorTarget<T>,
) {
  const apiError = getApiError(error);
  if (apiError === undefined) {
    setError(FORM_ALERT, { message: COMMON_MESSAGES.requestFailed });
    return;
  }
  const codeField = fieldOfCode[apiError.code];
  const messages =
    codeField === undefined
      ? apiError.fieldErrors
      : [{ field: codeField, message: apiError.message }];
  const fieldErrors = fields.flatMap((field) => {
    const found = messages.find((message) => message.field === field);
    return found === undefined ? [] : [{ field, message: found.message }];
  });
  if (fieldErrors.length === 0) {
    setError(FORM_ALERT, { type: apiError.code, message: apiError.message });
    return;
  }
  fieldErrors.forEach(({ field, message }, index) => {
    setError(field, { type: "server", message }, { shouldFocus: index === 0 });
  });
}
