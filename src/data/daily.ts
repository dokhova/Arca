import { cards, type TarotCard } from "./cards";

/**
 * Детерминированная «карта дня»: одна и та же карта весь день,
 * меняется в полночь. Не трогает cards.ts — живёт отдельно.
 */
export function getCardOfDay(date = new Date()): TarotCard {
  const dayKey =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  let seed = dayKey;
  seed = (seed ^ (seed >> 7)) * 2654435761;
  const index = Math.abs(seed) % cards.length;
  return cards[index];
}

/** Путь к изображению карты: public/cards/ + поле image из данных */
export function cardImage(card: TarotCard): string {
  return `/cards/${card.image}`;
}
