import { ChevronLeft } from "lucide-react";
import { getCardOfDay, cardImage } from "../data/daily";

export default function CardOfDayScreen({ onBack }: { onBack: () => void }) {
  const card = getCardOfDay();

  const paragraphs = card.dailyDescription
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div style={{ position: "relative", minHeight: "100dvh" }}>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <img
          src={cardImage(card)}
          alt=""
          style={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "120%",
            height: "120%",
            objectFit: "cover",
            filter: "blur(48px) saturate(1.2) brightness(0.6)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.45))",
          }}
        />
      </div>

      {/* Кнопка назад */}
      <button
        onClick={onBack}
        aria-label="Назад"
        style={{
          position: "fixed",
          zIndex: 2,
          top: "calc(20px + env(safe-area-inset-top, 40px))",
          left: 20,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <ChevronLeft size={24} />
      </button>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            position: "relative",
            height: "56dvh",
            overflow: "hidden",
            maskImage:
              "linear-gradient(to bottom, black 55%, rgba(0,0,0,0.6) 78%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 55%, rgba(0,0,0,0.6) 78%, transparent 100%)",
          }}
        >
          <img
            src={cardImage(card)}
            alt={card.name}
            style={{
              position: "absolute",
              top: "-8%",
              left: "-8%",
              width: "116%",
              height: "116%",
              objectFit: "cover",
              objectPosition: "50% 20%",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: -96,
            padding: "0 20px 40px",
          }}
        >
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {card.name}
        </h1>

        {/* Чипы-теги */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 14,
          }}
        >
          {card.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              style={{
                background: "var(--chip-bg)",
                color: "var(--card-dark-text)",
                fontSize: 15,
                fontWeight: 500,
                padding: "8px 16px",
                borderRadius: 999,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Описание */}
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              style={{
                margin: i === 0 ? "20px 0 0" : "16px 0 0",
                fontSize: 17,
                lineHeight: 1.5,
                color: "var(--text-body)",
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
