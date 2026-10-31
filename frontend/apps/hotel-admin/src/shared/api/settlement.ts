import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  GetSettlementQueryParams,
  GetSettlementResponse,
  GetSettlementStaysQueryParams,
  GetSettlementStaysResponse,
} from "./generated/zod";
import {
  PageResponseStaySettlementStayHotelAdminResponse,
  StaySettlementHotelAdminResponse,
  StaySettlementStayHotelAdminResponse,
} from "./generated/zod/schemas";

export const settlementParamsSchema = GetSettlementQueryParams;

export const settlementStayListParamsSchema = GetSettlementStaysQueryParams;

export type Settlement = z.output<typeof StaySettlementHotelAdminResponse>;

export type SettlementStay = z.output<
  typeof StaySettlementStayHotelAdminResponse
>;

export type SettlementStayPage = z.output<
  typeof PageResponseStaySettlementStayHotelAdminResponse
>;

export type SettlementParams = z.input<typeof GetSettlementQueryParams>;

export type SettlementStayListParams = z.input<
  typeof GetSettlementStaysQueryParams
>;

const GetSettlementSuccessResponse = GetSettlementResponse.extend({
  success: z.literal(true),
  data: StaySettlementHotelAdminResponse,
});

const GetSettlementStaysSuccessResponse = GetSettlementStaysResponse.extend({
  success: z.literal(true),
  data: PageResponseStaySettlementStayHotelAdminResponse,
});

type RequestOptions = {
  signal?: AbortSignal;
};

export function settlementQueryKey(params?: SettlementParams) {
  return generated.getGetSettlementQueryKey(params);
}

export function settlementStayListQueryKey(params?: SettlementStayListParams) {
  return generated.getGetSettlementStaysQueryKey(params);
}

export async function fetchSettlement(
  params: SettlementParams,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest(
    "getSettlement",
    GetSettlementQueryParams,
    params,
  );
  const response = await generated.getSettlement(
    validParams,
    undefined,
    signal,
  );
  return parseResponseBody(
    "getSettlement",
    GetSettlementSuccessResponse,
    response,
  ).data;
}

export async function fetchSettlementStays(
  params: SettlementStayListParams,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest(
    "getSettlementStays",
    GetSettlementStaysQueryParams,
    params,
  );
  const response = await generated.getSettlementStays(
    validParams,
    undefined,
    signal,
  );
  return parseResponseBody(
    "getSettlementStays",
    GetSettlementStaysSuccessResponse,
    response,
  ).data;
}
