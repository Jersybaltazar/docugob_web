"use client";

/**
 * DocuGob — Compact AI usage chip row.
 *
 * Shows provider · model · cached · latency · tokens on the bottom of
 * the AI step. The data comes from `AIUsage` on every response. It's
 * here for transparency (so the user knows when a response was cached
 * vs. freshly generated) and to make Sprint 10's cost dashboard a
 * natural extension.
 */

import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Database } from "lucide-react";
import type { AIUsage } from "@/lib/api/types";

export function AIUsageBar({ usage }: { usage: AIUsage | null | undefined }) {
  if (!usage) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <Badge variant="secondary" className="gap-1">
        <Sparkles className="h-3 w-3" />
        {prettyProvider(usage.provider)} · {usage.model}
      </Badge>
      {usage.cached ? (
        <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
          <Database className="h-3 w-3" />
          Caché (sin costo)
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1">
          <Zap className="h-3 w-3" />
          {(usage.latency_ms / 1000).toFixed(1)}s
        </Badge>
      )}
      <span>
        {usage.input_tokens.toLocaleString()} tokens entrada ·{" "}
        {usage.output_tokens.toLocaleString()} salida
      </span>
    </div>
  );
}

function prettyProvider(name: string): string {
  switch (name) {
    case "gemini":
      return "Gemini";
    case "anthropic":
      return "Claude";
    case "groq":
      return "Groq";
    case "mock":
      return "Mock (dev)";
    default:
      return name;
  }
}
