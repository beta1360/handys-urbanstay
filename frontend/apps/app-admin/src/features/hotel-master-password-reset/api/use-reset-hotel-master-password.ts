import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshHotelMaster } from "@/entities/hotel-master";
import { resetHotelMasterPassword } from "@/shared/api";
import type { ResetHotelMasterPasswordBody } from "@/shared/api";

export function useResetHotelMasterPassword(hotelId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: ResetHotelMasterPasswordBody) =>
      resetHotelMasterPassword(hotelId, body),
    onSuccess: () => refreshHotelMaster(queryClient, hotelId),
  });

  return { reset: mutate, isPending };
}
