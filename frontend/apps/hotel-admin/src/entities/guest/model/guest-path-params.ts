import { guestParamsSchema } from "@/shared/api";

const GUEST_ID_PATTERN = /^\d+$/;

const GUEST_ID_MIN = 1;

type GuestPathParams = {
  guestId: number | undefined;
};

function toGuestId(value: string) {
  if (!GUEST_ID_PATTERN.test(value)) {
    return undefined;
  }
  const guestId = Number(value);
  return guestId >= GUEST_ID_MIN &&
    guestParamsSchema.safeParse({ guestId }).success
    ? guestId
    : undefined;
}

export function parseGuestPathParams(params: {
  guestId: string;
}): GuestPathParams {
  return { guestId: toGuestId(params.guestId) };
}

export function stringifyGuestPathParams({ guestId }: GuestPathParams) {
  return { guestId: String(guestId) };
}
