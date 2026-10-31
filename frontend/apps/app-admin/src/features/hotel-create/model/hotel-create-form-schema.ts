import type { z } from "zod";
import { createHotelInfoFormShape, HOTEL_INFO_FIELDS } from "@/entities/hotel";
import type { HotelInfoField } from "@/entities/hotel";
import {
  createHotelMasterInfoFormShape,
  createHotelMasterPasswordSchema,
} from "@/entities/hotel-master";
import { createHotelBodySchema } from "@/shared/api";

const masterRules = createHotelBodySchema.shape.master;

export const hotelCreateFormSchema = createHotelBodySchema.extend({
  ...createHotelInfoFormShape(createHotelBodySchema.shape),
  master: masterRules.extend({
    ...createHotelMasterInfoFormShape(masterRules.shape),
    password: createHotelMasterPasswordSchema(masterRules.shape.password),
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
