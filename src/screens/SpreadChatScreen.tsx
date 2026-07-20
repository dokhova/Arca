import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUp, ImagePlus, SquarePen, X } from "lucide-react";
import {
  compressImage,
  sendTarotMessage,
  type ChatMessage,
} from "../lib/tarotChat";

const QUICK_PROMPTS = [
  { label: "Разобрать расклад", value: "Разбери мой расклад: " },
  { label: "Значение карты", value: "Что значит карта " },
];

export default function SpreadChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [typingText, setTypingText] = useState<string | null>(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const firstName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name;

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

  useEffect(() => {
    if (!photoMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (photoMenuRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest('[data-photo-menu-trigger="true"]')
      ) {
        return;
      }
      setPhotoMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [photoMenuOpen]);

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

  const handleSend = async () => {
    if (loading || typingText !== null || (!input.trim() && !pendingImage)) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      image: pendingImage ?? undefined,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setPendingImage(null);
    setLoading(true);

    try {
      const reply = await sendTarotMessage(nextMessages);
      if (!mountedRef.current) return;

      setLoading(false);
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
        }
      }, 30);
    } catch {
      if (!mountedRef.current) return;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Не получилось получить ответ. Попробуй ещё раз",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const isTyping = typingText !== null;
  const canSend = !loading && !isTyping && Boolean(input.trim() || pendingImage);
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

      {messages.length > 0 && (
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
        {messages.length === 0 ? (
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
                src="/ai-orb.png"
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
              {firstName ? `Привет, ${firstName}!` : "Привет!"}
            </h1>
            {!hideEmptyStateExtras && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 17,
                  lineHeight: 1.45,
                  color: "var(--text-secondary)",
                }}
              >
                Я помогу интерпретировать твой расклад таро
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {renderedMessages.map((message, index) => {
              const isUser = message.role === "user";

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
          position: "relative",
        }}
      >
        {photoMenuOpen && (
          <div
            ref={photoMenuRef}
            role="menu"
            style={{
              position: "absolute",
              left: 0,
              bottom: 66,
              zIndex: 10,
              minWidth: 224,
              padding: 6,
              borderRadius: 16,
              border: "1px solid var(--surface-border)",
              background: "var(--nav-bg)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setPhotoMenuOpen(false);
                cameraInputRef.current?.click();
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "11px 12px",
                border: "none",
                borderRadius: 11,
                background: "transparent",
                color: "var(--text-primary)",
                font: "inherit",
                fontSize: 15,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              📷 Сделать фото
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setPhotoMenuOpen(false);
                fileInputRef.current?.click();
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "11px 12px",
                border: "none",
                borderRadius: 11,
                background: "transparent",
                color: "var(--text-primary)",
                font: "inherit",
                fontSize: 15,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              🖼 Выбрать из галереи
            </button>
          </div>
        )}

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
          <div
            className="spread-chat-suggestions"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "nowrap",
              gap: 8,
              width: "100%",
              marginBottom: 12,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {QUICK_PROMPTS.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setInput(value);
                  inputRef.current?.focus();
                }}
                style={{
                  flexShrink: 0,
                  width: "fit-content",
                  padding: "6px 9px",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 16,
                  background: "var(--surface)",
                  color: "var(--text-secondary)",
                  fontSize: 11.5,
                  lineHeight: 1.35,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              data-photo-menu-trigger="true"
              onClick={() => setPhotoMenuOpen((open) => !open)}
              aria-expanded={photoMenuOpen}
              style={{
                flexShrink: 0,
                width: "fit-content",
                padding: "6px 9px",
                border: "1px solid var(--surface-border)",
                borderRadius: 16,
                background: "var(--surface)",
                color: "var(--text-secondary)",
                fontSize: 11.5,
                lineHeight: 1.35,
                cursor: "pointer",
              }}
            >
              Добавить фото
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 8px",
            borderRadius: 24,
            background: "var(--nav-bg)",
            border: "1px solid var(--surface-border)",
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
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            disabled={loading}
            hidden
          />
          <button
            type="button"
            aria-label="Добавить фото"
            data-photo-menu-trigger="true"
            onClick={() => setPhotoMenuOpen((open) => !open)}
            aria-expanded={photoMenuOpen}
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
            placeholder="Напиши сообщение"
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
              color: canSend ? "var(--card-dark-text)" : "var(--nav-inactive)",
              cursor: canSend ? "pointer" : "default",
            }}
          >
            <ArrowUp size={22} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
