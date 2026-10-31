import { getRouteApi } from "@tanstack/react-router";
import { OperatorNotFound } from "@/entities/operator";
import { OperatorUpdate } from "@/features/operator-update";

const operatorRoute = getRouteApi("/_authenticated/operators/$operatorId");

export function OperatorEditPage() {
  const { operatorId } = operatorRoute.useParams();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {operatorId === undefined ? (
        <OperatorNotFound />
      ) : (
        <OperatorUpdate operatorId={operatorId} />
      )}
    </div>
  );
}
