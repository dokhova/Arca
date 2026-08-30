import { ChevronLeft } from "lucide-react";
import { LEGAL_DOCS } from "../data/legal";

export default function LegalDocScreen({
  docId,
  onBack,
}: {
  docId: string;
  onBack: () => void;
}) {
  const doc = LEGAL_DOCS.find((item) => item.id === docId);

  return (
    <div
      style={{
        padding: "calc(24px + env(safe-area-inset-top,0px) + var(--tg-content-top, 0px)) 20px 120px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
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
            paddingTop: 6,
            fontSize: 27,
            lineHeight: 1.2,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {doc?.title ?? "Документ не найден"}
        </h1>
      </div>

      {!doc ? (
        <p
          style={{
            margin: "24px 0 0",
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--text-body)",
          }}
        >
          Запрошенный документ недоступен.
        </p>
      ) : (
        <div
          style={{
            marginTop: 18,
            userSelect: "text",
            WebkitUserSelect: "text",
          }}
        >
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Редакция от {doc.updated}
          </div>

          {doc.blocks.map((block, index) => {
            if (block.type === "h") {
              return (
                <h2
                  key={index}
                  style={{
                    margin: "20px 0 0",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {block.text}
                </h2>
              );
            }

            if (block.type === "li") {
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 10,
                    paddingLeft: 12,
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: "var(--text-body)",
                  }}
                >
                  <span aria-hidden>•</span>
                  <span>{block.text}</span>
                </div>
              );
            }

            return (
              <p
                key={index}
                style={{
                  margin: "10px 0 0",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--text-body)",
                }}
              >
                {block.text}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
