# Arca

Tarot / astrology Telegram Mini App. React 18 · Vite 6 · TypeScript · Tailwind v4.

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # проверка перед пушем
```

## Перед первым запуском

1. Скопируй из старого репо в `public/cards/` изображения карт (WebP, slug-имена).
2. Скопируй `moon.webp` (или `moon.png` → конвертируй в WebP) в `public/`.
3. Замени заглушки в `src/data/cards.ts` и `src/data/advice.ts` на полные данные (типы полей описаны в файлах).

## Правила разработки

См. `AGENTS.md` — обязателен к прочтению для Codex и других агентов.
