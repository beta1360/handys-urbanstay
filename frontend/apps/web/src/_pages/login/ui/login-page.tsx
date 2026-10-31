import { Suspense } from "react";
import { GuestOnly } from "@/widgets/guest-only";
import { LoginForm } from "@/features/auth-login";
import { COMMON_MESSAGES } from "@/shared/config";
import {
  LOGIN_REDIRECT_PARAM,
  sanitizeLoginRedirect,
  signupHref,
} from "@/shared/lib/login-redirect";
import { LoadingMessage, TextLink } from "@/shared/ui";
import { LOGIN_PAGE_MESSAGES } from "../config/messages";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <section className="flex flex-col gap-6 px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">
        {COMMON_MESSAGES.login}
      </h1>
      <Suspense fallback={<LoadingMessage />}>
        {searchParams.then((search) => {
          const redirectTo = sanitizeLoginRedirect(
            search[LOGIN_REDIRECT_PARAM],
          );
          return (
            <GuestOnly redirectTo={redirectTo}>
              <LoginForm redirectTo={redirectTo} />
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{LOGIN_PAGE_MESSAGES.signupPrompt}</span>
                <TextLink href={signupHref(redirectTo)}>
                  {COMMON_MESSAGES.signup}
                </TextLink>
              </div>
            </GuestOnly>
          );
        })}
      </Suspense>
    </section>
  );
}
