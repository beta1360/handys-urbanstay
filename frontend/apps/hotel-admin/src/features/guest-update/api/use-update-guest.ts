import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedGuest } from "@/entities/guest";
import { updateGuest } from "@/shared/api";
import type { UpdateGuestBody } from "@/shared/api";

export function useUpdateGuest(guestId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateGuestBody) => updateGuest(guestId, body),
    onSuccess: ({ data }) => cacheSavedGuest(queryClient, data),
  });

  return { update: mutate, isPending };
}
