import type { z } from "zod";
import { createGuestInfoFormShape } from "@/entities/guest";
import { createGuestBodySchema } from "@/shared/api";

export const guestCreateFormSchema = createGuestBodySchema.extend(
  createGuestInfoFormShape(createGuestBodySchema.shape),
);

export type GuestCreateFormValues = z.input<typeof guestCreateFormSchema>;

export const EMPTY_GUEST_CREATE_VALUES: GuestCreateFormValues = {
  name: "",
  phone: "",
  email: "",
};
