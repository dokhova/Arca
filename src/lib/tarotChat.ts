const FUNCTION_URL =
  "https://mdyfckcduuvminxwoern.supabase.co/functions/v1/swift-processor";
const SUPABASE_KEY = "sb_publishable_i3OACH7tqgGxfw_GlZ9VMg_Qd_8jzGL";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  image?: string; // dataURL для превью и отправки
};

export async function sendTarotMessage(
  messages: ChatMessage[],
): Promise<string> {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error("request_failed");
  const data = await res.json();
  if (!data.reply) throw new Error("empty_reply");
  return data.reply as string;
}

// Сжатие фото перед отправкой: max 1024px по длинной стороне, JPEG 0.8
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas_error"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_load_error"));
    };
    img.src = url;
  });
}