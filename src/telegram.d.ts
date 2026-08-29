/** Минимальные типы Telegram Mini App — только то, что используем. */
interface TelegramWebAppUser {
  id?: number;
  first_name?: string;
  username?: string;
}

interface TelegramWebApp {
  initDataUnsafe?: { user?: TelegramWebAppUser; start_param?: string };
  platform?: string;
  isFullscreen?: boolean;
  safeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number };
  contentSafeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number };
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
  requestWriteAccess?: (callback?: (granted: boolean) => void) => void;
  onEvent?: (eventType: string, callback: () => void) => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
