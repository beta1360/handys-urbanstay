import type { z } from "zod";
import { ApiResponseError } from "./api-error";
import { ErrorApiResponse } from "./generated/zod/schemas";
import {
  RequestValidationError,
  ResponseValidationError,
} from "./validation-error";
import type { ValidationIssues } from "./validation-error";

const SUCCESS_STATUS = { min: 200, max: 299 } as const;

type ApiResponse = {
  status: number;
  data: unknown;
};

function describeIssues(issues: ValidationIssues) {
  return issues.map(
    (issue) => `${issue.path.map(String).join(".") || "(root)"}: ${issue.code}`,
  );
}

function reportIssues(
  title: string,
  operation: string,
  issues: ValidationIssues,
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  console.error(`[${title}] ${operation}`, describeIssues(issues));
}

function isSuccessStatus(status: number) {
  return status >= SUCCESS_STATUS.min && status <= SUCCESS_STATUS.max;
}

function toApiResponseError(operation: string, { status, data }: ApiResponse) {
  const result = ErrorApiResponse.safeParse(data);
  if (!result.success) {
    reportIssues("API 응답 검증 실패", operation, result.error.issues);
    return new ApiResponseError(operation, status, undefined);
  }
  return new ApiResponseError(operation, status, result.data.error);
}

export function parseRequest<Schema extends z.ZodType>(
  operation: string,
  schema: Schema,
  request: z.input<Schema>,
): z.output<Schema> {
  const result = schema.safeParse(request);
  if (!result.success) {
    reportIssues("API 요청 검증 실패", operation, result.error.issues);
    throw new RequestValidationError(operation, result.error.issues);
  }
  return result.data;
}

export function parseResponse<Schema extends z.ZodType>(
  operation: string,
  successSchema: Schema,
  response: ApiResponse,
): z.output<Schema> {
  if (!isSuccessStatus(response.status)) {
    throw toApiResponseError(operation, response);
  }
  const result = successSchema.safeParse(response.data);
  if (!result.success) {
    reportIssues("API 응답 검증 실패", operation, result.error.issues);
    throw new ResponseValidationError(operation, result.error.issues);
  }
  return result.data;
}
