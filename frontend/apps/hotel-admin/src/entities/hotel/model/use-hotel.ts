import type { Hotel } from "@/shared/api";
import { useHotelQuery } from "../api/hotel-query";

export type HotelState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "ready"; hotel: Hotel };

export function useHotel(): HotelState {
  const { data, error, refetch } = useHotelQuery();

  if (data !== undefined) {
    return { status: "ready", hotel: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  return { status: "failed", retry: () => void refetch() };
}
