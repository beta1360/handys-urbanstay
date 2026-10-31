import { Suspense } from "react";
import { GuestOnly } from "@/widgets/guest-only";
import { SignupForm } from "@/features/auth-signup";
import { COMMON_MESSAGES } from "@/shared/config";
import {
  LOGIN_REDIRECT_PARAM,
  loginHref,
  sanitizeLoginRedirect,
} from "@/shared/lib/login-redirect";
import { LoadingMessage, TextLink } from "@/shared/ui";
import { SIGNUP_PAGE_MESSAGES } from "../config/messages";

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function SignupPage({ searchParams }: SignupPageProps) {
  return (
    <section className="flex flex-col gap-6 px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">
        {COMMON_MESSAGES.signup}
      </h1>
      <Suspense fallback={<LoadingMessage />}>
        {searchParams.then((search) => {
          const redirectTo = sanitizeLoginRedirect(
            search[LOGIN_REDIRECT_PARAM],
          );
          return (
            <GuestOnly redirectTo={redirectTo}>
              <SignupForm redirectTo={redirectTo} />
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{SIGNUP_PAGE_MESSAGES.loginPrompt}</span>
                <TextLink href={loginHref(redirectTo)}>
                  {COMMON_MESSAGES.login}
                </TextLink>
              </div>
            </GuestOnly>
          );
        })}
      </Suspense>
    </section>
  );
}
