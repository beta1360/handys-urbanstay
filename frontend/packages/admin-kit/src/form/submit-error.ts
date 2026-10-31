import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { COMMON_API_ERROR_CODES } from "../api";
import type { ApiError } from "../api";
import { FORM_ALERT_MESSAGES } from "../config";

export const FORM_ALERT = "root.server";

export type FormAlert = {
  code: string | undefined;
  message: string;
};

type SubmitErrorTarget<T extends FieldValues> = {
  fields: readonly Path<T>[];
  setError: UseFormSetError<T>;
  fieldOfCode?: Partial<Record<string, Path<T>>>;
  onAlert?: (alert: FormAlert) => void;
};

export function showSubmitError<T extends FieldValues>(
  apiError: ApiError | undefined,
  { fields, setError, fieldOfCode = {}, onAlert }: SubmitErrorTarget<T>,
) {
  function showAlert(alert: FormAlert) {
    setError(FORM_ALERT, { type: alert.code, message: alert.message });
    if (alert.code !== COMMON_API_ERROR_CODES.unauthorized) {
      onAlert?.(alert);
    }
  }

  if (apiError === undefined) {
    showAlert({ code: undefined, message: FORM_ALERT_MESSAGES.requestFailed });
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
    showAlert({ code: apiError.code, message: apiError.message });
    return;
  }
  fieldErrors.forEach(({ field, message }, index) => {
    setError(field, { type: "server", message }, { shouldFocus: index === 0 });
  });
}
