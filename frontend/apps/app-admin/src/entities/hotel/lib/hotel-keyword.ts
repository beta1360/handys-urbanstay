import { hotelListParamsSchema } from "@/shared/api";

const keywordParamSchema = hotelListParamsSchema.shape.keyword;

export const HOTEL_KEYWORD_MAX_LENGTH =
  keywordParamSchema.unwrap().maxLength ?? undefined;

export function normalizeHotelKeyword(value: string | undefined) {
  const keyword = value?.trim();
  if (!keyword || !keywordParamSchema.safeParse(keyword).success) {
    return undefined;
  }
  return keyword;
}
