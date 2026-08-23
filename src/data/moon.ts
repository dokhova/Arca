// Расчёт фазы Луны из даты — чистая арифметика, без внешних API.
// Опорное новолуние + синодический месяц; фаза одинакова для всех пользователей.

export type MoonPhase = {
  index: number;
  id: string;
  name: string;
  keywords: string;
  energy: string;
  recommendation: string;
};

export const MOON_PHASES: MoonPhase[] = [
  {
    index: 0,
    id: "new_moon",
    name: "Новолуние",
    keywords: "намерения, старт, новый цикл",
    energy:
      "Новолуние, чистый лист и начало нового цикла. Время принять решение, выбрать направление и сделать первый шаг. Не торопитесь с результатом, обозначьте главное.",
    recommendation: "Время загадывать и начинать",
  },
  {
    index: 1,
    id: "waxing_crescent",
    name: "Растущий серп",
    keywords: "первые шаги, рост, возможности",
    energy:
      "Появился первый свет, задуманное обретает форму. Время делать первые шаги и не сомневаться в выбранном пути, даже если результат ещё не виден.",
    recommendation: "Первые шаги к цели",
  },
  {
    index: 2,
    id: "first_quarter",
    name: "Первая четверть",
    keywords: "решения, действие, преодоление",
    energy:
      "Луна освещена наполовину, и наступает время решений. Это фаза действия и проверки выбранного направления, когда важно преодолеть сомнения и продолжить движение вперёд.",
    recommendation: "Момент решений и действия",
  },
  {
    index: 3,
    id: "waxing_gibbous",
    name: "Прибывающая луна",
    keywords: "развитие, доработка, упорство",
    energy:
      "Луна набирает силу, время доводить начатое до конца и приумножать. Хороший момент вложиться в то, что уже растёт, и не бросать на полпути.",
    recommendation: "Доводите начатое до конца",
  },
  {
    index: 4,
    id: "full_moon",
    name: "Полнолуние",
    keywords: "результат, ясность, эмоции",
    energy:
      "Полнолуние, кульминация лунного цикла. Результаты становятся заметнее и яснее. Важно сохранять внимание к своим ощущениям и не торопиться с резкими решениями.",
    recommendation: "Подведи итоги и выдели главное",
  },
  {
    index: 5,
    id: "waning_gibbous",
    name: "Убывающая луна",
    keywords: "благодарность, щедрость, отдача",
    energy:
      "Период осмысления и благодарности за достигнутое. Время понять ценность добытого опыта, поделиться им и постепенно освободить место для нового.",
    recommendation: "Сохрани главное из опыта",
  },
  {
    index: 6,
    id: "last_quarter",
    name: "Последняя четверть",
    keywords: "отпускание, прощение, завершение",
    energy:
      "Фаза пересмотра и завершения. Символически связана с освобождением от того, что больше не приносит пользы или уже выполнило свою роль.",
    recommendation: "Пора отпускать и прощать",
  },
  {
    index: 7,
    id: "waning_crescent",
    name: "Убывающий серп",
    keywords: "пауза, восстановление, тишина",
    energy:
      "Завершение цикла и время восстановления. Замедлись, отдохни и восполни силы, чтобы подготовиться к новому началу.",
    recommendation: "Время отдыха и восстановления",
  },
];

const SYNODIC = 29.530588853; // синодический месяц, дней
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // известное новолуние (UTC)

/** Возраст Луны в днях от новолуния (0…29.53). */
export function moonAge(date: Date = new Date()): number {
  const days = (date.getTime() - REF_NEW_MOON) / 86_400_000;
  const age = days % SYNODIC;
  return age < 0 ? age + SYNODIC : age;
}

/** Доля цикла 0…1. */
export function moonFraction(date: Date = new Date()): number {
  return moonAge(date) / SYNODIC;
}

/** Освещённость в процентах (0…100). */
export function moonIllumination(date: Date = new Date()): number {
  const frac = moonFraction(date);
  return Math.round(((1 - Math.cos(2 * Math.PI * frac)) / 2) * 100);
}

/** Растёт Луна (true) или убывает (false). */
export function isWaxing(date: Date = new Date()): boolean {
  return moonFraction(date) < 0.5;
}

/** Текущая фаза (одна из 8). */
export function getMoonPhase(date: Date = new Date()): MoonPhase {
  const frac = moonFraction(date);
  let index: number;
  if (frac < 0.03 || frac >= 0.97) index = 0;
  else if (frac < 0.22) index = 1;
  else if (frac < 0.28) index = 2;
  else if (frac < 0.47) index = 3;
  else if (frac < 0.53) index = 4;
  else if (frac < 0.72) index = 5;
  else if (frac < 0.78) index = 6;
  else index = 7;
  return MOON_PHASES[index];
}

/** Путь к картинке фазы в public/. */
export function moonImage(phase: MoonPhase): string {
  return `/moon-phases/${phase.id}.webp`;
}
