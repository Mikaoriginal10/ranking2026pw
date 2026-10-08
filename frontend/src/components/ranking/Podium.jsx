import { PodiumCard } from "./PodiumCard";

const ORDER = [1, 0, 2];

export const Podium = ({ sellers, showNumbers }) => {
  if (!sellers.length) return null;
  return (
    <section
      className="grid grid-cols-1 md:grid-cols-3 gap-14 md:gap-6 lg:gap-12 items-end max-w-6xl mx-auto pt-6"
      data-testid="podium-container"
    >
      {ORDER.map((idx) => {
        const s = sellers[idx];
        if (!s) return <div key={idx} className="hidden md:block" />;
        return (
          <div key={s.id} className={idx === 0 ? "order-first md:order-none" : idx === 1 ? "order-2 md:order-none" : "order-3 md:order-none"}>
            <PodiumCard seller={s} place={idx + 1} showNumbers={showNumbers} />
          </div>
        );
      })}
    </section>
  );
};
