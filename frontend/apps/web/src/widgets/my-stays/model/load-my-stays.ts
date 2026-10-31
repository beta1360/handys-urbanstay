import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMyStays, splitMyStays } from "@/entities/stay";
import type { MyStaySections } from "@/entities/stay";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { getKoreanToday } from "@/shared/lib/date";
import { loginHref } from "@/shared/lib/login-redirect";
import { SESSION_COOKIE } from "../config/session-cookie";

export type MyStaysState =
  { status: "empty" } | { status: "ready"; sections: MyStaySections };

async function readSessionCookie() {
  const session = (await cookies()).get(SESSION_COOKIE.name);
  return session === undefined
    ? undefined
    : `${SESSION_COOKIE.name}=${session.value}`;
}

async function getMyStaysOrLogin() {
  try {
    return await getMyStays(await readSessionCookie());
  } catch (error) {
    if (getApiError(error)?.code === API_ERROR_CODES.unauthorized) {
      redirect(loginHref(ROUTES.myStays));
    }
    throw error;
  }
}

export async function loadMyStays(): Promise<MyStaysState> {
  const { items } = await getMyStaysOrLogin();
  return items.length === 0
    ? { status: "empty" }
    : { status: "ready", sections: splitMyStays(items, getKoreanToday()) };
}
