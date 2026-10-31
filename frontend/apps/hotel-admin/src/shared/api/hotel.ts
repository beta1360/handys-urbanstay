import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import { GetHotelResponse, UpdateHotelResponse } from "./generated/zod";
import {
  HotelHotelAdminResponse,
  HotelUpdateHotelAdminRequest,
} from "./generated/zod/schemas";

export const updateHotelBodySchema = HotelUpdateHotelAdminRequest;

export type UpdateHotelBody = z.input<typeof HotelUpdateHotelAdminRequest>;

export type Hotel = z.output<typeof HotelHotelAdminResponse>;

const HOTEL_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: HotelHotelAdminResponse,
};

const GetHotelSuccessResponse = GetHotelResponse.extend(HOTEL_SUCCESS_SHAPE);

const UpdateHotelSuccessResponse = UpdateHotelResponse.extend({
  ...HOTEL_SUCCESS_SHAPE,
  message: z.string(),
});

type RequestOptions = {
  signal?: AbortSignal;
};

export function hotelQueryKey() {
  return generated.getGetHotelQueryKey();
}

export async function fetchHotel({ signal }: RequestOptions = {}) {
  const response = await generated.getHotel(undefined, signal);
  return parseResponseBody("getHotel", GetHotelSuccessResponse, response).data;
}

export async function updateHotel(body: UpdateHotelBody) {
  const validBody = parseRequest(
    "updateHotel",
    HotelUpdateHotelAdminRequest,
    body,
  );
  const response = await generated.updateHotel(validBody);
  const { data, message } = parseResponseBody(
    "updateHotel",
    UpdateHotelSuccessResponse,
    response,
  );
  return { data, message };
}
