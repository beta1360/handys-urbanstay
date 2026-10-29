import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { TextField } from "@repo/ui/text-field";
import { APP_INFO } from "@/shared/config";
import { LOGIN_MESSAGES } from "../config/messages";
import { useLoginForm } from "../model/use-login-form";

export function LoginPage() {
  const {
    values,
    fieldErrors,
    formError,
    isSubmitting,
    loginIdRef,
    passwordRef,
    changeField,
    handleSubmit,
  } = useLoginForm();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-neutral-900">{APP_INFO.name}</h1>
        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4"
        >
          <TextField
            ref={loginIdRef}
            label={LOGIN_MESSAGES.loginIdLabel}
            type="email"
            name="loginId"
            autoComplete="username"
            value={values.loginId}
            onChange={(event) => changeField("loginId", event.target.value)}
            error={fieldErrors.loginId}
          />
          <TextField
            ref={passwordRef}
            label={LOGIN_MESSAGES.passwordLabel}
            type="password"
            name="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => changeField("password", event.target.value)}
            error={fieldErrors.password}
          />
          {formError ? (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="mt-2 w-full"
          >
            {LOGIN_MESSAGES.submit}
          </Button>
        </form>
      </Card>
    </main>
  );
}
