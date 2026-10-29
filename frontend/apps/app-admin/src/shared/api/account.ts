import { queryOptions } from "@tanstack/react-query";
import type { z } from "zod";
import { getGetMeQueryKey, getMe, login, logout } from "./generated";
import {
  GetMeResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
} from "./generated/zod";
import { parseRequestBody, parseResponseBody } from "./validate";

export type LoginAccountBody = z.input<typeof LoginBody>;

export function meQueryOptions() {
  return queryOptions({
    queryKey: getGetMeQueryKey(),
    queryFn: async ({ signal }) =>
      parseResponseBody("getMe", GetMeResponse, await getMe(undefined, signal)),
  });
}

export async function loginAccount(body: LoginAccountBody) {
  const validBody = parseRequestBody("login", LoginBody, body);
  return parseResponseBody("login", LoginResponse, await login(validBody));
}

export async function logoutAccount() {
  return parseResponseBody("logout", LogoutResponse, await logout());
}
