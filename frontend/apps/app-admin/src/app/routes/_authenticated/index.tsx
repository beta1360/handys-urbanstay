import { createFileRoute } from "@tanstack/react-router";
import { HOME_MESSAGES, HomePage } from "@/pages/home";

export const Route = createFileRoute("/_authenticated/")({
  staticData: { title: HOME_MESSAGES.title },
  component: HomePage,
});
