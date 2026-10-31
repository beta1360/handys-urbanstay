import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { flushSync } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  FORM_ALERT,
  showSubmitError,
  SUBMIT_ONLY_VALIDATION,
  toFieldPropsMap,
  useFormErrorToast,
} from "@repo/admin-kit/form";
import type { FormAlert } from "@repo/admin-kit/form";
import { showToast } from "@repo/admin-kit/toast";
import {
  ROOM_TYPE_INFO_FIELDS,
  ROOM_TYPE_LOAD_MESSAGES,
  useRefetchRoomType,
} from "@/entities/room-type";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { RoomType } from "@/shared/api";
import { useUpdateRoomType } from "../api/use-update-room-type";
import {
  roomTypeUpdateFormSchema,
  toRoomTypeUpdateFormValues,
} from "./room-type-update-form-schema";

export type RoomTypeUpdateStatus =
  | "editing"
  | "submitting"
  | "reloading"
  | "notFound";

type LoadState = "idle" | "reloading" | "notFound";

const RELOAD_FAILED = "RELOAD_FAILED";

export function useRoomTypeUpdateForm(
  roomTypeId: number,
  initialRoomType: RoomType,
) {
  const { update } = useUpdateRoomType(roomTypeId);
  const refetchRoomType = useRefetchRoomType(roomTypeId);
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(roomTypeUpdateFormSchema),
    defaultValues: toRoomTypeUpdateFormValues(initialRoomType),
  });
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const { formState } = form;
  const fields = toFieldPropsMap(form, ROOM_TYPE_INFO_FIELDS);
  const formAlert = formState.errors.root?.server;
  const alert =
    formAlert?.type === API_ERROR_CODES.roomTypeModified ||
    formAlert?.type === RELOAD_FAILED
      ? formAlert.message
      : undefined;
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;
  const status: RoomTypeUpdateStatus =
    loadState !== "idle" ? loadState : isSubmitting ? "submitting" : "editing";

  function toastFormAlert({ code, message }: FormAlert) {
    if (code !== API_ERROR_CODES.roomTypeModified) {
      errorToast.show(message);
    }
  }

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        update(body, {
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
              onAlert: toastFormAlert,
            });
            resolve();
          },
        });
      }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (status !== "editing") {
      event.preventDefault();
      return;
    }
    errorToast.dismiss();
    void submit(event);
  }

  async function reload() {
    if (status !== "editing") {
      return;
    }
    setLoadState("reloading");
    try {
      const roomType = await refetchRoomType();
      form.reset(toRoomTypeUpdateFormValues(roomType), { keepFieldsRef: true });
      setLoadState("idle");
      form.setFocus(ROOM_TYPE_INFO_FIELDS[0]);
    } catch (error) {
      if (getApiError(error)?.code === API_ERROR_CODES.roomTypeNotFound) {
        setLoadState("notFound");
        return;
      }
      flushSync(() => {
        form.setError(FORM_ALERT, {
          type: RELOAD_FAILED,
          message: ROOM_TYPE_LOAD_MESSAGES.loadFailed,
        });
        setLoadState("idle");
      });
      reloadButtonRef.current?.focus();
    }
  }

  return {
    fields,
    alert,
    status,
    reloadButtonRef,
    handleSubmit,
    reload: () => void reload(),
  };
}
