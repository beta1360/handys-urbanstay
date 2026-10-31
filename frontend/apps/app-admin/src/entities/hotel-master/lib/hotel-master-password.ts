import { resetHotelMasterPasswordBodySchema } from "@/shared/api";

const passwordRule = resetHotelMasterPasswordBodySchema.shape.password;

export const HOTEL_MASTER_PASSWORD_LENGTH = {
  min: passwordRule.minLength,
  max: passwordRule.maxLength,
};
