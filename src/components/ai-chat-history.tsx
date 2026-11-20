"use client";

import { useEffect, useRef, useState } from "react";
import {
  Database,
  History,
  LoaderCircle,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react";

export interface ChatConversation {
  id: number;
  title: string;
  provider: string;
  model_id: string;
  created_at: string;
  updated_at: string;
}

interface ConversationListProps {
  conversations: ChatConversation[];
  conversationId: number | null;
  deletingConversationId: number | null;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  onSelect: () => void;
}

function ConversationList({
  conversations,
  conversationId,
  deletingConversationId,
  onOpen,
  onDelete,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`group flex items-center rounded-lg ${
            conversation.id === conversationId
              ? "bg-blue-50 text-blue-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onOpen(conversation.id);
              onSelect();
            }}
            className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-xs"
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
  );
}

export function AIChatHistory({
  conversations,
  conversationId,
  isLoading,
  deletingConversationId,
  onOpen,
  onDelete,
}: {
  conversations: ChatConversation[];
  conversationId: number | null;
  isLoading: boolean;
  deletingConversationId: number | null;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!historyRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDropdownOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const closeHistory = () => {
    setIsDropdownOpen(false);
    setIsPanelOpen(false);
  };
  const recentConversations = conversations.slice(0, 10);

  return (
    <>
      <div className="relative shrink-0" ref={historyRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((open) => !open)}
          aria-label="Conversation history"
          title="Conversation history"
          aria-expanded={isDropdownOpen}
          aria-haspopup="menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <History className="h-4 w-4" />
        </button>

        {isDropdownOpen ? (
          <div
            role="menu"
            aria-label="Recent conversations"
            className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Recent conversations
              </p>
              <span className="text-[10px] text-slate-400">
                {Math.min(conversations.length, 10)}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center gap-2 px-2 py-4 text-xs text-slate-400">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Loading history
                </div>
              ) : recentConversations.length ? (
                <ConversationList
                  conversations={recentConversations}
                  conversationId={conversationId}
                  deletingConversationId={deletingConversationId}
                  onOpen={onOpen}
                  onDelete={onDelete}
                  onSelect={() => setIsDropdownOpen(false)}
                />
              ) : (
                <p className="px-2 py-4 text-xs text-slate-400">
                  Your saved conversations will appear here.
                </p>
              )}
            </div>
            <div className="mt-1 border-t border-slate-100 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsPanelOpen(true);
                }}
                className="w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                View all conversations
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {isPanelOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close conversation history"
            onClick={closeHistory}
            className="absolute inset-0 bg-slate-900/30"
          />
          <aside
            aria-label="All conversations"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl"
          >
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Conversation history
                </h2>
                <p className="text-[10px] text-slate-500">
                  {conversations.length} saved{" "}
                  {conversations.length === 1 ? "conversation" : "conversations"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeHistory}
                aria-label="Close conversation history"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <div className="flex items-center gap-2 px-2 py-4 text-xs text-slate-400">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Loading history
                </div>
              ) : conversations.length ? (
                <ConversationList
                  conversations={conversations}
                  conversationId={conversationId}
                  deletingConversationId={deletingConversationId}
                  onOpen={onOpen}
                  onDelete={onDelete}
                  onSelect={() => setIsPanelOpen(false)}
                />
              ) : (
                <p className="px-2 py-4 text-xs text-slate-400">
                  Your saved conversations will appear here.
                </p>
              )}
            </div>

            <div className="border-t border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Database className="h-3.5 w-3.5 text-slate-400" />
                Uses your sales database
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
