import { z } from "zod";

export const LOGIN_PATH = "/login";

export const DEFAULT_LOGIN_REDIRECT = "/";

const PROTOCOL_RELATIVE_PATH_PATTERN = /^\/[\t\n\r]*[\\/]/;

function isLoginPath(path: string) {
  const [pathname] = path.split(/[?#]/, 1);
  return pathname.replace(/\/$/, "") === LOGIN_PATH;
}

export function sanitizeLoginRedirect(value: string | undefined): string {
  if (
    value === undefined ||
    !value.startsWith("/") ||
    PROTOCOL_RELATIVE_PATH_PATTERN.test(value) ||
    isLoginPath(value)
  ) {
    return DEFAULT_LOGIN_REDIRECT;
  }
  return value;
}

export const loginSearchSchema = z.object({
  redirect: z
    .string()
    .optional()
    .catch(undefined)
    .transform(sanitizeLoginRedirect),
});
