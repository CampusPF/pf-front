import type { ReactNode } from "react";

/* TODO(campus): renderer mínimo de markdown, hecho a mano a propósito.
   El plan es reemplazarlo por:

     <article className="prose prose-invert max-w-none">
       <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
         {markdown}
       </ReactMarkdown>
     </article>

   pero `react-markdown`, `remark-gfm`, `rehype-highlight` y
   `@tailwindcss/typography` todavía no están instalados y el build fallaría al
   importarlos. Cubre headings, listas, citas, énfasis, código inline y bloques
   cercados — alcanza para el contenido de `data/lesson-content.mock.ts`.
   Lo que no hace: syntax highlighting ni tablas de GFM. */

type Block =
  | { kind: "code"; lang: string; code: string }
  | { kind: "heading"; level: number; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "paragraph"; text: string };

const INLINE_PATTERN = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(INLINE_PATTERN)
    .filter(Boolean)
    .map((chunk, index) => {
      const key = `${keyPrefix}-${index}`;

      if (chunk.startsWith("`") && chunk.endsWith("`")) {
        return (
          <code
            key={key}
            className="bg-surface-elevated text-primary rounded px-1.5 py-0.5 font-mono text-[0.9em]"
          >
            {chunk.slice(1, -1)}
          </code>
        );
      }

      if (chunk.startsWith("**") && chunk.endsWith("**")) {
        return (
          <strong key={key} className="text-text font-semibold">
            {chunk.slice(2, -2)}
          </strong>
        );
      }

      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(chunk);
      if (link) {
        return (
          <a
            key={key}
            href={link[2]}
            className="text-primary hover:text-primary-hover cursor-pointer underline underline-offset-2 transition-colors duration-150"
          >
            {link[1]}
          </a>
        );
      }

      return <span key={key}>{chunk}</span>;
    });
}

function parseTextBlock(chunk: string): Block {
  const heading = /^(#{1,4})\s+(.*)$/.exec(chunk);
  if (heading) {
    return { kind: "heading", level: heading[1].length, text: heading[2] };
  }

  const lines = chunk.split("\n").map((line) => line.trim());

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return {
      kind: "list",
      ordered: false,
      items: lines.map((line) => line.replace(/^[-*]\s+/, "")),
    };
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return {
      kind: "list",
      ordered: true,
      items: lines.map((line) => line.replace(/^\d+\.\s+/, "")),
    };
  }

  if (lines.every((line) => line.startsWith(">"))) {
    return {
      kind: "quote",
      text: lines.map((line) => line.replace(/^>\s?/, "")).join(" "),
    };
  }

  return { kind: "paragraph", text: lines.join(" ") };
}

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];

  // Los índices impares del split son el interior de un bloque cercado con ```.
  markdown.split("```").forEach((segment, index) => {
    if (index % 2 === 1) {
      const newline = segment.indexOf("\n");
      const lang = newline === -1 ? "" : segment.slice(0, newline).trim();
      const code = newline === -1 ? segment : segment.slice(newline + 1);

      blocks.push({ kind: "code", lang, code: code.replace(/\s+$/, "") });
      return;
    }

    segment
      .split(/\n\s*\n/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .forEach((chunk) => blocks.push(parseTextBlock(chunk)));
  });

  return blocks;
}

const HEADING_STYLES: Record<number, string> = {
  1: "text-text mt-10 text-2xl font-bold",
  2: "text-text mt-10 text-xl font-bold",
  3: "text-text mt-8 text-lg font-semibold",
  4: "text-text mt-6 font-semibold",
};

export default function MarkdownRenderer({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown);

  return (
    <div className="text-text-secondary space-y-4 leading-relaxed">
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        switch (block.kind) {
          case "code":
            return (
              <div key={key} className="relative">
                {block.lang && (
                  <span className="text-text-muted absolute top-2.5 right-3 font-mono text-xs uppercase">
                    {block.lang}
                  </span>
                )}
                <pre className="bg-surface-elevated border-border text-text-secondary overflow-x-auto rounded-lg border p-4 font-mono text-sm">
                  <code>{block.code}</code>
                </pre>
              </div>
            );

          case "heading": {
            // El h1 de la página es el título de la lección: el markdown arranca en h2.
            const Tag = `h${Math.min(Math.max(block.level, 2), 6)}` as "h2";
            return (
              <Tag key={key} className={HEADING_STYLES[block.level]}>
                {renderInline(block.text, key)}
              </Tag>
            );
          }

          case "list": {
            const ListTag = block.ordered ? "ol" : "ul";
            return (
              <ListTag
                key={key}
                className={`ml-5 space-y-2 ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`} className="pl-1">
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </ListTag>
            );
          }

          case "quote":
            return (
              <blockquote
                key={key}
                className="border-primary text-text-muted border-l-2 pl-4 italic"
              >
                {renderInline(block.text, key)}
              </blockquote>
            );

          default:
            return <p key={key}>{renderInline(block.text, key)}</p>;
        }
      })}
    </div>
  );
}
