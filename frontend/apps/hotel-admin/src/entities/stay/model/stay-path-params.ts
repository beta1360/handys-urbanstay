import { stayParamsSchema } from "@/shared/api";

const STAY_ID_PATTERN = /^\d+$/;

const STAY_ID_MIN = 1;

type StayPathParams = {
  stayId: number | undefined;
};

function toStayId(value: string) {
  if (!STAY_ID_PATTERN.test(value)) {
    return undefined;
  }
  const stayId = Number(value);
  return stayId >= STAY_ID_MIN && stayParamsSchema.safeParse({ stayId }).success
    ? stayId
    : undefined;
}

export function parseStayPathParams(params: {
  stayId: string;
}): StayPathParams {
  return { stayId: toStayId(params.stayId) };
}

export function stringifyStayPathParams({ stayId }: StayPathParams) {
  return { stayId: String(stayId) };
}
