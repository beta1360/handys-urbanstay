import {
  COMMON_API_ERROR_CODES,
  createApiErrorReader,
} from "@repo/admin-kit/api";
import { ErrorApiResponse } from "./generated/zod/schemas";

export const API_ERROR_CODES = {
  ...COMMON_API_ERROR_CODES,
  roomNotFound: "ROOM_NOT_FOUND",
  roomDuplicated: "ROOM_DUPLICATED",
  roomModified: "ROOM_MODIFIED",
} as const;

export const getApiError = createApiErrorReader(ErrorApiResponse);
