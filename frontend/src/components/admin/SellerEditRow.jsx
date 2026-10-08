import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Camera, GripVertical, Trash2 } from "lucide-react";
import { adminApi, errMsg, photoSrc } from "../../lib/api";
import { initials } from "../ranking/format";
import { Input } from "../ui/input";

export const SellerEditRow = ({ seller, position, total, dragging, onDragStart, onDragOver, onDragEnd, onMove, onChanged }) => {
  const [name, setName] = useState(seller.name);
  const [value, setValue] = useState(seller.value ?? "");
  const [pos, setPos] = useState(position);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const src = photoSrc(seller);
  const tid = seller.id;

  useEffect(() => setPos(position), [position]);
  useEffect(() => {
    setName(seller.name);
    setValue(seller.value ?? "");
  }, [seller.name, seller.value]);

  const save = async (body) => {
    try {
      await adminApi.updateSeller(seller.id, body);
      onChanged();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await adminApi.uploadPhoto(seller.id, file);
      toast.success("Foto atualizada");
      onChanged();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remover ${seller.name}?`)) return;
    try {
      await adminApi.deleteSeller(seller.id);
      onChanged();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const accent = position === 1 ? "border-amber-400/50" : position === 2 ? "border-blue-400/50" : position === 3 ? "border-slate-200/40" : "border-white/10";

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border ${accent} bg-white/[0.03] p-2 transition-opacity ${dragging ? "opacity-40" : ""}`}
      data-testid={`admin-seller-row-${tid}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
      <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab shrink-0" />
      <input
        value={pos}
        onChange={(e) => setPos(e.target.value)}
        onBlur={() => Number(pos) !== position && onMove(Number(pos) || position)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="w-10 text-center bg-transparent rk-display font-bold text-amber-300 outline-none border-b border-white/10"
        data-testid={`admin-seller-position-${tid}`}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative w-9 h-12 rounded overflow-hidden bg-zinc-800 shrink-0 group"
        title="Enviar foto"
        data-testid={`admin-seller-photo-btn-${tid}`}
      >
        {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-zinc-400">{initials(seller.name)}</span>}
        <span className={`absolute inset-0 flex items-center justify-center bg-black/60 ${uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
          <Camera className={`w-3.5 h-3.5 ${uploading ? "animate-pulse" : ""}`} />
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} data-testid={`admin-seller-photo-input-${tid}`} />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== seller.name && save({ name: name.trim() })}
        className="h-9 bg-transparent border-white/10 flex-1 min-w-0"
        data-testid={`admin-seller-name-${tid}`}
      />
      </div>
      <div className="flex items-center gap-2 justify-end">
      <Input
        value={value}
        type="number"
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => String(value) !== String(seller.value ?? "") && save({ value: value === "" ? null : Number(value) })}
        placeholder="nº"
        className="h-9 w-20 sm:w-24 bg-transparent border-white/10"
        data-testid={`admin-seller-value-${tid}`}
      />
      <button type="button" disabled={position === 1} onClick={() => onMove(position - 1)} className="p-1 text-zinc-400 hover:text-white disabled:opacity-20" data-testid={`admin-seller-up-${tid}`}>
        <ArrowUp className="w-4 h-4" />
      </button>
      <button type="button" disabled={position === total} onClick={() => onMove(position + 1)} className="p-1 text-zinc-400 hover:text-white disabled:opacity-20" data-testid={`admin-seller-down-${tid}`}>
        <ArrowDown className="w-4 h-4" />
      </button>
      <button type="button" onClick={remove} className="p-1 text-zinc-500 hover:text-red-400" data-testid={`admin-seller-delete-${tid}`}>
        <Trash2 className="w-4 h-4" />
      </button>
      </div>
    </li>
  );
};
