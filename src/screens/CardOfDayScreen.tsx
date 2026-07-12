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
      <img
        src={cardImage(card)}
        alt={card.name}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 30%",
          transform: "scale(1.22)",
          transformOrigin: "top center",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          maskImage:
            "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 54%, black 62%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 54%, black 62%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, transparent 44%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.62) 100%)",
        }}
      />

      {/* Кнопка назад */}
      <button
        onClick={onBack}
        aria-label="Назад"
        style={{
          position: "fixed",
          zIndex: 1,
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

      {/* Контент */}
      <div
        style={{
          position: "relative",
          padding: "58dvh 20px 40px",
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
          {card.tags.map((tag) => (
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
  );
}
