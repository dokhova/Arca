import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cards, getBySlug } from "../data/cards";
import { cardImage } from "../data/daily";

type SpreadDrawSlot = { slug: string; revealed: boolean };

type SpreadDrawProps = {
  count: number;
  positions?: string[];
  cardSize?: { width: number; height: number };
  availableHeight?: number;
  onComplete?: (slugs: string[]) => void;
  onCardDrawn?: () => void;
};

const PULL_THRESHOLD = 60;
const TAP_SLOP = 8;
const FAN_BLOCK = 16 + 124 + 8 + 18;

const haptic = (style: "light" | "medium") =>
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);

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
  availableHeight,
  onComplete,
  onCardDrawn,
}: SpreadDrawProps) {
  const [slots, setSlots] = useState<SpreadDrawSlot[]>([]);
  const [leavingFanCard, setLeavingFanCard] = useState<number | null>(null);
  const [leaveOffset, setLeaveOffset] = useState({ dx: 0, dy: 0 });
  const [drag, setDrag] = useState<{
    index: number;
    dx: number;
    dy: number;
  } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const slotsContainerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const passedThreshold = useRef(false);
  const fanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const completionCalled = useRef(false);

  useEffect(() => {
    const container = slotsContainerRef.current;
    if (!container) return;
    const updateWidth = () => setContainerWidth(container.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      onCardDrawn?.();
    }
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (leavingFanCard !== null || allDrawn) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
    };
    passedThreshold.current = false;
    setDrag({ index, dx: 0, dy: 0 });
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const start = dragStart.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = Math.min(24, event.clientY - start.y);
    if (dy < -PULL_THRESHOLD && !passedThreshold.current) {
      passedThreshold.current = true;
      haptic("light");
    } else if (dy >= -PULL_THRESHOLD && passedThreshold.current) {
      passedThreshold.current = false;
    }
    setDrag({ index, dx, dy });
  };

  const handlePointerUp = (
    event: ReactPointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const start = dragStart.current;
    if (!drag || drag.index !== index || !start || start.id !== event.pointerId)
      return;
    const dx = event.clientX - start.x;
    const dy = Math.min(24, event.clientY - start.y);
    const distance = Math.hypot(dx, dy);
    dragStart.current = null;
    passedThreshold.current = false;

    if (dy < -PULL_THRESHOLD) {
      setLeaveOffset({ dx, dy });
      setDrag(null);
      selectFanCard(index);
      haptic("medium");
    } else if (distance < TAP_SLOP) {
      setLeaveOffset({ dx: 0, dy: 0 });
      setDrag(null);
      selectFanCard(index);
    } else {
      setDrag(null);
    }
  };

  const handlePointerCancel = () => {
    dragStart.current = null;
    passedThreshold.current = false;
    setDrag(null);
  };

  const defaultCardSize =
    count === 1
      ? { width: 120, height: 200 }
      : count <= 3
        ? { width: 96, height: 160 }
        : count === 4
          ? { width: 76, height: 127 }
          : { width: 64, height: 107 };
  const gap = count > 3 ? 8 : 12;
  const perRow =
    containerWidth > 0
      ? Math.max(
          1,
          Math.floor(
            (containerWidth + gap) / (defaultCardSize.width + gap),
          ),
        )
      : count;
  const rows = Math.ceil(count / perRow);
  const labelHeight = count > 3 ? 26 : 32;
  const labelGap = 8;
  const adaptiveCardSize = (() => {
    if (availableHeight === undefined || containerWidth === 0) {
      return defaultCardSize;
    }
    const maxCardHeight =
      (availableHeight -
        12 -
        FAN_BLOCK -
        rows * (labelHeight + labelGap) -
        (rows - 1) * 12) /
      rows;
    const minHeight = count <= 3 ? 110 : 80;
    const height = Math.round(
      Math.max(
        minHeight,
        Math.min(defaultCardSize.height, maxCardHeight),
      ),
    );
    const width = Math.round(
      (height * defaultCardSize.width) / defaultCardSize.height,
    );
    return { width, height };
  })();
  const { width, height } = cardSize ?? adaptiveCardSize;

  return (
    <>
      <style>{`
        @keyframes spread-draw-pull-hint {
          0%, 70%, 100% { transform: translateY(0); }
          82% { transform: translateY(-8px); }
        }
      `}</style>
      <div
        ref={slotsContainerRef}
        style={{
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-start",
          gap,
          rowGap: 12,
          marginTop: 12,
        }}
      >
        {Array.from({ length: count }, (_, index) => {
          const slot = slots[index];
          const card = slot ? getBySlug(slot.slug) : undefined;

          return (
            <div key={index} style={{ width, flexShrink: 0 }}>
              {positions && positions.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    textAlign: "center",
                    overflow: "hidden",
                    marginBottom: 8,
                    fontSize: count > 3 ? 11 : 13,
                    lineHeight: count > 3 ? "13px" : "16px",
                    height: count > 3 ? 26 : 32,
                    color: "var(--text-secondary)",
                  }}
                >
                  {positions[index] ?? ""}
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
            margin: "16px auto 0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 280,
              height: 124,
              margin: "0 auto",
              overflow: "visible",
            }}
          >
            {[-24, -16, -8, 0, 8, 16, 24].map((rotation, index) => {
              const offset = (index - 3) * 26;
              const isLeaving = leavingFanCard === index;
              const activeDrag = drag?.index === index ? drag : null;
              const pullProgress = activeDrag
                ? Math.min(
                    1,
                    Math.max(0, -activeDrag.dy / PULL_THRESHOLD),
                  )
                : 0;
              const transform = activeDrag
                ? `translateX(${offset + activeDrag.dx}px) translateY(${activeDrag.dy}px) rotate(${rotation * (1 - pullProgress)}deg) scale(${1 + 0.08 * pullProgress})`
                : isLeaving
                  ? `translateX(${offset + leaveOffset.dx}px) translateY(${leaveOffset.dy - 60}px) rotate(0deg) scale(1.08)`
                  : `translateX(${offset}px) translateY(0) rotate(${rotation}deg)`;

              return (
                <button
                  key={rotation}
                  type="button"
                  aria-label={`Вытянуть карту ${index + 1}`}
                  disabled={leavingFanCard !== null}
                  onPointerDown={(event) => handlePointerDown(event, index)}
                  onPointerMove={(event) => handlePointerMove(event, index)}
                  onPointerUp={(event) => handlePointerUp(event, index)}
                  onPointerCancel={handlePointerCancel}
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
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    transformOrigin: "bottom center",
                    transform,
                    opacity: isLeaving ? 0 : 1,
                    transition: activeDrag
                      ? "none"
                      : "transform 0.25s, opacity 0.25s",
                    zIndex: activeDrag ? 10 : undefined,
                    filter: activeDrag
                      ? `drop-shadow(0 0 ${12 * pullProgress}px color-mix(in srgb, var(--accent) 60%, transparent))`
                      : undefined,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      animation:
                        index === 3 &&
                        drawnCount === 0 &&
                        drag === null &&
                        leavingFanCard === null
                          ? "spread-draw-pull-hint 2.5s ease-in-out infinite"
                          : undefined,
                    }}
                  >
                    <CardBack style={{ pointerEvents: "none" }} />
                  </div>
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
            Потяни карту вверх
          </div>
        </div>
      )}
    </>
  );
}
