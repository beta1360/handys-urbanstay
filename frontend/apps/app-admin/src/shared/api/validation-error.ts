import type { z } from "zod";

export type ValidationIssues = readonly z.core.$ZodIssue[];

export class RequestValidationError extends Error {
  readonly name = "RequestValidationError";
  readonly operation: string;
  readonly issues: ValidationIssues;

  constructor(operation: string, issues: ValidationIssues) {
    super(`${operation} 요청 본문이 스키마와 맞지 않습니다.`);
    this.operation = operation;
    this.issues = issues;
  }
}

export class ResponseValidationError extends Error {
  readonly name = "ResponseValidationError";
  readonly operation: string;
  readonly issues: ValidationIssues;

  constructor(operation: string, issues: ValidationIssues) {
    super(`${operation} 응답이 스키마와 맞지 않습니다.`);
    this.operation = operation;
    this.issues = issues;
  }
}
