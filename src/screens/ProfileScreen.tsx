// Временно отключён из навигации (июль 2026) — не удалять, подключение вернётся в App.tsx.
import { useState, type ReactNode } from "react";
import { Bell, ChevronRight, Info, Sparkles, User } from "lucide-react";
import { syncUserProfile } from "../data/user";

export default function ProfileScreen() {
  const [profile] = useState(syncUserProfile);
  const [aboutOpen, setAboutOpen] = useState(false);

  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ");
  const initial = profile?.firstName?.trim().charAt(0).toUpperCase();

  return (
    <div
      style={{
        padding: "calc(24px + env(safe-area-inset-top, 0px) + var(--tg-content-top, 0px)) 20px 120px",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 34,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        Профиль
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 24,
          padding: 20,
          border: "1px solid var(--surface-border)",
          borderRadius: "var(--radius-card)",
          background: "var(--surface)",
        }}
      >
        {profile?.photoUrl ? (
          <img
            src={profile.photoUrl}
            alt=""
            style={{
              width: 64,
              height: 64,
              flexShrink: 0,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "var(--icon-circle)",
              color: "var(--accent)",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {initial || <User size={26} />}
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {fullName || "Гость"}
          </div>
          {profile?.username && (
            <div
              style={{
                marginTop: 4,
                fontSize: 15,
                color: "var(--text-secondary)",
              }}
            >
              @{profile.username}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 16,
        }}
      >
        <ProfileRow
          icon={<Sparkles size={20} />}
          label="Карта дня"
          trailing={
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              скоро
            </span>
          }
          inactive
        />
        <ProfileRow
          icon={<Bell size={20} />}
          label="Уведомления"
          trailing={
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              скоро
            </span>
          }
          inactive
        />

        <button
          type="button"
          onClick={() => setAboutOpen((open) => !open)}
          aria-expanded={aboutOpen}
          style={{
            width: "100%",
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
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "var(--text-primary)",
              fontSize: 16,
            }}
          >
            <Info size={20} color="var(--accent)" />
            <span style={{ flex: 1 }}>О приложении</span>
            <ChevronRight
              size={20}
              color="var(--nav-inactive)"
              style={{
                transform: aboutOpen ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </span>

          {aboutOpen && (
            <span
              style={{
                display: "block",
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid var(--surface-border)",
                fontSize: 14,
                lineHeight: 1.5,
                color: "var(--text-secondary)",
              }}
            >
              <span style={{ display: "block" }}>
                Arca — карты, советы и ритуалы на каждый день
              </span>
              <span style={{ display: "block", marginTop: 4 }}>
                Версия 1.0.0
              </span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  trailing,
  inactive = false,
}: {
  icon: ReactNode;
  label: string;
  trailing: ReactNode;
  inactive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 18,
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-card)",
        background: "var(--surface)",
        color: "var(--text-primary)",
        fontSize: 16,
        opacity: inactive ? 0.5 : 1,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          color: "var(--accent)",
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {trailing}
    </div>
  );
}
