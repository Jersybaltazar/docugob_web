"use client";

/**
 * DocuGob — FormGenerator (AUDIT §5.1).
 *
 * A single component that renders Label + Input | Textarea | Select +
 * inline error message for a react-hook-form field. Keeps the form
 * authoring sites focused on the schema and orchestration hook —
 * never on Tailwind classes per input.
 *
 * Usage:
 *   <FormGenerator
 *     inputType="input"
 *     name="email"
 *     label="Correo electrónico"
 *     type="email"
 *     register={register}
 *     errors={errors}
 *   />
 *
 * For selects, pass `options` as `{ value, label }[]`. The component
 * stays uncontrolled — react-hook-form owns the value via `register`.
 */

import * as React from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SelectOption = { value: string; label: string };

type CommonProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  /** Pass-through HTML id (defaults to the field name). */
  id?: string;
  /** Optional autocomplete hint. */
  autoComplete?: string;
  /** When true, render with autoFocus. */
  autoFocus?: boolean;
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean;
  /** Class applied to the field wrapper. */
  className?: string;
};

type InputProps<T extends FieldValues> = CommonProps<T> & {
  inputType: "input";
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

type PasswordProps<T extends FieldValues> = CommonProps<T> & {
  inputType: "password";
};

type TextareaProps<T extends FieldValues> = CommonProps<T> & {
  inputType: "textarea";
  rows?: number;
};

type SelectProps<T extends FieldValues> = CommonProps<T> & {
  inputType: "select";
  options: SelectOption[];
};

type FormGeneratorProps<T extends FieldValues> =
  | InputProps<T>
  | PasswordProps<T>
  | TextareaProps<T>
  | SelectProps<T>;

function getError<T extends FieldValues>(
  errors: FieldErrors<T>,
  name: Path<T>
): string | undefined {
  // RHF nests errors by dot-path; for now we only support flat names.
  const node = errors[name];
  const message = (node as { message?: unknown } | undefined)?.message;
  return typeof message === "string" ? message : undefined;
}

export function FormGenerator<T extends FieldValues>(
  props: FormGeneratorProps<T>
): React.ReactElement {
  const {
    name,
    label,
    description,
    placeholder,
    register,
    errors,
    id,
    autoComplete,
    autoFocus,
    hideLabel,
    className,
  } = props;

  const fieldId = id ?? String(name);
  const error = getError(errors, name);
  const errorId = `${fieldId}-error`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const describedBy =
    [error ? errorId : null, descriptionId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={fieldId} className={hideLabel ? "sr-only" : undefined}>
          {label}
        </Label>
      )}

      {props.inputType === "input" && (
        <Input
          id={fieldId}
          type={props.type ?? "text"}
          inputMode={props.inputMode}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...register(name)}
        />
      )}

      {props.inputType === "password" && (
        <PasswordInput
          id={fieldId}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...register(name)}
        />
      )}

      {props.inputType === "textarea" && (
        <Textarea
          id={fieldId}
          rows={props.rows}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...register(name)}
        />
      )}

      {props.inputType === "select" && (
        <select
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
            "dark:bg-input/30"
          )}
          {...register(name)}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {props.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {description && !error && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
