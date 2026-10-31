import type { z } from "zod";
import { passwordSchema } from "@repo/admin-kit/form";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { createHotelInfoFormShape, HOTEL_INFO_FIELDS } from "@/entities/hotel";
import type { HotelInfoField } from "@/entities/hotel";
import { createHotelMasterInfoFormShape } from "@/entities/hotel-master";
import { createHotelBodySchema } from "@/shared/api";

const masterRules = createHotelBodySchema.shape.master;

const passwordRule = masterRules.shape.password;

export const MASTER_PASSWORD_LENGTH = {
  min: passwordRule.minLength,
  max: passwordRule.maxLength,
};

export const hotelCreateFormSchema = createHotelBodySchema.extend({
  ...createHotelInfoFormShape(createHotelBodySchema.shape),
  master: masterRules.extend({
    ...createHotelMasterInfoFormShape(masterRules.shape),
    password: passwordSchema(
      passwordRule,
      FORM_VALIDATION_MESSAGES.passwordRule(
        MASTER_PASSWORD_LENGTH.min,
        MASTER_PASSWORD_LENGTH.max,
      ),
    ),
  }),
});

export type HotelCreateFormValues = z.input<typeof hotelCreateFormSchema>;

export type MasterField = keyof HotelCreateFormValues["master"];

export type HotelCreateField = HotelInfoField | `master.${MasterField}`;

export const HOTEL_CREATE_FIELDS = [
  ...HOTEL_INFO_FIELDS,
  "master.loginId",
  "master.name",
  "master.password",
] as const satisfies readonly HotelCreateField[];

export const EMPTY_HOTEL_CREATE_VALUES: HotelCreateFormValues = {
  name: "",
  address: "",
  phone: "",
  description: "",
  master: { loginId: "", name: "", password: "" },
};
