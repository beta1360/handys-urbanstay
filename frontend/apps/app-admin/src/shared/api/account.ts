import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { getGetMeQueryKey, getMe, login, logout } from "./generated";
import {
  GetMeResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
} from "./generated/zod";
import { AccountAppAdminResponse } from "./generated/zod/schemas";
import { parseRequest, parseResponseBody } from "./validate";

export const loginAccountBodySchema = LoginBody;

export type LoginAccountBody = z.input<typeof LoginBody>;

const ACCOUNT_SUCCESS_SHAPE = {
  success: z.literal(true),
  data: AccountAppAdminResponse,
};

const GetMeSuccessResponse = GetMeResponse.extend(ACCOUNT_SUCCESS_SHAPE);

const LoginSuccessResponse = LoginResponse.extend(ACCOUNT_SUCCESS_SHAPE);

export function meQueryOptions() {
  return queryOptions({
    queryKey: getGetMeQueryKey(),
    queryFn: async ({ signal }) => {
      const response = await getMe(undefined, signal);
      return parseResponseBody("getMe", GetMeSuccessResponse, response).data;
    },
  });
}

export async function loginAccount(body: LoginAccountBody) {
  const validBody = parseRequest("login", LoginBody, body);
  const response = await login(validBody);
  return parseResponseBody("login", LoginSuccessResponse, response).data;
}

export async function logoutAccount(): Promise<void> {
  parseResponseBody("logout", LogoutResponse, await logout());
}
