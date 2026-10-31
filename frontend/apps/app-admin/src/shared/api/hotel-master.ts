import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import { GetHotelMasterParams, GetHotelMasterResponse } from "./generated/zod";
import { AccountHotelMasterAppAdminResponse } from "./generated/zod/schemas";

export type HotelMaster = z.output<typeof AccountHotelMasterAppAdminResponse>;

const HOTEL_MASTER_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: AccountHotelMasterAppAdminResponse,
};

const GetHotelMasterSuccessResponse = GetHotelMasterResponse.extend(
  HOTEL_MASTER_SUCCESS_SHAPE,
);

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
