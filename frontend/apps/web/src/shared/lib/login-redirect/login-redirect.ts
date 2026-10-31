import { ROUTES } from "@/shared/config";

export const LOGIN_REDIRECT_PARAM = "redirect";

const AUTH_PATHS: readonly string[] = [ROUTES.login, ROUTES.signup];

const PROTOCOL_RELATIVE_PATH_PATTERN = /^\/[\t\n\r]*[\\/]/;

function isAuthPath(path: string) {
  const [pathname] = path.split(/[?#]/, 1);
  return AUTH_PATHS.includes(pathname.replace(/\/$/, ""));
}

export function sanitizeLoginRedirect(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    PROTOCOL_RELATIVE_PATH_PATTERN.test(value) ||
    isAuthPath(value)
  ) {
    return ROUTES.hotels;
  }
  return value;
}

function withRedirect(path: string, redirectTo: string) {
  const search = new URLSearchParams({ [LOGIN_REDIRECT_PARAM]: redirectTo });
  return `${path}?${search.toString()}`;
}

export function loginHref(redirectTo: string) {
  return withRedirect(ROUTES.login, redirectTo);
}

export function signupHref(redirectTo: string) {
  return withRedirect(ROUTES.signup, redirectTo);
}
