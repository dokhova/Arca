import type { ReactNode } from "react";
import { X } from "lucide-react";

export default function DailyPopup({
  open,
  icon,
  eyebrow,
  cardName,
  title,
  imageSrc,
  text,
  variant,
  onClose,
}: {
  open: boolean;
  icon: ReactNode;
  eyebrow: string;
  cardName: string;
  title: string;
  imageSrc: string;
  text: string;
  variant: "advice" | "ritual";
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 360,
          maxHeight: "82dvh",
          overflow: "hidden",
          overflowY: "auto",
          background: "#241A0F",
          border: "1px solid var(--surface-border)",
          borderRadius: "var(--radius-card)",
          padding: 0,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "relative",
            height: 210,
            overflow: "hidden",
          }}
        >
          <img
            src={imageSrc}
            alt={cardName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 20%",
              transform: "scale(1.15)",
            }}
          />
          {variant === "ritual" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(to bottom, rgba(20,28,44,0.25), rgba(20,28,44,0.45))",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(to bottom, transparent 60%, rgba(36,26,15,0.9) 100%)",
            }}
          />

          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              border: "none",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "18px 22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background:
                  variant === "ritual"
                    ? "rgba(199,213,232,0.14)"
                    : "var(--icon-circle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: variant === "ritual" ? "#C7D5E8" : "var(--accent)",
              }}
            >
              {icon}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: variant === "ritual" ? "#C7D5E8" : "var(--accent)",
              }}
            >
              {eyebrow}
            </span>
            <span
              style={{
                minWidth: 0,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              · {cardName}
            </span>
          </div>

          {title !== cardName && (
            <h2
              style={{
                margin: "12px 0 0",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h2>
          )}

          <p
            style={{
              margin: "10px 0 0",
              fontSize: 16,
              lineHeight: 1.5,
              color: "var(--text-body)",
              fontWeight: 400,
            }}
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
