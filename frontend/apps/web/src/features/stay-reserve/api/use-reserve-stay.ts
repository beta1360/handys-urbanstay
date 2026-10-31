import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endMemberSession } from "@/entities/member";
import { refreshRoomTypes } from "@/entities/room-type";
import { API_ERROR_CODES, createStay, getApiError } from "@/shared/api";

const STALE_ROOM_TYPES_ERROR_CODES: readonly string[] = [
  API_ERROR_CODES.roomTypeUnavailable,
  API_ERROR_CODES.roomTypeNotFound,
  API_ERROR_CODES.stayPeriodOverlapped,
];

function isStaleRoomTypesError(error: unknown) {
  const code = getApiError(error)?.code;
  return code !== undefined && STALE_ROOM_TYPES_ERROR_CODES.includes(code);
}

function isEndedSessionError(error: unknown) {
  return getApiError(error)?.code === API_ERROR_CODES.unauthorized;
}

export function useReserveStay(hotelId: number) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: createStay,
    onSuccess: () => {
      void refreshRoomTypes(queryClient, hotelId);
    },
    onError: (error) => {
      if (isEndedSessionError(error)) {
        endMemberSession(queryClient);
        return undefined;
      }
      return isStaleRoomTypesError(error)
        ? refreshRoomTypes(queryClient, hotelId)
        : undefined;
    },
  });

  return { reserve: mutate };
}
