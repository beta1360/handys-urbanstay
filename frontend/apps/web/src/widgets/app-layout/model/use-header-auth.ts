import { useMember } from "@/entities/member";
import { useCurrentHref } from "@/shared/lib/current-href";
import { loginHref, signupHref } from "@/shared/lib/login-redirect";

export type HeaderAuthState =
  | { status: "checking" }
  | { status: "guest"; loginHref: string; signupHref: string }
  | { status: "member"; name: string };

export function useHeaderAuth(): HeaderAuthState {
  const member = useMember();
  const currentHref = useCurrentHref();

  if (member.status === "member") {
    return { status: "member", name: member.member.name };
  }
  if (member.status === "guest") {
    return {
      status: "guest",
      loginHref: loginHref(currentHref),
      signupHref: signupHref(currentHref),
    };
  }
  return { status: "checking" };
}
