import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMyStays, splitMyStays } from "@/entities/stay";
import type { MyStaySections } from "@/entities/stay";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { getKoreanToday } from "@/shared/lib/date";
import { loginHref } from "@/shared/lib/login-redirect";

export type MyStaysState =
  { status: "empty" } | { status: "ready"; sections: MyStaySections };

async function getMyStaysOrLogin() {
  const cookie = (await cookies()).toString();
  try {
    return await getMyStays(cookie);
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
