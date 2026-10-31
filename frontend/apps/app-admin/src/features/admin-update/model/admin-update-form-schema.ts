import type { z } from "zod";
import { createAdminInfoFormShape } from "@/entities/admin";
import { updateAdminBodySchema } from "@/shared/api";
import type { Admin } from "@/shared/api";

export const adminUpdateFormSchema = updateAdminBodySchema.extend(
  createAdminInfoFormShape(updateAdminBodySchema.shape),
);

type AdminUpdateFormValues = z.input<typeof adminUpdateFormSchema>;

export function toAdminUpdateFormValues(admin: Admin): AdminUpdateFormValues {
  return {
    name: admin.name,
    version: admin.version,
  };
}
