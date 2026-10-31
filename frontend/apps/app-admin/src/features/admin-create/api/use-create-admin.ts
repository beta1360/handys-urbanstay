import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedAdmin } from "@/entities/admin";
import { createAdmin } from "@/shared/api";

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createAdmin,
    onSuccess: ({ data }) => cacheSavedAdmin(queryClient, data),
  });

  return { create: mutate, isPending };
}
