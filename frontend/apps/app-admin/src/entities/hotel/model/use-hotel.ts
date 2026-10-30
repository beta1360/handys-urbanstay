import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { useHotelQuery } from "../api/hotel-query";

export function useHotel(hotelId: number) {
  const { data, error, refetch } = useHotelQuery(hotelId);

  return {
    hotel: data,
    isNotFound: getApiError(error)?.code === API_ERROR_CODES.hotelNotFound,
    isLoadFailed: error !== null,
    retry: () => void refetch(),
  };
}
