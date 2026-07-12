import { useLayoutEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { getBySlug } from "../data/cards";
import { cardImage } from "../data/daily";

export default function CardDetailScreen({
  slug,
  onBack,
}: {
  slug: string;
  onBack: () => void;
}) {
  const card = getBySlug(slug);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!card) return null;

  const paragraphs = card.catalogDescription
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div style={{ position: "relative", minHeight: "100dvh" }}>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: "-10%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <img
          src={cardImage(card)}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(60px) saturate(1.3) brightness(0.45)",
            transform: "scale(1.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
          }}
        />
      </div>

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
            width: "100%",
            height: "54dvh",
            overflow: "hidden",
          }}
        >
          <img
            src={cardImage(card)}
            alt={card.name}
            style={{
              position: "absolute",
              inset: "-3%",
              width: "106%",
              height: "106%",
              objectFit: "cover",
              objectPosition: "50% 22%",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 80,
              pointerEvents: "none",
              background:
                "linear-gradient(to bottom, transparent, rgba(0,0,0,0.35))",
            }}
          />
        </div>

        <div style={{ padding: "20px 20px 40px" }}>
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

          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              style={{
                margin: index === 0 ? "20px 0 0" : "16px 0 0",
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
