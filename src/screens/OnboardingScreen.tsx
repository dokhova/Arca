import { useState, type MouseEvent } from "react";
import { Check } from "lucide-react";
import { LEGAL_DOCS } from "../data/legal";
import LegalDocScreen from "./LegalDocScreen";

export default function OnboardingScreen({
  onAccept,
}: {
  onAccept: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  if (docId !== null) {
    return <LegalDocScreen docId={docId} onBack={() => setDocId(null)} />;
  }

  const openDocument = (event: MouseEvent<HTMLButtonElement>, id: string) => {
    event.stopPropagation();
    if (LEGAL_DOCS.some((doc) => doc.id === id)) setDocId(id);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#1a1109",
          backgroundImage:
            'url("/onboarding-bg-v1.jpg"), radial-gradient(70% 45% at 32% 28%,rgba(235,196,132,0.45),transparent 62%), radial-gradient(65% 50% at 72% 52%,rgba(150,104,58,0.5),transparent 60%), linear-gradient(180deg,#2b2013,#1a1109 55%,#0c0806)',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg,rgba(10,7,5,0.4) 0%,transparent 14%,transparent 52%,rgba(10,7,5,0.6) 84%,rgba(10,7,5,0.93) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding:
            "calc(26px + env(safe-area-inset-top,0px)) 24px calc(30px + env(safe-area-inset-bottom,0px))",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: 15,
            fontWeight: 500,
            color: "#fff",
          }}
        >
          Arca App
        </div>

        <div style={{ flex: 1 }} />

        <h1
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: 27,
            lineHeight: 1.18,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          Место, где карты помогают найти ответ
        </h1>
        <p
          style={{
            margin: "16px 0 0",
            textAlign: "center",
            fontSize: 14,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Карта дня, расклады и подсказки на каждый день
        </p>

        <button
          type="button"
          onClick={() => {
            if (!checked) {
              setError(true);
              return;
            }
            onAccept();
          }}
          style={{
            width: "100%",
            height: 58,
            marginTop: 26,
            border: "none",
            borderRadius: 18,
            background: "#fff",
            color: "#1a1206",
            fontSize: 17,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Войти
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label="Принять условия"
            onClick={() => {
              setChecked((value) => !value);
              setError(false);
            }}
            style={{
              width: 30,
              height: 30,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              border: `1.5px solid ${checked ? "#fff" : "rgba(255,255,255,0.4)"}`,
              borderRadius: 9,
              background: checked ? "#fff" : "rgba(255,255,255,0.05)",
              color: "#1a1206",
              cursor: "pointer",
            }}
          >
            {checked && <Check size={20} strokeWidth={3} />}
          </button>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.6)",
              textAlign: "left",
            }}
          >
            Мне есть 18 лет. Принимаю{" "}
            <LegalLink onClick={(event) => openDocument(event, "terms")}>
              Пользовательское соглашение
            </LegalLink>{" "}
            и{" "}
            <LegalLink onClick={(event) => openDocument(event, "privacy")}>
              Политику конфиденциальности
            </LegalLink>{" "}
            и даю согласие на обработку персональных данных, в том числе их
            передачу за рубеж (в т. ч. в США).
          </div>
        </div>

        <div
          style={{
            minHeight: 16,
            marginTop: 10,
            textAlign: "center",
            fontSize: 11.5,
            color: "#f0c98a",
          }}
        >
          {error ? "Сначала отметьте согласие" : ""}
        </div>
      </div>
    </div>
  );
}

function LegalLink({
  children,
  onClick,
}: {
  children: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline",
        margin: 0,
        padding: 0,
        border: "none",
        background: "none",
        color: "inherit",
        font: "inherit",
        lineHeight: "inherit",
        textAlign: "left",
        textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
