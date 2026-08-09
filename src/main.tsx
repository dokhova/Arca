import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initAnalytics } from "./lib/analytics";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const tg = window.Telegram?.WebApp;
tg?.ready?.();
initAnalytics();
tg?.expand?.();
tg?.setHeaderColor?.("#17100A");
tg?.setBackgroundColor?.("#17100A");
tg?.setBottomBarColor?.("#17100A");
