import cardsData from "./cards.json";

export type Arcana = "major" | "wands" | "cups" | "swords" | "pentacles";
export type Suit = "wands" | "cups" | "swords" | "pentacles" | null;

export interface TarotCard {
  /** Порядковый номер 0..77 (Старшие арканы идут первыми, в каноническом порядке) */
  id: number;
  /** Латинский идентификатор для маршрутов и имён файлов, напр. "shut" */
  slug: string;
  /** Название на русском, напр. "Шут" */
  name: string;
  /** Группа как в таблице: "Старшие арканы" | "Жезлы" | "Кубки" | "Мечи" | "Пентакли" */
  group: string;
  /** "major" — старшие арканы, иначе масть младших арканов */
  arcana: Arcana;
  /** Масть для младших арканов, null — для старших */
  suit: Suit;
  /** Теги-ключевые слова */
  tags: string[];
  /** Полное описание (несколько абзацев, разделены \n\n) */
  description: string;
  catalogDescription: string;
  dailyDescription: string;
  dailyShort: string;
  dailyAdvice: string;
  spreadPast: string;
  spreadPresent: string;
  spreadFuture: string;
  /** Имя файла картинки, напр. "shut.png" */
  image: string;
}

export const cards: TarotCard[] = cardsData as TarotCard[];

export const getBySlug = (slug: string): TarotCard | undefined =>
  cards.find((c) => c.slug === slug);

export const getRandomCard = (): TarotCard =>
  cards[Math.floor(Math.random() * cards.length)];
