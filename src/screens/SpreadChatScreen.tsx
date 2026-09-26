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

type SpreadOption = { count: number; positions: string[] };
type SpreadOffer = { recommended: number; options: SpreadOption[] };

function plural(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "карт";
  if (lastDigit === 1) return "карта";
  if (lastDigit >= 2 && lastDigit <= 4) return "карты";
  return "карт";
}

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
  const [spreadOffer, setSpreadOffer] = useState<SpreadOffer | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[] | null>(null);
  const [otherMode, setOtherMode] = useState(false);
  const [availableDrawHeight, setAvailableDrawHeight] = useState<
    number | undefined
  >(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const fullReplyRef = useRef<string>("");
  const typingDoneRef = useRef<(() => void) | undefined>(undefined);
  const typingActiveRef = useRef(false);
  const stickToBottomRef = useRef(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (stickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: typingText !== null ? "auto" : "smooth",
      });
    }
  }, [messages, loading, typingText]);

  useEffect(() => {
    if (!pendingDraw) {
      setAvailableDrawHeight(undefined);
      return;
    }
    stickToBottomRef.current = false;
    const updateAvailableHeight = () => {
      const container = messagesContainerRef.current;
      if (!container) return;
      const paddingTop = Number.parseFloat(
        window.getComputedStyle(container).paddingTop,
      );
      setAvailableDrawHeight(
        Math.max(0, container.clientHeight - paddingTop),
      );
    };
    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    const frame = window.requestAnimationFrame(() => {
      drawRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateAvailableHeight);
    };
  }, [pendingDraw]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (typingIntervalRef.current !== null) {
        window.clearInterval(typingIntervalRef.current);
      }
      typingActiveRef.current = false;
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

  const finishTyping = () => {
    if (!typingActiveRef.current) return;
    typingActiveRef.current = false;
    if (typingIntervalRef.current !== null) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setMessages((current) => [
      ...current,
      { role: "assistant", content: fullReplyRef.current },
    ]);
    setTypingText(null);
    const done = typingDoneRef.current;
    typingDoneRef.current = undefined;
    done?.();
  };

  const streamReply = (reply: string, onDone?: () => void) => {
    fullReplyRef.current = reply;
    typingDoneRef.current = onDone;
    if (reply.trim() === "") {
      setTypingText(null);
      typingDoneRef.current = undefined;
      onDone?.();
      return;
    }
    typingActiveRef.current = true;
    setTypingText("");
    let visibleCharacters = 0;
    typingIntervalRef.current = window.setInterval(() => {
      const chunkSize = visibleCharacters % 2 === 0 ? 3 : 2;
      visibleCharacters = Math.min(visibleCharacters + chunkSize, reply.length);
      setTypingText(reply.slice(0, visibleCharacters));
      if (visibleCharacters === reply.length) {
        finishTyping();
      }
    }, 30);
  };

  const parseSpreadMarker = (
    raw: string,
  ): {
    text: string;
    offer: SpreadOffer | null;
    chips: string[] | null;
  } => {
    const spreadMatch = raw.match(/\[\[\s*SPREAD\s*:([^\]]*)\]\]/i);
    const chipsMatch = raw.match(/\[\[\s*CHIPS\s*:([^\]]*)\]\]/i);
    const cleanMarkdown = (text: string) =>
      text
        .trim()
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^#{1,6}\s+/gm, "");

    let offer: SpreadOffer | null = null;
    if (spreadMatch) {
      const body = spreadMatch[1].trim();
      const segments = body.split("|").map((segment) => segment.trim());
      const optionSegments = body.includes("|") ? segments.slice(1) : segments;
      let recommended = Number.parseInt(
        body.includes("|") ? segments[0] : segments[0].split(":", 1)[0],
        10,
      );
      const options = optionSegments.flatMap((segment): SpreadOption[] => {
        const separatorIndex = segment.indexOf(":");
        if (separatorIndex === -1) return [];
        const countText = segment.slice(0, separatorIndex).trim();
        if (countText === "") return [];
        const parsedCount = Number(countText);
        if (!Number.isInteger(parsedCount)) return [];
        const count = Math.min(10, Math.max(1, parsedCount));
        const positions = segment
          .slice(separatorIndex + 1)
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .slice(0, count);
        return [{ count, positions }];
      });
      if (options.length > 0) {
        if (!options.some((option) => option.count === recommended)) {
          recommended = options[0].count;
        }
        offer = { recommended, options };
      }
    }

    const parsedChips = chipsMatch?.[1]
      .split("|")
      .map((chip) => chip.trim())
      .filter(Boolean)
      .slice(0, 6)
      .map((chip) => chip.slice(0, 30));
    const chips = parsedChips && parsedChips.length > 0 ? parsedChips : null;
    let text = raw;
    if (spreadMatch) text = text.replace(spreadMatch[0], "");
    if (chipsMatch) text = text.replace(chipsMatch[0], "");
    return { text: cleanMarkdown(text), offer, chips };
  };

  const requestAssistant = async (convo: ChatMessage[]) => {
    setLoading(true);
    try {
      const raw = await sendTarotMessage(convo);
      if (!mountedRef.current) return;
      setLoading(false);
      const { text, offer, chips } = parseSpreadMarker(raw);
      streamReply(text, () => {
        setSpreadOffer(offer);
        setQuickReplies(chips);
      });
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
    stickToBottomRef.current = true;
    trackAiChatMessageSent(Boolean(image), trimmed.length);
    setSpreadOffer(null);
    setQuickReplies(null);
    setOtherMode(false);
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
    stickToBottomRef.current = true;
    const draw = pendingDraw;
    setPendingDraw(null);
    if (!draw) return;
    trackSpreadCompleted(draw.count, slugs);
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
        padding:
          "0 16px calc(var(--nav-height) + 20px + var(--app-safe-bottom))",
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
            height: "calc(env(safe-area-inset-top, 0px) + 72px + var(--tg-content-top, 0px))",
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
            typingActiveRef.current = false;
            typingDoneRef.current = undefined;
            fullReplyRef.current = "";
            setMessages([]);
            setInput("");
            setPendingImage(null);
            setTypingText(null);
            setPendingDraw(null);
            setSpreadOffer(null);
            setQuickReplies(null);
            setOtherMode(false);
          }}
          disabled={loading}
          style={{
            position: "fixed",
            top: "calc(12px + env(safe-area-inset-top, 0px) + var(--tg-content-top, 0px))",
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
        ref={messagesContainerRef}
        className="spread-chat-messages"
        onScroll={(event) => {
          const element = event.currentTarget;
          stickToBottomRef.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        }}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: messages.length === 0 ? "hidden" : "auto",
          scrollbarWidth: "none",
          paddingTop:
            messages.length > 0
              ? "calc(env(safe-area-inset-top, 0px) + 64px + var(--tg-content-top, 0px))"
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
              const isTypingMessage =
                isTyping && index === renderedMessages.length - 1;

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
                          {positions.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "center",
                                textAlign: "center",
                                overflow: "hidden",
                                marginBottom: 6,
                                fontSize: 12,
                                lineHeight: "15px",
                                height: 30,
                                color: "var(--text-secondary)",
                              }}
                            >
                              {positions[i] ?? ""}
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
                    onClick={isTypingMessage ? finishTyping : undefined}
                    style={{
                      width: "100%",
                      color: "var(--text-body)",
                      fontSize: 16,
                      lineHeight: 1.5,
                      overflowWrap: "anywhere",
                      cursor: isTypingMessage ? "pointer" : undefined,
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

            {quickReplies && !pendingDraw && !isTyping && !loading && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: 8,
                }}
              >
                {quickReplies
                  .filter((chip) => chip.toLowerCase() !== "другое")
                  .map((chip, index) => (
                    <button
                      key={`${chip}-${index}`}
                      type="button"
                      onClick={() => void sendText(chip)}
                      style={{
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
                      {chip}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => {
                    setQuickReplies(null);
                    setOtherMode(true);
                    inputRef.current?.focus();
                  }}
                  style={{
                    padding: "12px 18px",
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
                  Другое
                </button>
              </div>
            )}

            {spreadOffer && !pendingDraw && !isTyping && !loading && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: 8,
                }}
              >
                {spreadOffer.options.map((option, index) => {
                  const isRecommended = option.count === spreadOffer.recommended;
                  return (
                    <button
                      key={`${option.count}-${index}`}
                      type="button"
                      onClick={() => {
                        stickToBottomRef.current = true;
                        setSpreadOffer(null);
                        setPendingDraw({
                          count: option.count,
                          positions: option.positions,
                        });
                      }}
                      style={{
                        padding: "12px 18px",
                        border: isRecommended
                          ? "1px solid color-mix(in srgb, var(--accent) 55%, transparent)"
                          : "1px solid color-mix(in srgb, var(--accent) 16%, transparent)",
                        borderRadius: 20,
                        background: isRecommended
                          ? "color-mix(in srgb, var(--accent) 14%, transparent)"
                          : "color-mix(in srgb, var(--accent) 4%, transparent)",
                        color: isRecommended
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      {option.count} {plural(option.count)}
                      {isRecommended ? " · совет" : ""}
                    </button>
                  );
                })}
                {!spreadOffer.options.some((option) => option.count > 4) && (
                  <button
                    type="button"
                    onClick={() =>
                      void sendText("Хочу более подробный расклад, больше карт")
                    }
                    style={{
                      padding: "12px 18px",
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
                    Больше карт
                  </button>
                )}
              </div>
            )}

            {pendingDraw && (
              <div
                ref={drawRef}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  scrollMarginTop:
                    "calc(env(safe-area-inset-top, 0px) + 72px + var(--tg-content-top, 0px))",
                  scrollMarginBottom: 16,
                }}
              >
                <SpreadDraw
                  count={pendingDraw.count}
                  availableHeight={availableDrawHeight}
                  positions={
                    pendingDraw.positions.length
                      ? pendingDraw.positions
                      : undefined
                  }
                  onComplete={handleDrawComplete}
                  onCardDrawn={() =>
                    drawRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                    })
                  }
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

      {!pendingDraw && (
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
              placeholder={
                otherMode
                  ? "Напиши, что тебя волнует…"
                  : (quickReplies || spreadOffer) && !pendingDraw
                  ? "Или напиши своё…"
                  : "Спросите или загрузите…"
              }
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
                fontSize: 14,
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
      )}
    </div>
  );
}
