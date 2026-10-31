import { memberListParamsSchema } from "@/shared/api";

const keywordParamSchema = memberListParamsSchema.shape.keyword;

export const MEMBER_KEYWORD_MAX_LENGTH =
  keywordParamSchema.unwrap().maxLength ?? undefined;

export function normalizeMemberKeyword(value: string | undefined) {
  const keyword = value?.trim();
  if (!keyword || !keywordParamSchema.safeParse(keyword).success) {
    return undefined;
  }
  return keyword;
}
