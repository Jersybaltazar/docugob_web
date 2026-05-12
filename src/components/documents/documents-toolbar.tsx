"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { DocumentStatus, DocumentType } from "@/lib/api/types";
import { DOCUMENT_STATUS_LABEL, DOCUMENT_TYPES } from "@/lib/document-types";
import { Button } from "@/components/ui/button";

export type DocumentsToolbarValue = {
  search: string;
  document_type?: DocumentType | "all";
  status?: DocumentStatus | "all";
};

export function DocumentsToolbar({
  value,
  onChange,
}: {
  value: DocumentsToolbarValue;
  onChange: (next: DocumentsToolbarValue) => void;
}) {
  // Local search input is debounced before bubbling up — avoids one
  // API call per keystroke.
  const [search, setSearch] = useState(value.search);

  useEffect(() => {
    setSearch(value.search);
  }, [value.search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (search !== value.search) onChange({ ...value, search });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters =
    Boolean(value.search) ||
    (value.document_type && value.document_type !== "all") ||
    (value.status && value.status !== "all");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Buscar por título"
          placeholder="Buscar por título..."
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={value.document_type ?? "all"}
          onValueChange={(v) =>
            onChange({
              ...value,
              document_type: v === "all" ? "all" : (v as DocumentType),
            })
          }
        >
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por tipo">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {DOCUMENT_TYPES.map((t) => (
              <SelectItem key={t.code} value={t.code}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.status ?? "all"}
          onValueChange={(v) =>
            onChange({
              ...value,
              status: v === "all" ? "all" : (v as DocumentStatus),
            })
          }
        >
          <SelectTrigger className="w-[150px]" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(DOCUMENT_STATUS_LABEL).map(([code, label]) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({ search: "", document_type: "all", status: "all" })
            }
            aria-label="Limpiar filtros"
          >
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
