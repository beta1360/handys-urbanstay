import { optionalTextSchema } from "@repo/admin-kit/form";
import { cancelStayBodySchema } from "@/shared/api";

const reasonRule = cancelStayBodySchema.shape.reason.unwrap().unwrap();

export const stayCancelFormSchema = cancelStayBodySchema
  .extend({ reason: optionalTextSchema(reasonRule) })
  .transform(({ reason }) => (reason === null ? {} : { reason }));

export const STAY_CANCEL_FIELDS = ["reason"] as const;

export const EMPTY_STAY_CANCEL_VALUES = { reason: "" };
