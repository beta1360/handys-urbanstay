import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SUBMIT_ONLY_VALIDATION, toFieldPropsMap } from "@repo/admin-kit/form";
import {
  normalizeRoomKeyword,
  normalizeRoomStatus,
  ROOM_LIST_FIRST_PAGE,
} from "@/entities/room";
import type { RoomStatus } from "@/shared/api";

const roomSearchFormSchema = z.object({
  keyword: z.string().transform(normalizeRoomKeyword),
  status: z.string().transform(normalizeRoomStatus),
});

const ROOM_SEARCH_FIELDS = ["keyword", "status"] as const;

export type RoomSearchCriteria = {
  keyword: string | undefined;
  status: RoomStatus | undefined;
};

export function useRoomSearchForm({ keyword, status }: RoomSearchCriteria) {
  const navigate = useNavigate();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(roomSearchFormSchema),
    values: { keyword: keyword ?? "", status: status ?? "" },
  });
  const fields = toFieldPropsMap(form, ROOM_SEARCH_FIELDS);

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

  return { fields, handleSubmit };
}
