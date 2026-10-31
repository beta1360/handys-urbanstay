import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMyStayPage, MY_STAY_FIRST_PAGE } from "@/entities/stay";
import type { MyStayPage, MyStayPageParam } from "@/entities/stay";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { loginHref } from "@/shared/lib/login-redirect";
import { SESSION_COOKIE } from "../config/session-cookie";

export type MyStaysState =
  | { status: "empty" }
  | { status: "ready"; initialPages: MyStayPage[] };

async function readSessionCookie() {
  const session = (await cookies()).get(SESSION_COOKIE.name);
  return session === undefined
    ? undefined
    : `${SESSION_COOKIE.name}=${session.value}`;
}

async function getMyStayPageOrLogin(
  param: MyStayPageParam,
  cookie: string | undefined,
) {
  try {
    return await getMyStayPage(param, { cookie });
  } catch (error) {
    if (getApiError(error)?.code === API_ERROR_CODES.unauthorized) {
      redirect(loginHref(ROUTES.myStays));
    }
    throw error;
  }
}

export async function loadMyStays(): Promise<MyStaysState> {
  const cookie = await readSessionCookie();
  const upcoming = await getMyStayPageOrLogin(
    MY_STAY_FIRST_PAGE.upcoming,
    cookie,
  );
  if (upcoming.items.length > 0) {
    return { status: "ready", initialPages: [upcoming] };
  }
  const past = await getMyStayPageOrLogin(MY_STAY_FIRST_PAGE.past, cookie);
  return past.items.length === 0
    ? { status: "empty" }
    : { status: "ready", initialPages: [upcoming, past] };
}
