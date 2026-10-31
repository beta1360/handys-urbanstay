import { z } from "zod";
import * as generated from "./generated";
import { GetHotelsQueryParams, GetHotelsResponse } from "./generated/zod";
import {
  HotelAppResponse,
  PageResponseHotelAppResponse,
} from "./generated/zod/schemas";
import { parseRequest, parseResponse } from "./validate";

export type Hotel = z.output<typeof HotelAppResponse>;

export type HotelPage = z.output<typeof PageResponseHotelAppResponse>;

export type HotelListParams = z.input<typeof GetHotelsQueryParams>;

const GetHotelsSuccessResponse = GetHotelsResponse.extend({
  success: z.literal(true),
  data: PageResponseHotelAppResponse,
});

export async function fetchHotels(params: HotelListParams) {
  const validParams = parseRequest("getHotels", GetHotelsQueryParams, params);
  const response = await generated.getHotels(validParams);
  return parseResponse("getHotels", GetHotelsSuccessResponse, response).data;
}
