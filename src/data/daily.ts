import { cards, type TarotCard } from "./cards";

const PERSONAL_SEED_KEY = "arca-seed";

export function getPersonalSeed(): number {
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user as
    | { id?: number }
    | undefined;

  if (typeof telegramUser?.id === "number") return telegramUser.id;

  try {
    const storedSeed = localStorage.getItem(PERSONAL_SEED_KEY);
    if (storedSeed !== null) {
      const parsedSeed = Number(storedSeed);
      if (Number.isFinite(parsedSeed)) return parsedSeed;
    }

    const generatedSeed = Math.floor(Math.random() * 0x7fffffff);
    localStorage.setItem(PERSONAL_SEED_KEY, String(generatedSeed));
    return generatedSeed;
  } catch {
    return 0;
  }
}

/**
 * 32-битный микшер (финализатор murmur3). Считает через Math.imul,
 * поэтому умножение идёт в целых числах и не теряет младшие биты.
 */
function hashInt(n: number): number {
  let h = n | 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Детерминированная «карта дня»: одна и та же карта весь день,
 * меняется в полночь. Использует все 78 карт равномерно.
 */
export function getCardOfDay(date = new Date()): TarotCard {
  const dayKey =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const index = hashInt(dayKey ^ hashInt(getPersonalSeed())) % cards.length;
  return cards[index];
}

export function cardImage(card: TarotCard): string {
  return `/cards/webp/${card.slug}.webp`;
}

export function cardThumb(card: TarotCard): string {
  return `/cards/thumbs/${card.slug}.webp`;
}
