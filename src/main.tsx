import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const tg = window.Telegram?.WebApp;
tg?.ready?.();
tg?.expand?.();
if (tg && (tg.platform === "ios" || tg.platform === "android")) {
  tg.requestFullscreen?.();
}
tg?.setHeaderColor?.("#17100A");
tg?.setBackgroundColor?.("#17100A");
tg?.setBottomBarColor?.("#17100A");
