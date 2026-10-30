import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedHotel } from "@/entities/hotel";
import { createHotel } from "@/shared/api";

export function useCreateHotel() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createHotel,
    onSuccess: ({ data }) => cacheSavedHotel(queryClient, data),
  });

  return { create: mutate, isPending };
}
