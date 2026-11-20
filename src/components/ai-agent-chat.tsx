"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  AlertCircle,
  LoaderCircle,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import {
  AIChatModelPicker,
  CHAT_MODEL_OPTIONS,
} from "@/components/ai-chat-model-picker";
import type { ChatModel } from "@/components/ai-chat-model-picker";
import { AIChatHistory } from "@/components/ai-chat-history";
import type { ChatConversation } from "@/components/ai-chat-history";
import { AIChatResponse } from "@/components/ai-chat-response";

interface ChatMessage {
  id: number | string;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  model_id: string | null;
  created_at: string;
}

interface ChatConversationDetail extends ChatConversation {
  messages: ChatMessage[];
}

interface ChatTurn {
  conversation: ChatConversation;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

const CHAT_API = "/api/ai/chat";
const INITIAL_MODEL = "openai/gpt-oss-20b";
const SUGGESTIONS = [
  "Summarize our current lead pipeline",
  "Which lead statuses should we focus on?",
  "What products and campaigns are in the database?",
];

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return payload as T;
}

export function AIAgentChat() {
  const [models, setModels] = useState<ChatModel[]>(CHAT_MODEL_OPTIONS);
  const [modelStatusLoaded, setModelStatusLoaded] = useState(false);
  const [modelStatusAvailable, setModelStatusAvailable] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [modelId, setModelId] = useState(INITIAL_MODEL);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void requestJson<ChatModel[]>(`${CHAT_API}/models`)
      .then((availableModels) => {
        if (!active) return;
        const statusById = new Map(
          availableModels.map((model) => [model.model_id, model.configured]),
        );
        setModels(
          CHAT_MODEL_OPTIONS.map((model) => ({
            ...model,
            configured: statusById.get(model.model_id) ?? false,
          })),
        );
        setModelStatusLoaded(true);
        setModelStatusAvailable(true);
        const preferred = availableModels.find((model) => model.configured);
        if (preferred) setModelId(preferred.model_id);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load model status.");
          setModelStatusLoaded(true);
        }
      });

    void requestJson<ChatConversation[]>(`${CHAT_API}/conversations`)
      .then((savedConversations) => {
        if (active) setConversations(savedConversations);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load conversation history.");
        }
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  };

  const openConversation = async (id: number) => {
    setError(null);
    try {
      const conversation = await requestJson<ChatConversationDetail>(
        `${CHAT_API}/conversations/${id}`,
      );
      setConversationId(conversation.id);
      setMessages(conversation.messages);
      setModelId(conversation.model_id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open this chat.");
    }
  };

  const removeConversation = async (id: number) => {
    if (deletingConversationId !== null) return;
    setError(null);
    setDeletingConversationId(id);
    try {
      await requestJson<void>(`${CHAT_API}/conversations/${id}`, {
        method: "DELETE",
      });
      setConversations((current) => current.filter((item) => item.id !== id));
      if (conversationId === id) startNewChat();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this chat.");
    } finally {
      setDeletingConversationId(null);
    }
  };

  const sendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setError(null);
    setInput("");
    setIsSending(true);
    const pendingId = `pending-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id: pendingId,
        conversation_id: conversationId ?? 0,
        role: "user",
        content,
        model_id: null,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      let activeConversationId = conversationId;
      if (activeConversationId === null) {
        const conversation = await requestJson<ChatConversation>(
          `${CHAT_API}/conversations`,
          {
            method: "POST",
            body: JSON.stringify({ model_id: modelId }),
          },
        );
        activeConversationId = conversation.id;
        setConversationId(conversation.id);
      }

      const turn = await requestJson<ChatTurn>(
        `${CHAT_API}/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content, model_id: modelId }),
        },
      );
      setMessages((current) => [
        ...current.filter((message) => message.id !== pendingId),
        turn.user_message,
        turn.assistant_message,
      ]);
      setModelId(turn.conversation.model_id);
      setConversations((current) => [
        turn.conversation,
        ...current.filter((item) => item.id !== turn.conversation.id),
      ]);
    } catch (cause) {
      setMessages((current) => current.filter((message) => message.id !== pendingId));
      setError(cause instanceof Error ? cause.message : "The AI Copilot could not respond.");
      setInput(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const selectedModel = models.find((model) => model.model_id === modelId);
  const hasConfiguredModel = models.some((model) => model.configured);

  return (
    <section className="flex h-[min(680px,calc(100vh-17rem))] min-h-[430px] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <AIChatHistory
        conversations={conversations}
        conversationId={conversationId}
        isLoading={isLoadingHistory}
        deletingConversationId={deletingConversationId}
        onNewChat={startNewChat}
        onOpen={(id) => void openConversation(id)}
        onDelete={(id) => void removeConversation(id)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={startNewChat}
              aria-label="Start a new chat"
              title="New chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 sm:hidden"
            >
              <Plus className="h-4 w-4" />
            </button>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {conversationId === null
                ? "New chat"
                : conversations.find((item) => item.id === conversationId)?.title ?? "Saved chat"}
            </h2>
          </div>
          <AIChatModelPicker
            models={models}
            modelId={modelId}
            onChange={setModelId}
          />
        </header>

        <div className="flex-1 overflow-y-auto px-3 sm:px-6">
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center py-8">
              <h2 className="text-lg font-semibold text-slate-900">
                How can I help?
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Ask a question about leads, products, campaigns, or workload.
              </p>
              {modelStatusLoaded && modelStatusAvailable && !hasConfiguredModel ? (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  No provider key is configured. Add GROQ_API_KEY or GOOGLE_API_KEY to the backend environment.
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[11px] text-slate-600 transition hover:bg-slate-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-6 py-6 sm:py-8">
              {messages.map((message) => (
                  <article
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" ? (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </div>
                  ) : null}
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap break-words text-sm leading-7 ${
                      message.role === "user"
                          ? "rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-800"
                          : "min-w-0 flex-1 pt-0.5 text-slate-700"
                    }`}
                  >
                      {message.role === "assistant"
                        ? <AIChatResponse content={message.content} />
                        : message.content}
                  </div>
                </article>
              ))}
              {isSending ? (
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    {selectedModel ? `${selectedModel.name} is thinking…` : "Thinking…"}
                  </span>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-3 pb-3 pt-3 sm:px-6 sm:pb-4">
          <div className="mx-auto max-w-2xl">
            {error ? (
              <div
                role="alert"
                className="mb-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs leading-relaxed text-rose-800"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
            <form
              onSubmit={(event) => void sendMessage(event)}
              className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 transition focus-within:border-blue-500"
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Message the AI Copilot…"
                rows={1}
                maxLength={8000}
                aria-label="Message the AI Copilot"
                className="max-h-36 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {isSending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-slate-400">
              {selectedModel?.name ?? "Select a model"} · Review AI-generated answers
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
