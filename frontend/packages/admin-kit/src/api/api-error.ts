import { isAxiosError } from "axios";
import type { z } from "zod";
import { reportResponseIssues } from "./validate";

export type ApiError = {
  code: string;
  message: string;
  fieldErrors: { field: string; message: string }[];
};

export const COMMON_API_ERROR_CODES = {
  invalidInput: "INVALID_INPUT",
  unauthorized: "UNAUTHORIZED",
  forbidden: "FORBIDDEN",
  invalidCsrfToken: "INVALID_CSRF_TOKEN",
  notFound: "NOT_FOUND",
  internalServerError: "INTERNAL_SERVER_ERROR",
} as const;

export function createApiErrorReader(
  errorResponseSchema: z.ZodType<{ error: ApiError }>,
) {
  return function getApiError(error: unknown): ApiError | undefined {
    if (!isAxiosError(error) || error.response === undefined) {
      return undefined;
    }
    const result = errorResponseSchema.safeParse(error.response.data);
    if (!result.success) {
      reportResponseIssues("errorResponse", result.error.issues);
      return undefined;
    }
    return result.data.error;
  };
}
