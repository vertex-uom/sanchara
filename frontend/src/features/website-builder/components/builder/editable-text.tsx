"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";

// The block being drawn (set by BlockView).
export const BlockContext = createContext<{
  id: string;
  props: Record<string, string>;
} | null>(null);

// Set by the canvas: which block is selected and how to save text.
export const EditorContext = createContext<{
  selectedId: string | null;
  previewing: boolean;
  update: (blockId: string, key: string, value: string) => void;
  // Choices for a text's link (the booking section and the site's pages).
  links: string[];
} | null>(null);

// Whether the block's selected-for-editing state applies to this render.
function useEditing() {
  const block = useContext(BlockContext);
  const editor = useContext(EditorContext);
  return Boolean(
    block &&
    editor &&
    !editor.previewing &&
    editor.selectedId === block.id &&
    block.props.locked !== "true",
  );
}

// An empty field is shown while its block is edited (so it can be typed
// into) and left out otherwise.
export function useShowsField(field: string) {
  const block = useContext(BlockContext);
  const editing = useEditing();
  return Boolean(block?.props[field]) || editing;
}

const LEVELS = ["Heading 1", "Heading 2", "Heading 3", "Paragraph"] as const;
const LEVEL_SIZES: Record<(typeof LEVELS)[number], string> = {
  "Heading 1": "2.5rem",
  "Heading 2": "2rem",
  "Heading 3": "1.5rem",
  Paragraph: "1rem",
};
const ALIGNS = ["left", "center", "right"] as const;
const COLORS: { name: string; value: string; swatch: string }[] = [
  { name: "Default", value: "", swatch: "#94a3b8" },
  { name: "Primary", value: "primary", swatch: "var(--site-primary)" },
  { name: "Secondary", value: "secondary", swatch: "var(--site-secondary)" },
  { name: "Accent", value: "accent", swatch: "var(--site-accent)" },
  { name: "White", value: "white", swatch: "#ffffff" },
];
const COLOR_VALUES: Record<string, string> = {
  primary: "var(--site-primary)",
  secondary: "var(--site-secondary)",
  accent: "var(--site-accent)",
  white: "#ffffff",
};

type EditableTextProps = {
  // Prop of the block that holds the text.
  field: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  // Text inside a button or a line: Enter ends editing, no heading levels.
  inline?: boolean;
  // Shown in the level menu until one is chosen.
  defaultLevel?: (typeof LEVELS)[number];
  placeholder?: string;
};

