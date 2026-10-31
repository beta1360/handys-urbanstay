import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  CreateRoomResponse,
  GetRoomParams,
  GetRoomResponse,
  GetRoomsQueryParams,
  GetRoomsResponse,
  GetRoomStatusHistoriesParams,
  GetRoomStatusHistoriesQueryParams,
  GetRoomStatusHistoriesResponse,
  UpdateRoomParams,
  UpdateRoomResponse,
  UpdateRoomStatusParams,
  UpdateRoomStatusResponse,
} from "./generated/zod";
import {
  PageResponseRoomHotelAdminResponse,
  PageResponseRoomStatusHistoryHotelAdminResponse,
  RoomCreateHotelAdminRequest,
  RoomHotelAdminResponse,
  RoomStatusHistoryHotelAdminResponse,
  RoomStatusUpdateHotelAdminRequest,
  RoomUpdateHotelAdminRequest,
} from "./generated/zod/schemas";

export const createRoomBodySchema = RoomCreateHotelAdminRequest;

export const updateRoomBodySchema = RoomUpdateHotelAdminRequest;

export const roomListParamsSchema = GetRoomsQueryParams;

export const roomParamsSchema = GetRoomParams;

export const roomStatusHistoryParamsSchema = GetRoomStatusHistoriesQueryParams;

export type CreateRoomBody = z.input<typeof RoomCreateHotelAdminRequest>;

export type UpdateRoomBody = z.input<typeof RoomUpdateHotelAdminRequest>;

export type UpdateRoomStatusBody = z.input<
  typeof RoomStatusUpdateHotelAdminRequest
>;

export type Room = z.output<typeof RoomHotelAdminResponse>;

export type RoomStatus = Room["status"];

export type RoomPage = z.output<typeof PageResponseRoomHotelAdminResponse>;

export type RoomListParams = z.input<typeof GetRoomsQueryParams>;

export type RoomStatusHistory = z.output<
  typeof RoomStatusHistoryHotelAdminResponse
>;

export type RoomStatusHistoryPage = z.output<
  typeof PageResponseRoomStatusHistoryHotelAdminResponse
>;

export type RoomStatusHistoryParams = z.input<
  typeof GetRoomStatusHistoriesQueryParams
>;

const ROOM_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: RoomHotelAdminResponse,
};

const GetRoomsSuccessResponse = GetRoomsResponse.extend({
  success: z.literal(true),
  data: PageResponseRoomHotelAdminResponse,
});

const GetRoomSuccessResponse = GetRoomResponse.extend(ROOM_SUCCESS_SHAPE);

const GetRoomStatusHistoriesSuccessResponse =
  GetRoomStatusHistoriesResponse.extend({
    success: z.literal(true),
    data: PageResponseRoomStatusHistoryHotelAdminResponse,
  });

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

const UpdateRoomStatusSuccessResponse = UpdateRoomStatusResponse.extend(
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

export function roomStatusHistoriesQueryKey(
  roomId: number,
  params?: RoomStatusHistoryParams,
) {
  return generated.getGetRoomStatusHistoriesQueryKey(roomId, params);
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

export async function fetchRoomStatusHistories(
  roomId: number,
  params: RoomStatusHistoryParams,
  { signal }: RequestOptions = {},
) {
  const validPath = parseRequest(
    "getRoomStatusHistories",
    GetRoomStatusHistoriesParams,
    { roomId },
  );
  const validParams = parseRequest(
    "getRoomStatusHistories",
    GetRoomStatusHistoriesQueryParams,
    params,
  );
  const response = await generated.getRoomStatusHistories(
    validPath.roomId,
    validParams,
    undefined,
    signal,
  );
  return parseResponseBody(
    "getRoomStatusHistories",
    GetRoomStatusHistoriesSuccessResponse,
    response,
  ).data;
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

export async function updateRoomStatus(
  roomId: number,
  body: UpdateRoomStatusBody,
) {
  const validParams = parseRequest("updateRoomStatus", UpdateRoomStatusParams, {
    roomId,
  });
  const validBody = parseRequest(
    "updateRoomStatus",
    RoomStatusUpdateHotelAdminRequest,
    body,
  );
  const response = await generated.updateRoomStatus(
    validParams.roomId,
    validBody,
  );
  const { data, message } = parseResponseBody(
    "updateRoomStatus",
    UpdateRoomStatusSuccessResponse,
    response,
  );
  return { data, message };
}
