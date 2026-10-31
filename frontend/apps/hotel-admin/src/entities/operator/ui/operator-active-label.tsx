import { OPERATOR_ACTIVE_LABELS } from "../config/messages";

type OperatorActiveLabelProps = {
  active: boolean;
};

export function OperatorActiveLabel({ active }: OperatorActiveLabelProps) {
  return active
    ? OPERATOR_ACTIVE_LABELS.active
    : OPERATOR_ACTIVE_LABELS.inactive;
}
