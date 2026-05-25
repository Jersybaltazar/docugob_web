"use client";

/**
 * DocuGob — TipTap rich-text editor for the document body.
 *
 * TDR §7.2: editor del cuerpo debe sentirse como Word (negrita, cursiva,
 * viñetas, headings). The visual formatting is a UX aid for the user
 * while drafting — the final .docx layout comes from the template, so
 * we don't try to round-trip every formatting choice into the file.
 *
 * Props:
 *  - `value` / `onChange`: HTML string (controlled).
 *  - `placeholder`: shown when empty.
 *  - `editable`: lock the editor while an AI call is in flight.
 */

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  /** Approximate max characters shown in the counter at the bottom. */
  characterLimit?: number;
};

export function TiptapEditor({
  value,
  onChange,
  placeholder = "Comienza a redactar el cuerpo del documento aquí...",
  editable = true,
  className,
  characterLimit = 8000,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false, // Next 16 / RSC compatibility
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // The default code/codeBlock extensions are unnecessary for
        // administrative documents.
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: characterLimit }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base max-w-none min-h-[260px] px-4 py-3",
          "focus:outline-none",
          // Make admin-document headings feel deliberate without
          // shouting; keeps the editor closer to Word visually.
          "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-wide",
          "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide",
          "[&_p]:my-2"
        ),
        "aria-label": "Cuerpo del documento",
      },
    },
  });

  // Sync external value changes (e.g., AI just returned a new draft)
  // without losing focus when the user is typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) {
    return (
      <div className="rounded-md border bg-card">
        <div className="h-12 border-b bg-muted/30" />
        <div className="min-h-[260px] px-4 py-3 text-sm text-muted-foreground">
          Cargando editor…
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border bg-card focus-within:ring-2 focus-within:ring-ring/40 transition-shadow",
        !editable && "opacity-60 pointer-events-none",
        className
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <CharacterFooter editor={editor} limit={characterLimit} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        icon={<Bold className="h-3.5 w-3.5" />}
        label="Negrita (Ctrl+B)"
      />
      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        icon={<Italic className="h-3.5 w-3.5" />}
        label="Cursiva (Ctrl+I)"
      />
      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        icon={<UnderlineIcon className="h-3.5 w-3.5" />}
        label="Subrayado (Ctrl+U)"
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        icon={<Heading2 className="h-3.5 w-3.5" />}
        label="Título de sección (ej. ANTECEDENTES)"
      />
      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        icon={<Heading3 className="h-3.5 w-3.5" />}
        label="Subtítulo"
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        icon={<List className="h-3.5 w-3.5" />}
        label="Viñetas"
      />
      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        icon={<ListOrdered className="h-3.5 w-3.5" />}
        label="Lista numerada"
      />
      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        icon={<Quote className="h-3.5 w-3.5" />}
        label="Cita"
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        icon={<Undo className="h-3.5 w-3.5" />}
        label="Deshacer (Ctrl+Z)"
      />
      <ToolButton
        editor={editor}
        action={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        icon={<Redo className="h-3.5 w-3.5" />}
        label="Rehacer (Ctrl+Y)"
      />
    </div>
  );
}

function ToolButton({
  action,
  active,
  disabled,
  icon,
  label,
}: {
  editor: Editor;
  action: () => void;
  active?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={active}
          data-active={active ? "true" : undefined}
          disabled={disabled}
          onClick={action}
          className={cn(
            "rounded data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
          )}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function CharacterFooter({
  editor,
  limit,
}: {
  editor: Editor;
  limit: number;
}) {
  const chars = editor.storage.characterCount.characters() as number;
  const words = editor.storage.characterCount.words() as number;
  const remaining = limit - chars;
  const warn = remaining < 200;
  return (
    <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
      <span>
        {words} palabra{words === 1 ? "" : "s"} · {chars} caracteres
      </span>
      <span className={cn(warn && "text-destructive")}>
        {remaining >= 0
          ? `${remaining} caracteres restantes`
          : `${Math.abs(remaining)} caracteres por encima del límite`}
      </span>
    </div>
  );
}
