import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  GetMemberParams,
  GetMemberResponse,
  GetMembersQueryParams,
  GetMembersResponse,
  GetMemberStaysParams,
  GetMemberStaysQueryParams,
  GetMemberStaysResponse,
} from "./generated/zod";
import {
  MemberAppAdminResponse,
  PageResponseMemberAppAdminResponse,
  PageResponseStayAppAdminResponse,
  StayAppAdminResponse,
} from "./generated/zod/schemas";

export const memberListParamsSchema = GetMembersQueryParams;

export const memberParamsSchema = GetMemberParams;

export const memberStayListParamsSchema = GetMemberStaysQueryParams;

export type Member = z.output<typeof MemberAppAdminResponse>;

export type MemberPage = z.output<typeof PageResponseMemberAppAdminResponse>;

export type MemberListParams = z.input<typeof GetMembersQueryParams>;

export type MemberStay = z.output<typeof StayAppAdminResponse>;

export type MemberStayPage = z.output<typeof PageResponseStayAppAdminResponse>;

export type MemberStayListParams = z.input<typeof GetMemberStaysQueryParams>;

const GetMembersSuccessResponse = GetMembersResponse.extend({
  success: z.literal(true),
  data: PageResponseMemberAppAdminResponse,
});

const GetMemberSuccessResponse = GetMemberResponse.extend({
  success: z.literal(true),
  data: MemberAppAdminResponse,
});

const GetMemberStaysSuccessResponse = GetMemberStaysResponse.extend({
  success: z.literal(true),
  data: PageResponseStayAppAdminResponse,
});

type RequestOptions = {
  signal?: AbortSignal;
};

export function memberListQueryKey(params?: MemberListParams) {
  return generated.getGetMembersQueryKey(params);
}

export function memberQueryKey(memberId: number) {
  return generated.getGetMemberQueryKey(memberId);
}

export function memberStayListQueryKey(
  memberId: number,
  params?: MemberStayListParams,
) {
  return generated.getGetMemberStaysQueryKey(memberId, params);
}

export async function fetchMembers(
  params: MemberListParams,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getMembers", GetMembersQueryParams, params);
  const response = await generated.getMembers(validParams, undefined, signal);
  return parseResponseBody(
    "getMembers",
    GetMembersSuccessResponse,
    response,
  ).data;
}

export async function fetchMember(
  memberId: number,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getMember", GetMemberParams, { memberId });
  const response = await generated.getMember(
    validParams.memberId,
    undefined,
    signal,
  );
  return parseResponseBody("getMember", GetMemberSuccessResponse, response)
    .data;
}

export async function fetchMemberStays(
  memberId: number,
  params: MemberStayListParams,
  { signal }: RequestOptions = {},
) {
  const validPathParams = parseRequest(
    "getMemberStays",
    GetMemberStaysParams,
    { memberId },
  );
  const validParams = parseRequest(
    "getMemberStays",
    GetMemberStaysQueryParams,
    params,
  );
  const response = await generated.getMemberStays(
    validPathParams.memberId,
    validParams,
    undefined,
    signal,
  );
  return parseResponseBody(
    "getMemberStays",
    GetMemberStaysSuccessResponse,
    response,
  ).data;
}
