import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  CreateStayResponse,
  GetStayParams,
  GetStayResponse,
  GetStaysQueryParams,
  GetStaysResponse,
} from "./generated/zod";
import {
  PageResponseStayHotelAdminResponse,
  StayCreateHotelAdminRequest,
  StayHotelAdminResponse,
} from "./generated/zod/schemas";

export const createStayBodySchema = StayCreateHotelAdminRequest;

export const stayListParamsSchema = GetStaysQueryParams;

export const stayParamsSchema = GetStayParams;

export type CreateStayBody = z.input<typeof StayCreateHotelAdminRequest>;

export type Stay = z.output<typeof StayHotelAdminResponse>;

export type StayPage = z.output<typeof PageResponseStayHotelAdminResponse>;

export type StayListParams = z.input<typeof GetStaysQueryParams>;

const STAY_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: StayHotelAdminResponse,
};

const GetStaysSuccessResponse = GetStaysResponse.extend({
  success: z.literal(true),
  data: PageResponseStayHotelAdminResponse,
});

const GetStaySuccessResponse = GetStayResponse.extend(STAY_SUCCESS_SHAPE);

const CreateStaySuccessResponse = CreateStayResponse.extend({
  ...STAY_SUCCESS_SHAPE,
  message: z.string(),
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

export async function createStay(body: CreateStayBody) {
  const validBody = parseRequest(
    "createStay",
    StayCreateHotelAdminRequest,
    body,
  );
  const response = await generated.createStay(validBody);
  const { data, message } = parseResponseBody(
    "createStay",
    CreateStaySuccessResponse,
    response,
  );
  return { data, message };
}
