import type { z } from "zod";
import {
  optionalIntegerSchema,
  optionalTextSchema,
  requiredIntegerSchema,
  requiredTextSchema,
} from "@repo/admin-kit/form";
import { createRoomBodySchema } from "@/shared/api";

export const ROOM_INFO_FIELDS = [
  "name",
  "roomTypeId",
  "floor",
  "description",
] as const;

export type RoomInfoField = (typeof ROOM_INFO_FIELDS)[number];

const floorRule = createRoomBodySchema.shape.floor.unwrap().unwrap();

export const ROOM_FLOOR_RANGE = {
  min: floorRule.minValue,
  max: floorRule.maxValue,
};

export function createRoomInfoFormShape(
  rules: Record<RoomInfoField, z.ZodType>,
) {
  return {
    name: requiredTextSchema(rules.name),
    roomTypeId: requiredIntegerSchema(rules.roomTypeId),
    floor: optionalIntegerSchema(rules.floor),
    description: optionalTextSchema(rules.description),
  };
}
