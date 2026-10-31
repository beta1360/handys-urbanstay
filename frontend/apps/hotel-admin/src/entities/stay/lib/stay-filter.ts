import { stayListParamsSchema } from "@/shared/api";

const ID_PATTERN = /^\d+$/;

const ID_MIN = 1;

const idParamSchema = stayListParamsSchema.shape.roomId.unwrap();

export function normalizeStayFilterId(value: string | number | undefined) {
  const id =
    typeof value === "string" && ID_PATTERN.test(value) ? Number(value) : value;
  return typeof id === "number" &&
    id >= ID_MIN &&
    idParamSchema.safeParse(id).success
    ? id
    : undefined;
}

export function normalizeStayCanceled(value: string | boolean | undefined) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === String(true)) {
    return true;
  }
  return value === String(false) ? false : undefined;
}
