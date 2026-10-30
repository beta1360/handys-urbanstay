import { getRouteApi } from "@tanstack/react-router";
import { Card } from "@repo/ui/card";
import { LoginForm } from "@/features/auth-login";
import { APP_INFO } from "@/shared/config";

const loginRoute = getRouteApi("/login");

export function LoginPage() {
  const { redirect } = loginRoute.useSearch();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-neutral-900">{APP_INFO.name}</h1>
        <LoginForm redirectTo={redirect} />
      </Card>
    </main>
  );
}
