/** Минимальные типы Telegram Mini App — только то, что используем. */
interface TelegramWebAppUser {
  id?: number;
  first_name?: string;
  username?: string;
}

interface TelegramWebApp {
  initDataUnsafe?: { user?: TelegramWebAppUser; start_param?: string };
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
