import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedRoomType } from "@/entities/room-type";
import { updateRoomType } from "@/shared/api";
import type { UpdateRoomTypeBody } from "@/shared/api";

export function useUpdateRoomType(roomTypeId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateRoomTypeBody) => updateRoomType(roomTypeId, body),
    onSuccess: ({ data }) => cacheSavedRoomType(queryClient, data),
  });

  return { update: mutate, isPending };
}
