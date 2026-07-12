import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, Moon, Sparkles } from "lucide-react";
import { cards, getBySlug, type TarotCard } from "../data/cards";
import { cardImage } from "../data/daily";

type SpreadType = 1 | 3;

type SpreadSlot = {
  slug: string;
  revealed: boolean;
};

type StoredSpread = {
  type: SpreadType;
  slots: SpreadSlot[];
  date: string;
};

const STORAGE_KEY = "arca-spread";
const POSITIONS = ["Прошлое", "Настоящее", "Будущее"];

function loadSpread(): StoredSpread {
  const fallback: StoredSpread = { type: 3, slots: [], date: "" };

  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<StoredSpread> | null;

    if (parsed?.type !== 1 && parsed?.type !== 3) return fallback;
    if (!Array.isArray(parsed.slots)) return fallback;

    const slots = parsed.slots.filter(
      (slot): slot is SpreadSlot =>
        typeof slot?.slug === "string" &&
        typeof slot.revealed === "boolean" &&
        Boolean(getBySlug(slot.slug)),
    );

    const uniqueSlots = slots.filter(
      (slot, index) =>
        slots.findIndex((candidate) => candidate.slug === slot.slug) === index,
    );

    return {
      type: parsed.type,
      slots: uniqueSlots.slice(0, parsed.type),
      date: typeof parsed.date === "string" ? parsed.date : "",
    };
  } catch {
    return fallback;
  }
}

function CardBack({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 12,
        border: "1px solid rgba(240,169,60,0.35)",
        background: "linear-gradient(160deg, #2E2010, #17100A)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--accent)",
        ...style,
      }}
    >
      <Moon size={28} />
      <Sparkles
        size={14}
        color="rgba(240,169,60,0.6)"
        style={{ marginTop: 8 }}
      />
    </div>
  );
}

