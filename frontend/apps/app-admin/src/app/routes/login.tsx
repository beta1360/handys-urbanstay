import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { LoginPage } from "@/pages/login";
import { redirectIfLoggedIn } from "../auth/login-guard";
import {
  DEFAULT_LOGIN_REDIRECT,
  loginSearchSchema,
} from "../auth/login-redirect";

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  search: {
    middlewares: [stripSearchParams({ redirect: DEFAULT_LOGIN_REDIRECT })],
  },
  beforeLoad: ({ context, search }) =>
    redirectIfLoggedIn(context.queryClient, search.redirect),
  component: LoginPage,
});
