import { fetchMyStays } from "@/shared/api";

const MY_STAYS_PARAMS = { page: 0, size: 100 } as const;

export function getMyStays(cookie: string) {
  return fetchMyStays(MY_STAYS_PARAMS, { cookie });
}
