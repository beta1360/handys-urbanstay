import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  CreateRoomResponse,
  GetRoomParams,
  GetRoomResponse,
  GetRoomsQueryParams,
  GetRoomsResponse,
  UpdateRoomParams,
  UpdateRoomResponse,
} from "./generated/zod";
import {
  PageResponseRoomHotelAdminResponse,
  RoomCreateHotelAdminRequest,
  RoomHotelAdminResponse,
  RoomUpdateHotelAdminRequest,
} from "./generated/zod/schemas";

export const createRoomBodySchema = RoomCreateHotelAdminRequest;

export const updateRoomBodySchema = RoomUpdateHotelAdminRequest;

export const roomListParamsSchema = GetRoomsQueryParams;

export const roomParamsSchema = GetRoomParams;

export type CreateRoomBody = z.input<typeof RoomCreateHotelAdminRequest>;

export type UpdateRoomBody = z.input<typeof RoomUpdateHotelAdminRequest>;

export type Room = z.output<typeof RoomHotelAdminResponse>;

export type RoomStatus = Room["status"];

export type RoomPage = z.output<typeof PageResponseRoomHotelAdminResponse>;

export type RoomListParams = z.input<typeof GetRoomsQueryParams>;

const ROOM_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: RoomHotelAdminResponse,
};

const GetRoomsSuccessResponse = GetRoomsResponse.extend({
  success: z.literal(true),
  data: PageResponseRoomHotelAdminResponse,
});

const GetRoomSuccessResponse = GetRoomResponse.extend(ROOM_SUCCESS_SHAPE);

const ROOM_CHANGE_SUCCESS_SHAPE = {
  ...ROOM_SUCCESS_SHAPE,
  message: z.string(),
};

const CreateRoomSuccessResponse = CreateRoomResponse.extend(
  ROOM_CHANGE_SUCCESS_SHAPE,
);

const UpdateRoomSuccessResponse = UpdateRoomResponse.extend(
  ROOM_CHANGE_SUCCESS_SHAPE,
);

type RequestOptions = {
  signal?: AbortSignal;
};

export function roomListQueryKey(params?: RoomListParams) {
  return generated.getGetRoomsQueryKey(params);
}

export function roomQueryKey(roomId: number) {
  return generated.getGetRoomQueryKey(roomId);
}

export async function fetchRooms(
  params: RoomListParams,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getRooms", GetRoomsQueryParams, params);
  const response = await generated.getRooms(validParams, undefined, signal);
  return parseResponseBody("getRooms", GetRoomsSuccessResponse, response).data;
}

export async function fetchRoom(
  roomId: number,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getRoom", GetRoomParams, { roomId });
  const response = await generated.getRoom(
    validParams.roomId,
    undefined,
    signal,
  );
  return parseResponseBody("getRoom", GetRoomSuccessResponse, response).data;
}

export async function createRoom(body: CreateRoomBody) {
  const validBody = parseRequest(
    "createRoom",
    RoomCreateHotelAdminRequest,
    body,
  );
  const response = await generated.createRoom(validBody);
  const { data, message } = parseResponseBody(
    "createRoom",
    CreateRoomSuccessResponse,
    response,
  );
  return { data, message };
}

export async function updateRoom(roomId: number, body: UpdateRoomBody) {
  const validParams = parseRequest("updateRoom", UpdateRoomParams, { roomId });
  const validBody = parseRequest(
    "updateRoom",
    RoomUpdateHotelAdminRequest,
    body,
  );
  const response = await generated.updateRoom(validParams.roomId, validBody);
  const { data, message } = parseResponseBody(
    "updateRoom",
    UpdateRoomSuccessResponse,
    response,
  );
  return { data, message };
}
