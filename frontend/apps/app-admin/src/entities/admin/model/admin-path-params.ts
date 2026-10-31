import { adminParamsSchema } from "@/shared/api";

const ADMIN_ID_PATTERN = /^\d+$/;

const ADMIN_ID_MIN = 1;

type AdminPathParams = {
  adminId: number | undefined;
};

function toAdminId(value: string) {
  if (!ADMIN_ID_PATTERN.test(value)) {
    return undefined;
  }
  const adminId = Number(value);
  return adminId >= ADMIN_ID_MIN &&
    adminParamsSchema.safeParse({ adminId }).success
    ? adminId
    : undefined;
}

export function parseAdminPathParams(params: {
  adminId: string;
}): AdminPathParams {
  return { adminId: toAdminId(params.adminId) };
}

export function stringifyAdminPathParams({ adminId }: AdminPathParams) {
  return { adminId: String(adminId) };
}
