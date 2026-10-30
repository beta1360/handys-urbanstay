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
