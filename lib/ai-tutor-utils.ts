/* Separa la respuesta del tutor en partes de texto y de código, para poder
   mostrar los bloques ```cercados``` con su propio estilo dentro de la
   burbuja del chat. No es un parser de markdown completo (para eso está
   components/lesson-player/MarkdownRenderer.tsx, pensado para el artículo
   entero de una lección, con headings y demás — demasiado espaciado para una
   burbuja angosta de 320px): sólo separa texto de código, que es lo único
   que una respuesta de chat necesita. */

export type MessagePart =
  | { kind: "text"; text: string }
  | { kind: "code"; code: string; lang: string };

export function splitMessageParts(content: string): MessagePart[] {
  const segments = content.split("```");
  const parts: MessagePart[] = [];

  segments.forEach((segment, index) => {
    // Los índices impares son el interior de un bloque cercado.
    if (index % 2 === 1) {
      const newline = segment.indexOf("\n");
      const lang = newline === -1 ? "" : segment.slice(0, newline).trim();
      const code = (newline === -1 ? segment : segment.slice(newline + 1)).replace(/\s+$/, "");
      if (code) parts.push({ kind: "code", code, lang });
      return;
    }

    const text = segment.trim();
    if (text) parts.push({ kind: "text", text });
  });

  // Un mensaje sin ``` en absoluto: un único part de texto, aunque esté vacío.
  return parts.length > 0 ? parts : [{ kind: "text", text: content }];
}