// Block text that can be edited in place once its block is selected, with
// a toolbar that formats the whole text (level, bold, italic, underline,
// link, alignment and color). Formats are stored as "field:format" props.
export function EditableText({
  field,
  as = "p",
  className,
  inline,
  defaultLevel = "Paragraph",
  placeholder = "Type here",
}: EditableTextProps) {
  const block = useContext(BlockContext);
  const editor = useContext(EditorContext);
  const ref = useRef<HTMLParagraphElement>(null);
  const [focused, setFocused] = useState(false);
  const [panel, setPanel] = useState<"link" | "color" | null>(null);
  const props = block?.props ?? {};
  const value = props[field] ?? "";
  const editable = useEditing();

  // Typing owns the text while focused, so React does not reset the caret.
  useLayoutEffect(() => {
    const element = ref.current;
    if (
      element &&
      document.activeElement !== element &&
      element.innerText !== value
    ) {
      element.innerText = value;
    }
  }, [value, editable]);

  if (!value && !editable) return null;

  const format = (name: string) => props[`${field}:${name}`] ?? "";
  const set = (name: string, next: string) =>
    block && editor?.update(block.id, `${field}:${name}`, next);
  const level = (format("level") || defaultLevel) as (typeof LEVELS)[number];
  const align = (format("align") || "") as (typeof ALIGNS)[number] | "";
  const AlignIcon =
    align === "center"
      ? AlignCenter
      : align === "right"
        ? AlignRight
        : AlignLeft;

  const style: CSSProperties = {
    fontSize: format("level") ? LEVEL_SIZES[level] : undefined,
    fontWeight: format("bold") ? 700 : undefined,
    fontStyle: format("italic") ? "italic" : undefined,
    textDecoration: format("underline") ? "underline" : undefined,
    textAlign: align || undefined,
    color: COLOR_VALUES[format("color")],
  };

  function handleKey(event: KeyboardEvent<HTMLParagraphElement>) {
    if (event.key === "Escape" || (inline && event.key === "Enter")) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  // Keep the toolbar while focus moves into it (its level menu, link menu).
  function handleBlur(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setFocused(false);
      setPanel(null);
    }
  }

  // One tag type for typing; the text itself is set in the effect above.
  const Tag = as as "p";
  const element = (
    <Tag
      ref={ref}
      contentEditable={editable ? "plaintext-only" : undefined}
      suppressContentEditableWarning
      role={editable ? "textbox" : undefined}
      aria-label={editable ? placeholder : undefined}
      aria-multiline={editable && !inline ? true : undefined}
      data-placeholder={placeholder}
      onInput={(event) =>
        block && editor?.update(block.id, field, event.currentTarget.innerText)
      }
      onKeyDown={editable ? handleKey : undefined}
      onFocus={() => setFocused(true)}
      className={cn(
        "whitespace-pre-line",
        editable &&
          "cursor-text rounded-[3px] outline-none focus:bg-office-chart-bright/10 focus:outline-2 focus:outline-dashed focus:outline-office-chart-bright empty:before:opacity-50 empty:before:content-[attr(data-placeholder)]",
        className,
      )}
      style={style}
    />
  );

  if (!editable) return element;

  const toolButton =
    "focus-ring inline-flex size-7 items-center justify-center rounded-md text-office-icon hover:bg-office-chip";
  // Toolbar buttons keep focus in the text (mousedown would move it).
  const keepFocus = (event: { preventDefault: () => void }) =>
    event.preventDefault();

  return (
    <span
      className={cn("relative", inline ? "inline-block" : "block")}
      onBlur={handleBlur}
    >
      {focused ? (
        <span
          role="toolbar"
          aria-label="Text formatting"
          onClick={(event) => event.stopPropagation()}
          className="absolute bottom-full left-0 z-40 mb-2 flex items-center gap-0.5 rounded-lg border border-office-meter-track bg-white p-1 font-sans text-sm text-office-icon shadow-lg"
        >
          {inline ? null : (
            <>
              <label
                className="sr-only"
                htmlFor={`${block?.id}-${field}-level`}
              >
                Text level
              </label>
              <select
                id={`${block?.id}-${field}-level`}
                value={level}
                onChange={(event) => set("level", event.target.value)}
                className="focus-ring h-7 cursor-pointer rounded-md bg-transparent pr-1 pl-1.5 text-xs font-medium outline-none hover:bg-office-chip"
              >
                {LEVELS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <span
                aria-hidden="true"
                className="mx-0.5 h-5 w-px bg-office-meter-track"
              />
            </>
          )}
          <button
            type="button"
            aria-label="Bold"
            aria-pressed={Boolean(format("bold"))}
            onMouseDown={keepFocus}
            onClick={() => set("bold", format("bold") ? "" : "true")}
            className={cn(
              toolButton,
              format("bold") && "bg-office-tint-teal text-office-primary",
            )}
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Italic"
            aria-pressed={Boolean(format("italic"))}
            onMouseDown={keepFocus}
            onClick={() => set("italic", format("italic") ? "" : "true")}
            className={cn(
              toolButton,
              format("italic") && "bg-office-tint-teal text-office-primary",
            )}
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Underline"
            aria-pressed={Boolean(format("underline"))}
            onMouseDown={keepFocus}
            onClick={() => set("underline", format("underline") ? "" : "true")}
            className={cn(
              toolButton,
              format("underline") && "bg-office-tint-teal text-office-primary",
            )}
          >
            <Underline className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Link"
            aria-expanded={panel === "link"}
            onMouseDown={keepFocus}
            onClick={() => setPanel(panel === "link" ? null : "link")}
            className={cn(
              toolButton,
              format("link") && "bg-office-tint-teal text-office-primary",
            )}
          >
            <Link2 className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Align ${align || "left"} (click to change)`}
            onMouseDown={keepFocus}
            onClick={() =>
              set(
                "align",
                ALIGNS[(ALIGNS.indexOf(align || "left") + 1) % ALIGNS.length],
              )
            }
            className={toolButton}
          >
            <AlignIcon className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Text color"
            aria-expanded={panel === "color"}
            onMouseDown={keepFocus}
            onClick={() => setPanel(panel === "color" ? null : "color")}
            className={toolButton}
          >
            <span
              aria-hidden="true"
              className="size-3.5 rounded-full border border-black/15"
              style={{
                background:
                  COLORS.find((color) => color.value === format("color"))
                    ?.swatch ?? "#0b2240",
              }}
            />
          </button>

          {panel === "link" ? (
            <span className="absolute top-full left-0 mt-1 flex items-center gap-2 rounded-lg border border-office-meter-track bg-white p-2 shadow-lg">
              <label
                htmlFor={`${block?.id}-${field}-link`}
                className="text-xs whitespace-nowrap"
              >
                Link to
              </label>
              <select
                id={`${block?.id}-${field}-link`}
                value={format("link")}
                onChange={(event) => set("link", event.target.value)}
                className="focus-ring h-8 rounded-md border border-office-meter-track bg-card px-2 text-xs"
              >
                <option value="">No link</option>
                {editor?.links.map((link) => (
                  <option key={link}>{link}</option>
                ))}
              </select>
            </span>
          ) : null}
          {panel === "color" ? (
            <span className="absolute top-full right-0 mt-1 flex gap-1.5 rounded-lg border border-office-meter-track bg-white p-2 shadow-lg">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  aria-label={color.name}
                  aria-pressed={format("color") === color.value}
                  onMouseDown={keepFocus}
                  onClick={() => set("color", color.value)}
                  className={cn(
                    "focus-ring size-6 rounded-full border border-black/15",
                    format("color") === color.value &&
                      "ring-2 ring-office-primary ring-offset-1",
                  )}
                  style={{ background: color.swatch }}
                />
              ))}
            </span>
          ) : null}
        </span>
      ) : null}
      {element}
    </span>
  );
}
