import type { z } from "zod";
import {
  RequestValidationError,
  ResponseValidationError,
} from "./validation-error";
import type { ValidationIssues } from "./validation-error";

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
  if (!import.meta.env.DEV) {
    return;
  }
  console.error(`[${title}] ${operation}`, describeIssues(issues));
}

export function reportResponseIssues(
  operation: string,
  issues: ValidationIssues,
) {
  reportIssues("API 응답 검증 실패", operation, issues);
}

export function parseRequestBody<Schema extends z.ZodType>(
  operation: string,
  schema: Schema,
  body: z.input<Schema>,
): z.output<Schema> {
  const result = schema.safeParse(body);
  if (!result.success) {
    reportIssues("API 요청 검증 실패", operation, result.error.issues);
    throw new RequestValidationError(operation, result.error.issues);
  }
  return result.data;
}

export function parseResponseBody<Schema extends z.ZodType>(
  operation: string,
  schema: Schema,
  data: unknown,
): z.output<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    reportResponseIssues(operation, result.error.issues);
    throw new ResponseValidationError(operation, result.error.issues);
  }
  return result.data;
}
