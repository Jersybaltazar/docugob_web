import { Badge } from "@/components/ui/badge";
import type { DocumentStatus } from "@/lib/api/types";
import { DOCUMENT_STATUS_LABEL } from "@/lib/document-types";

const VARIANT: Record<
  DocumentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "outline",
  generated: "default",
  reviewed: "secondary",
  signed: "secondary",
  archived: "secondary",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const variant = VARIANT[status] ?? "secondary";
  const label = DOCUMENT_STATUS_LABEL[status] ?? status;
  return <Badge variant={variant}>{label}</Badge>;
}
