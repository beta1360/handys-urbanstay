import {
  OperatorLoadFailed,
  OperatorLoading,
  OperatorNotFound,
  useOperator,
} from "@/entities/operator";
import { OperatorUpdateForm } from "./operator-update-form";

type OperatorUpdateProps = {
  operatorId: number;
};

export function OperatorUpdate({ operatorId }: OperatorUpdateProps) {
  const state = useOperator(operatorId);

  switch (state.status) {
    case "ready":
      return (
        <OperatorUpdateForm
          key={operatorId}
          operatorId={operatorId}
          initialOperator={state.operator}
        />
      );
    case "notFound":
      return <OperatorNotFound />;
    case "failed":
      return <OperatorLoadFailed onRetry={state.retry} />;
    case "loading":
      return <OperatorLoading />;
  }
}
