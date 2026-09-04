export interface ChatMessageData {
  id: string;
  role: "user" | "tutor";
  text: string;
  /** Bloque de código opcional que acompaña a la respuesta del tutor. */
  code?: string;
}

export default function ChatMessage({ message }: { message: ChatMessageData }) {
  if (message.role === "user") {
    return (
      <p className="bg-primary ml-auto max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white">
        {message.text}
      </p>
    );
  }

  return (
    <div className="bg-surface-elevated border-border max-w-[92%] space-y-3 rounded-2xl rounded-tl-sm border px-3 py-2">
      <p className="text-text-secondary text-sm">{message.text}</p>

      {message.code && (
        <pre className="bg-surface border-border text-text-secondary overflow-x-auto rounded-lg border p-3 font-mono text-xs">
          <code>{message.code}</code>
        </pre>
      )}
    </div>
  );
}
