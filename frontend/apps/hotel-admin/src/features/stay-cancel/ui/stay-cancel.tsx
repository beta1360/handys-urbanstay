import type { Stay } from "@/shared/api";
import { useStayCancel } from "../model/use-stay-cancel";
import { StayCancelView } from "./stay-cancel-view";

type StayCancelProps = {
  stay: Stay;
};

export function StayCancel({ stay }: StayCancelProps) {
  const { status, fields, triggerRef, open, close, handleSubmit } =
    useStayCancel(stay);

  if (status === "unavailable") {
    return null;
  }
  return (
    <StayCancelView
      status={status}
      fields={fields}
      triggerRef={triggerRef}
      onOpen={open}
      onClose={close}
      onSubmit={handleSubmit}
    />
  );
}
