import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedRoom } from "@/entities/room";
import { createRoom } from "@/shared/api";

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createRoom,
    onSuccess: ({ data }) => cacheSavedRoom(queryClient, data),
  });

  return { create: mutate, isPending };
}
