import { ChevronLeft, ChevronRight, MessageCircle, ArrowUpRight } from "lucide-react";
import { LEGAL_DOCS } from "../data/legal";

export default function LegalScreen({
  onBack,
  onOpenDoc,
}: {
  onBack: () => void;
  onOpenDoc: (id: string) => void;
}) {
  return (
    <div
      style={{
        padding: "calc(24px + env(safe-area-inset-top,0px)) 20px 120px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--surface-border)",
            borderRadius: "50%",
            background: "var(--surface)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            lineHeight: 1.15,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Правовая информация
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 28,
        }}
      >
        {LEGAL_DOCS.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => onOpenDoc(doc.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 18,
              border: "1px solid var(--surface-border)",
              borderRadius: "var(--radius-card)",
              background: "var(--surface)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {doc.title}
              </span>
              <span
                style={{
                  display: "block",
                  marginTop: 5,
                  fontSize: 14,
                  lineHeight: 1.4,
                  color: "var(--text-secondary)",
                }}
              >
                {doc.short}
              </span>
            </span>
            <ChevronRight
              size={20}
              color="var(--nav-inactive)"
              style={{ flexShrink: 0 }}
            />
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            const url = "https://t.me/the_dokhova";
            const tg = window.Telegram?.WebApp;
            if (tg?.openTelegramLink) tg.openTelegramLink(url);
            else window.open(url, "_blank", "noopener,noreferrer");
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 18,
            border: "1px solid var(--surface-border)",
            borderRadius: "var(--radius-card)",
            background: "var(--surface)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "rgba(240, 169, 60, 0.14)",
              color: "var(--accent)",
            }}
          >
            <MessageCircle size={20} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Написать нам
            </span>
            <span
              style={{
                display: "block",
                marginTop: 5,
                fontSize: 14,
                lineHeight: 1.4,
                color: "var(--text-secondary)",
              }}
            >
              Вопросы и обратная связь — в Telegram
            </span>
          </span>
          <ArrowUpRight
            size={20}
            color="var(--nav-inactive)"
            style={{ flexShrink: 0 }}
          />
        </button>
      </div>
    </div>
  );
}
