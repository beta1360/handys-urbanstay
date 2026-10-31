import { stayListParamsSchema } from "@/shared/api";
import type { StayListParams } from "@/shared/api";
import { toApiPage } from "./stay-page";

const ID_PATTERN = /^\d+$/;

const ID_MIN = 1;

const idParamSchema = stayListParamsSchema.shape.roomId.unwrap();

const keywordParamSchema = stayListParamsSchema.shape.keyword;

const checkInDateParamSchema = stayListParamsSchema.shape.checkInFrom.unwrap();

export const STAY_KEYWORD_MAX_LENGTH =
  keywordParamSchema.unwrap().maxLength ?? undefined;

export type StayListFilter = {
  roomId: number | undefined;
  guestId: number | undefined;
  canceled: boolean | undefined;
  keyword: string | undefined;
  checkInFrom: string | undefined;
  checkInTo: string | undefined;
};

export function normalizeStayFilterId(value: string | number | undefined) {
  const id =
    typeof value === "string" && ID_PATTERN.test(value) ? Number(value) : value;
  return typeof id === "number" &&
    id >= ID_MIN &&
    idParamSchema.safeParse(id).success
    ? id
    : undefined;
}

export function normalizeStayCanceled(value: string | boolean | undefined) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === String(true)) {
    return true;
  }
  return value === String(false) ? false : undefined;
}

export function normalizeStayKeyword(value: string | undefined) {
  const keyword = value?.trim();
  if (!keyword || !keywordParamSchema.safeParse(keyword).success) {
    return undefined;
  }
  return keyword;
}

export function normalizeStayCheckInDate(value: string | undefined) {
  return value !== undefined && checkInDateParamSchema.safeParse(value).success
    ? value
    : undefined;
}

export function isStayCheckInRangeValid(
  checkInFrom: string | undefined,
  checkInTo: string | undefined,
) {
  return (
    checkInFrom === undefined ||
    checkInTo === undefined ||
    checkInFrom <= checkInTo
  );
}

export function hasStayListFilter(filter: StayListFilter) {
  return Object.values(filter).some((value) => value !== undefined);
}

export function toStayListParams(
  {
    roomId,
    guestId,
    canceled,
    keyword,
    checkInFrom,
    checkInTo,
  }: StayListFilter,
  page: number,
): StayListParams {
  return {
    roomId,
    guestId,
    canceled,
    keyword,
    checkInFrom,
    checkInTo,
    page: toApiPage(page),
  };
}
