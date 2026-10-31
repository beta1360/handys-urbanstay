import { getRouteApi } from "@tanstack/react-router";
import { OperatorNotFound } from "@/entities/operator";
import { OperatorDetail } from "@/widgets/operator-detail";

const operatorRoute = getRouteApi("/_authenticated/operators/$operatorId");

export function OperatorDetailPage() {
  const { operatorId } = operatorRoute.useParams();

  return (
    <div className="flex flex-col gap-4">
      {operatorId === undefined ? (
        <OperatorNotFound />
      ) : (
        <OperatorDetail operatorId={operatorId} />
      )}
    </div>
  );
}
