import { useState } from "react";
import { toast } from "sonner";
import { Check, Eye, Radio, Trash2 } from "lucide-react";
import { adminApi, errMsg } from "../../lib/api";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

const RankingItem = ({ r, isActive, isViewing, onView, onChanged }) => {
  const [title, setTitle] = useState(r.title);
  const run = async (fn, msg) => {
    try {
      await fn();
      if (msg) toast.success(msg);
      onChanged();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <li className={`rounded-lg border p-3 flex flex-wrap items-center gap-2 ${isViewing ? "border-amber-400/40 bg-amber-400/[0.04]" : "border-white/10"}`} data-testid={`admin-ranking-item-${r.id}`}>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 bg-transparent border-white/10 flex-1 min-w-[160px]" data-testid={`admin-ranking-title-${r.id}`} />
      {title !== r.title && (
        <Button size="sm" variant="secondary" onClick={() => run(() => adminApi.updateRanking(r.id, title), "Título salvo")} data-testid={`admin-ranking-save-${r.id}`}>
          <Check className="w-4 h-4" />
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onView} className={isViewing ? "text-amber-300" : "text-zinc-400"} data-testid={`admin-ranking-edit-${r.id}`}>
        <Eye className="w-4 h-4 mr-1" /> {isViewing ? "Editando" : "Editar"}
      </Button>
      {isActive ? (
        <span className="text-xs text-emerald-400 flex items-center gap-1 px-2" data-testid={`admin-ranking-active-badge-${r.id}`}><Radio className="w-3.5 h-3.5" /> No ar</span>
      ) : (
        <Button size="sm" variant="ghost" className="text-zinc-400" onClick={() => run(() => adminApi.setActive(r.id), "Ranking publicado para todos")} data-testid={`admin-ranking-activate-${r.id}`}>
          Exibir para todos
        </Button>
      )}
      <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-red-400" onClick={() => window.confirm(`Excluir "${r.title}"?`) && run(() => adminApi.deleteRanking(r.id), "Ranking excluído")} data-testid={`admin-ranking-delete-${r.id}`}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </li>
  );
};

export const RankingsTab = ({ data, viewId, onViewChange, onChanged }) => {
  const [title, setTitle] = useState("");
  const [copy, setCopy] = useState(true);

  const create = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { data: r } = await adminApi.createRanking({ title, copy_from: copy ? viewId : null });
      setTitle("");
      toast.success("Ranking criado");
      onViewChange(r.id);
      onChanged();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <form onSubmit={create} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <p className="text-sm font-medium">Novo ranking (ex.: Ranking de Novembro)</p>
        <div className="flex gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ranking de Novembro" className="bg-white/5 border-white/10" data-testid="admin-new-ranking-title" />
          <Button type="submit" className="rk-btn-gold rounded-full" data-testid="admin-create-ranking-button">Criar</Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <Checkbox checked={copy} onCheckedChange={(v) => setCopy(!!v)} data-testid="admin-copy-sellers-checkbox" />
          Copiar vendedores e fotos do ranking que estou editando
        </label>
      </form>
      <ul className="space-y-2">
        {(data?.rankings || []).map((r) => (
          <RankingItem key={r.id} r={r} isActive={r.id === data?.active_ranking_id} isViewing={r.id === viewId} onView={() => onViewChange(r.id)} onChanged={onChanged} />
        ))}
      </ul>
    </div>
  );
};
