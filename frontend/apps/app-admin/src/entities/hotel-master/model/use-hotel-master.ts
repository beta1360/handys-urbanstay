import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { HotelMaster } from "@/shared/api";
import { useHotelMasterQuery } from "../api/hotel-master-query";

export type HotelMasterState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "notFound" }
  | { status: "ready"; master: HotelMaster };

export function useHotelMaster(hotelId: number): HotelMasterState {
  const { data, error, refetch } = useHotelMasterQuery(hotelId);

  if (data !== undefined) {
    return { status: "ready", master: data };
  }
  if (error === null) {
    return { status: "loading" };
  }
  if (getApiError(error)?.code === API_ERROR_CODES.hotelNotFound) {
    return { status: "notFound" };
  }
  return { status: "failed", retry: () => void refetch() };
}
