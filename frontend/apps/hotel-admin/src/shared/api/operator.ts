import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import * as generated from "./generated";
import {
  CreateHotelOperatorResponse,
  GetHotelOperatorParams,
  GetHotelOperatorResponse,
  GetHotelOperatorsQueryParams,
  GetHotelOperatorsResponse,
  ResetHotelOperatorPasswordParams,
  ResetHotelOperatorPasswordResponse,
  UpdateHotelOperatorActiveParams,
  UpdateHotelOperatorActiveResponse,
  UpdateHotelOperatorParams,
  UpdateHotelOperatorResponse,
} from "./generated/zod";
import {
  AccountHotelOperatorActiveUpdateHotelAdminRequest,
  AccountHotelOperatorCreateHotelAdminRequest,
  AccountHotelOperatorHotelAdminResponse,
  AccountHotelOperatorPasswordResetHotelAdminRequest,
  AccountHotelOperatorUpdateHotelAdminRequest,
  PageResponseAccountHotelOperatorHotelAdminResponse,
} from "./generated/zod/schemas";

export const createOperatorBodySchema =
  AccountHotelOperatorCreateHotelAdminRequest;

export const updateOperatorBodySchema =
  AccountHotelOperatorUpdateHotelAdminRequest;

export const resetOperatorPasswordBodySchema =
  AccountHotelOperatorPasswordResetHotelAdminRequest;

export const operatorListParamsSchema = GetHotelOperatorsQueryParams;

export const operatorParamsSchema = GetHotelOperatorParams;

export type CreateOperatorBody = z.input<
  typeof AccountHotelOperatorCreateHotelAdminRequest
>;

export type UpdateOperatorBody = z.input<
  typeof AccountHotelOperatorUpdateHotelAdminRequest
>;

export type ResetOperatorPasswordBody = z.input<
  typeof AccountHotelOperatorPasswordResetHotelAdminRequest
>;

export type UpdateOperatorActiveBody = z.input<
  typeof AccountHotelOperatorActiveUpdateHotelAdminRequest
>;

export type Operator = z.output<typeof AccountHotelOperatorHotelAdminResponse>;

export type OperatorPage = z.output<
  typeof PageResponseAccountHotelOperatorHotelAdminResponse
>;

export type OperatorListParams = z.input<typeof GetHotelOperatorsQueryParams>;

const OPERATOR_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: AccountHotelOperatorHotelAdminResponse,
};

const OPERATOR_CHANGE_SUCCESS_SHAPE = {
  ...OPERATOR_SUCCESS_SHAPE,
  message: z.string(),
};

const GetOperatorsSuccessResponse = GetHotelOperatorsResponse.extend({
  success: z.literal(true),
  data: PageResponseAccountHotelOperatorHotelAdminResponse,
});

const GetOperatorSuccessResponse = GetHotelOperatorResponse.extend(
  OPERATOR_SUCCESS_SHAPE,
);

const CreateOperatorSuccessResponse = CreateHotelOperatorResponse.extend(
  OPERATOR_CHANGE_SUCCESS_SHAPE,
);

const UpdateOperatorSuccessResponse = UpdateHotelOperatorResponse.extend(
  OPERATOR_CHANGE_SUCCESS_SHAPE,
);

const UpdateOperatorActiveSuccessResponse =
  UpdateHotelOperatorActiveResponse.extend(OPERATOR_CHANGE_SUCCESS_SHAPE);

const ResetOperatorPasswordSuccessResponse =
  ResetHotelOperatorPasswordResponse.extend({
    success: z.literal(true),
    message: z.string(),
  });

type RequestOptions = {
  signal?: AbortSignal;
};

export function operatorListQueryKey(params?: OperatorListParams) {
  return generated.getGetHotelOperatorsQueryKey(params);
}

export function operatorQueryKey(operatorId: number) {
  return generated.getGetHotelOperatorQueryKey(operatorId);
}

export async function fetchOperators(
  params: OperatorListParams,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest(
    "getHotelOperators",
    GetHotelOperatorsQueryParams,
    params,
  );
  const response = await generated.getHotelOperators(
    validParams,
    undefined,
    signal,
  );
  return parseResponseBody(
    "getHotelOperators",
    GetOperatorsSuccessResponse,
    response,
  ).data;
}

export async function fetchOperator(
  operatorId: number,
  { signal }: RequestOptions = {},
) {
  const validParams = parseRequest("getHotelOperator", GetHotelOperatorParams, {
    operatorId,
  });
  const response = await generated.getHotelOperator(
    validParams.operatorId,
    undefined,
    signal,
  );
  return parseResponseBody(
    "getHotelOperator",
    GetOperatorSuccessResponse,
    response,
  ).data;
}

export async function createOperator(body: CreateOperatorBody) {
  const validBody = parseRequest(
    "createHotelOperator",
    AccountHotelOperatorCreateHotelAdminRequest,
    body,
  );
  const response = await generated.createHotelOperator(validBody);
  const { data, message } = parseResponseBody(
    "createHotelOperator",
    CreateOperatorSuccessResponse,
    response,
  );
  return { data, message };
}

export async function updateOperator(
  operatorId: number,
  body: UpdateOperatorBody,
) {
  const validParams = parseRequest(
    "updateHotelOperator",
    UpdateHotelOperatorParams,
    { operatorId },
  );
  const validBody = parseRequest(
    "updateHotelOperator",
    AccountHotelOperatorUpdateHotelAdminRequest,
    body,
  );
  const response = await generated.updateHotelOperator(
    validParams.operatorId,
    validBody,
  );
  const { data, message } = parseResponseBody(
    "updateHotelOperator",
    UpdateOperatorSuccessResponse,
    response,
  );
  return { data, message };
}

export async function resetOperatorPassword(
  operatorId: number,
  body: ResetOperatorPasswordBody,
) {
  const validParams = parseRequest(
    "resetHotelOperatorPassword",
    ResetHotelOperatorPasswordParams,
    { operatorId },
  );
  const validBody = parseRequest(
    "resetHotelOperatorPassword",
    AccountHotelOperatorPasswordResetHotelAdminRequest,
    body,
  );
  const response = await generated.resetHotelOperatorPassword(
    validParams.operatorId,
    validBody,
  );
  const { message } = parseResponseBody(
    "resetHotelOperatorPassword",
    ResetOperatorPasswordSuccessResponse,
    response,
  );
  return { message };
}

export async function updateOperatorActive(
  operatorId: number,
  body: UpdateOperatorActiveBody,
) {
  const validParams = parseRequest(
    "updateHotelOperatorActive",
    UpdateHotelOperatorActiveParams,
    { operatorId },
  );
  const validBody = parseRequest(
    "updateHotelOperatorActive",
    AccountHotelOperatorActiveUpdateHotelAdminRequest,
    body,
  );
  const response = await generated.updateHotelOperatorActive(
    validParams.operatorId,
    validBody,
  );
  const { data, message } = parseResponseBody(
    "updateHotelOperatorActive",
    UpdateOperatorActiveSuccessResponse,
    response,
  );
  return { data, message };
}
