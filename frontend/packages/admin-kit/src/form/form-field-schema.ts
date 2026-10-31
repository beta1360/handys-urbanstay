import { z } from "zod";
import { FORM_VALIDATION_MESSAGES } from "../config";

type MessageOf = (value: string) => string | undefined;

function checkMessage(messageOf: MessageOf) {
  return (value: string, ctx: z.RefinementCtx<string>) => {
    const message = messageOf(value);
    if (message !== undefined) {
      ctx.addIssue({ code: "custom", message });
    }
  };
}

// 서버(PatternThenMaxLength)처럼 형식 오류를 길이 오류보다 먼저 보여준다.
function ruleMessage(rule: z.ZodType, value: string, formatMessage?: string) {
  const result = rule.safeParse(value);
  if (result.success) {
    return undefined;
  }
  const { issues } = result.error;
  const issue =
    issues.find(({ code }) => code === "invalid_format") ?? issues[0];
  if (issue.code === "invalid_format" && formatMessage !== undefined) {
    return formatMessage;
  }
  if (issue.code === "too_big") {
    return FORM_VALIDATION_MESSAGES.maxLength(Number(issue.maximum));
  }
  return issue.message;
}

export function requiredTextSchema(rule: z.ZodType, formatMessage?: string) {
  return z
    .string()
    .trim()
    .superRefine(
      checkMessage((value) =>
        value === ""
          ? FORM_VALIDATION_MESSAGES.required
          : ruleMessage(rule, value, formatMessage),
      ),
    );
}

export function optionalTextSchema(rule: z.ZodType) {
  return z
    .string()
    .trim()
    .superRefine(checkMessage((value) => ruleMessage(rule, value)))
    .transform((value) => (value === "" ? null : value));
}

export function passwordSchema(rule: z.ZodType, invalidMessage: string) {
  return z.string().superRefine(
    checkMessage((value) => {
      if (value.trim() === "") {
        return FORM_VALIDATION_MESSAGES.required;
      }
      return rule.safeParse(value).success ? undefined : invalidMessage;
    }),
  );
}

const INTEGER_PATTERN = /^-?\d+$/;

function toInteger(value: string) {
  if (!INTEGER_PATTERN.test(value)) {
    return undefined;
  }
  const integer = Number(value);
  return Number.isSafeInteger(integer) ? integer : undefined;
}

function integerMessage(rule: z.ZodType, value: string) {
  const integer = toInteger(value);
  if (integer === undefined) {
    return FORM_VALIDATION_MESSAGES.typeMismatch;
  }
  const result = rule.safeParse(integer);
  if (result.success) {
    return undefined;
  }
  const [issue] = result.error.issues;
  if (issue.code === "too_small") {
    return FORM_VALIDATION_MESSAGES.min(Number(issue.minimum));
  }
  if (issue.code === "too_big") {
    return FORM_VALIDATION_MESSAGES.max(Number(issue.maximum));
  }
  return issue.message;
}

export function requiredIntegerSchema(rule: z.ZodType) {
  return z
    .string()
    .trim()
    .superRefine(
      checkMessage((value) =>
        value === ""
          ? FORM_VALIDATION_MESSAGES.required
          : integerMessage(rule, value),
      ),
    )
    .transform(Number);
}

export function optionalIntegerSchema(rule: z.ZodType) {
  return z
    .string()
    .trim()
    .superRefine(
      checkMessage((value) =>
        value === "" ? undefined : integerMessage(rule, value),
      ),
    )
    .transform((value) => (value === "" ? null : Number(value)));
}
