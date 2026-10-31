import type { FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SUBMIT_ONLY_VALIDATION, toFieldPropsMap } from "@repo/admin-kit/form";
import { useRoomListQuery } from "@/entities/room";
import {
  normalizeStayCanceled,
  normalizeStayFilterId,
  STAY_LIST_FIRST_PAGE,
  STAY_ROOM_OPTION_MESSAGES,
  STAY_ROOM_OPTIONS_PARAMS,
  toStayRoomOptions,
} from "@/entities/stay";

const staySearchFormSchema = z.object({
  roomId: z.string().transform(normalizeStayFilterId),
  canceled: z.string().transform(normalizeStayCanceled),
});

const STAY_SEARCH_FIELDS = ["roomId", "canceled"] as const;

function toFormValue(value: number | boolean | undefined) {
  return value === undefined ? "" : String(value);
}

export type StaySearchCriteria = {
  roomId: number | undefined;
  canceled: boolean | undefined;
  guestId: number | undefined;
};

export function useStaySearchForm({
  roomId,
  canceled,
  guestId,
}: StaySearchCriteria) {
  const navigate = useNavigate();
  const rooms = useRoomListQuery(STAY_ROOM_OPTIONS_PARAMS);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(staySearchFormSchema),
    values: { roomId: toFormValue(roomId), canceled: toFormValue(canceled) },
  });
  const fields = toFieldPropsMap(form, STAY_SEARCH_FIELDS);
  const selectedRoomId = useWatch({ control: form.control, name: "roomId" });

  const submit = form.handleSubmit((criteria) => {
    void navigate({
      to: "/stays",
      search: { ...criteria, guestId, page: STAY_LIST_FIRST_PAGE },
    });
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void submit(event);
  }

  return {
    fields: {
      roomId: { ...fields.roomId, value: selectedRoomId },
      canceled: fields.canceled,
    },
    roomOptions: toStayRoomOptions(rooms.data?.items),
    roomHint:
      rooms.data === undefined && rooms.isError
        ? STAY_ROOM_OPTION_MESSAGES.loadFailed
        : undefined,
    handleSubmit,
  };
}
