import { useState } from "react";
import { toast } from "sonner";
import { Plus, ListPlus } from "lucide-react";
import { adminApi, errMsg } from "../../lib/api";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

export const AddSellerForm = ({ rankingId, onChanged }) => {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await adminApi.addSeller({ ranking_id: rankingId, name, value: value === "" ? null : Number(value) });
      setName("");
      setValue("");
      toast.success("Vendedor adicionado");
      onChanged();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const addBulk = async () => {
    const names = bulk.split("\n").map((n) => n.trim()).filter(Boolean);
    if (!names.length) return;
    try {
      const { data } = await adminApi.bulkAdd(rankingId, names);
      setBulk("");
      setShowBulk(false);
      toast.success(`${data.added} vendedores adicionados`);
      onChanged();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do vendedor" className="bg-white/5 border-white/10 flex-1" data-testid="admin-new-seller-name" />
        <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" placeholder="Número (opcional)" className="bg-white/5 border-white/10 sm:w-40" data-testid="admin-new-seller-value" />
        <Button type="submit" className="rk-btn-gold rounded-full" data-testid="admin-add-rep-button">
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </form>
      <button type="button" onClick={() => setShowBulk((v) => !v)} className="text-xs text-amber-300/80 hover:text-amber-300 flex items-center gap-1" data-testid="admin-toggle-bulk">
        <ListPlus className="w-3.5 h-3.5" /> Adicionar vários de uma vez
      </button>
      {showBulk && (
        <div className="space-y-2">
          <Textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={6} placeholder={"Um nome por linha\nJoão Silva\nMaria Souza"} className="bg-white/5 border-white/10" data-testid="admin-bulk-textarea" />
          <Button type="button" variant="secondary" onClick={addBulk} className="rounded-full" data-testid="admin-bulk-submit">Adicionar lista</Button>
        </div>
      )}
    </div>
  );
};
