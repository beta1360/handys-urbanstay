import type { z } from "zod";

const PATH_ID_PATTERN = /^\d+$/;

const PATH_ID_MIN = 1;

export function parsePathId(value: string, idSchema: z.ZodType<number>) {
  if (!PATH_ID_PATTERN.test(value)) {
    return undefined;
  }
  const id = Number(value);
  return id >= PATH_ID_MIN && idSchema.safeParse(id).success ? id : undefined;
}
