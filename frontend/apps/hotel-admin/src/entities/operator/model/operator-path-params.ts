import { operatorParamsSchema } from "@/shared/api";

const OPERATOR_ID_PATTERN = /^\d+$/;

const OPERATOR_ID_MIN = 1;

type OperatorPathParams = {
  operatorId: number | undefined;
};

function toOperatorId(value: string) {
  if (!OPERATOR_ID_PATTERN.test(value)) {
    return undefined;
  }
  const operatorId = Number(value);
  return operatorId >= OPERATOR_ID_MIN &&
    operatorParamsSchema.safeParse({ operatorId }).success
    ? operatorId
    : undefined;
}

export function parseOperatorPathParams(params: {
  operatorId: string;
}): OperatorPathParams {
  return { operatorId: toOperatorId(params.operatorId) };
}

export function stringifyOperatorPathParams({
  operatorId,
}: OperatorPathParams) {
  return { operatorId: String(operatorId) };
}
