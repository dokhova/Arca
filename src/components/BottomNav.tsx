import { Home } from "lucide-react";

export type Tab = "home" | "spreads" | "catalog";

function CardsIcon({
  size = 24,
  strokeWidth = 1.8,
}: {
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="4.5"
        y="3.5"
        width="11"
        height="17"
        rx="2"
        transform="rotate(-12 10 12)"
      />
      <rect x="8.5" y="3.5" width="11" height="17" rx="2" />
    </svg>
  );
}

function AiIcon({
  size = 24,
  strokeWidth = 1.8,
}: {
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6 C12.6 9 15 11.4 18 12 C15 12.6 12.6 15 12 18 C11.4 15 9 12.6 6 12 C9 11.4 11.4 9 12 6 Z" />
    </svg>
  );
}

const TABS = [
  { id: "home", label: "Главная", icon: Home },
  { id: "spreads", label: "Расклады", icon: AiIcon },
  { id: "catalog", label: "Каталог", icon: CardsIcon },
] as const;

export default function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--surface-border)",
        paddingTop: 10,
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
      }}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = id === active;
        const color = isActive ? "var(--accent)" : "var(--nav-inactive)";
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              color,
            }}
          >
            <Icon size={24} strokeWidth={isActive ? 2.2 : 1.8} />
            <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400 }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
