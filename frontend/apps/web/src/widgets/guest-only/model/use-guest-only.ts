import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMember } from "@/entities/member";
import type { MemberState } from "@/entities/member";

export type GuestOnlyStatus = MemberState["status"];

export function useGuestOnly(redirectTo: string): GuestOnlyStatus {
  const { status } = useMember();
  const router = useRouter();

  useEffect(() => {
    if (status === "member") {
      router.replace(redirectTo);
    }
  }, [status, redirectTo, router]);

  return status;
}
