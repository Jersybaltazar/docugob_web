/**
 * DocuGob — Formatting helpers (i18n es-PE).
 *
 * Centralized so the date/number/currency formats match the rest of
 * the platform (legal docs always read "5 de mayo de 2026").
 */

const dateShortFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateLongFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const penFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function safeDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const format = {
  dateShort(input: string | Date | null | undefined): string {
    const d = safeDate(input);
    return d ? dateShortFormatter.format(d) : "—";
  },
  dateLong(input: string | Date | null | undefined): string {
    const d = safeDate(input);
    return d ? dateLongFormatter.format(d) : "—";
  },
  dateTime(input: string | Date | null | undefined): string {
    const d = safeDate(input);
    return d ? dateTimeFormatter.format(d) : "—";
  },
  /** Format a centavos amount as "S/19.90". */
  cents(cents: number): string {
    return penFormatter.format(cents / 100);
  },
};
