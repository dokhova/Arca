/**
 * Фиксированный фон приложения.
 *
 * ПРАВИЛА (не менять без крайней необходимости):
 * - zIndex: 0 (не -1! отрицательный z-index хоронит фон
 *   под непрозрачными обёртками — уже проходили).
 * - pointerEvents: none, чтобы фон не перехватывал тапы.
 * - Контент приложения лежит в обёртке с zIndex: 1 (см. App.tsx).
 */
export default function AppBackground({ showMoon }: { showMoon: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "var(--bg-base)",
        overflow: "hidden",
      }}
    >
      {/* Янтарное свечение в правом верхнем углу */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 55% at 85% -5%, var(--bg-glow), transparent 65%)",
        }}
      />

      {showMoon && (
        <img
          src="/moon.png"
          alt=""
          style={{
            position: "absolute",
            top: "-14vw",
            right: "-22vw",
            width: "72vw",
            objectFit: "contain",
          }}
        />
      )}
    </div>
  );
}
