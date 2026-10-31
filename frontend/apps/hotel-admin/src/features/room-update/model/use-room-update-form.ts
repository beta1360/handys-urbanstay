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
  ROOM_INFO_FIELDS,
  ROOM_LOAD_MESSAGES,
  useRefetchRoom,
} from "@/entities/room";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Room } from "@/shared/api";
import { useUpdateRoom } from "../api/use-update-room";
import {
  roomUpdateFormSchema,
  toRoomUpdateFormValues,
} from "./room-update-form-schema";

export type RoomUpdateStatus =
  | "editing"
  | "submitting"
  | "reloading"
  | "notFound";

type LoadState = "idle" | "reloading" | "notFound";

const RELOAD_FAILED = "RELOAD_FAILED";

export function useRoomUpdateForm(roomId: number, initialRoom: Room) {
  const { update } = useUpdateRoom(roomId);
  const refetchRoom = useRefetchRoom(roomId);
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(roomUpdateFormSchema),
    defaultValues: toRoomUpdateFormValues(initialRoom),
  });
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const { formState } = form;
  const fields = toFieldPropsMap(form, ROOM_INFO_FIELDS);
  const formAlert = formState.errors.root?.server;
  const alert =
    formAlert?.type === API_ERROR_CODES.roomModified ||
    formAlert?.type === RELOAD_FAILED
      ? formAlert.message
      : undefined;
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;
  const status: RoomUpdateStatus =
    loadState !== "idle" ? loadState : isSubmitting ? "submitting" : "editing";

  function toastFormAlert({ code, message }: FormAlert) {
    if (code !== API_ERROR_CODES.roomModified) {
      errorToast.show(message);
    }
  }

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        update(body, {
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
              fieldOfCode: { [API_ERROR_CODES.roomDuplicated]: "name" },
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
      const room = await refetchRoom();
      form.reset(toRoomUpdateFormValues(room), { keepFieldsRef: true });
      setLoadState("idle");
      form.setFocus(ROOM_INFO_FIELDS[0]);
    } catch (error) {
      if (getApiError(error)?.code === API_ERROR_CODES.roomNotFound) {
        setLoadState("notFound");
        return;
      }
      flushSync(() => {
        form.setError(FORM_ALERT, {
          type: RELOAD_FAILED,
          message: ROOM_LOAD_MESSAGES.loadFailed,
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
