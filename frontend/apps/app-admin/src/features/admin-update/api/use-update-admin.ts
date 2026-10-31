import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshMeIfSelf } from "@/entities/account";
import { cacheSavedAdmin } from "@/entities/admin";
import { updateAdmin } from "@/shared/api";
import type { UpdateAdminBody } from "@/shared/api";

export function useUpdateAdmin(adminId: number) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (body: UpdateAdminBody) => updateAdmin(adminId, body),
    onSuccess: ({ data }) => {
      cacheSavedAdmin(queryClient, data);
      void refreshMeIfSelf(queryClient, data.id);
    },
  });

  return { update: mutate, isPending };
}
