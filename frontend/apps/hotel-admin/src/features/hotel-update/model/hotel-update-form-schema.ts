import type { z } from "zod";
import { createHotelInfoFormShape } from "@/entities/hotel";
import { updateHotelBodySchema } from "@/shared/api";
import type { Hotel } from "@/shared/api";

export const hotelUpdateFormSchema = updateHotelBodySchema.extend(
  createHotelInfoFormShape(updateHotelBodySchema.shape),
);

type HotelUpdateFormValues = z.input<typeof hotelUpdateFormSchema>;

export function toHotelUpdateFormValues(hotel: Hotel): HotelUpdateFormValues {
  return {
    name: hotel.name,
    address: hotel.address,
    phone: hotel.phone,
    description: hotel.description ?? "",
    version: hotel.version,
  };
}
