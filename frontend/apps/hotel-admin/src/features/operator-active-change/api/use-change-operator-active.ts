import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshOperator } from "@/entities/operator";
import { updateOperatorActive } from "@/shared/api";
import type { UpdateOperatorActiveBody } from "@/shared/api";

export function useChangeOperatorActive(operatorId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateOperatorActiveBody) =>
      updateOperatorActive(operatorId, body),
    onSuccess: () => refreshOperator(queryClient, operatorId),
  });

  return { change: mutate, isPending };
}
