import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  GetStayParams,
  GetStayResponse,
  GetStaysQueryParams,
  GetStaysResponse,
} from "./generated/zod";
import {
  PageResponseStayHotelAdminResponse,
  StayHotelAdminResponse,
} from "./generated/zod/schemas";

export const stayListParamsSchema = GetStaysQueryParams;

export const stayParamsSchema = GetStayParams;

export type Stay = z.output<typeof StayHotelAdminResponse>;

export type StayPage = z.output<typeof PageResponseStayHotelAdminResponse>;

export type StayListParams = z.input<typeof GetStaysQueryParams>;

const GetStaysSuccessResponse = GetStaysResponse.extend({
  success: z.literal(true),
  data: PageResponseStayHotelAdminResponse,
});

const GetStaySuccessResponse = GetStayResponse.extend({
  success: z.literal(true),
  data: StayHotelAdminResponse,
});

type RequestOptions = {
  signal?: AbortSignal;
};

export function stayListQueryKey(params?: StayListParams) {
  return generated.getGetStaysQueryKey(params);
}

export function stayQueryKey(stayId: number) {
  return generated.getGetStayQueryKey(stayId);
}

export async function fetchStays(
  params: StayListParams,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getStays", GetStaysQueryParams, params);
  const response = await generated.getStays(validParams, undefined, signal);
  return parseResponseBody("getStays", GetStaysSuccessResponse, response).data;
}

export async function fetchStay(
  stayId: number,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getStay", GetStayParams, { stayId });
  const response = await generated.getStay(
    validParams.stayId,
    undefined,
    signal,
  );
  return parseResponseBody("getStay", GetStaySuccessResponse, response).data;
}
