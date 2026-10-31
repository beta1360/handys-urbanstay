import { useId } from "react";
import type { Ref } from "react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { OPERATOR_ACTIVE_CHANGE_MESSAGES } from "../config/messages";
import type {
  OperatorActiveChangeAction,
  OperatorActiveChangeStatus,
} from "../model/use-operator-active-change";

const ACTION_MESSAGES = {
  deactivate: {
    label: OPERATOR_ACTIVE_CHANGE_MESSAGES.deactivate,
    confirm: OPERATOR_ACTIVE_CHANGE_MESSAGES.deactivateConfirm,
  },
  activate: {
    label: OPERATOR_ACTIVE_CHANGE_MESSAGES.activate,
    confirm: OPERATOR_ACTIVE_CHANGE_MESSAGES.activateConfirm,
  },
} as const satisfies Record<
  OperatorActiveChangeAction,
  { label: string; confirm: string }
>;

type OperatorActiveChangeViewProps = {
  status: OperatorActiveChangeStatus;
  action: OperatorActiveChangeAction;
  triggerRef: Ref<HTMLButtonElement>;
  onRequest: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function OperatorActiveChangeView({
  status,
  action,
  triggerRef,
  onRequest,
  onCancel,
  onConfirm,
}: OperatorActiveChangeViewProps) {
  const titleId = useId();
  const confirmId = useId();
  const messages = ACTION_MESSAGES[action];

  return (
    <Card>
      <div
        role="group"
        aria-labelledby={titleId}
        className="flex flex-col gap-3"
      >
        <h2 id={titleId} className="text-sm font-medium text-neutral-600">
          {OPERATOR_ACTIVE_CHANGE_MESSAGES.title}
        </h2>
        {status === "idle" ? (
          <div>
            <Button
              ref={triggerRef}
              type="button"
              variant="secondary"
              onClick={onRequest}
            >
              {messages.label}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p id={confirmId} className="text-sm text-neutral-700">
              {messages.confirm}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                loading={status === "changing"}
                aria-describedby={confirmId}
                onClick={onConfirm}
              >
                {messages.label}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={status === "changing"}
                aria-describedby={confirmId}
                autoFocus
                onClick={onCancel}
              >
                {COMMON_MESSAGES.cancel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