export default function SpreadScreen({ onBack }: { onBack: () => void }) {
  const [initialSpread] = useState(loadSpread);
  const [spreadType, setSpreadType] = useState<SpreadType>(
    initialSpread.type,
  );
  const [slots, setSlots] = useState<SpreadSlot[]>(initialSpread.slots);
  const [leavingFanCard, setLeavingFanCard] = useState<number | null>(null);
  const skipNextSave = useRef(false);
  const fanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        type: spreadType,
        slots,
        date: new Date().toISOString().slice(0, 10),
      }),
    );
  }, [spreadType, slots]);

  useEffect(() => {
    slots.forEach((slot) => {
      if (slot.revealed || revealTimers.current.has(slot.slug)) return;

      const timer = setTimeout(() => {
        revealTimers.current.delete(slot.slug);
        setSlots((current) =>
          current.map((currentSlot) =>
            currentSlot.slug === slot.slug
              ? { ...currentSlot, revealed: true }
              : currentSlot,
          ),
        );
      }, 400);

      revealTimers.current.set(slot.slug, timer);
    });
  }, [slots]);

  useEffect(
    () => () => {
      if (fanTimer.current) clearTimeout(fanTimer.current);
      revealTimers.current.forEach((timer) => clearTimeout(timer));
      revealTimers.current.clear();
    },
    [],
  );

  const drawnCount = slots.length;
  const allDrawn = drawnCount === spreadType;
  const allRevealed = allDrawn && slots.every((slot) => slot.revealed);

  const clearRevealTimers = () => {
    revealTimers.current.forEach((timer) => clearTimeout(timer));
    revealTimers.current.clear();
  };

  const resetForType = (type: SpreadType) => {
    if (type === spreadType) return;
    if (fanTimer.current) clearTimeout(fanTimer.current);
    clearRevealTimers();
    fanTimer.current = null;
    setLeavingFanCard(null);
    setSpreadType(type);
    setSlots([]);
  };

  const selectFanCard = (index: number) => {
    if (leavingFanCard !== null || allDrawn) return;

    setLeavingFanCard(index);
    fanTimer.current = setTimeout(() => {
      drawCard();
      setLeavingFanCard(null);
      fanTimer.current = null;
    }, 250);
  };

  const drawCard = () => {
    if (allDrawn) return;

    const usedSlugs = new Set(slots.map((slot) => slot.slug));
    const availableCards = cards.filter((card) => !usedSlugs.has(card.slug));
    const card =
      availableCards[Math.floor(Math.random() * availableCards.length)];

    if (card) {
      setSlots((current) => [
        ...current,
        { slug: card.slug, revealed: false },
      ]);
    }
  };

  const repeatSpread = () => {
    clearRevealTimers();
    skipNextSave.current = true;
    localStorage.removeItem(STORAGE_KEY);
    setSlots([]);
  };

  return (
    <div style={{ minHeight: "100dvh", padding: "0 20px 40px" }}>
      <button
        onClick={onBack}
        aria-label="Назад"
        style={{
          position: "fixed",
          top: "calc(20px + env(safe-area-inset-top, 40px))",
          left: 20,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          zIndex: 5,
        }}
      >
        <ChevronLeft size={24} />
      </button>

      <h1
        style={{
          margin: 0,
          paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
          textAlign: "center",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        Разбор карт
      </h1>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            padding: 4,
            borderRadius: 999,
            border: "1px solid var(--surface-border)",
            background: "var(--surface)",
          }}
        >
          {([3, 1] as SpreadType[]).map((type) => {
            const isActive = spreadType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => resetForType(type)}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 999,
                  background: isActive ? "var(--chip-bg)" : "transparent",
                  color: isActive
                    ? "var(--card-dark-text)"
                    : "var(--text-secondary)",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {type} {type === 1 ? "карта" : "карты"}
              </button>
            );
          })}
        </div>
      </div>

      {!allRevealed && (
        <div
          style={{
            margin: "20px auto 0",
            maxWidth: 340,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            Мысленно задайте вопрос
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 14,
              fontStyle: "italic",
              color: "var(--accent)",
            }}
          >
            Например: «Что мне поможет продвинуться в работе?»
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 12,
          marginTop: 24,
        }}
      >
        {Array.from({ length: spreadType }, (_, index) => {
          const slot = slots[index];
          const card = slot ? getBySlug(slot.slug) : undefined;
          const width = spreadType === 1 ? 120 : 96;
          const height = spreadType === 1 ? 200 : 160;

          return (
            <div key={index} style={{ width, flexShrink: 0 }}>
              {spreadType === 3 && (
                <div
                  style={{
                    marginBottom: 8,
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  {POSITIONS[index]}
                </div>
              )}

              <div
                style={{
                  position: "relative",
                  width,
                  height,
                  borderRadius: 12,
                  perspective: "800px",
                  ...(!slot
                    ? {
                        border: "1.5px dashed var(--surface-border)",
                        background: "var(--surface)",
                      }
                    : {}),
                }}
              >
                {slot && card && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 12,
                      transformStyle: "preserve-3d",
                      transition: "transform 0.5s",
                      transform: slot.revealed
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                    }}
                  >
                    <CardBack
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 12,
                        overflow: "hidden",
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <img
                        src={cardImage(card)}
                        alt={card.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transform: "scale(1.18)",
                          objectPosition: "50% 30%",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!allDrawn && (
        <div
          style={{
            margin: "28px auto 0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 280,
              height: 150,
              margin: "0 auto",
            }}
          >
            {[-24, -16, -8, 0, 8, 16, 24].map((rotation, index) => {
              const offset = (index - 3) * 26;
              const isLeaving = leavingFanCard === index;

              return (
                <button
                  key={rotation}
                  type="button"
                  aria-label={`Вытянуть карту ${index + 1}`}
                  disabled={leavingFanCard !== null}
                  onClick={() => selectFanCard(index)}
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: 6,
                    width: 64,
                    height: 104,
                    marginLeft: -32,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: leavingFanCard === null ? "pointer" : "default",
                    transformOrigin: "bottom center",
                    transform: `translateX(${offset}px) translateY(${isLeaving ? -16 : 0}px) rotate(${rotation}deg)`,
                    opacity: isLeaving ? 0 : 1,
                    transition: "transform 0.25s, opacity 0.25s",
                  }}
                >
                  <CardBack style={{ pointerEvents: "none" }} />
                </button>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Вытяните карту
          </div>
        </div>
      )}

      {allRevealed && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 28,
            }}
          >
            {slots.map((slot, index) => {
              const card = getBySlug(slot.slug) as TarotCard;
              const interpretation =
                spreadType === 1
                  ? card.description
                  : index === 0
                    ? card.spreadPast
                    : index === 1
                      ? card.spreadPresent
                      : card.spreadFuture;
              const paragraphs = interpretation
                .split("\n\n")
                .map((paragraph) => paragraph.trim())
                .filter(Boolean);

              return (
                <article
                  key={slot.slug}
                  style={{
                    padding: 18,
                    borderRadius: "var(--radius-card)",
                    border: "1px solid var(--surface-border)",
                    background: "var(--surface)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--accent)",
                    }}
                  >
                    {spreadType === 1 ? "Ваша карта" : POSITIONS[index]}
                  </div>
                  <h2
                    style={{
                      margin: "4px 0 0",
                      fontSize: 19,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {card.name}
                  </h2>
                  {paragraphs.map((paragraph, paragraphIndex) => (
                    <p
                      key={paragraphIndex}
                      style={{
                        margin: paragraphIndex === 0 ? "8px 0 0" : "10px 0 0",
                        fontSize: 15,
                        lineHeight: 1.5,
                        color: "var(--text-body)",
                      }}
                    >
                      {paragraph}
                    </p>
                  ))}
                </article>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              type="button"
              onClick={repeatSpread}
              style={{
                padding: "12px 24px",
                border: "none",
                borderRadius: 999,
                background: "var(--chip-bg)",
                color: "var(--card-dark-text)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Повторить расклад
            </button>
          </div>
        </>
      )}
    </div>
  );
}
