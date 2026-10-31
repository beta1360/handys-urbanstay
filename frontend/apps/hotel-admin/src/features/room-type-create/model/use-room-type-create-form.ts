import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
  useFormErrorToast,
} from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import { ROOM_TYPE_INFO_FIELDS } from "@/entities/room-type";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import { useCreateRoomType } from "../api/use-create-room-type";
import {
  EMPTY_ROOM_TYPE_CREATE_VALUES,
  roomTypeCreateFormSchema,
} from "./room-type-create-form-schema";

export function useRoomTypeCreateForm() {
  const { create } = useCreateRoomType();
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(roomTypeCreateFormSchema),
    defaultValues: EMPTY_ROOM_TYPE_CREATE_VALUES,
  });
  const { formState } = form;
  const fields = toFieldPropsMap(form, ROOM_TYPE_INFO_FIELDS);
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        create(body, {
          onSuccess: ({ data: roomType, message }) => {
            showToast({ type: "success", message });
            void navigate({
              to: "/room-types/$roomTypeId",
              params: { roomTypeId: roomType.id },
              replace: true,
            });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: ROOM_TYPE_INFO_FIELDS,
              setError: form.setError,
              fieldOfCode: { [API_ERROR_CODES.roomTypeDuplicated]: "name" },
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

  return { fields, isSubmitting, handleSubmit };
}
