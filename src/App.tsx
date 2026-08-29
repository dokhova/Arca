import { useEffect, useState } from "react";
import AppBackground from "./components/AppBackground";
import BottomNav, { type Tab } from "./components/BottomNav";
import { initAnalytics, trackScreen } from "./lib/analytics";
import HomeScreen from "./screens/HomeScreen";
import CardOfDayScreen from "./screens/CardOfDayScreen";
import CatalogScreen from "./screens/CatalogScreen";
import CardDetailScreen from "./screens/CardDetailScreen";
import MoonTodayScreen from "./screens/MoonTodayScreen";
import SpreadChatScreen from "./screens/SpreadChatScreen";
import LegalScreen from "./screens/LegalScreen";
import LegalDocScreen from "./screens/LegalDocScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import { LEGAL_VERSION } from "./data/legal";

/**
 * АРХИТЕКТУРА СЛОЁВ — НЕ МЕНЯТЬ:
 *
 * 1. AppBackground: position fixed, inset 0, zIndex 0, pointerEvents none.
 * 2. Контент: единственная обёртка с position relative + zIndex 1.
 *
 * Запрещено на обёртках контента: opacity, transform, filter, isolation,
 * непрозрачные background — всё это создаёт stacking context
 * или перекрывает фон. Фон живёт ТОЛЬКО в AppBackground и токенах CSS.
 */

export type Screen =
  | "home"
  | "cardOfDay"
  | "cardDetail"
  | "moon"
  | "spreadChat"
  | "catalog"
  | "legal"
  | "legalDoc";

const TAB_SCREENS: Record<Tab, Screen> = {
  home: "home",
  spreads: "spreadChat",
  catalog: "catalog",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    const startScreens: Record<string, Screen> = {
      card: "cardOfDay",
      moon: "moon",
      ai: "spreadChat",
      catalog: "catalog",
    };
    return (startParam && startScreens[startParam]) || "home";
  });
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [legalDocId, setLegalDocId] = useState<string | null>(null);
  const [consented, setConsented] = useState<boolean>(() => {
    try {
      const rawConsent = localStorage.getItem("arca-consent");
      if (!rawConsent) return false;
      const value = JSON.parse(rawConsent);
      return value.accepted === true && value.version === LEGAL_VERSION;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (consented) initAnalytics();
  }, [consented]);

  useEffect(() => {
    if (!consented) return;
    try {
      if (localStorage.getItem("arca-write-access-asked")) return;
    } catch {
      return;
    }
    window.Telegram?.WebApp?.requestWriteAccess?.((granted) => {
      if (granted) {
        try {
          localStorage.setItem("arca-write-access-asked", "1");
        } catch {
          // no-op
        }
      }
    });
  }, [consented]);

  useEffect(() => {
    trackScreen(screen);
  }, [screen]);

  // Нижняя навигация видна только на корневых экранах табов
  const isRootScreen =
    screen === "home" || screen === "catalog" || screen === "spreadChat";

  const activeTab: Tab =
    screen === "catalog"
      ? "catalog"
      : screen === "spreadChat"
        ? "spreads"
        : "home";

  if (!consented) {
    return (
      <OnboardingScreen
        onAccept={() => {
          try {
            localStorage.setItem(
              "arca-consent",
              JSON.stringify({
                accepted: true,
                acceptedAt: new Date().toISOString(),
                version: LEGAL_VERSION,
              }),
            );
          } catch {
            // Согласие действует в текущей сессии, даже если хранилище недоступно.
          }
          setConsented(true);
          window.Telegram?.WebApp?.requestWriteAccess?.((granted) => {
            if (granted) {
              try {
                localStorage.setItem("arca-write-access-asked", "1");
              } catch {
                // no-op
              }
            }
          });
        }}
      />
    );
  }

  return (
    <>
      <AppBackground showMoon={screen === "home"} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100dvh" }}>
        {screen === "home" && <HomeScreen onNavigate={setScreen} />}
        {screen === "cardOfDay" && (
          <CardOfDayScreen onBack={() => setScreen("home")} />
        )}
        {screen === "moon" && (
          <MoonTodayScreen onBack={() => setScreen("home")} />
        )}
        {screen === "spreadChat" && <SpreadChatScreen />}
        {screen === "catalog" && (
          <CatalogScreen
            onOpenCard={(slug) => {
              setDetailSlug(slug);
              setScreen("cardDetail");
            }}
          />
        )}
        {screen === "cardDetail" && (
          <CardDetailScreen
            slug={detailSlug!}
            onBack={() => setScreen("catalog")}
          />
        )}
        {screen === "legal" && (
          <LegalScreen
            onBack={() => setScreen("home")}
            onOpenDoc={(id) => {
              setLegalDocId(id);
              setScreen("legalDoc");
            }}
          />
        )}
        {screen === "legalDoc" && (
          <LegalDocScreen
            docId={legalDocId!}
            onBack={() => setScreen("legal")}
          />
        )}
        {isRootScreen && (
          <BottomNav
            active={activeTab}
            onChange={(tab) => setScreen(TAB_SCREENS[tab])}
          />
        )}
      </div>
    </>
  );
}
