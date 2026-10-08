import { motion } from "framer-motion";
import { Crown, Medal } from "lucide-react";
import { photoSrc } from "../../lib/api";
import { MarqueeBulbs } from "./MarqueeBulbs";
import { formatValue, initials } from "./format";

const THEME = {
  1: { key: "gold", label: "1º", word: "Primeiro lugar", testid: "1st", width: "max-w-[340px]", delay: 0.3 },
  2: { key: "blue", label: "2º", word: "Segundo lugar", testid: "2nd", width: "max-w-[270px]", delay: 0.5 },
  3: { key: "white", label: "3º", word: "Terceiro lugar", testid: "3rd", width: "max-w-[270px]", delay: 0.7 },
};

export const PodiumCard = ({ seller, place, showNumbers }) => {
  const t = THEME[place];
  const src = photoSrc(seller);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: t.delay }}
      className={`rk-podium rk-${t.key} mx-auto w-full ${t.width} flex flex-col items-center`}
      data-testid={`podium-${t.testid}-place`}
    >
      <div className="rk-place-icon mb-4">
        {place === 1 ? <Crown className="w-10 h-10 sm:w-12 sm:h-12" /> : <Medal className="w-8 h-8" />}
      </div>

      <div className="relative w-full">
        <div className="rk-backlight" aria-hidden />
        <div className="rk-rays" aria-hidden />
        <div className="rk-frame relative w-full aspect-[3/5]">
          <MarqueeBulbs />
          <div className="rk-frame-inner absolute inset-[14px] overflow-hidden rounded-[6px]">
            {src ? (
              <img src={src} alt={seller.name} className="w-full h-full object-cover" data-testid={`podium-photo-${t.testid}`} />
            ) : (
              <div className="rk-initials w-full h-full flex items-center justify-center" data-testid={`podium-photo-${t.testid}`}>
                {initials(seller.name)}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
          <div className="rk-badge absolute -bottom-6 left-1/2 -translate-x-1/2" data-testid={`podium-badge-${t.testid}`}>
            {t.label}
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="rk-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">{t.word}</p>
        <h3 className={`rk-display mt-2 font-bold text-zinc-50 ${place === 1 ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`} data-testid={`podium-name-${t.testid}`}>
          {seller.name}
        </h3>
        {seller.subtitle && <p className="text-sm text-zinc-400 mt-1">{seller.subtitle}</p>}
        {showNumbers && seller.value != null && (
          <p className="rk-mono mt-2 text-sm text-amber-300" data-testid={`podium-value-${t.testid}`}>{formatValue(seller.value)}</p>
        )}
      </div>
    </motion.div>
  );
};
