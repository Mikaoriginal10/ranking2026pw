import { AnimatePresence, motion } from "framer-motion";
import { photoSrc } from "../../lib/api";
import { formatValue, initials } from "./format";

const Row = ({ s, index, showNumbers }) => {
  const src = photoSrc(s);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.9) }}
      className="rk-row group flex items-center gap-4 sm:gap-5 px-4 sm:px-5 py-3.5 rounded-xl"
      data-testid={`seller-row-item-${s.position}`}
    >
      <span className="rk-rank-num rk-display w-12 sm:w-14 shrink-0 text-2xl sm:text-3xl font-extrabold" data-testid={`seller-rank-number-${s.position}`}>
        {s.position}º
      </span>
      <div className="w-11 h-14 shrink-0 rounded-md overflow-hidden bg-zinc-800 border border-white/10">
        {src ? (
          <img src={src} alt={s.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">{initials(s.name)}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="rk-display text-base sm:text-lg font-semibold text-zinc-100 truncate" data-testid={`seller-name-${s.position}`}>
          {s.name}
        </p>
        {s.subtitle && <p className="text-xs text-zinc-500 truncate">{s.subtitle}</p>}
      </div>
      {showNumbers && s.value != null && (
        <span className="rk-mono text-sm text-amber-300/90 shrink-0" data-testid={`seller-value-${s.position}`}>{formatValue(s.value)}</span>
      )}
    </motion.li>
  );
};

export const SellerList = ({ sellers, showNumbers }) => {
  if (!sellers.length) return null;
  return (
    <section className="mt-28" data-testid="sellers-list-container">
      <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
        <h2 className="rk-display text-base md:text-lg font-semibold uppercase tracking-[0.25em] text-zinc-300">Classificação geral</h2>
        <span className="rk-mono text-xs text-zinc-500" data-testid="sellers-count">{sellers.length + 3} representantes</span>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <AnimatePresence>
          {sellers.map((s, i) => (
            <Row key={s.id} s={s} index={i} showNumbers={showNumbers} />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
};
