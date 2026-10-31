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
  roomStatusChanged: "ROOM_STATUS_CHANGED",
  roomStatusTransitionNotAllowed: "ROOM_STATUS_TRANSITION_NOT_ALLOWED",
  guestNotFound: "GUEST_NOT_FOUND",
  guestPhoneDuplicated: "GUEST_PHONE_DUPLICATED",
  guestModified: "GUEST_MODIFIED",
  operatorNotFound: "HOTEL_OPERATOR_NOT_FOUND",
  operatorModified: "HOTEL_ADMIN_MODIFIED",
  loginIdDuplicated: "LOGIN_ID_DUPLICATED",
  stayNotFound: "STAY_NOT_FOUND",
  stayAlreadyCanceled: "STAY_ALREADY_CANCELED",
  stayAlreadyEnded: "STAY_ALREADY_ENDED",
} as const;

export const getApiError = createApiErrorReader(ErrorApiResponse);
