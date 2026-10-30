import { useId } from "react";
import type { ReactNode } from "react";
import { joinClassNames } from "./class-names";

export const FIELD_CONTROL_CLASS_NAME =
  "rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500 aria-invalid:border-red-600 aria-invalid:focus-visible:outline-red-600";

export type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

type FieldControlProps = {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
};

type FieldLayoutProps = FieldProps & {
  id: string | undefined;
  className: string | undefined;
  children: (controlProps: FieldControlProps) => ReactNode;
};

export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FieldLayoutProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const hasHint = Boolean(hint);
  const hasError = Boolean(error);
  const describedBy = [hasHint && hintId, hasError && errorId]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={joinClassNames("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={controlId}
        className="text-sm font-medium text-neutral-900"
      >
        {label}
      </label>
      {children({
        id: controlId,
        "aria-invalid": hasError || undefined,
        "aria-describedby": describedBy || undefined,
      })}
      {hasHint ? (
        <p id={hintId} className="text-sm text-neutral-500">
          {hint}
        </p>
      ) : null}
      {hasError ? (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
