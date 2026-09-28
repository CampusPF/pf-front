import { splitMessageParts } from "@/lib/ai-tutor-utils";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export default function ChatMessage({ message }: { message: ChatMessageData }) {
  if (message.role === "user") {
    return (
      <p className="bg-primary-solid ml-auto max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm whitespace-pre-wrap text-white">
        {message.text}
      </p>
    );
  }

  // Respuesta en streaming que todavía no trajo la primera palabra.
  if (message.text === "") {
    return (
      <p className="bg-surface-elevated border-border text-text-muted max-w-[92%] animate-pulse rounded-2xl rounded-tl-sm border px-3 py-2 text-sm">
        Escribiendo…
      </p>
    );
  }

  // La respuesta del tutor puede traer bloques ```de código```, con texto
  // antes y/o después — no un único `code` fijo al final como antes.
  const parts = splitMessageParts(message.text);

  return (
    <div className="bg-surface-elevated border-border max-w-[92%] space-y-3 rounded-2xl rounded-tl-sm border px-3 py-2">
      {parts.map((part, index) =>
        part.kind === "code" ? (
          <div key={index} className="relative">
            {part.lang && (
              <span className="text-text-muted absolute top-1.5 right-2.5 font-mono text-[10px] uppercase">
                {part.lang}
              </span>
            )}
            <pre className="bg-surface border-border text-text-secondary overflow-x-auto rounded-lg border p-3 font-mono text-xs">
              <code>{part.code}</code>
            </pre>
          </div>
        ) : (
          <p key={index} className="text-text-secondary text-sm whitespace-pre-wrap">
            {part.text}
          </p>
        ),
      )}
    </div>
  );
}
