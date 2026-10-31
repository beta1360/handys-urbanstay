import { z } from "zod";
import * as generated from "./generated";
import {
  GetMeResponse,
  LoginResponse,
  LogoutResponse,
  SignupResponse,
} from "./generated/zod";
import {
  MemberAppResponse,
  MemberLoginAppRequest,
  MemberSignupAppRequest,
} from "./generated/zod/schemas";
import { parseRequest, parseResponse } from "./validate";

export const signupBodySchema = MemberSignupAppRequest;

export const loginBodySchema = MemberLoginAppRequest;

export type Member = z.output<typeof MemberAppResponse>;

export type SignupBody = z.input<typeof MemberSignupAppRequest>;

export type LoginBody = z.input<typeof MemberLoginAppRequest>;

const SignupSuccessResponse = SignupResponse.extend({
  success: z.literal(true),
  data: MemberAppResponse,
  message: z.string(),
});

const LoginSuccessResponse = LoginResponse.extend({
  success: z.literal(true),
  data: MemberAppResponse,
  message: z.string(),
});

const LogoutSuccessResponse = LogoutResponse.extend({
  success: z.literal(true),
  message: z.string(),
});

const GetMeSuccessResponse = GetMeResponse.extend({
  success: z.literal(true),
  data: MemberAppResponse,
});

type RequestOptions = {
  signal?: AbortSignal;
};

export function memberQueryKey() {
  return generated.getGetMeQueryKey();
}

export async function signupMember(body: SignupBody) {
  const validBody = parseRequest("signup", MemberSignupAppRequest, body);
  const response = await generated.signup(validBody);
  const { data, message } = parseResponse(
    "signup",
    SignupSuccessResponse,
    response,
  );
  return { data, message };
}

export async function loginMember(body: LoginBody) {
  const validBody = parseRequest("login", MemberLoginAppRequest, body);
  const response = await generated.login(validBody);
  const { data, message } = parseResponse(
    "login",
    LoginSuccessResponse,
    response,
  );
  return { data, message };
}

export async function logoutMember() {
  const response = await generated.logout();
  const { message } = parseResponse("logout", LogoutSuccessResponse, response);
  return { message };
}

export async function fetchMe({ signal }: RequestOptions = {}) {
  const response = await generated.getMe({ signal });
  return parseResponse("getMe", GetMeSuccessResponse, response).data;
}
