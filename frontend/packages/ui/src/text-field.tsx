import type { ComponentProps } from "react";
import { joinClassNames } from "./class-names";
import { Field, FIELD_CONTROL_CLASS_NAME } from "./field";
import type { FieldProps } from "./field";

type TextFieldProps = Omit<ComponentProps<"input">, "children"> & FieldProps;

export function TextField({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: TextFieldProps) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      {(controlProps) => (
        <input
          {...props}
          {...controlProps}
          className={joinClassNames("h-10", FIELD_CONTROL_CLASS_NAME)}
        />
      )}
    </Field>
  );
}
