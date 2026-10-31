import Link from "next/link";
import { COMMON_MESSAGES } from "@/shared/config";

type HeaderGuestLinksProps = {
  loginHref: string;
  signupHref: string;
};

const HEADER_LINK_CLASS_NAME =
  "text-sm text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900";

export function HeaderGuestLinks({
  loginHref,
  signupHref,
}: HeaderGuestLinksProps) {
  return (
    <nav className="flex items-center gap-3">
      <Link href={loginHref} className={HEADER_LINK_CLASS_NAME}>
        {COMMON_MESSAGES.login}
      </Link>
      <Link href={signupHref} className={HEADER_LINK_CLASS_NAME}>
        {COMMON_MESSAGES.signup}
      </Link>
    </nav>
  );
}
