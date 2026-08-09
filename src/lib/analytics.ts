import posthog from "posthog-js";
import type { TarotCard } from "../data/cards";

let enabled = false;

export function initAnalytics(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com",
    defaults: "2026-05-30",
    capture_pageview: false,
    persistence: "localStorage",
  });
  enabled = true;

  const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tg?.id != null) {
    posthog.identify(String(tg.id), {
      username: tg.username,
      first_name: tg.first_name,
      is_telegram: true,
    });
  }
}

function capture(event: string, props?: Record<string, unknown>): void {
  if (!enabled) return;
  posthog.capture(event, props);
}

export function trackScreen(screen: string): void {
  capture("$pageview", { screen });
}
export function trackCardOfDayOpened(card: TarotCard): void {
  capture("card_of_day_opened", { card_slug: card.slug, card_name: card.name });
}
export function trackDailyAdviceViewed(card: TarotCard): void {
  capture("daily_advice_viewed", { card_slug: card.slug, card_name: card.name });
}
export function trackDailyRitualViewed(card: TarotCard): void {
  capture("daily_ritual_viewed", { card_slug: card.slug, card_name: card.name });
}
export function trackSpreadCompleted(spreadType: 1 | 3, slugs: string[]): void {
  capture("spread_completed", { spread_type: spreadType, cards: slugs });
}
export function trackAiChatMessageSent(hasImage: boolean, length: number): void {
  capture("ai_chat_message_sent", { has_image: hasImage, message_length: length });
}
export function trackCardViewed(card: TarotCard, source: string): void {
  capture("card_viewed", { card_slug: card.slug, card_name: card.name, source });
}
