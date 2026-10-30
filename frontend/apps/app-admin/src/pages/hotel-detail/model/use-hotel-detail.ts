import { useQuery } from "@tanstack/react-query";
import { API_ERROR_CODES, getApiError, hotelQueryOptions } from "@/shared/api";

export function useHotelDetail(hotelId: number) {
  const { data, error, refetch } = useQuery(hotelQueryOptions(hotelId));

  return {
    hotel: data,
    isNotFound: getApiError(error)?.code === API_ERROR_CODES.hotelNotFound,
    isLoadFailed: error !== null,
    retry: () => void refetch(),
  };
}
