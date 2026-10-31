import { operatorListParamsSchema } from "@/shared/api";

const keywordParamSchema = operatorListParamsSchema.shape.keyword;

export const OPERATOR_KEYWORD_MAX_LENGTH =
  keywordParamSchema.unwrap().maxLength ?? undefined;

export function normalizeOperatorKeyword(value: string | undefined) {
  const keyword = value?.trim();
  if (!keyword || !keywordParamSchema.safeParse(keyword).success) {
    return undefined;
  }
  return keyword;
}
