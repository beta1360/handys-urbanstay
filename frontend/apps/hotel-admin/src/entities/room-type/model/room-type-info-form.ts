import type { z } from "zod";
import {
  requiredIntegerSchema,
  requiredTextSchema,
} from "@repo/admin-kit/form";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { createRoomTypeBodySchema } from "@/shared/api";

export const ROOM_TYPE_INFO_FIELDS = [
  "name",
  "capacity",
  "roomRate",
  "checkInTime",
  "checkOutTime",
] as const;

export type RoomTypeInfoField = (typeof ROOM_TYPE_INFO_FIELDS)[number];

const capacityRule = createRoomTypeBodySchema.shape.capacity;

const roomRateRule = createRoomTypeBodySchema.shape.roomRate;

export const ROOM_TYPE_CAPACITY_RANGE = {
  min: capacityRule.minValue,
  max: capacityRule.maxValue,
};

export const ROOM_TYPE_RATE_RANGE = {
  min: roomRateRule.minValue ?? 0,
  max: roomRateRule.maxValue ?? 0,
};

export function createRoomTypeInfoFormShape(
  rules: Record<RoomTypeInfoField, z.ZodType>,
) {
  return {
    name: requiredTextSchema(rules.name),
    capacity: requiredIntegerSchema(rules.capacity),
    roomRate: requiredIntegerSchema(rules.roomRate),
    checkInTime: requiredTextSchema(
      rules.checkInTime,
      FORM_VALIDATION_MESSAGES.typeMismatch,
    ),
    checkOutTime: requiredTextSchema(
      rules.checkOutTime,
      FORM_VALIDATION_MESSAGES.typeMismatch,
    ),
  };
}
