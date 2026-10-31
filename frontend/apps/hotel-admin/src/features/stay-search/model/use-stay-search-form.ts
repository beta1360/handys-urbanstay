import { useEffect } from "react";
import type { FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SUBMIT_ONLY_VALIDATION, toFieldPropsMap } from "@repo/admin-kit/form";
import { useRoomListQuery } from "@/entities/room";
import {
  isStayCheckInRangeValid,
  normalizeStayCanceled,
  normalizeStayCheckInDate,
  normalizeStayFilterId,
  normalizeStayKeyword,
  STAY_LIST_FIRST_PAGE,
  STAY_ROOM_OPTION_MESSAGES,
  STAY_ROOM_OPTIONS_PARAMS,
  toStayListParams,
  toStayRoomOptions,
  useStayListQuery,
} from "@/entities/stay";
import type { StayListFilter } from "@/entities/stay";
import { getApiError } from "@/shared/api";
import { STAY_SEARCH_FORM_MESSAGES } from "../config/messages";

const staySearchFormSchema = z
  .object({
    roomId: z.string().transform(normalizeStayFilterId),
    canceled: z.string().transform(normalizeStayCanceled),
    keyword: z.string().transform(normalizeStayKeyword),
    checkInFrom: z.string().transform(normalizeStayCheckInDate),
    checkInTo: z.string().transform(normalizeStayCheckInDate),
  })
  .refine(
    ({ checkInFrom, checkInTo }) =>
      isStayCheckInRangeValid(checkInFrom, checkInTo),
    {
      path: ["checkInTo"],
      message: STAY_SEARCH_FORM_MESSAGES.checkInToBeforeFrom,
    },
  );

const STAY_SEARCH_FIELDS = [
  "roomId",
  "canceled",
  "keyword",
  "checkInFrom",
  "checkInTo",
] as const;

function toFormValue(value: number | boolean | string | undefined) {
  return value === undefined ? "" : String(value);
}

export type StaySearchCriteria = StayListFilter & {
  page: number;
};

export function useStaySearchForm(criteria: StaySearchCriteria) {
  const { roomId, canceled, keyword, checkInFrom, checkInTo, guestId, page } =
    criteria;
  const navigate = useNavigate();
  const rooms = useRoomListQuery(STAY_ROOM_OPTIONS_PARAMS);
  const { error: listError } = useStayListQuery(
    toStayListParams(criteria, page),
  );
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(staySearchFormSchema),
    values: {
      roomId: toFormValue(roomId),
      canceled: toFormValue(canceled),
      keyword: toFormValue(keyword),
      checkInFrom: toFormValue(checkInFrom),
      checkInTo: toFormValue(checkInTo),
    },
  });
  const { setError } = form;
  const fields = toFieldPropsMap(form, STAY_SEARCH_FIELDS);
  const selectedRoomId = useWatch({ control: form.control, name: "roomId" });

  useEffect(() => {
    const fieldErrors = getApiError(listError)?.fieldErrors ?? [];
    STAY_SEARCH_FIELDS.forEach((field) => {
      const fieldError = fieldErrors.find((error) => error.field === field);
      if (fieldError !== undefined) {
        setError(field, { type: "server", message: fieldError.message });
      }
    });
  }, [listError, setError]);

  const submit = form.handleSubmit((filter) => {
    form.setValue("keyword", filter.keyword ?? "");
    void navigate({
      to: "/stays",
      search: { ...filter, guestId, page: STAY_LIST_FIRST_PAGE },
    });
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void submit(event);
  }

  return {
    fields: {
      ...fields,
      roomId: { ...fields.roomId, value: selectedRoomId },
    },
    roomOptions: toStayRoomOptions(rooms.data?.items),
    roomHint:
      rooms.data === undefined && rooms.isError
        ? STAY_ROOM_OPTION_MESSAGES.loadFailed
        : undefined,
    handleSubmit,
  };
}
