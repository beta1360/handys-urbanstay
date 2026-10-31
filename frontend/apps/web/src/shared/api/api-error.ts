import type { z } from "zod";
import { ErrorApiResponse } from "./generated/zod/schemas";

export type ApiError = z.output<typeof ErrorApiResponse>["error"];

export const API_ERROR_CODES = {
  invalidInput: "INVALID_INPUT",
  notFound: "NOT_FOUND",
  internalServerError: "INTERNAL_SERVER_ERROR",
  hotelNotFound: "HOTEL_NOT_FOUND",
  roomNotFound: "ROOM_NOT_FOUND",
  stayPeriodOverlapped: "STAY_PERIOD_OVERLAPPED",
} as const;

export class ApiResponseError extends Error {
  readonly name = "ApiResponseError";
  readonly operation: string;
  readonly status: number;
  readonly apiError: ApiError | undefined;

  constructor(operation: string, status: number, apiError: ApiError | undefined) {
    super(`${operation} 요청이 ${status} 응답을 받았습니다.`);
    this.operation = operation;
    this.status = status;
    this.apiError = apiError;
  }
}

export function getApiError(error: unknown): ApiError | undefined {
  return error instanceof ApiResponseError ? error.apiError : undefined;
}
