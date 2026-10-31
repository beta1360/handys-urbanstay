import { createOperatorBodySchema } from "@/shared/api";

const passwordRule = createOperatorBodySchema.shape.password;

export const OPERATOR_PASSWORD_LENGTH = {
  min: passwordRule.minLength,
  max: passwordRule.maxLength,
};
