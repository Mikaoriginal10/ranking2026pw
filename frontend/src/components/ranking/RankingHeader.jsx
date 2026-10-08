import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { fileSrc } from "../../lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export const RankingHeader = ({ data, viewId, onChangeView }) => {
  const logo = fileSrc(data?.logo_path);
  const rankings = data?.rankings || [];
  return (
    <header className="pt-10 sm:pt-14 pb-10 flex flex-col items-center text-center" data-testid="main-header">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full flex justify-center"
        data-testid="brand-logo-container"
      >
        {logo ? (
          <img src={logo} alt="Logo da marca" className="max-h-40 sm:max-h-52 lg:max-h-64 max-w-[90%] object-contain drop-shadow-[0_0_40px_rgba(234,179,8,0.25)]" data-testid="brand-logo-img" />
        ) : (
          <div className="h-36 sm:h-48 w-full max-w-xl rounded-2xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-2 text-zinc-500" data-testid="brand-logo-placeholder">
            <Trophy className="w-10 h-10 text-amber-400/70" />
            <span className="rk-mono text-xs uppercase tracking-[0.3em]">Espaço para o logo da marca</span>
          </div>
        )}
      </motion.div>

      <div className="mt-8 flex items-center gap-3 rk-mono text-[11px] uppercase tracking-[0.35em] text-zinc-400">
        <span className="rk-live-dot" /> Ao vivo
      </div>

      <motion.h1
        key={data?.ranking?.title}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="rk-title mt-3 text-4xl sm:text-5xl lg:text-7xl font-extrabold uppercase tracking-tight"
        data-testid="ranking-title-heading"
      >
        {data?.ranking?.title || "Carregando..."}
      </motion.h1>

      {rankings.length > 1 && (
        <div className="mt-6">
          <Select value={viewId || data?.ranking?.id || ""} onValueChange={onChangeView}>
            <SelectTrigger className="w-60 bg-white/5 border-white/10 text-zinc-300 rounded-full" data-testid="month-select-dropdown">
              <SelectValue placeholder="Ver outro ranking" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-zinc-200">
              {rankings.map((r) => (
                <SelectItem key={r.id} value={r.id} data-testid={`month-option-${r.id}`}>
                  {r.title}{r.id === data?.active_ranking_id ? " • atual" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </header>
  );
};
