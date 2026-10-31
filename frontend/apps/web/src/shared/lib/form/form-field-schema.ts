import { z } from "zod";
import { FORM_VALIDATION_MESSAGES } from "@/shared/config";

type MessageOf = (value: string) => string | undefined;

function checkMessage(messageOf: MessageOf) {
  return (value: string, ctx: z.RefinementCtx<string>) => {
    const message = messageOf(value);
    if (message !== undefined) {
      ctx.addIssue({ code: "custom", message });
    }
  };
}

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
