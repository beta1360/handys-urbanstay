import { FORM_ALERT_MESSAGES } from "@repo/admin-kit/config";
import { useFormErrorToast } from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import { ROOM_STATUS_TRANSITIONS } from "@/entities/room";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Room, RoomStatus } from "@/shared/api";
import { useChangeRoomStatus } from "../api/use-change-room-status";

export type RoomStatusChangeStatus = "idle" | "changing";

export function useRoomStatusChange(room: Room) {
  const { change, isPending } = useChangeRoomStatus(room.id);
  const errorToast = useFormErrorToast();
  const status: RoomStatusChangeStatus = isPending ? "changing" : "idle";

  function changeTo(to: RoomStatus) {
    if (status === "changing") {
      return;
    }
    errorToast.dismiss();
    change(
      { from: room.status, to },
      {
        onSuccess: ({ message }) => {
          showToast({ type: "success", message });
        },
        onError: (error) => {
          const apiError = getApiError(error);
          if (apiError?.code === API_ERROR_CODES.unauthorized) {
            return;
          }
          errorToast.show(
            apiError?.message ?? FORM_ALERT_MESSAGES.requestFailed,
          );
        },
      },
    );
  }

  return {
    status,
    nextStatuses: ROOM_STATUS_TRANSITIONS[room.status],
    change: changeTo,
  };
}
