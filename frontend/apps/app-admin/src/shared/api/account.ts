import { z } from "zod";
import { parseRequest, parseResponseBody } from "@repo/admin-kit/api";
import { getGetMeQueryKey, getMe, login, logout } from "./generated";
import {
  GetMeResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
} from "./generated/zod";
import { AccountAppAdminResponse } from "./generated/zod/schemas";

export const loginAccountBodySchema = LoginBody;

export type LoginAccountBody = z.input<typeof LoginBody>;

export type Account = z.output<typeof AccountAppAdminResponse>;

const ACCOUNT_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: AccountAppAdminResponse,
};

const GetMeSuccessResponse = GetMeResponse.extend(ACCOUNT_SUCCESS_SHAPE);

const LoginSuccessResponse = LoginResponse.extend({
  ...ACCOUNT_SUCCESS_SHAPE,
  message: z.string(),
});

const LogoutSuccessResponse = LogoutResponse.extend({ message: z.string() });

type RequestOptions = {
  signal?: AbortSignal;
};

export function meQueryKey() {
  return getGetMeQueryKey();
}

export async function fetchMe({ signal }: RequestOptions = {}) {
  const response = await getMe(undefined, signal);
  return parseResponseBody("getMe", GetMeSuccessResponse, response).data;
}

export async function loginAccount(body: LoginAccountBody) {
  const validBody = parseRequest("login", LoginBody, body);
  const response = await login(validBody);
  const { data, message } = parseResponseBody(
    "login",
    LoginSuccessResponse,
    response,
  );
  return { data, message };
}

export async function logoutAccount() {
  const response = await logout();
  const { message } = parseResponseBody(
    "logout",
    LogoutSuccessResponse,
    response,
  );
  return { message };
}
