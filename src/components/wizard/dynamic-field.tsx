"use client";

/**
 * DocuGob — Renderer for a single `FieldSpec`.
 *
 * Owns the label, the underlying control (Input or Textarea), the
 * placeholder hint and the error display. Stays decoupled from the
 * form library by accepting plain `register`-returned props plus an
 * optional error message.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type FieldSpec, placeholderFor } from "@/lib/form-schema";
import type { UseFormRegisterReturn } from "react-hook-form";

export type DynamicFieldProps = {
  spec: FieldSpec;
  registration: UseFormRegisterReturn;
  error?: string;
  /** Override placeholder text (used inside ArrayField). */
  placeholder?: string;
};

export function DynamicField({
  spec,
  registration,
  error,
  placeholder,
}: DynamicFieldProps) {
  const id = registration.name.replace(/\./g, "-");
  const ph = placeholder ?? placeholderFor(spec.name) ?? "";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {spec.label}
        {spec.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {spec.kind === "textarea" ? (
        <Textarea
          id={id}
          rows={spec.name === "cuerpo" ? 6 : 3}
          maxLength={spec.maxLength}
          placeholder={ph}
          aria-invalid={!!error}
          {...registration}
        />
      ) : (
        <Input
          id={id}
          maxLength={spec.maxLength}
          placeholder={ph}
          aria-invalid={!!error}
          {...registration}
        />
      )}
      {spec.description && !error && (
        <p className="text-xs text-muted-foreground">{spec.description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
