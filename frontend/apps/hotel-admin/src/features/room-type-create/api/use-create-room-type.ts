import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedRoomType } from "@/entities/room-type";
import { createRoomType } from "@/shared/api";

export function useCreateRoomType() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createRoomType,
    onSuccess: ({ data }) => cacheSavedRoomType(queryClient, data),
  });

  return { create: mutate, isPending };
}
