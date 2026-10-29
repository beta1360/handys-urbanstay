import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { TextField } from "@repo/ui/text-field";
import { APP_INFO } from "@/shared/config";
import { LOGIN_MESSAGES } from "../config/messages";

export function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-neutral-900">{APP_INFO.name}</h1>
        <form
          noValidate
          onSubmit={(event) => event.preventDefault()}
          className="mt-6 flex flex-col gap-4"
        >
          <TextField
            label={LOGIN_MESSAGES.loginIdLabel}
            type="email"
            name="loginId"
            autoComplete="username"
          />
          <TextField
            label={LOGIN_MESSAGES.passwordLabel}
            type="password"
            name="password"
            autoComplete="current-password"
          />
          <Button type="submit" variant="primary" className="mt-2 w-full">
            {LOGIN_MESSAGES.submit}
          </Button>
        </form>
      </Card>
    </main>
  );
}
