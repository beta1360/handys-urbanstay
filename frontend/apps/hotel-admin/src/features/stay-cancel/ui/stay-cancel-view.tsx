import { useId } from "react";
import type { FormEvent, Ref } from "react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { TextareaField } from "@repo/ui/textarea-field";
import type { FormFieldProps } from "@repo/admin-kit/form";
import { STAY_CANCELLATION_LABELS } from "@/entities/stay";
import { STAY_CANCEL_MESSAGES } from "../config/messages";
import type { StayCancelStatus } from "../model/use-stay-cancel";

const REASON_ROWS = 3;

type StayCancelViewProps = {
  status: Exclude<StayCancelStatus, "unavailable">;
  fields: Record<"reason", FormFieldProps>;
  triggerRef: Ref<HTMLButtonElement>;
  onOpen: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function StayCancelView({
  status,
  fields,
  triggerRef,
  onOpen,
  onClose,
  onSubmit,
}: StayCancelViewProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Card>
      <div
        role="group"
        aria-labelledby={titleId}
        className="flex flex-col gap-3"
      >
        <h2 id={titleId} className="text-sm font-medium text-neutral-600">
          {STAY_CANCEL_MESSAGES.title}
        </h2>
        {status === "idle" ? (
          <div>
            <Button
              ref={triggerRef}
              type="button"
              variant="secondary"
              onClick={onOpen}
            >
              {STAY_CANCEL_MESSAGES.title}
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
            <p id={descriptionId} className="text-sm text-neutral-700">
              {STAY_CANCEL_MESSAGES.description}
            </p>
            <TextareaField
              label={
                <>
                  {STAY_CANCELLATION_LABELS.reason}{" "}
                  <span className="font-normal text-neutral-500">
                    {STAY_CANCEL_MESSAGES.optional}
                  </span>
                </>
              }
              rows={REASON_ROWS}
              autoFocus
              {...fields.reason}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                loading={status === "submitting"}
                aria-describedby={descriptionId}
              >
                {STAY_CANCEL_MESSAGES.confirm}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={status === "submitting"}
                onClick={onClose}
              >
                {STAY_CANCEL_MESSAGES.close}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
