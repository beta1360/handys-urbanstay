import { z } from "zod";
import * as generated from "./generated";
import {
  GetHotelRoomsParams,
  GetHotelRoomsQueryParams,
  GetHotelRoomsResponse,
} from "./generated/zod";
import {
  PageResponseRoomAppResponse,
  RoomAppResponse,
} from "./generated/zod/schemas";
import { parseRequest, parseResponse } from "./validate";

export const hotelRoomsParamsSchema = GetHotelRoomsParams;

export type Room = z.output<typeof RoomAppResponse>;

export type RoomPage = z.output<typeof PageResponseRoomAppResponse>;

export type HotelRoomListParams = z.input<typeof GetHotelRoomsQueryParams>;

const GetHotelRoomsSuccessResponse = GetHotelRoomsResponse.extend({
  success: z.literal(true),
  data: PageResponseRoomAppResponse,
});

export async function fetchHotelRooms(
  hotelId: number,
  params: HotelRoomListParams,
) {
  const validPath = parseRequest("getHotelRooms", GetHotelRoomsParams, {
    hotelId,
  });
  const validParams = parseRequest(
    "getHotelRooms",
    GetHotelRoomsQueryParams,
    params,
  );
  const response = await generated.getHotelRooms(
    validPath.hotelId,
    validParams,
  );
  return parseResponse("getHotelRooms", GetHotelRoomsSuccessResponse, response)
    .data;
}
