export type CampaignProps = {
  campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  tg_start_param?: string;
  entry_source?: "telegram" | "web";
};

const STORAGE_KEY = "arca-campaign";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

// Конвенция start_param: "<экран>__<кампания>", напр. "ai__madloba".
// Обратная совместимость: если "__" нет — всё значение это токен экрана.
export function parseStartParam(
  raw: string | undefined,
): { screen: string | undefined; campaign: string | undefined } {
  if (!raw) return { screen: undefined, campaign: undefined };
  const idx = raw.indexOf("__");
  if (idx === -1) return { screen: raw, campaign: undefined };
  return {
    screen: raw.slice(0, idx) || undefined,
    campaign: raw.slice(idx + 2) || undefined,
  };
}

// Читает UTM из URL + Telegram start_param и один раз сохраняет first-touch атрибуцию.
export function captureCampaignOnLoad(): void {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return; // только первое касание
  } catch {
    return;
  }

  const props: CampaignProps = {};

  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) props[key] = value;
    }
  } catch {
    // no-op
  }

  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (startParam) {
    props.tg_start_param = startParam;
    const { campaign } = parseStartParam(startParam);
    if (campaign) props.campaign = campaign;
  }

  props.entry_source = startParam ? "telegram" : "web";

  const hasAttribution = Object.keys(props).some((k) => k !== "entry_source");
  if (!hasAttribution) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(props));
  } catch {
    // no-op
  }
}

export function getCampaignProps(): CampaignProps {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CampaignProps) : {};
  } catch {
    return {};
  }
}

export function hasCampaign(): boolean {
  const p = getCampaignProps();
  return Boolean(p.campaign || p.utm_source || p.tg_start_param);
}
