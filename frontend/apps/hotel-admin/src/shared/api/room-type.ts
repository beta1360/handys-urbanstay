import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  CreateRoomTypeResponse,
  GetRoomTypeParams,
  GetRoomTypeResponse,
  GetRoomTypesResponse,
  UpdateRoomTypeParams,
  UpdateRoomTypeResponse,
} from "./generated/zod";
import {
  RoomTypeCreateHotelAdminRequest,
  RoomTypeHotelAdminResponse,
  RoomTypeUpdateHotelAdminRequest,
} from "./generated/zod/schemas";

export const createRoomTypeBodySchema = RoomTypeCreateHotelAdminRequest;

export const updateRoomTypeBodySchema = RoomTypeUpdateHotelAdminRequest;

export const roomTypeParamsSchema = GetRoomTypeParams;

export type CreateRoomTypeBody = z.input<
  typeof RoomTypeCreateHotelAdminRequest
>;

export type UpdateRoomTypeBody = z.input<
  typeof RoomTypeUpdateHotelAdminRequest
>;

export type RoomType = z.output<typeof RoomTypeHotelAdminResponse>;

const ROOM_TYPE_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: RoomTypeHotelAdminResponse,
};

const ROOM_TYPE_CHANGE_SUCCESS_SHAPE = {
  ...ROOM_TYPE_SUCCESS_SHAPE,
  message: z.string(),
};

const GetRoomTypesSuccessResponse = GetRoomTypesResponse.extend({
  success: z.literal(true),
  data: z.array(RoomTypeHotelAdminResponse),
});

const GetRoomTypeSuccessResponse = GetRoomTypeResponse.extend(
  ROOM_TYPE_SUCCESS_SHAPE,
);

const CreateRoomTypeSuccessResponse = CreateRoomTypeResponse.extend(
  ROOM_TYPE_CHANGE_SUCCESS_SHAPE,
);

const UpdateRoomTypeSuccessResponse = UpdateRoomTypeResponse.extend(
  ROOM_TYPE_CHANGE_SUCCESS_SHAPE,
);

type RequestOptions = {
  signal?: AbortSignal;
};

export function roomTypeListQueryKey() {
  return generated.getGetRoomTypesQueryKey();
}

export function roomTypeQueryKey(roomTypeId: number) {
  return generated.getGetRoomTypeQueryKey(roomTypeId);
}

export async function fetchRoomTypes({ signal }: RequestOptions = {}) {
  const response = await generated.getRoomTypes(undefined, signal);
  return parseResponseBody(
    "getRoomTypes",
    GetRoomTypesSuccessResponse,
    response,
  ).data;
}

export async function fetchRoomType(
  roomTypeId: number,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getRoomType", GetRoomTypeParams, {
    roomTypeId,
  });
  const response = await generated.getRoomType(
    validParams.roomTypeId,
    undefined,
    signal,
  );
  return parseResponseBody("getRoomType", GetRoomTypeSuccessResponse, response)
    .data;
}

export async function createRoomType(body: CreateRoomTypeBody) {
  const validBody = parseRequest(
    "createRoomType",
    RoomTypeCreateHotelAdminRequest,
    body,
  );
  const response = await generated.createRoomType(validBody);
  const { data, message } = parseResponseBody(
    "createRoomType",
    CreateRoomTypeSuccessResponse,
    response,
  );
  return { data, message };
}

export async function updateRoomType(
  roomTypeId: number,
  body: UpdateRoomTypeBody,
) {
  const validParams = parseRequest("updateRoomType", UpdateRoomTypeParams, {
    roomTypeId,
  });
  const validBody = parseRequest(
    "updateRoomType",
    RoomTypeUpdateHotelAdminRequest,
    body,
  );
  const response = await generated.updateRoomType(
    validParams.roomTypeId,
    validBody,
  );
  const { data, message } = parseResponseBody(
    "updateRoomType",
    UpdateRoomTypeSuccessResponse,
    response,
  );
  return { data, message };
}
