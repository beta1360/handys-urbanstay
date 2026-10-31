import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  GetHotelMasterParams,
  GetHotelMasterResponse,
  ResetHotelMasterPasswordParams,
  ResetHotelMasterPasswordResponse,
  UpdateHotelMasterParams,
  UpdateHotelMasterResponse,
} from "./generated/zod";
import {
  AccountHotelMasterAppAdminResponse,
  AccountHotelMasterPasswordResetAppAdminRequest,
  AccountHotelMasterUpdateAppAdminRequest,
} from "./generated/zod/schemas";

export const updateHotelMasterBodySchema =
  AccountHotelMasterUpdateAppAdminRequest;

export const resetHotelMasterPasswordBodySchema =
  AccountHotelMasterPasswordResetAppAdminRequest;

export type UpdateHotelMasterBody = z.input<
  typeof AccountHotelMasterUpdateAppAdminRequest
>;

export type ResetHotelMasterPasswordBody = z.input<
  typeof AccountHotelMasterPasswordResetAppAdminRequest
>;

export type HotelMaster = z.output<typeof AccountHotelMasterAppAdminResponse>;

const HOTEL_MASTER_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: AccountHotelMasterAppAdminResponse,
};

const GetHotelMasterSuccessResponse = GetHotelMasterResponse.extend(
  HOTEL_MASTER_SUCCESS_SHAPE,
);

const UpdateHotelMasterSuccessResponse = UpdateHotelMasterResponse.extend({
  ...HOTEL_MASTER_SUCCESS_SHAPE,
  message: z.string(),
});

const ResetHotelMasterPasswordSuccessResponse =
  ResetHotelMasterPasswordResponse.extend({ message: z.string() });

type RequestOptions = {
  signal?: AbortSignal;
};

export function hotelMasterQueryKey(hotelId: number) {
  return generated.getGetHotelMasterQueryKey(hotelId);
}

export async function fetchHotelMaster(
  hotelId: number,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getHotelMaster", GetHotelMasterParams, {
    hotelId,
  });
  const response = await generated.getHotelMaster(
    validParams.hotelId,
    undefined,
    signal,
  );
  return parseResponseBody(
    "getHotelMaster",
    GetHotelMasterSuccessResponse,
    response,
  ).data;
}

export async function updateHotelMaster(
  hotelId: number,
  body: UpdateHotelMasterBody,
) {
  const validParams = parseRequest(
    "updateHotelMaster",
    UpdateHotelMasterParams,
    { hotelId },
  );
  const validBody = parseRequest(
    "updateHotelMaster",
    AccountHotelMasterUpdateAppAdminRequest,
    body,
  );
  const response = await generated.updateHotelMaster(
    validParams.hotelId,
    validBody,
  );
  const { data, message } = parseResponseBody(
    "updateHotelMaster",
    UpdateHotelMasterSuccessResponse,
    response,
  );
  return { data, message };
}

export async function resetHotelMasterPassword(
  hotelId: number,
  body: ResetHotelMasterPasswordBody,
) {
  const validParams = parseRequest(
    "resetHotelMasterPassword",
    ResetHotelMasterPasswordParams,
    { hotelId },
  );
  const validBody = parseRequest(
    "resetHotelMasterPassword",
    AccountHotelMasterPasswordResetAppAdminRequest,
    body,
  );
  const response = await generated.resetHotelMasterPassword(
    validParams.hotelId,
    validBody,
  );
  const { message } = parseResponseBody(
    "resetHotelMasterPassword",
    ResetHotelMasterPasswordSuccessResponse,
    response,
  );
  return { message };
}
