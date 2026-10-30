import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedHotel } from "@/entities/hotel";
import { createHotel } from "@/shared/api";

export function useCreateHotel() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createHotel,
    onSuccess: (hotel) => cacheSavedHotel(queryClient, hotel),
  });

  return { create: mutate, isPending };
}
