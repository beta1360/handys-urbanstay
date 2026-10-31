import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateMe } from "@/entities/account";
import { cacheSavedHotel } from "@/entities/hotel";
import { updateHotel } from "@/shared/api";
import type { UpdateHotelBody } from "@/shared/api";

export function useUpdateHotel() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateHotelBody) => updateHotel(body),
    onSuccess: ({ data }) => {
      cacheSavedHotel(queryClient, data);
      void invalidateMe(queryClient);
    },
  });

  return { update: mutate, isPending };
}
