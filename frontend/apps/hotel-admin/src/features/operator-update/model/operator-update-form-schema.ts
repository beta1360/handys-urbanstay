import type { z } from "zod";
import { createOperatorInfoFormShape } from "@/entities/operator";
import { updateOperatorBodySchema } from "@/shared/api";
import type { Operator } from "@/shared/api";

export const operatorUpdateFormSchema = updateOperatorBodySchema.extend(
  createOperatorInfoFormShape(updateOperatorBodySchema.shape),
);

type OperatorUpdateFormValues = z.input<typeof operatorUpdateFormSchema>;

export function toOperatorUpdateFormValues(
  operator: Operator,
): OperatorUpdateFormValues {
  return {
    loginId: operator.loginId,
    name: operator.name,
    version: operator.version,
  };
}
