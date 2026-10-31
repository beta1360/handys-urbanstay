import {
  OperatorInformation,
  OperatorLoadFailed,
  OperatorLoading,
  OperatorNotFound,
  useOperator,
} from "@/entities/operator";
import { OperatorDetailActions } from "./operator-detail-actions";

type OperatorDetailProps = {
  operatorId: number;
};

export function OperatorDetail({ operatorId }: OperatorDetailProps) {
  const state = useOperator(operatorId);

  switch (state.status) {
    case "notFound":
      return <OperatorNotFound />;
    case "loading":
      return (
        <>
          <OperatorDetailActions />
          <OperatorLoading />
        </>
      );
    case "failed":
      return (
        <>
          <OperatorDetailActions />
          <OperatorLoadFailed onRetry={state.retry} />
        </>
      );
    case "ready":
      return (
        <>
          <OperatorDetailActions />
          <OperatorInformation operator={state.operator} />
        </>
      );
  }
}
