import type { z } from "zod";
import { createHotelMasterInfoFormShape } from "@/entities/hotel-master";
import { updateHotelMasterBodySchema } from "@/shared/api";
import type { HotelMaster } from "@/shared/api";

export const hotelMasterUpdateFormSchema = updateHotelMasterBodySchema.extend(
  createHotelMasterInfoFormShape(updateHotelMasterBodySchema.shape),
);

type HotelMasterUpdateFormValues = z.input<typeof hotelMasterUpdateFormSchema>;

export function toHotelMasterUpdateFormValues(
  master: HotelMaster,
): HotelMasterUpdateFormValues {
  return {
    loginId: master.loginId,
    name: master.name,
    version: master.version,
  };
}
