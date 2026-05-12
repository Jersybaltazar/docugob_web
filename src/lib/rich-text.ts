/**
 * DocuGob — HTML ↔ plain text helpers.
 *
 * The backend stores `ai_generated_body` as plain text. The TipTap editor
 * emits HTML. These helpers bridge the two without dragging in a heavy
 * sanitizer dependency:
 *
 *  - `htmlToText(html)`: serializes HTML into the same plain-text shape
 *    that docxtpl will render in the .docx (paragraphs as blank-line-
 *    separated blocks, list items as "- item" lines).
 *  - `textToHtml(text)`: hydrates plain text back into the simple HTML
 *    structure TipTap expects (each blank-line block becomes a <p>).
 *
 * The round-trip is lossy by design: bold/italic/underline are visual
 * helpers in the editor but never affect the generated .docx (the
 * template controls the typography).
 */

/** Convert TipTap-style HTML to the plain text we send to the API. */
export function htmlToText(html: string): string {
  if (!html) return "";

  // Use DOMParser in the browser; on the server we fall back to a tiny
  // regex-based stripper (this code path only runs in client components
  // for the wizard, so the simple fallback is enough as a safety net).
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li>/gi, "- ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const doc = new DOMParser().parseFromString(html, "text/html");

  const visit = (node: Node, lines: string[]) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        lines[lines.length - 1] += child.textContent ?? "";
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "p" || tag === "div") {
        lines.push("");
        visit(el, lines);
        lines.push("");
        return;
      }
      if (tag === "br") {
        lines.push("");
        return;
      }
      if (tag === "h1" || tag === "h2" || tag === "h3") {
        lines.push("");
        const start = lines.length - 1;
        visit(el, lines);
        // Uppercase the heading text — matches admin-document conventions
        // (ANTECEDENTES, ANÁLISIS, etc.).
        lines[start] = lines[start].toUpperCase();
        lines.push("");
        return;
      }
      if (tag === "ul" || tag === "ol") {
        lines.push("");
        Array.from(el.children).forEach((li, idx) => {
          const prefix = tag === "ol" ? `${idx + 1}. ` : "- ";
          lines.push(prefix);
          visit(li as HTMLElement, lines);
        });
        lines.push("");
        return;
      }
      // Inline formatting (b/i/u/strong/em/span) — just take the text.
      visit(el, lines);
    });
  };

  const lines: string[] = [""];
  visit(doc.body, lines);

  return lines
    .map((l) => l.trimEnd())
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Hydrate plain text into the minimal HTML structure TipTap expects. */
export function textToHtml(text: string): string {
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Detect a list block (every non-empty line starts with "- " or "n. ").
      const lines = trimmed.split("\n");
      const isBulletList = lines.every((l) => /^\s*-\s+/.test(l));
      const isNumberedList = lines.every((l) => /^\s*\d+\.\s+/.test(l));
      if (isBulletList) {
        return `<ul>${lines
          .map((l) => `<li>${escapeHtml(l.replace(/^\s*-\s+/, ""))}</li>`)
          .join("")}</ul>`;
      }
      if (isNumberedList) {
        return `<ol>${lines
          .map((l) => `<li>${escapeHtml(l.replace(/^\s*\d+\.\s+/, ""))}</li>`)
          .join("")}</ol>`;
      }
      // Regular paragraph: preserve single-newlines as <br>.
      const html = lines
        .map((l) => escapeHtml(l))
        .join("<br>");
      return `<p>${html}</p>`;
    })
    .filter(Boolean)
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
