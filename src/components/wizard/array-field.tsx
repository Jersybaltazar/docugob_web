"use client";

/**
 * DocuGob — Repeating group control for FieldSpec.kind === "array".
 *
 * Used today by `destinatarios[]` on Oficio Múltiple. Each row renders
 * the inner FieldSpec[] (nombre, cargo, entidad) and a remove button.
 * The "Agregar destinatario" button appends a fresh empty row.
 *
 * We rely on react-hook-form's `useFieldArray` for stable row keys,
 * insert/remove ergonomics, and validation propagation.
 */

import { Plus, Trash2 } from "lucide-react";
import {
  type Control,
  type FieldErrors,
  useFieldArray,
  useFormContext,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DynamicField } from "./dynamic-field";
import { placeholderFor, type FieldSpec } from "@/lib/form-schema";

type Props = {
  spec: FieldSpec;
};

export function ArrayField({ spec }: Props) {
  const { control, register, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control: control as Control,
    name: `content_data.${spec.name}`,
  });

  const itemSpecs = spec.itemFields ?? [];
  const errors = formState.errors as FieldErrors;
  const groupError = (errors as Record<string, { message?: string }>)?.[
    `content_data.${spec.name}` as string
  ]?.message;

  const emptyItem = () =>
    Object.fromEntries(itemSpecs.map((f) => [f.name, ""]));

  const addRow = () => append(emptyItem());

  const minItems = spec.minItems ?? (spec.required ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h4 className="text-sm font-medium">{spec.label}</h4>
          {spec.description && (
            <p className="text-xs text-muted-foreground">{spec.description}</p>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Agregar
        </Button>
      </div>

      {fields.length === 0 ? (
        <button
          type="button"
          onClick={addRow}
          className="w-full rounded-md border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <Plus className="mr-1 inline h-4 w-4" />
          Agregar el primer destinatario
        </button>
      ) : (
        <ol className="space-y-3">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="rounded-md border bg-background/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  #{index + 1}
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => remove(index)}
                  disabled={fields.length <= minItems && minItems > 0}
                  aria-label={`Eliminar destinatario ${index + 1}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {itemSpecs.map((itemSpec) => {
                  const path = `content_data.${spec.name}.${index}.${itemSpec.name}` as const;
                  const itemError = getNestedError(errors, path);
                  return (
                    <DynamicField
                      key={path}
                      spec={itemSpec}
                      registration={register(path)}
                      error={itemError}
                      placeholder={placeholderFor(itemSpec.name)}
                    />
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}

      {minItems > 0 && fields.length < minItems && (
        <p className="text-sm text-destructive">
          Agrega al menos {minItems}{" "}
          {minItems === 1 ? "destinatario" : "destinatarios"}.
        </p>
      )}
      {groupError && <p className="text-sm text-destructive">{groupError}</p>}
    </div>
  );
}

// react-hook-form returns nested errors as a tree (errors.content_data.destinatarios.0.nombre).
// This helper walks that tree using a dot-path key.
function getNestedError(
  errors: FieldErrors,
  path: string
): string | undefined {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = errors;
  for (const part of parts) {
    if (!node) return undefined;
    node = node[part];
  }
  return node?.message as string | undefined;
}
