import type { FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
  useFormErrorToast,
} from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import { ROOM_INFO_FIELDS } from "@/entities/room";
import { useRoomTypeOptions } from "@/entities/room-type";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { useCreateRoom } from "../api/use-create-room";
import {
  EMPTY_ROOM_CREATE_VALUES,
  roomCreateFormSchema,
} from "./room-create-form-schema";

export function useRoomCreateForm() {
  const { create } = useCreateRoom();
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const { roomTypeOptions, roomTypeHint, isRoomTypeEmpty } =
    useRoomTypeOptions();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(roomCreateFormSchema),
    defaultValues: EMPTY_ROOM_CREATE_VALUES,
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, ROOM_INFO_FIELDS);
  const roomTypeId = useWatch({ control: form.control, name: "roomTypeId" });
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        create(body, {
          onSuccess: ({ data: room, message }) => {
            showToast({ type: "success", message });
            void navigate({
              to: "/rooms/$roomId",
              params: { roomId: room.id },
              replace: true,
            });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: ROOM_INFO_FIELDS,
              setError: form.setError,
              fieldOfCode: {
                [API_ERROR_CODES.roomDuplicated]: "name",
                [API_ERROR_CODES.roomTypeNotFound]: "roomTypeId",
              },
              onAlert: ({ message }) => errorToast.show(message),
            });
            resolve();
          },
        });
      }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    errorToast.dismiss();
    void submit(event);
  }

  return {
    fields: {
      ...fields,
      roomTypeId: { ...fields.roomTypeId, value: roomTypeId },
    },
    roomTypeOptions,
    roomTypeHint,
    isRoomTypeEmpty,
    isSubmitting,
    handleSubmit,
  };
}
