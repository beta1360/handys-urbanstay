import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedHotelMaster } from "@/entities/hotel-master";
import { updateHotelMaster } from "@/shared/api";
import type { UpdateHotelMasterBody } from "@/shared/api";

export function useUpdateHotelMaster(hotelId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateHotelMasterBody) =>
      updateHotelMaster(hotelId, body),
    onSuccess: ({ data }) => cacheSavedHotelMaster(queryClient, hotelId, data),
  });

  return { update: mutate, isPending };
}
