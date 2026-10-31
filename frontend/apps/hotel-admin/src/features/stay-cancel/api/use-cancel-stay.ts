import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { refreshRoomStatus } from "@/entities/room";
import { refreshStay } from "@/entities/stay";
import { API_ERROR_CODES, cancelStay, getApiError } from "@/shared/api";
import type { CancelStayBody, Stay } from "@/shared/api";

const STALE_STAY_ERROR_CODES: readonly string[] = [
  API_ERROR_CODES.stayAlreadyCanceled,
  API_ERROR_CODES.stayAlreadyEnded,
];

function isStaleStayError(error: unknown) {
  const code = getApiError(error)?.code;
  return code !== undefined && STALE_STAY_ERROR_CODES.includes(code);
}

function refreshCanceledStay(queryClient: QueryClient, stay: Stay) {
  return Promise.all([
    refreshStay(queryClient, stay.id),
    refreshRoomStatus(queryClient, stay.room.id),
  ]);
}

export function useCancelStay(stay: Stay) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (body: CancelStayBody) => cancelStay(stay.id, body),
    onSuccess: () => refreshCanceledStay(queryClient, stay),
    onError: (error) =>
      isStaleStayError(error)
        ? refreshCanceledStay(queryClient, stay)
        : undefined,
  });

  return { cancel: mutate };
}
