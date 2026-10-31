import type { z } from "zod";
import {
  optionalIntegerSchema,
  optionalTextSchema,
  requiredIntegerSchema,
  requiredTextSchema,
} from "@repo/admin-kit/form";
import { FORM_VALIDATION_MESSAGES } from "@repo/admin-kit/config";
import { createRoomBodySchema } from "@/shared/api";

export const ROOM_INFO_FIELDS = [
  "name",
  "type",
  "capacity",
  "floor",
  "checkInTime",
  "checkOutTime",
  "description",
] as const;

export type RoomInfoField = (typeof ROOM_INFO_FIELDS)[number];

const capacityRule = createRoomBodySchema.shape.capacity;

const floorRule = createRoomBodySchema.shape.floor.unwrap().unwrap();

export const ROOM_CAPACITY_RANGE = {
  min: capacityRule.minValue,
  max: capacityRule.maxValue,
};

export const ROOM_FLOOR_RANGE = {
  min: floorRule.minValue,
  max: floorRule.maxValue,
};

export function createRoomInfoFormShape(
  rules: Record<RoomInfoField, z.ZodType>,
) {
  return {
    name: requiredTextSchema(rules.name),
    type: requiredTextSchema(rules.type),
    capacity: requiredIntegerSchema(rules.capacity),
    floor: optionalIntegerSchema(rules.floor),
    checkInTime: requiredTextSchema(
      rules.checkInTime,
      FORM_VALIDATION_MESSAGES.typeMismatch,
    ),
    checkOutTime: requiredTextSchema(
      rules.checkOutTime,
      FORM_VALIDATION_MESSAGES.typeMismatch,
    ),
    description: optionalTextSchema(rules.description),
  };
}
