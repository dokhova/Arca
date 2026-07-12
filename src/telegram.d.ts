/** Минимальные типы Telegram Mini App — только то, что используем. */
interface TelegramWebAppUser {
  first_name?: string;
}

interface TelegramWebApp {
  initDataUnsafe?: { user?: TelegramWebAppUser };
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
