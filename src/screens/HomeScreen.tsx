import { useEffect, useState } from "react";
import { ArrowRight, Sun, Moon, ChevronDown } from "lucide-react";
import type { Screen } from "../App";
import { getCardOfDay, cardImage } from "../data/daily";
import { dailyExtras } from "../data/advice";
import { syncUserProfile } from "../data/user";
import DailyPopup from "../components/DailyPopup";
import { trackDailyAdviceViewed, trackDailyRitualViewed } from "../lib/analytics";

export default function HomeScreen({
  onNavigate,
}: {
  onNavigate: (screen: Screen) => void;
}) {
  const [popup, setPopup] = useState<"advice" | "ritual" | null>(null);
  const [userProfile] = useState(syncUserProfile);

  const card = getCardOfDay();
  const extra = dailyExtras[card.slug];

  useEffect(() => {
    new Image().src = cardImage(getCardOfDay());
  }, []);

  const adviceText = card.dailyAdvice || extra?.advice || "";
  const ritualTitle = extra?.ritualTitle ?? "Ритуал дня";
  const ritualText =
    extra?.ritualText ?? "Проведите несколько минут в тишине, наблюдая за дыханием.";

  return (
    <div style={{ padding: "0 20px", paddingBottom: 120 }}>
      {/* Приветствие — большой отступ сверху, чтобы луна дышала */}
      <header style={{ paddingTop: 180 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.15,
          }}
        >
          {userProfile?.firstName
            ? `Привет, ${userProfile.firstName}!`
            : "Привет!"}
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 17,
            color: "var(--text-secondary)",
          }}
        >
          Открой ответы и подсказки на сегодня!
        </p>
      </header>

      {/* Две большие карточки */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 32,
        }}
      >
        <BigCard
          title={"Карта\nдня"}
          gradient="linear-gradient(135deg, var(--card-light-from), var(--card-light-to))"
          onClick={() => onNavigate("cardOfDay")}
        />
        <BigCard
          title={"Расклад\nкарт"}
          gradient="linear-gradient(135deg, var(--card-bronze-from), var(--card-bronze-to))"
          onClick={() => onNavigate("spread")}
        />
      </div>

      {/* Виджеты */}
      <Widget
        icon={<Sun size={24} color="var(--accent)" />}
        title="Ежедневный совет"
        subtitle="Совет от карты дня"
        style={{ marginTop: 24 }}
        onClick={() => { trackDailyAdviceViewed(card); setPopup("advice"); }}
      />
      <Widget
        icon={<Moon size={24} color="var(--accent)" />}
        title="Ритуал дня"
        subtitle="Действие на сегодня"
        style={{ marginTop: 16 }}
        onClick={() => { trackDailyRitualViewed(card); setPopup("ritual"); }}
      />

      {/* Попапы */}
      <DailyPopup
        open={popup === "advice"}
        icon={<Sun size={22} />}
        eyebrow="Совет дня"
        cardName={card.name}
        title={card.name}
        imageSrc={cardImage(card)}
        text={adviceText}
        variant="advice"
        onClose={() => setPopup(null)}
      />
      <DailyPopup
        open={popup === "ritual"}
        icon={<Moon size={22} />}
        eyebrow="Ритуал дня"
        cardName={card.name}
        title={ritualTitle}
        imageSrc={cardImage(card)}
        text={ritualText}
        variant="ritual"
        onClose={() => setPopup(null)}
      />
    </div>
  );
}

function BigCard({
  title,
  gradient,
  onClick,
}: {
  title: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        cursor: "pointer",
        background: gradient,
        borderRadius: "var(--radius-card)",
        height: 185,
        padding: 20,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        textAlign: "left",
      }}
    >
      <span
        style={{
          whiteSpace: "pre-line",
          fontSize: 26,
          fontWeight: 600,
          lineHeight: 1.2,
          color: "var(--card-dark-text)",
        }}
      >
        {title}
      </span>
      <ArrowRight size={24} color="var(--card-dark-text)" />
    </button>
  );
}

function Widget({
  icon,
  title,
  subtitle,
  onClick,
  style,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "1px solid var(--surface-border)",
        cursor: "pointer",
        background: "var(--surface)",
        borderRadius: "var(--radius-card)",
        padding: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
        textAlign: "left",
        ...style,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "var(--icon-circle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 19,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {title}
        </span>
        <span
          style={{
            display: "block",
            marginTop: 4,
            fontSize: 15,
            lineHeight: 1.35,
            color: "var(--text-secondary)",
          }}
        >
          {subtitle}
        </span>
      </span>
      <ChevronDown size={22} color="var(--accent)" style={{ flexShrink: 0 }} />
    </button>
  );
}
