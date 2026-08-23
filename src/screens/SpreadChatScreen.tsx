import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUp, ChevronRight, ImagePlus, SquarePen, X } from "lucide-react";
import {
  compressImage,
  sendTarotMessage,
  type ChatMessage,
} from "../lib/tarotChat";
import { getBySlug } from "../data/cards";
import { cardImage } from "../data/daily";
import {
  trackAiChatMessageSent,
  trackSpreadCompleted,
} from "../lib/analytics";
import SpreadDraw from "../components/SpreadDraw";

const QUESTION_SUGGESTIONS = [
  "Что меня ждёт в будущем",
  "Когда встречу любовь",
  "Стоит ли менять работу",
  "Совет на сегодня",
];

export default function SpreadChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [typingText, setTypingText] = useState<string | null>(null);
  const [pendingDraw, setPendingDraw] = useState<{
    count: number;
    positions: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, typingText]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (typingIntervalRef.current !== null) {
        window.clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setPendingImage(await compressImage(file));
    } catch {
      setPendingImage(null);
    }
  };

  const streamReply = (reply: string, onDone?: () => void) => {
    if (reply.trim() === "") {
      setTypingText(null);
      onDone?.();
      return;
    }
    setTypingText("");
    let visibleCharacters = 0;
    typingIntervalRef.current = window.setInterval(() => {
      const chunkSize = visibleCharacters % 2 === 0 ? 3 : 2;
      visibleCharacters = Math.min(visibleCharacters + chunkSize, reply.length);
      setTypingText(reply.slice(0, visibleCharacters));
      if (visibleCharacters === reply.length) {
        if (typingIntervalRef.current !== null) {
          window.clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setMessages((current) => [
          ...current,
          { role: "assistant", content: reply },
        ]);
        setTypingText(null);
        onDone?.();
      }
    }, 30);
  };

  const parseSpreadMarker = (
    raw: string,
  ): { text: string; draw: { count: number; positions: string[] } | null } => {
    const match = raw.match(/\[\[\s*SPREAD\s*:\s*(\d)\s*:\s*([^\]]*)\]\]/i);
    if (!match) {
      const clean = raw
        .trim()
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^#{1,6}\s+/gm, "");
      return { text: clean, draw: null };
    }
    const count = Math.min(3, Math.max(1, parseInt(match[1], 10) || 1));
    const positions = match[2]
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, count);
    const text = raw.replace(match[0], "").trim();
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^#{1,6}\s+/gm, "");
    return { text: clean, draw: { count, positions } };
  };

  const requestAssistant = async (convo: ChatMessage[]) => {
    setLoading(true);
    try {
      const raw = await sendTarotMessage(convo);
      if (!mountedRef.current) return;
      setLoading(false);
      const { text, draw } = parseSpreadMarker(raw);
      streamReply(text, draw ? () => setPendingDraw(draw) : undefined);
    } catch {
      if (!mountedRef.current) return;
      setLoading(false);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Не получилось получить ответ. Попробуй ещё раз",
        },
      ]);
    }
  };

  const sendText = async (text: string, image?: string) => {
    const trimmed = text.trim();
    if (loading || typingText !== null || pendingDraw || (!trimmed && !image))
      return;
    trackAiChatMessageSent(Boolean(image), trimmed.length);
    const userMessage: ChatMessage = { role: "user", content: trimmed, image };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setPendingImage(null);
    await requestAssistant(next);
  };

  const handleSend = () => {
    void sendText(input, pendingImage ?? undefined);
  };

  const handleDrawComplete = async (slugs: string[]) => {
    const draw = pendingDraw;
    setPendingDraw(null);
    if (!draw) return;
    trackSpreadCompleted(draw.count as 1 | 3, slugs);
    const lines = slugs
      .map((slug, index) => {
        const card = getBySlug(slug);
        const name = card?.name ?? slug;
        const position = draw.positions[index];
        return position ? `${position}: ${name}` : name;
      })
      .join("\n");
    const content = `Я вытянул карты:\n${lines}\n\nРастолкуй их под мой вопрос.`;
    const spreadMessage: ChatMessage = {
      role: "user",
      content,
      spread: { positions: draw.positions, slugs },
    };
    const next = [...messages, spreadMessage];
    setMessages(next);
    await requestAssistant(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const isTyping = typingText !== null;
  const canSend =
    !loading &&
    !isTyping &&
    !pendingDraw &&
    Boolean(input.trim() || pendingImage);
  const hideEmptyStateExtras = inputFocused || input.length > 0;
  const renderedMessages: ChatMessage[] = isTyping
    ? [...messages, { role: "assistant", content: typingText ?? "" }]
    : messages;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        boxSizing: "border-box",
        padding: "0 16px calc(85px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <style>{`
        @keyframes spread-chat-dot {
          0%, 60%, 100% { translate: 0 0; }
          30% { translate: 0 -5px; }
        }
        .spread-chat-dot {
          animation: spread-chat-dot 1.2s infinite ease-in-out;
        }
        .spread-chat-dot:nth-child(2) { animation-delay: 0.15s; }
        .spread-chat-dot:nth-child(3) { animation-delay: 0.3s; }
        .spread-chat-messages::-webkit-scrollbar { display: none; }
        .spread-chat-suggestions::-webkit-scrollbar { display: none; }
      `}</style>

      {(messages.length > 0 || pendingDraw) && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "calc(env(safe-area-inset-top, 0px) + 72px)",
            zIndex: 7,
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, var(--bg-base), transparent)",
          }}
        />
      )}

      {(messages.length > 0 || pendingDraw) && (
        <button
          type="button"
          aria-label="Новый чат"
          onClick={() => {
            if (typingIntervalRef.current !== null) {
              window.clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
            }
            setMessages([]);
            setInput("");
            setPendingImage(null);
            setTypingText(null);
            setPendingDraw(null);
          }}
          disabled={loading}
          style={{
            position: "fixed",
            top: "calc(12px + env(safe-area-inset-top, 0px))",
            right: 16,
            zIndex: 8,
            width: 40,
            height: 40,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "1px solid var(--surface-border)",
            background: "var(--surface)",
            color: loading ? "var(--nav-inactive)" : "var(--text-primary)",
            cursor: loading ? "default" : "pointer",
          }}
        >
          <SquarePen size={20} />
        </button>
      )}

      <div
        className="spread-chat-messages"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: messages.length === 0 ? "hidden" : "auto",
          scrollbarWidth: "none",
          paddingTop:
            messages.length > 0
              ? "calc(env(safe-area-inset-top, 0px) + 64px)"
              : 0,
          paddingBottom: messages.length > 0 ? 16 : 0,
        }}
      >
        {messages.length === 0 && !pendingDraw ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                overflow: "hidden",
                boxShadow:
                  "0 0 40px color-mix(in srgb, var(--accent) 32%, transparent)",
              }}
            >
              <img
                src="/ai-orb.webp"
                alt=""
                draggable={false}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scale(2)",
                }}
              />
            </div>
            <h1
              style={{
                margin: "20px 0 0",
                fontSize: 34,
                fontWeight: 700,
                lineHeight: 1.15,
                color: "var(--text-primary)",
              }}
            >
              Что хочешь узнать?
            </h1>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {renderedMessages.map((message, index) => {
              const isUser = message.role === "user";

              if (isUser && message.spread) {
                const { positions, slugs } = message.spread;
                const single = slugs.length === 1;
                return (
                  <div
                    key={`spread-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {slugs.map((slug, i) => {
                      const card = getBySlug(slug);
                      if (!card) return null;
                      return (
                        <div
                          key={slug}
                          style={{
                            width: single ? 118 : 92,
                            textAlign: "center",
                          }}
                        >
                          {positions[i] && (
                            <div
                              style={{
                                marginBottom: 6,
                                fontSize: 12,
                                color: "var(--text-secondary)",
                              }}
                            >
                              {positions[i]}
                            </div>
                          )}
                          <img
                            src={cardImage(card)}
                            alt={card.name}
                            style={{
                              width: "100%",
                              borderRadius: 10,
                              display: "block",
                            }}
                          />
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              color: "var(--text-primary)",
                            }}
                          >
                            {card.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              if (!isUser) {
                return (
                  <div
                    key={`${message.role}-${index}`}
                    style={{
                      width: "100%",
                      color: "var(--text-body)",
                      fontSize: 16,
                      lineHeight: 1.5,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {message.content.split(/\n\n+/).map((paragraph, paragraphIndex) => (
                      <p
                        key={paragraphIndex}
                        style={{
                          margin: paragraphIndex === 0 ? 0 : "12px 0 0",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                );
              }

              return (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: "80%",
                    padding: "11px 14px",
                    borderRadius: 18,
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    color: "var(--text-primary)",
                    fontSize: 16,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Фото расклада"
                      style={{
                        display: "block",
                        width: "100%",
                        maxWidth: 200,
                        maxHeight: 260,
                        marginBottom: message.content ? 10 : 0,
                        borderRadius: 14,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {message.content}
                </div>
              );
            })}

            {pendingDraw && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <SpreadDraw
                  count={pendingDraw.count}
                  positions={
                    pendingDraw.positions.length
                      ? pendingDraw.positions
                      : undefined
                  }
                  onComplete={handleDrawComplete}
                />
              </div>
            )}

            {loading && (
              <div
                aria-label="Ассистент печатает"
                style={{
                  alignSelf: "flex-start",
                  display: "flex",
                  gap: 5,
                  padding: "3px 0",
                }}
              >
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="spread-chat-dot"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--text-secondary)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          flexShrink: 0,
        }}
      >
        {pendingImage && (
          <div
            style={{
              position: "relative",
              width: 64,
              height: 64,
              marginBottom: 10,
            }}
          >
            <img
              src={pendingImage}
              alt="Выбранное фото"
              style={{
                width: 64,
                height: 64,
                display: "block",
                borderRadius: 14,
                objectFit: "cover",
                border: "1px solid var(--surface-border)",
              }}
            />
            <button
              type="button"
              aria-label="Удалить фото"
              onClick={() => setPendingImage(null)}
              disabled={loading}
              style={{
                position: "absolute",
                top: -7,
                right: -7,
                width: 24,
                height: 24,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                border: "1px solid var(--surface-border)",
                background: "var(--bg-base)",
                color: "var(--text-primary)",
                cursor: loading ? "default" : "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {messages.length === 0 && !hideEmptyStateExtras && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                marginBottom: 12,
                borderRadius: 14,
                background:
                  "color-mix(in srgb, var(--accent) 5%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--accent) 14%, transparent)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <ImagePlus
                size={18}
                style={{ flexShrink: 0, color: "var(--accent)" }}
              />
              <span style={{ flex: 1, fontSize: 13, lineHeight: 1.3 }}>
                Загрузите фото своего расклада
              </span>
              <ChevronRight
                size={16}
                style={{ flexShrink: 0, opacity: 0.5 }}
              />
            </button>
            <div
              className="spread-chat-suggestions"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
                gap: 8,
                width: "100%",
                marginBottom: 12,
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              {QUESTION_SUGGESTIONS.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => void sendText(text)}
                  style={{
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    padding: "12px 18px",
                    border:
                      "1px solid color-mix(in srgb, var(--accent) 16%, transparent)",
                    borderRadius: 20,
                    background:
                      "color-mix(in srgb, var(--accent) 4%, transparent)",
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {text}
                </button>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap",
                  padding: "12px 16px",
                  border:
                    "1px dashed color-mix(in srgb, var(--accent) 55%, transparent)",
                  borderRadius: 20,
                  background:
                    "color-mix(in srgb, var(--accent) 14%, transparent)",
                  color: "var(--accent)",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <ImagePlus size={16} />
                Загрузить расклад
              </button>
            </div>
          </>
        )}

        <div
          style={{
            borderRadius: 24,
            padding: 1.5,
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 70%, transparent), color-mix(in srgb, var(--accent) 8%, transparent) 45%, color-mix(in srgb, var(--accent) 50%, transparent))",
            boxShadow:
              "0 0 26px color-mix(in srgb, var(--accent) 20%, transparent)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 8px",
              borderRadius: 22,
              border: "none",
              background: "var(--nav-bg)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
              hidden
            />
            <button
              type="button"
              aria-label="Добавить фото"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{
                width: 42,
                height: 42,
                flexShrink: 0,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "transparent",
                color: "var(--nav-inactive)",
                cursor: loading ? "default" : "pointer",
              }}
            >
              <ImagePlus size={21} />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Спросите или загрузите расклад…"
              rows={1}
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 42,
                maxHeight: 112,
                boxSizing: "border-box",
                resize: "none",
                padding: "10px 4px",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--text-primary)",
                font: "inherit",
                fontSize: 16,
                lineHeight: 1.35,
              }}
            />
            <button
              type="button"
              aria-label="Отправить"
              onClick={() => void handleSend()}
              disabled={!canSend}
              style={{
                width: 42,
                height: 42,
                flexShrink: 0,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                border: "none",
                background: canSend ? "var(--accent)" : "var(--surface)",
                color: canSend
                  ? "var(--card-dark-text)"
                  : "var(--nav-inactive)",
                cursor: canSend ? "pointer" : "default",
              }}
            >
              <ArrowUp size={22} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
