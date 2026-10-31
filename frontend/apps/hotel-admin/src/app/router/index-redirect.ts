import { redirect } from "@tanstack/react-router";

export const INDEX_REDIRECT_PATH = "/rooms";

export function redirectFromIndex(): never {
  throw redirect({ to: INDEX_REDIRECT_PATH });
}
