import type { QueryClient } from "@tanstack/react-query";
import { ensureMe, isMaster } from "@/entities/account";

export async function checkMasterAccess(
  queryClient: QueryClient,
): Promise<{ isMaster: boolean }> {
  const me = await ensureMe(queryClient);
  return { isMaster: isMaster(me) };
}
