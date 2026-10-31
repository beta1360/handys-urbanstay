import { z } from "zod";
import * as generated from "./generated";
import { CreateStayResponse } from "./generated/zod";
import {
  StayAppResponse,
  StayCreateAppRequest,
} from "./generated/zod/schemas";
import { parseRequest, parseResponse } from "./validate";

export const createStayBodySchema = StayCreateAppRequest;

export type CreateStayBody = z.input<typeof StayCreateAppRequest>;

export type ReservedStay = z.output<typeof StayAppResponse>;

const CreateStaySuccessResponse = CreateStayResponse.extend({
  success: z.literal(true),
  data: StayAppResponse,
  message: z.string(),
});

export async function createStay(body: CreateStayBody) {
  const validBody = parseRequest("createStay", StayCreateAppRequest, body);
  const response = await generated.createStay(validBody);
  const { data, message } = parseResponse(
    "createStay",
    CreateStaySuccessResponse,
    response,
  );
  return { data, message };
}
