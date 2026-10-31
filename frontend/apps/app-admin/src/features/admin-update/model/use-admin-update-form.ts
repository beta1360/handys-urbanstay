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
  ADMIN_INFO_FIELDS,
  ADMIN_LOAD_MESSAGES,
  useRefetchAdmin,
} from "@/entities/admin";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Admin } from "@/shared/api";
import { useUpdateAdmin } from "../api/use-update-admin";
import {
  adminUpdateFormSchema,
  toAdminUpdateFormValues,
} from "./admin-update-form-schema";

export type AdminUpdateStatus =
  | "editing"
  | "submitting"
  | "reloading"
  | "notFound";

type LoadState = "idle" | "reloading" | "notFound";

const RELOAD_FAILED = "RELOAD_FAILED";

export function useAdminUpdateForm(adminId: number, initialAdmin: Admin) {
  const { update } = useUpdateAdmin(adminId);
  const refetchAdmin = useRefetchAdmin(adminId);
  const navigate = useNavigate();
  const errorToast = useFormErrorToast();
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  const form = useForm({
    ...SUBMIT_ONLY_VALIDATION,
    resolver: zodResolver(adminUpdateFormSchema),
    defaultValues: toAdminUpdateFormValues(initialAdmin),
  });
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const { formState } = form;
  const fields = toFieldPropsMap(form, ADMIN_INFO_FIELDS);
  const formAlert = formState.errors.root?.server;
  const alert =
    formAlert?.type === API_ERROR_CODES.appAdminModified ||
    formAlert?.type === RELOAD_FAILED
      ? formAlert.message
      : undefined;
  const isSubmitting = formState.isSubmitting || formState.isSubmitSuccessful;
  const status: AdminUpdateStatus =
    loadState !== "idle" ? loadState : isSubmitting ? "submitting" : "editing";

  function toastFormAlert({ code, message }: FormAlert) {
    if (code !== API_ERROR_CODES.appAdminModified) {
      errorToast.show(message);
    }
  }

  const submit = form.handleSubmit(
    (body) =>
      new Promise<void>((resolve) => {
        update(body, {
          onSuccess: ({ data: admin, message }) => {
            showToast({ type: "success", message });
            void navigate({
              to: "/admins/$adminId",
              params: { adminId: admin.id },
              replace: true,
            });
            resolve();
          },
          onError: (error) => {
            showSubmitError(getApiError(error), {
              fields: ADMIN_INFO_FIELDS,
              setError: form.setError,
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
      const admin = await refetchAdmin();
      form.reset(toAdminUpdateFormValues(admin), { keepFieldsRef: true });
      setLoadState("idle");
      form.setFocus(ADMIN_INFO_FIELDS[0]);
    } catch (error) {
      if (getApiError(error)?.code === API_ERROR_CODES.appAdminNotFound) {
        setLoadState("notFound");
        return;
      }
      flushSync(() => {
        form.setError(FORM_ALERT, {
          type: RELOAD_FAILED,
          message: ADMIN_LOAD_MESSAGES.loadFailed,
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
