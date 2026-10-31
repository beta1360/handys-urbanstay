import type { z } from "zod";
import {
  createOperatorInfoFormShape,
  createOperatorPasswordSchema,
  OPERATOR_INFO_FIELDS,
} from "@/entities/operator";
import { createOperatorBodySchema } from "@/shared/api";

export const operatorCreateFormSchema = createOperatorBodySchema.extend({
  ...createOperatorInfoFormShape(createOperatorBodySchema.shape),
  password: createOperatorPasswordSchema(
    createOperatorBodySchema.shape.password,
  ),
});

export type OperatorCreateFormValues = z.input<typeof operatorCreateFormSchema>;

export const OPERATOR_CREATE_FIELDS = [
  ...OPERATOR_INFO_FIELDS,
  "password",
] as const satisfies readonly (keyof OperatorCreateFormValues)[];

export const EMPTY_OPERATOR_CREATE_VALUES: OperatorCreateFormValues = {
  loginId: "",
  name: "",
  password: "",
};
