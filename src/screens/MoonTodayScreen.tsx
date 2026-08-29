import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import {
  getMoonPhase,
  moonImage,
  moonIllumination,
  isWaxing,
} from "../data/moon";

export default function MoonTodayScreen({ onBack }: { onBack: () => void }) {
  const phase = getMoonPhase();
  const illum = moonIllumination();
  const waxing = isWaxing();

  useEffect(() => {
    new Image().src = moonImage(phase);
  }, [phase.id]);

  // Направление показываем только для промежуточных фаз (не для новолуния/полнолуния)
  const direction =
    phase.index === 0 || phase.index === 4 ? null : waxing ? "растёт" : "убывает";

  const keywords = phase.keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const paragraphs = phase.energy
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div style={{ position: "relative", minHeight: "100dvh" }}>
      {/* Кнопка назад — идентична экрану карты дня */}
      <button
        onClick={onBack}
        aria-label="Назад"
        style={{
          position: "fixed",
          zIndex: 2,
          top: "calc(20px + env(safe-area-inset-top, 40px) + var(--tg-content-top, 0px))",
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

      <div style={{ padding: "0 20px 48px" }}>
        {/* Луна с мягким свечением */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: "calc(96px + env(safe-area-inset-top, 40px) + var(--tg-content-top, 0px))",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(240,169,60,0.22), rgba(240,169,60,0) 68%)",
            }}
          />
          <img
            src={moonImage(phase)}
            alt={phase.name}
            width={248}
            height={248}
            style={{
              position: "relative",
              width: 248,
              height: 248,
              maxWidth: "none",
              objectFit: "contain",
              filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.5))",
            }}
          />
        </div>

        {/* Название фазы */}
        <h1
          style={{
            margin: "32px 0 0",
            textAlign: "center",
            fontSize: 32,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {phase.name}
        </h1>

        {/* Освещённость + направление */}
        <p
          style={{
            margin: "8px 0 0",
            textAlign: "center",
            fontSize: 16,
            color: "var(--accent)",
          }}
        >
          {illum}% освещена{direction ? ` · ${direction}` : ""}
        </p>

        {/* Чипы-теги */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            marginTop: 18,
          }}
        >
          {keywords.map((tag) => (
            <span
              key={tag}
              style={{
                background: "var(--chip-bg)",
                color: "var(--card-dark-text)",
                fontSize: 14,
                fontWeight: 500,
                padding: "7px 14px",
                borderRadius: 999,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Энергия фазы */}
        {paragraphs.map((paragraph, i) => (
          <p
            key={i}
            style={{
              margin: i === 0 ? "24px 0 0" : "16px 0 0",
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
