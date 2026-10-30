import { isAxiosError } from "axios";
import { ErrorApiResponse } from "./generated/zod/schemas";
import type { ErrorResponseOutput } from "./generated/zod/schemas";
import { reportResponseIssues } from "./validate";

export type ApiError = ErrorResponseOutput;

export const API_ERROR_CODES = {
  unauthorized: "UNAUTHORIZED",
  hotelNotFound: "HOTEL_NOT_FOUND",
  hotelDuplicated: "HOTEL_DUPLICATED",
  hotelModified: "HOTEL_MODIFIED",
  loginIdDuplicated: "LOGIN_ID_DUPLICATED",
} as const;

export function getApiError(error: unknown): ApiError | undefined {
  if (!isAxiosError(error) || error.response === undefined) {
    return undefined;
  }
  const result = ErrorApiResponse.safeParse(error.response.data);
  if (!result.success) {
    reportResponseIssues("errorResponse", result.error.issues);
    return undefined;
  }
  return result.data.error;
}
