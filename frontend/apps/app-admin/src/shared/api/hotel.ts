import { z } from "zod";
import * as generated from "./generated";
import {
  CreateHotelResponse,
  GetHotelParams,
  GetHotelResponse,
  GetHotelsQueryParams,
  GetHotelsResponse,
  UpdateHotelParams,
  UpdateHotelResponse,
} from "./generated/zod";
import {
  HotelAppAdminResponse,
  HotelCreateAppAdminRequest,
  HotelUpdateAppAdminRequest,
  PageResponseHotelAppAdminResponse,
} from "./generated/zod/schemas";
import { parseRequest, parseResponseBody } from "./validate";

export const createHotelBodySchema = HotelCreateAppAdminRequest;

export const updateHotelBodySchema = HotelUpdateAppAdminRequest;

export const hotelListParamsSchema = GetHotelsQueryParams;

export const hotelParamsSchema = GetHotelParams;

export type CreateHotelBody = z.input<typeof HotelCreateAppAdminRequest>;

export type UpdateHotelBody = z.input<typeof HotelUpdateAppAdminRequest>;

export type Hotel = z.output<typeof HotelAppAdminResponse>;

export type HotelPage = z.output<typeof PageResponseHotelAppAdminResponse>;

export type HotelListParams = z.input<typeof GetHotelsQueryParams>;

const HOTEL_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: HotelAppAdminResponse,
};

const GetHotelsSuccessResponse = GetHotelsResponse.extend({
  success: z.literal(true),
  data: PageResponseHotelAppAdminResponse,
});

const GetHotelSuccessResponse = GetHotelResponse.extend(HOTEL_SUCCESS_SHAPE);

const CreateHotelSuccessResponse =
  CreateHotelResponse.extend(HOTEL_SUCCESS_SHAPE);

const UpdateHotelSuccessResponse =
  UpdateHotelResponse.extend(HOTEL_SUCCESS_SHAPE);

type RequestOptions = {
  signal?: AbortSignal;
};

export function hotelListQueryKey(params?: HotelListParams) {
  return generated.getGetHotelsQueryKey(params);
}

export function hotelQueryKey(hotelId: number) {
  return generated.getGetHotelQueryKey(hotelId);
}

export async function fetchHotels(
  params: HotelListParams,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getHotels", GetHotelsQueryParams, params);
  const response = await generated.getHotels(validParams, undefined, signal);
  return parseResponseBody(
    "getHotels",
    GetHotelsSuccessResponse,
    response,
  ).data;
}

export async function fetchHotel(
  hotelId: number,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getHotel", GetHotelParams, { hotelId });
  const response = await generated.getHotel(
    validParams.hotelId,
    undefined,
    signal,
  );
  return parseResponseBody("getHotel", GetHotelSuccessResponse, response).data;
}

export async function createHotel(body: CreateHotelBody) {
  const validBody = parseRequest(
    "createHotel",
    HotelCreateAppAdminRequest,
    body,
  );
  const response = await generated.createHotel(validBody);
  return parseResponseBody(
    "createHotel",
    CreateHotelSuccessResponse,
    response,
  ).data;
}

export async function updateHotel(hotelId: number, body: UpdateHotelBody) {
  const validParams = parseRequest("updateHotel", UpdateHotelParams, {
    hotelId,
  });
  const validBody = parseRequest(
    "updateHotel",
    HotelUpdateAppAdminRequest,
    body,
  );
  const response = await generated.updateHotel(validParams.hotelId, validBody);
  return parseResponseBody(
    "updateHotel",
    UpdateHotelSuccessResponse,
    response,
  ).data;
}
