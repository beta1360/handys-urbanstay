import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type { ParsedLocation } from "@tanstack/react-router";
import { ensureMe } from "@/entities/account";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { LOGIN_PATH } from "./login-redirect";

export async function ensureLoggedIn(
  queryClient: QueryClient,
  location: Pick<ParsedLocation, "href">,
): Promise<void> {
  try {
    await ensureMe(queryClient);
  } catch (error) {
    if (getApiError(error)?.code === API_ERROR_CODES.unauthorized) {
      throw redirect({ to: LOGIN_PATH, search: { redirect: location.href } });
    }
    throw error;
  }
}

export async function redirectIfLoggedIn(
  queryClient: QueryClient,
  redirectTo: string,
): Promise<void> {
  try {
    await ensureMe(queryClient);
  } catch {
    return;
  }
  throw redirect({ href: redirectTo });
}
