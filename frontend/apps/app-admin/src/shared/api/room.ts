import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  GetHotelRoomsParams,
  GetHotelRoomsQueryParams,
  GetHotelRoomsResponse,
} from "./generated/zod";
import {
  PageResponseRoomAppAdminResponse,
  RoomAppAdminResponse,
} from "./generated/zod/schemas";

export const hotelRoomListParamsSchema = GetHotelRoomsQueryParams;

export type HotelRoom = z.output<typeof RoomAppAdminResponse>;

export type RoomStatus = HotelRoom["status"];

export type HotelRoomPage = z.output<typeof PageResponseRoomAppAdminResponse>;

export type HotelRoomListParams = z.input<typeof GetHotelRoomsQueryParams>;

const GetHotelRoomsSuccessResponse = GetHotelRoomsResponse.extend({
  success: z.literal(true),
  data: PageResponseRoomAppAdminResponse,
});

type RequestOptions = {
  signal?: AbortSignal;
};

export function hotelRoomListQueryKey(
  hotelId: number,
  params?: HotelRoomListParams,
) {
  return generated.getGetHotelRoomsQueryKey(hotelId, params);
}

export async function fetchHotelRooms(
  hotelId: number,
  params: HotelRoomListParams,
  { signal }: RequestOptions = {},
) {
  const validPathParams = parseRequest("getHotelRooms", GetHotelRoomsParams, {
    hotelId,
  });
  const validParams = parseRequest(
    "getHotelRooms",
    GetHotelRoomsQueryParams,
    params,
  );
  const response = await generated.getHotelRooms(
    validPathParams.hotelId,
    validParams,
    undefined,
    signal,
  );
  return parseResponseBody(
    "getHotelRooms",
    GetHotelRoomsSuccessResponse,
    response,
  ).data;
}
