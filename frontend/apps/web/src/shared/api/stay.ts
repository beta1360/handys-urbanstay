import { z } from "zod";
import * as generated from "./generated";
import {
  CreateStayResponse,
  GetRoomReservedPeriodsParams,
  GetRoomReservedPeriodsQueryParams,
  GetRoomReservedPeriodsResponse,
} from "./generated/zod";
import {
  PageResponseStayReservedPeriodAppResponse,
  StayAppResponse,
  StayCreateAppRequest,
  StayReservedPeriodAppResponse,
} from "./generated/zod/schemas";
import { parseRequest, parseResponse } from "./validate";

export const createStayBodySchema = StayCreateAppRequest;

export const reservedPeriodsParamsSchema = GetRoomReservedPeriodsParams;

export type CreateStayBody = z.input<typeof StayCreateAppRequest>;

export type ReservedStay = z.output<typeof StayAppResponse>;

export type ReservedPeriod = z.output<typeof StayReservedPeriodAppResponse>;

export type ReservedPeriodPage = z.output<
  typeof PageResponseStayReservedPeriodAppResponse
>;

export type ReservedPeriodListParams = z.input<
  typeof GetRoomReservedPeriodsQueryParams
>;

const GetRoomReservedPeriodsSuccessResponse =
  GetRoomReservedPeriodsResponse.extend({
    success: z.literal(true),
    data: PageResponseStayReservedPeriodAppResponse,
  });

const CreateStaySuccessResponse = CreateStayResponse.extend({
  success: z.literal(true),
  data: StayAppResponse,
  message: z.string(),
});

type RequestOptions = {
  signal?: AbortSignal;
};

export function reservedPeriodsQueryKey(
  roomId: number,
  params?: ReservedPeriodListParams,
) {
  return generated.getGetRoomReservedPeriodsQueryKey(roomId, params);
}

export async function fetchRoomReservedPeriods(
  roomId: number,
  params: ReservedPeriodListParams,
  { signal }: RequestOptions = {},
) {
  const validPath = parseRequest(
    "getRoomReservedPeriods",
    GetRoomReservedPeriodsParams,
    { roomId },
  );
  const validParams = parseRequest(
    "getRoomReservedPeriods",
    GetRoomReservedPeriodsQueryParams,
    params,
  );
  const response = await generated.getRoomReservedPeriods(
    validPath.roomId,
    validParams,
    { signal },
  );
  return parseResponse(
    "getRoomReservedPeriods",
    GetRoomReservedPeriodsSuccessResponse,
    response,
  ).data;
}

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
