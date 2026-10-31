import { guestListParamsSchema } from "@/shared/api";

const keywordParamSchema = guestListParamsSchema.shape.keyword;

export const GUEST_KEYWORD_MAX_LENGTH =
  keywordParamSchema.unwrap().maxLength ?? undefined;

export function normalizeGuestKeyword(value: string | undefined) {
  const keyword = value?.trim();
  if (!keyword || !keywordParamSchema.safeParse(keyword).success) {
    return undefined;
  }
  return keyword;
}
