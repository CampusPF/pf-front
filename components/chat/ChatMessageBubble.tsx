import { formatMessageTime } from "@/lib/chat-utils";
import type { ChatMessage } from "@/types/chat.types";

export default function ChatMessageBubble({
  message,
  isMine,
  showAuthor,
}: {
  message: ChatMessage;
  isMine: boolean;
  /** En la sala grupal hay más de dos voces: se aclara quién escribió. */
  showAuthor: boolean;
}) {
  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      {showAuthor && (
        <span className="text-text-muted mb-1 px-1 text-xs font-medium">{message.author.name}</span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm sm:max-w-[70%] ${
          isMine
            ? "bg-primary-solid rounded-tr-sm text-white"
            : "bg-surface-elevated border-border rounded-tl-sm border text-text"
        }`}
      >
        <p className="wrap-break-word whitespace-pre-wrap">{message.text}</p>
      </div>
      <span className="text-text-muted mt-1 px-1 text-[11px]">{formatMessageTime(message.sentAt)}</span>
    </div>
  );
}
