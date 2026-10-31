import { z } from "zod";
import {
  isRequestablePage,
  normalizeRoomKeyword,
  normalizeRoomStatus,
  normalizeRoomTypeFilterId,
  ROOM_LIST_FIRST_PAGE,
} from "@/entities/room";

const PAGE_NUMBER_PATTERN = /^\d+$/;

function toPageNumber(value: string | number | undefined) {
  if (typeof value === "string") {
    return PAGE_NUMBER_PATTERN.test(value) ? Number(value) : undefined;
  }
  return value;
}

function normalizePage(value: string | number | undefined) {
  const page = toPageNumber(value);
  return page !== undefined && isRequestablePage(page)
    ? page
    : ROOM_LIST_FIRST_PAGE;
}

export const roomListSearchSchema = z.object({
  keyword: z
    .string()
    .optional()
    .catch(undefined)
    .transform(normalizeRoomKeyword),
  status: z
    .string()
    .optional()
    .catch(undefined)
    .transform(normalizeRoomStatus),
  roomTypeId: z
    .union([z.string(), z.number()])
    .optional()
    .catch(undefined)
    .transform(normalizeRoomTypeFilterId),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .catch(undefined)
    .transform(normalizePage),
});

export type RoomListSearch = z.output<typeof roomListSearchSchema>;

export const ROOM_LIST_DEFAULT_SEARCH = {
  page: ROOM_LIST_FIRST_PAGE,
} as const;
