import { useEffect } from "react";
import type { FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SUBMIT_ONLY_VALIDATION, toFieldPropsMap } from "@repo/admin-kit/form";
import {
  normalizeRoomKeyword,
  normalizeRoomStatus,
  normalizeRoomTypeFilterId,
  ROOM_LIST_FIRST_PAGE,
} from "@/entities/room";
import { useRoomTypeOptions } from "@/entities/room-type";
import type { RoomStatus } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";

const roomSearchFormSchema = z.object({
  keyword: z.string().transform(normalizeRoomKeyword),
  status: z.string().transform(normalizeRoomStatus),
  roomTypeId: z.string().transform(normalizeRoomTypeFilterId),
});

const ROOM_SEARCH_FIELDS = ["keyword", "status", "roomTypeId"] as const;

export type RoomSearchCriteria = {
  keyword: string | undefined;
  status: RoomStatus | undefined;
  roomTypeId: number | undefined;
};

export function useRoomSearchForm({
  keyword,
  status,
  roomTypeId,
}: RoomSearchCriteria) {
  const navigate = useNavigate();
  const { roomTypeOptions, roomTypeHint, isUnlistedRoomType } =
    useRoomTypeOptions({ emptyLabel: COMMON_MESSAGES.all });
  const isRoomTypeIdUnlisted =
    roomTypeId !== undefined && isUnlistedRoomType(roomTypeId);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(roomSearchFormSchema),
    values: {
      keyword: keyword ?? "",
      status: status ?? "",
      roomTypeId: roomTypeId === undefined ? "" : String(roomTypeId),
    },
  });
  const fields = toFieldPropsMap(form, ROOM_SEARCH_FIELDS);
  const selectedRoomTypeId = useWatch({
    control: form.control,
    name: "roomTypeId",
  });

  useEffect(() => {
    if (isRoomTypeIdUnlisted) {
      void navigate({
        to: "/rooms",
        search: (previous) => ({ ...previous, roomTypeId: undefined }),
        replace: true,
      });
    }
  }, [isRoomTypeIdUnlisted, navigate]);

  const submit = form.handleSubmit((criteria) => {
    form.setValue("keyword", criteria.keyword ?? "");
    void navigate({
      to: "/rooms",
      search: { ...criteria, page: ROOM_LIST_FIRST_PAGE },
    });
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void submit(event);
  }

  return {
    fields: {
      ...fields,
      roomTypeId: { ...fields.roomTypeId, value: selectedRoomTypeId },
    },
    roomTypeOptions,
    roomTypeHint,
    handleSubmit,
  };
}
