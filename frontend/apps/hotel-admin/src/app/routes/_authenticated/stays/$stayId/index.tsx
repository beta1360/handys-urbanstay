import { createFileRoute } from "@tanstack/react-router";
import { STAY_DETAIL_MESSAGES, StayDetailPage } from "@/pages/stay-detail";

export const Route = createFileRoute("/_authenticated/stays/$stayId/")({
  staticData: { title: STAY_DETAIL_MESSAGES.title },
  component: StayDetailPage,
});
