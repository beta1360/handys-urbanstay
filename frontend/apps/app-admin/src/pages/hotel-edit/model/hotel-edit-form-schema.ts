import { createHotelInfoFormShape } from "@/entities/hotel";
import type { HotelInfoValues } from "@/entities/hotel";
import { updateHotelBodySchema } from "@/shared/api";
import type { Hotel } from "@/shared/api";

export const hotelEditFormSchema = updateHotelBodySchema.extend(
  createHotelInfoFormShape(updateHotelBodySchema.shape),
);

export type HotelEditFormState = {
  values: HotelInfoValues;
  version: number;
};

export function toHotelEditFormState(hotel: Hotel): HotelEditFormState {
  return {
    values: {
      name: hotel.name,
      address: hotel.address,
      phone: hotel.phone,
      description: hotel.description ?? "",
    },
    version: hotel.version,
  };
}
