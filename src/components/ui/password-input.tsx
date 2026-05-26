"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  /** Accessible label for the toggle button (shown to screen readers). */
  toggleLabel?: { show: string; hide: string };
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput(
  {
    className,
    toggleLabel = { show: "Mostrar contraseña", hide: "Ocultar contraseña" },
    disabled,
    ...props
  },
  ref,
) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-9", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? toggleLabel.hide : toggleLabel.show}
        aria-pressed={visible}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex h-full w-9 items-center justify-center",
          "text-muted-foreground transition-colors hover:text-foreground",
          "focus-visible:text-foreground focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {visible ? (
          <EyeOff aria-hidden className="size-4" />
        ) : (
          <Eye aria-hidden className="size-4" />
        )}
      </button>
    </div>
  );
});
