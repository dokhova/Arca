import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { cards, getBySlug } from "../data/cards";
import { cardImage } from "../data/daily";

type SpreadDrawSlot = { slug: string; revealed: boolean };

type SpreadDrawProps = {
  count: number;
  positions?: string[];
  cardSize?: { width: number; height: number };
  onComplete?: (slugs: string[]) => void;
};

function CardBack({ style }: { style?: CSSProperties }) {
  const maskId = useId();
  const cx = 60;
  const cy = 110;
  const rayAngles = [-78, -58, -40, -24, -9, 9, 24, 40, 58, 78];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 12,
        border: "1px solid rgba(240,169,60,0.35)",
        background: "linear-gradient(160deg, #2E2010, #17100A)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--accent)",
        overflow: "hidden",
        ...style,
      }}
    >
      <svg
        viewBox="0 0 120 220"
        fill="currentColor"
        style={{ width: "62%", maxHeight: "84%" }}
        aria-hidden="true"
      >
        {/* длинные вертикальные лучи */}
        <polygon points="57.5,78 64.5,78 61,14" />
        <polygon points="57.5,142 64.5,142 61,206" />
        {/* лучи справа */}
        {rayAngles.map((deg) => {
          const a = (deg * Math.PI) / 180;
          const r0 = 40;
          const r1 = r0 + (Math.abs(deg) < 30 ? 30 : 20);
          const w = 3.2;
          const x0 = cx + r0 * Math.cos(a);
          const y0 = cy + r0 * Math.sin(a);
          const x1 = cx + r1 * Math.cos(a);
          const y1 = cy + r1 * Math.sin(a);
          const px = -Math.sin(a) * w;
          const py = Math.cos(a) * w;
          return (
            <polygon
              key={deg}
              points={`${x0 + px},${y0 + py} ${x0 - px},${y0 - py} ${x1},${y1}`}
            />
          );
        })}
        {/* полумесяц: круг с вырезом через маску */}
        <mask id={maskId}>
          <rect x="0" y="0" width="120" height="220" fill="white" />
          <circle cx="44" cy="110" r="27" fill="black" />
        </mask>
        <circle cx="56" cy="110" r="32" mask={`url(#${maskId})`} />
      </svg>
    </div>
  );
}

export default function SpreadDraw({
  count,
  positions,
  cardSize,
  onComplete,
}: SpreadDrawProps) {
  const [slots, setSlots] = useState<SpreadDrawSlot[]>([]);
  const [leavingFanCard, setLeavingFanCard] = useState<number | null>(null);
  const fanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const completionCalled = useRef(false);

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
  const allDrawn = drawnCount === count;
  const allRevealed = allDrawn && slots.every((slot) => slot.revealed);

  useEffect(() => {
    if (allRevealed && !completionCalled.current) {
      completionCalled.current = true;
      onComplete?.(slots.map((slot) => slot.slug));
    }
  }, [allRevealed, onComplete, slots]);

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

  const defaultCardSize =
    count === 1 ? { width: 120, height: 200 } : { width: 96, height: 160 };
  const { width, height } = cardSize ?? defaultCardSize;

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 12,
          marginTop: 24,
        }}
      >
        {Array.from({ length: count }, (_, index) => {
          const slot = slots[index];
          const card = slot ? getBySlug(slot.slug) : undefined;

          return (
            <div key={index} style={{ width, flexShrink: 0 }}>
              {positions?.[index] && (
                <div
                  style={{
                    marginBottom: 8,
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  {positions[index]}
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
    </>
  );
}
