import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedOperator } from "@/entities/operator";
import { createOperator } from "@/shared/api";

export function useCreateOperator() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: createOperator,
    onSuccess: ({ data }) => cacheSavedOperator(queryClient, data),
  });

  return { create: mutate, isPending };
}
