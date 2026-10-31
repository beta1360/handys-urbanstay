import {
  COMMON_API_ERROR_CODES,
  createApiErrorReader,
} from "@repo/admin-kit/api";
import { ErrorApiResponse } from "./generated/zod/schemas";

export const API_ERROR_CODES = {
  ...COMMON_API_ERROR_CODES,
  hotelNotFound: "HOTEL_NOT_FOUND",
  hotelDuplicated: "HOTEL_DUPLICATED",
  hotelModified: "HOTEL_MODIFIED",
  loginIdDuplicated: "LOGIN_ID_DUPLICATED",
  hotelAdminModified: "HOTEL_ADMIN_MODIFIED",
  memberNotFound: "MEMBER_NOT_FOUND",
  appAdminNotFound: "APP_ADMIN_NOT_FOUND",
  appAdminModified: "APP_ADMIN_MODIFIED",
} as const;

export const getApiError = createApiErrorReader(ErrorApiResponse);
