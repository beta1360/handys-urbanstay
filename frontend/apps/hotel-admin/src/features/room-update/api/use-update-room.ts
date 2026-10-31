import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedRoom } from "@/entities/room";
import { updateRoom } from "@/shared/api";
import type { UpdateRoomBody } from "@/shared/api";

export function useUpdateRoom(roomId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateRoomBody) => updateRoom(roomId, body),
    onSuccess: ({ data }) => cacheSavedRoom(queryClient, data),
  });

  return { update: mutate, isPending };
}
