import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  GetGuestParams,
  GetGuestResponse,
  GetGuestsQueryParams,
  GetGuestsResponse,
  UpdateGuestParams,
  UpdateGuestResponse,
} from "./generated/zod";
import {
  GuestDetailHotelAdminResponse,
  GuestHotelAdminResponse,
  GuestUpdateHotelAdminRequest,
  PageResponseGuestHotelAdminResponse,
} from "./generated/zod/schemas";

export const updateGuestBodySchema = GuestUpdateHotelAdminRequest;

export const guestListParamsSchema = GetGuestsQueryParams;

export const guestParamsSchema = GetGuestParams;

export type UpdateGuestBody = z.input<typeof GuestUpdateHotelAdminRequest>;

export type Guest = z.output<typeof GuestHotelAdminResponse>;

export type GuestDetail = z.output<typeof GuestDetailHotelAdminResponse>;

export type GuestCurrentStay = NonNullable<GuestDetail["currentStay"]>;

export type GuestPage = z.output<typeof PageResponseGuestHotelAdminResponse>;

export type GuestListParams = z.input<typeof GetGuestsQueryParams>;

const GUEST_DETAIL_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: GuestDetailHotelAdminResponse,
};

const GetGuestsSuccessResponse = GetGuestsResponse.extend({
  success: z.literal(true),
  data: PageResponseGuestHotelAdminResponse,
});

const GetGuestSuccessResponse = GetGuestResponse.extend(
  GUEST_DETAIL_SUCCESS_SHAPE,
);

const GUEST_CHANGE_SUCCESS_SHAPE = {
  ...GUEST_DETAIL_SUCCESS_SHAPE,
  message: z.string(),
};

const UpdateGuestSuccessResponse = UpdateGuestResponse.extend(
  GUEST_CHANGE_SUCCESS_SHAPE,
);

type RequestOptions = {
  signal?: AbortSignal;
};

export function guestListQueryKey(params?: GuestListParams) {
  return generated.getGetGuestsQueryKey(params);
}

export function guestQueryKey(guestId: number) {
  return generated.getGetGuestQueryKey(guestId);
}

export async function fetchGuests(
  params: GuestListParams,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getGuests", GetGuestsQueryParams, params);
  const response = await generated.getGuests(validParams, undefined, signal);
  return parseResponseBody(
    "getGuests",
    GetGuestsSuccessResponse,
    response,
  ).data;
}

export async function fetchGuest(
  guestId: number,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getGuest", GetGuestParams, { guestId });
  const response = await generated.getGuest(
    validParams.guestId,
    undefined,
    signal,
  );
  return parseResponseBody("getGuest", GetGuestSuccessResponse, response).data;
}

export async function updateGuest(guestId: number, body: UpdateGuestBody) {
  const validParams = parseRequest("updateGuest", UpdateGuestParams, {
    guestId,
  });
  const validBody = parseRequest(
    "updateGuest",
    GuestUpdateHotelAdminRequest,
    body,
  );
  const response = await generated.updateGuest(validParams.guestId, validBody);
  const { data, message } = parseResponseBody(
    "updateGuest",
    UpdateGuestSuccessResponse,
    response,
  );
  return { data, message };
}
