import { ROUTES } from "@/shared/config";

export const LOGIN_REDIRECT_PARAM = "redirect";

const AUTH_PATHS: readonly string[] = [ROUTES.login, ROUTES.signup];

const PARSE_BASE_URL = "http://login-redirect.invalid";

const PARSE_BASE_ORIGIN = new URL(PARSE_BASE_URL).origin;

const UNSAFE_CHARACTER_PATTERN = /[\\\u0000-\u001f\u007f]/;

function isAuthPath(pathname: string) {
  return AUTH_PATHS.includes(pathname.replace(/\/$/, ""));
}

export function sanitizeLoginRedirect(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    UNSAFE_CHARACTER_PATTERN.test(value)
  ) {
    return ROUTES.hotels;
  }
  const url = new URL(value, PARSE_BASE_URL);
  if (
    url.origin !== PARSE_BASE_ORIGIN ||
    url.pathname.startsWith("//") ||
    isAuthPath(url.pathname)
  ) {
    return ROUTES.hotels;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function loginReturnTo(currentHref: string) {
  const { pathname, searchParams } = new URL(currentHref, PARSE_BASE_URL);
  return isAuthPath(pathname)
    ? sanitizeLoginRedirect(searchParams.get(LOGIN_REDIRECT_PARAM))
    : currentHref;
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
