import type { ComponentProps } from "react";
import { joinClassNames } from "./class-names";
import { Field, FIELD_CONTROL_CLASS_NAME } from "./field";
import type { FieldProps } from "./field";

type TextareaFieldProps = Omit<ComponentProps<"textarea">, "children"> &
  FieldProps;

export function TextareaField({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      {(controlProps) => (
        <textarea
          {...props}
          {...controlProps}
          className={joinClassNames("resize-y py-2", FIELD_CONTROL_CLASS_NAME)}
        />
      )}
    </Field>
  );
}
