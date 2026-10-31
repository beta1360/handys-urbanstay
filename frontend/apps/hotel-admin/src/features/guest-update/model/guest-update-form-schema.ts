import type { z } from "zod";
import { createGuestInfoFormShape } from "@/entities/guest";
import { updateGuestBodySchema } from "@/shared/api";
import type { Guest } from "@/shared/api";

export const guestUpdateFormSchema = updateGuestBodySchema.extend(
  createGuestInfoFormShape(updateGuestBodySchema.shape),
);

type GuestUpdateFormValues = z.input<typeof guestUpdateFormSchema>;

export function toGuestUpdateFormValues(guest: Guest): GuestUpdateFormValues {
  return {
    name: guest.name,
    phone: guest.phone,
    email: guest.email,
    version: guest.version,
  };
}
