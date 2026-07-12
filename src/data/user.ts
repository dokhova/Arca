export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
}

type TelegramUserData = {
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

const STORAGE_KEY = "arca-user";

export function getUserProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<UserProfile> | null;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      firstName:
        typeof parsed.firstName === "string" ? parsed.firstName : null,
      lastName: typeof parsed.lastName === "string" ? parsed.lastName : null,
      username: typeof parsed.username === "string" ? parsed.username : null,
      photoUrl: typeof parsed.photoUrl === "string" ? parsed.photoUrl : null,
    };
  } catch {
    return null;
  }
}

export function syncUserProfile(): UserProfile | null {
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user as
    | TelegramUserData
    | undefined;

  if (!telegramUser) return getUserProfile();

  const profile: UserProfile = {
    firstName: telegramUser.first_name ?? null,
    lastName: telegramUser.last_name ?? null,
    username: telegramUser.username ?? null,
    photoUrl: telegramUser.photo_url ?? null,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Профиль всё равно доступен в текущей сессии.
  }

  return profile;
}
