import { z } from "zod";
import * as generated from "./generated";
import { GetMyStaysPeriod } from "./generated/schemas";
import {
  CreateStayResponse,
  GetMyStaysQueryParams,
  GetMyStaysResponse,
  getMyStaysQueryPageMax,
} from "./generated/zod";
import {
  PageResponseStayMyAppResponse,
  StayAppResponse,
  StayCreateAppRequest,
  StayMyAppResponse,
} from "./generated/zod/schemas";
import { parseRequest, parseResponse } from "./validate";

export const createStayBodySchema = StayCreateAppRequest;

export type CreateStayBody = z.input<typeof StayCreateAppRequest>;

export type ReservedStay = z.output<typeof StayAppResponse>;

export type MyStay = z.output<typeof StayMyAppResponse>;

export type MyStayListParams = z.input<typeof GetMyStaysQueryParams>;

export const MY_STAY_PERIOD = GetMyStaysPeriod;

export type MyStayPeriod = GetMyStaysPeriod;

export const MY_STAY_LIST_MAX_PAGE = getMyStaysQueryPageMax;

const GetMyStaysSuccessResponse = GetMyStaysResponse.extend({
  success: z.literal(true),
  data: PageResponseStayMyAppResponse,
});

type MyStaysRequestOptions = {
  cookie?: string;
  signal?: AbortSignal;
};

const CreateStaySuccessResponse = CreateStayResponse.extend({
  success: z.literal(true),
  data: StayAppResponse,
  message: z.string(),
});

export async function createStay(body: CreateStayBody) {
  const validBody = parseRequest("createStay", StayCreateAppRequest, body);
  const response = await generated.createStay(validBody);
  const { data, message } = parseResponse(
    "createStay",
    CreateStaySuccessResponse,
    response,
  );
  return { data, message };
}

export function myStaysQueryKey() {
  return generated.getGetMyStaysQueryKey();
}

export async function fetchMyStays(
  params: MyStayListParams,
  { cookie, signal }: MyStaysRequestOptions = {},
) {
  const validParams = parseRequest("getMyStays", GetMyStaysQueryParams, params);
  const response = await generated.getMyStays(validParams, {
    signal,
    headers: cookie === undefined ? undefined : { cookie },
  });
  return parseResponse("getMyStays", GetMyStaysSuccessResponse, response).data;
}
