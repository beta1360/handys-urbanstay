import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedGuest } from "@/entities/guest";
import { createGuest } from "@/shared/api";

export function useCreateGuest() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createGuest,
    onSuccess: ({ data }) => cacheSavedGuest(queryClient, data),
  });

  return { create: mutate, isPending };
}
