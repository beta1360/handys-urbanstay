import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Hotel } from "@/shared/api";
import { useHotelQuery } from "../api/hotel-query";

export type HotelState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "notFound" }
  | { status: "ready"; hotel: Hotel };

export function useHotel(hotelId: number): HotelState {
  const { data, error, refetch } = useHotelQuery(hotelId);

  if (data !== undefined) {
    return { status: "ready", hotel: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  if (getApiError(error)?.code === API_ERROR_CODES.hotelNotFound) {
    return { status: "notFound" };
  }
  return { status: "failed", retry: () => void refetch() };
}
