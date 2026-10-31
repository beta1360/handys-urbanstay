import type { Operator } from "@/shared/api";
import { useOperatorActiveChange } from "../model/use-operator-active-change";
import { OperatorActiveChangeView } from "./operator-active-change-view";

type OperatorActiveChangeProps = {
  operator: Operator;
};

export function OperatorActiveChange({ operator }: OperatorActiveChangeProps) {
  const { status, action, triggerRef, request, cancel, confirm } =
    useOperatorActiveChange(operator);

  return (
    <OperatorActiveChangeView
      status={status}
      action={action}
      triggerRef={triggerRef}
      onRequest={request}
      onCancel={cancel}
      onConfirm={confirm}
    />
  );
}
