import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshRoomStatus } from "@/entities/room";
import { API_ERROR_CODES, getApiError, updateRoomStatus } from "@/shared/api";
import type { UpdateRoomStatusBody } from "@/shared/api";

const STALE_STATUS_ERROR_CODES: readonly string[] = [
  API_ERROR_CODES.roomStatusChanged,
  API_ERROR_CODES.roomStatusTransitionNotAllowed,
];

function isStaleStatusError(error: unknown) {
  const code = getApiError(error)?.code;
  return code !== undefined && STALE_STATUS_ERROR_CODES.includes(code);
}

export function useChangeRoomStatus(roomId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateRoomStatusBody) => updateRoomStatus(roomId, body),
    onSuccess: () => refreshRoomStatus(queryClient, roomId),
    onError: (error) =>
      isStaleStatusError(error)
        ? refreshRoomStatus(queryClient, roomId)
        : undefined,
  });

  return { change: mutate, isPending };
}
