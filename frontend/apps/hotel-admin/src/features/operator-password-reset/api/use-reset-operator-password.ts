import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshOperator } from "@/entities/operator";
import { resetOperatorPassword } from "@/shared/api";
import type { ResetOperatorPasswordBody } from "@/shared/api";

export function useResetOperatorPassword(operatorId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: ResetOperatorPasswordBody) =>
      resetOperatorPassword(operatorId, body),
    onSuccess: () => refreshOperator(queryClient, operatorId),
  });

  return { reset: mutate, isPending };
}
