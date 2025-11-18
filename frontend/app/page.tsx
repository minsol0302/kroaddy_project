"use client";

import axios from "axios";
import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

// API Base URL 설정 (환경변수 또는 기본값)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 저는 K-리그의 질문만 답변할 수 있는 챗봇입니다.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submitMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/soccer/players/all`, {
        params: {
          question: trimmed,
          history: nextMessages,
        },
      });

      const { data } = response;

      if (data?.message) {
        setMessages((prev: Message[]) => [...prev, data.message as Message]);
        return;
      }

      const assistantContent =
        typeof data === "string"
          ? data
          : typeof data?.content === "string"
            ? data.content
            : JSON.stringify(data, null, 2);

      setMessages((prev: Message[]) => [
        ...prev,
        {
          role: "assistant",
          content: assistantContent,
        },
      ]);
    } catch (error: unknown) {
      console.error("API 요청 실패:", error);
      let fallbackMessage =
        "죄송해요. 답변을 불러오는 동안 문제가 발생했어요. 잠시 후 다시 시도해 주세요.";

      if (axios.isAxiosError(error)) {
        const axiosError = error as import("axios").AxiosError;
        if (axiosError.response?.data && typeof axiosError.response.data === "object" && "error" in axiosError.response.data) {
          fallbackMessage = axiosError.response.data.error as string;
        } else if (axiosError.message) {
          fallbackMessage = `연결 오류: ${axiosError.message}`;
        }
      }

      setMessages((prev: Message[]) => [
        ...prev,
        {
          role: "assistant",
          content: fallbackMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }




  };

  return (
    <main className="flex min-h-screen bg-[#050509] text-zinc-100">
      <aside className="hidden w-72 flex-col border-r border-zinc-900 bg-[#090910] px-6 py-8 lg:flex">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            대화 기록
          </p>
          <h1 className="mt-2 text-xl font-semibold text-zinc-100">
            나의 질문들
          </h1>
        </div>
        <div className="mt-8 flex-1 space-y-4 overflow-y-auto pr-1">
          {messages
            .filter((message: Message) => message.role === "user")
            .map((message: Message, index: number) => (
              <div
                key={`${message.role}-history-${index}`}
                className="rounded-xl border border-zinc-900/70 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300 shadow-inner shadow-blue-500/10"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  질문 {index + 1}
                </p>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-zinc-200">
                  {message.content}
                </p>
              </div>
            ))}
          {!messages.some((message: Message) => message.role === "user") && (
            <div className="rounded-xl border border-dashed border-zinc-800/70 bg-zinc-900/20 px-4 py-6 text-sm text-zinc-400">
              아직 질문이 없어요. 새로운 질문을 입력해 보세요!
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {messages.map((message: Message, index: number) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-lg ${message.role === "user"
                    ? "bg-[linear-gradient(135deg,#1a7efc,#7b5bff)] text-white"
                    : "bg-zinc-900/80 text-zinc-100 ring-1 ring-zinc-800"
                    }`}
                >
                  <p className="text-sm font-semibold text-zinc-300">
                    {message.role === "user" ? "You" : "ChatGPT"}
                  </p>
                  <p className="whitespace-pre-wrap text-base text-zinc-100">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-zinc-900/80 px-4 py-3 text-zinc-300 ring-1 ring-zinc-800">
                  <p className="text-sm font-semibold text-zinc-400">
                    ChatGPT
                  </p>
                  <p className="text-base">생각 중...</p>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-zinc-800 bg-[#050509]/95 px-4 py-6 sm:px-6"
        >
          <div className="mx-auto flex w-full max-w-3xl items-end gap-3">
            <div className="relative flex-1 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_0_35px_rgba(37,99,235,0.25)]">
              <textarea
                value={input}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="메시지를 입력하세요..."
                className="max-h-40 w-full resize-none border-0 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <p className="mt-3 text-xs text-zinc-500">
                Enter로 전송 · Shift + Enter로 줄바꿈
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-12 rounded-xl bg-[linear-gradient(135deg,#1a7efc,#7b5bff)] px-6 font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "전송 중" : "전송"}
            </button>
          </div>
          <p className="mx-auto mt-3 max-w-3xl text-xs text-zinc-500">
            OpenAI API 키를 `.env.local` 파일에 `OPENAI_API_KEY`로 설정하면 챗봇이 실제 답변을 생성합니다.
          </p>
        </form>
      </div>
    </main>
  );
}
