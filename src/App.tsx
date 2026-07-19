import { useState } from "react";
import AppBackground from "./components/AppBackground";
import BottomNav, { type Tab } from "./components/BottomNav";
import HomeScreen from "./screens/HomeScreen";
import CardOfDayScreen from "./screens/CardOfDayScreen";
import CatalogScreen from "./screens/CatalogScreen";
import CardDetailScreen from "./screens/CardDetailScreen";
import SpreadScreen from "./screens/SpreadScreen";
import SpreadChatScreen from "./screens/SpreadChatScreen";

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
  | "spread"
  | "spreadChat"
  | "catalog";

const TAB_SCREENS: Record<Tab, Screen> = {
  home: "home",
  spreads: "spreadChat",
  catalog: "catalog",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [detailSlug, setDetailSlug] = useState<string | null>(null);

  // Нижняя навигация видна только на корневых экранах табов
  const isRootScreen =
    screen === "home" || screen === "catalog" || screen === "spreadChat";

  const activeTab: Tab =
    screen === "catalog"
      ? "catalog"
      : screen === "spreadChat"
        ? "spreads"
        : "home";

  return (
    <>
      <AppBackground showMoon={screen === "home"} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100dvh" }}>
        {screen === "home" && <HomeScreen onNavigate={setScreen} />}
        {screen === "cardOfDay" && (
          <CardOfDayScreen onBack={() => setScreen("home")} />
        )}
        {screen === "spread" && (
          <SpreadScreen onBack={() => setScreen("home")} />
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
