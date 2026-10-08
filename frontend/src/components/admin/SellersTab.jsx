import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi, errMsg } from "../../lib/api";
import { AddSellerForm } from "./AddSellerForm";
import { SellerEditRow } from "./SellerEditRow";

export const SellersTab = ({ rankingId, sellers, onChanged }) => {
  const [list, setList] = useState(sellers);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    if (!dragId) setList(sellers);
  }, [sellers, dragId]);

  const saveOrder = async (next) => {
    setList(next);
    try {
      await adminApi.reorder(rankingId, next.map((s) => s.id));
      onChanged();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const moveTo = (id, newPos) => {
    const from = list.findIndex((s) => s.id === id);
    const to = Math.max(0, Math.min(list.length - 1, newPos - 1));
    if (from < 0 || from === to) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    saveOrder(next.map((s, i) => ({ ...s, position: i + 1 })));
  };

  const onDragOver = (e, overId) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    const from = list.findIndex((s) => s.id === dragId);
    const to = list.findIndex((s) => s.id === overId);
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setList(next);
  };

  const onDragEnd = () => {
    setDragId(null);
    saveOrder(list.map((s, i) => ({ ...s, position: i + 1 })));
  };

  return (
    <div className="space-y-6 pt-4">
      <AddSellerForm rankingId={rankingId} onChanged={onChanged} />
      <div>
        <p className="text-xs text-zinc-500 mb-3">Arraste para reordenar, use as setas ou digite a posição.</p>
        <ul className="space-y-2" data-testid="admin-reorder-list">
          {list.map((s, i) => (
            <SellerEditRow
              key={s.id}
              seller={s}
              position={i + 1}
              total={list.length}
              dragging={dragId === s.id}
              onDragStart={() => setDragId(s.id)}
              onDragOver={(e) => onDragOver(e, s.id)}
              onDragEnd={onDragEnd}
              onMove={(p) => moveTo(s.id, p)}
              onChanged={onChanged}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};
