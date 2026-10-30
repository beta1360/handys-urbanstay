import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedHotel } from "@/entities/hotel";
import { updateHotel } from "@/shared/api";
import type { UpdateHotelBody } from "@/shared/api";

export function useUpdateHotel(hotelId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateHotelBody) => updateHotel(hotelId, body),
    onSuccess: (hotel) => cacheSavedHotel(queryClient, hotel),
  });

  return { update: mutate, isPending };
}
