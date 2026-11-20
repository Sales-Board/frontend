"use client";

import {
  Database,
  LoaderCircle,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";

export interface ChatConversation {
  id: number;
  title: string;
  provider: string;
  model_id: string;
  created_at: string;
  updated_at: string;
}

export function AIChatHistory({
  conversations,
  conversationId,
  isLoading,
  deletingConversationId,
  onNewChat,
  onOpen,
  onDelete,
}: {
  conversations: ChatConversation[];
  conversationId: number | null;
  isLoading: boolean;
  deletingConversationId: number | null;
  onNewChat: () => void;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50 sm:flex">
        <div className="p-3">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Plus className="h-3.5 w-3.5" />
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            History
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-400">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Loading history
            </div>
          ) : conversations.length ? (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-center rounded-lg ${
                    conversation.id === conversationId
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(conversation.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-[11px]"
                    title={conversation.title}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{conversation.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(conversation.id)}
                    aria-label={`Delete ${conversation.title}`}
                    disabled={deletingConversationId === conversation.id}
                    title="Delete conversation"
                    className="mr-1 rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    {deletingConversationId === conversation.id ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-2 py-2 text-[11px] leading-relaxed text-slate-400">
              Your saved conversations will appear here.
            </p>
          )}
        </div>
        <div className="border-t border-slate-200 px-3 py-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            Uses your sales database
          </div>
        </div>
      </aside>

      {conversations.length > 0 ? (
        <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 px-3 py-2 sm:hidden">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex max-w-48 shrink-0 items-center rounded-md ${
                conversation.id === conversationId
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              <button
                type="button"
                onClick={() => onOpen(conversation.id)}
                title={conversation.title}
                className="min-w-0 truncate px-2.5 py-1.5 text-left text-[10px]"
              >
                {conversation.title}
              </button>
              <button
                type="button"
                onClick={() => onDelete(conversation.id)}
                aria-label={`Delete ${conversation.title}`}
                title="Delete conversation"
                disabled={deletingConversationId === conversation.id}
                className="mr-1 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                {deletingConversationId === conversation.id ? (
                  <LoaderCircle className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
