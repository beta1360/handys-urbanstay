import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshReservedPeriods } from "@/entities/stay";
import { API_ERROR_CODES, createStay, getApiError } from "@/shared/api";

function isPeriodOverlappedError(error: unknown) {
  return getApiError(error)?.code === API_ERROR_CODES.stayPeriodOverlapped;
}

export function useReserveStay(roomId: number) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: createStay,
    onSuccess: () => refreshReservedPeriods(queryClient, roomId),
    onError: (error) =>
      isPeriodOverlappedError(error)
        ? refreshReservedPeriods(queryClient, roomId)
        : undefined,
  });

  return { reserve: mutate };
}
