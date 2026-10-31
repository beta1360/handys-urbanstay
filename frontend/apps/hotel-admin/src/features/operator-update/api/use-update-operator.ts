import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cacheSavedOperator } from "@/entities/operator";
import { updateOperator } from "@/shared/api";
import type { UpdateOperatorBody } from "@/shared/api";

export function useUpdateOperator(operatorId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateOperatorBody) => updateOperator(operatorId, body),
    onSuccess: ({ data }) => cacheSavedOperator(queryClient, data),
  });

  return { update: mutate, isPending };
}
