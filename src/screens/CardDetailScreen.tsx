import { useLayoutEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { getBySlug } from "../data/cards";

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
      <img
        src={`/cards/${card.image}`}
        alt={card.name}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 25%",
          transform: "scale(1.15)",
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
            "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 44%, black 52%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 44%, black 52%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, transparent 34%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.62) 100%)",
        }}
      />

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

      <div
        style={{
          position: "relative",
          padding: "48dvh 20px 40px",
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
  );
}
