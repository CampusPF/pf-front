"use client";

import { MessageCircle, Users } from "lucide-react";

import UserAvatar from "@/components/ui/UserAvatar";
import { formatRelativeTime } from "@/lib/chat-utils";
import type { ChatConversation } from "@/types/chat.types";

export default function ChatConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: ChatConversation[];
  selectedId: string | null;
  onSelect: (conversation: ChatConversation) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <MessageCircle className="text-text-muted size-8" aria-hidden />
        <p className="text-text-muted text-sm">Todavía no tenés conversaciones.</p>
      </div>
    );
  }

  return (
    <ul className="divide-border divide-y">
      {conversations.map((conversation) => {
        const isActive = conversation.id === selectedId;
        const hasUnread = conversation.unreadCount > 0;

        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation)}
              aria-current={isActive ? "true" : undefined}
              className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                isActive ? "bg-primary-subtle" : "hover:bg-surface-elevated"
              }`}
            >
              {conversation.kind === "group" ? (
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Users className="size-5" aria-hidden />
                </span>
              ) : (
                <UserAvatar
                  name={conversation.title}
                  avatarUrl={conversation.avatarUrl}
                  className="size-10 text-sm"
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-text truncate text-sm ${hasUnread ? "font-semibold" : "font-medium"}`}
                  >
                    {conversation.title}
                  </p>
                  {conversation.lastMessage && (
                    <span className="text-text-muted shrink-0 text-[11px]">
                      {formatRelativeTime(conversation.lastMessage.sentAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-xs ${hasUnread ? "text-text-secondary" : "text-text-muted"}`}
                  >
                    {conversation.lastMessage ? conversation.lastMessage.text : conversation.subtitle}
                  </p>
                  {hasUnread && (
                    <span className="bg-primary-solid flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
