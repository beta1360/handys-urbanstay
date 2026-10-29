import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type { ParsedLocation } from "@tanstack/react-router";
import { API_ERROR_CODES, getApiError, meQueryOptions } from "@/shared/api";
import { LOGIN_PATH } from "./login-redirect";

function loadMe(queryClient: QueryClient) {
  return queryClient.query({
    ...meQueryOptions(),
    staleTime: "static",
    retry: false,
  });
}

export async function ensureLoggedIn(
  queryClient: QueryClient,
  location: Pick<ParsedLocation, "href">,
): Promise<void> {
  try {
    await loadMe(queryClient);
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
    await loadMe(queryClient);
  } catch {
    return;
  }
  throw redirect({ href: redirectTo });
}
