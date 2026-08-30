import { useLayoutEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cards } from "../data/cards";
import { cardThumb } from "../data/daily";

const GROUPS = ["Старшие арканы", "Жезлы", "Кубки", "Мечи", "Пентакли"];
const ALL_CARDS = "Все";

let catalogScrollY = 0;
let catalogActiveGroup = ALL_CARDS;

export default function CatalogScreen({
  onOpenCard,
}: {
  onOpenCard: (slug: string) => void;
}) {
  const [activeGroup, setActiveGroup] = useState(catalogActiveGroup);

  useLayoutEffect(() => {
    window.scrollTo(0, catalogScrollY);

    return () => {
      catalogScrollY = window.scrollY;
    };
  }, []);

  const visibleGroups =
    activeGroup === ALL_CARDS ? GROUPS : [activeGroup];

  return (
    <div
      style={{
        padding: "calc(24px + env(safe-area-inset-top, 0px) + var(--tg-content-top, 0px)) 20px 120px",
      }}
    >
      <style>{`.catalog-filters::-webkit-scrollbar { display: none; }`}</style>

      <h1
        style={{
          margin: 0,
          fontSize: 34,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        Каталог
      </h1>

      <div
        className="catalog-filters"
        style={{
          display: "flex",
          gap: 8,
          marginTop: 18,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {[ALL_CARDS, ...GROUPS].map((group) => {
          const isActive = activeGroup === group;

          return (
            <button
              key={group}
              type="button"
              onClick={() => {
                catalogActiveGroup = group;
                setActiveGroup(group);
              }}
              style={{
                flexShrink: 0,
                padding: "8px 14px",
                borderRadius: 999,
                border: isActive
                  ? "1px solid transparent"
                  : "1px solid var(--surface-border)",
                background: isActive ? "var(--chip-bg)" : "var(--surface)",
                color: isActive
                  ? "var(--card-dark-text)"
                  : "var(--text-secondary)",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {group}
            </button>
          );
        })}
      </div>

      {visibleGroups.map((group) => (
        <section key={group}>
          {activeGroup === ALL_CARDS && (
            <h2
              style={{
                margin: "24px 0 10px",
                fontSize: 17,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {group}
            </h2>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: activeGroup === ALL_CARDS ? 0 : 24,
            }}
          >
            {cards
              .filter((card) => card.group === group)
              .map((card) => (
                <button
                  key={card.slug}
                  type="button"
                  onClick={() => onOpenCard(card.slug)}
                  style={{
                    width: "100%",
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    textAlign: "left",
                    background: "var(--surface)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--radius-card)",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: 56,
                      height: 92,
                      borderRadius: 10,
                      overflow: "hidden",
                      flexShrink: 0,
                      display: "block",
                    }}
                  >
                    <img
                      src={cardThumb(card)}
                      alt={card.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scale(1.18)",
                        objectPosition: "50% 30%",
                      }}
                    />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {card.name}
                    </span>
                    <span
                      style={{
                        display: "block",
                        marginTop: 5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 13,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {card.tags.slice(0, 2).join(" · ")}
                    </span>
                  </span>
                  <ChevronRight
                    size={20}
                    color="var(--nav-inactive)"
                    style={{ flexShrink: 0 }}
                  />
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
