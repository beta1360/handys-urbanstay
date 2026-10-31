import { getRouteApi } from "@tanstack/react-router";
import { StayNotFound } from "@/entities/stay";
import { StayDetail } from "@/widgets/stay-detail";

const stayDetailRoute = getRouteApi("/_authenticated/stays/$stayId");

export function StayDetailPage() {
  const { stayId } = stayDetailRoute.useParams();

  return (
    <div className="flex flex-col gap-4">
      {stayId === undefined ? <StayNotFound /> : <StayDetail stayId={stayId} />}
    </div>
  );
}
