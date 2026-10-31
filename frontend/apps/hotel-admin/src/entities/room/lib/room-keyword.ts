import { roomListParamsSchema } from "@/shared/api";

const keywordParamSchema = roomListParamsSchema.shape.keyword;

export const ROOM_KEYWORD_MAX_LENGTH =
  keywordParamSchema.unwrap().maxLength ?? undefined;

export function normalizeRoomKeyword(value: string | undefined) {
  const keyword = value?.trim();
  if (!keyword || !keywordParamSchema.safeParse(keyword).success) {
    return undefined;
  }
  return keyword;
}
