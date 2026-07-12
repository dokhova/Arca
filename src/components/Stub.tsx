/** Временная заглушка экрана — заменяется реальной реализацией. */
export default function Stub({ title }: { title: string }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 20,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h1>
      <p style={{ margin: 0, fontSize: 16, color: "var(--text-secondary)" }}>
        Скоро здесь появится контент
      </p>
    </div>
  );
}
