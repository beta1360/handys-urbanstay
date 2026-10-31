import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateRooms } from "@/entities/room";
import { cacheSavedRoomType } from "@/entities/room-type";
import { updateRoomType } from "@/shared/api";
import type { UpdateRoomTypeBody } from "@/shared/api";

export function useUpdateRoomType(roomTypeId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateRoomTypeBody) => updateRoomType(roomTypeId, body),
    onSuccess: ({ data }) => {
      cacheSavedRoomType(queryClient, data);
      void invalidateRooms(queryClient);
    },
  });

  return { update: mutate, isPending };
}
