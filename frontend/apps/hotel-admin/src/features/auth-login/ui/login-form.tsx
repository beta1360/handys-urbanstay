import { useLoginForm } from "../model/use-login-form";
import { LoginFormView } from "./login-form-view";

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const { fields, alert, isSubmitting, handleSubmit } =
    useLoginForm(redirectTo);

  return (
    <LoginFormView
      fields={fields}
      alert={alert}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
