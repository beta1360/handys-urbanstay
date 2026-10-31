import { z } from "zod";
import * as generated from "./generated";
import {
  GetHotelRoomTypesParams,
  GetHotelRoomTypesQueryParams,
  GetHotelRoomTypesResponse,
} from "./generated/zod";
import { StayRoomTypeAppResponse } from "./generated/zod/schemas";
import { parseRequest, parseResponse } from "./validate";

export const hotelIdParamsSchema = GetHotelRoomTypesParams;

export const roomTypeListParamsSchema = GetHotelRoomTypesQueryParams;

export type RoomType = z.output<typeof StayRoomTypeAppResponse>;

export type RoomTypeListParams = z.output<typeof GetHotelRoomTypesQueryParams>;

const GetHotelRoomTypesSuccessResponse = GetHotelRoomTypesResponse.extend({
  success: z.literal(true),
  data: z.array(StayRoomTypeAppResponse),
});

type RequestOptions = {
  signal?: AbortSignal;
};

export function roomTypesQueryKey(hotelId: number, params?: RoomTypeListParams) {
  return generated.getGetHotelRoomTypesQueryKey(hotelId, params);
}

export async function fetchHotelRoomTypes(
  hotelId: number,
  params: RoomTypeListParams,
  { signal }: RequestOptions = {},
) {
  const validPath = parseRequest("getHotelRoomTypes", GetHotelRoomTypesParams, {
    hotelId,
  });
  const validParams = parseRequest(
    "getHotelRoomTypes",
    GetHotelRoomTypesQueryParams,
    params,
  );
  const response = await generated.getHotelRoomTypes(
    validPath.hotelId,
    validParams,
    { signal },
  );
  return parseResponse(
    "getHotelRoomTypes",
    GetHotelRoomTypesSuccessResponse,
    response,
  ).data;
}
