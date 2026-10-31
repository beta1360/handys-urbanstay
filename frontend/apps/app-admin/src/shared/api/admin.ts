import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  CreateAdminResponse,
  GetAdminParams,
  GetAdminResponse,
  GetAdminsQueryParams,
  GetAdminsResponse,
  UpdateAdminParams,
  UpdateAdminResponse,
} from "./generated/zod";
import {
  AccountAdminAppAdminResponse,
  AccountAdminCreateAppAdminRequest,
  AccountAdminDetailAppAdminResponse,
  AccountAdminUpdateAppAdminRequest,
  PageResponseAccountAdminAppAdminResponse,
} from "./generated/zod/schemas";

export const createAdminBodySchema = AccountAdminCreateAppAdminRequest;

export const updateAdminBodySchema = AccountAdminUpdateAppAdminRequest;

export const adminListParamsSchema = GetAdminsQueryParams;

export const adminParamsSchema = GetAdminParams;

export type CreateAdminBody = z.input<typeof AccountAdminCreateAppAdminRequest>;

export type UpdateAdminBody = z.input<typeof AccountAdminUpdateAppAdminRequest>;

export type AdminSummary = z.output<typeof AccountAdminAppAdminResponse>;

export type Admin = z.output<typeof AccountAdminDetailAppAdminResponse>;

export type AdminPage = z.output<
  typeof PageResponseAccountAdminAppAdminResponse
>;

export type AdminListParams = z.input<typeof GetAdminsQueryParams>;

const ADMIN_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: AccountAdminDetailAppAdminResponse,
};

const ADMIN_CHANGE_SUCCESS_SHAPE = {
  ...ADMIN_SUCCESS_SHAPE,
  message: z.string(),
};

const GetAdminsSuccessResponse = GetAdminsResponse.extend({
  success: z.literal(true),
  data: PageResponseAccountAdminAppAdminResponse,
});

const GetAdminSuccessResponse = GetAdminResponse.extend(ADMIN_SUCCESS_SHAPE);

const CreateAdminSuccessResponse = CreateAdminResponse.extend(
  ADMIN_CHANGE_SUCCESS_SHAPE,
);

const UpdateAdminSuccessResponse = UpdateAdminResponse.extend(
  ADMIN_CHANGE_SUCCESS_SHAPE,
);

type RequestOptions = {
  signal?: AbortSignal;
};

export function adminListQueryKey(params?: AdminListParams) {
  return generated.getGetAdminsQueryKey(params);
}

export function adminQueryKey(adminId: number) {
  return generated.getGetAdminQueryKey(adminId);
}

export async function fetchAdmins(
  params: AdminListParams,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getAdmins", GetAdminsQueryParams, params);
  const response = await generated.getAdmins(validParams, undefined, signal);
  return parseResponseBody("getAdmins", GetAdminsSuccessResponse, response)
    .data;
}

export async function fetchAdmin(
  adminId: number,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getAdmin", GetAdminParams, { adminId });
  const response = await generated.getAdmin(
    validParams.adminId,
    undefined,
    signal,
  );
  return parseResponseBody("getAdmin", GetAdminSuccessResponse, response).data;
}

export async function createAdmin(body: CreateAdminBody) {
  const validBody = parseRequest(
    "createAdmin",
    AccountAdminCreateAppAdminRequest,
    body,
  );
  const response = await generated.createAdmin(validBody);
  const { data, message } = parseResponseBody(
    "createAdmin",
    CreateAdminSuccessResponse,
    response,
  );
  return { data, message };
}

export async function updateAdmin(adminId: number, body: UpdateAdminBody) {
  const validParams = parseRequest("updateAdmin", UpdateAdminParams, {
    adminId,
  });
  const validBody = parseRequest(
    "updateAdmin",
    AccountAdminUpdateAppAdminRequest,
    body,
  );
  const response = await generated.updateAdmin(validParams.adminId, validBody);
  const { data, message } = parseResponseBody(
    "updateAdmin",
    UpdateAdminSuccessResponse,
    response,
  );
  return { data, message };
}
