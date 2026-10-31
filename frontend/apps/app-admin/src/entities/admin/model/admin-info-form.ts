import type { z } from "zod";
import { requiredTextSchema } from "@repo/admin-kit/form";

export const ADMIN_INFO_FIELDS = ["name"] as const;

export type AdminInfoField = (typeof ADMIN_INFO_FIELDS)[number];

export function createAdminInfoFormShape(
  rules: Record<AdminInfoField, z.ZodType>,
) {
  return {
    name: requiredTextSchema(rules.name),
  };
}
