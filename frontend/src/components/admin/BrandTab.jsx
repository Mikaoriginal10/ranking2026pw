import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUp } from "lucide-react";
import { adminApi, errMsg, fileSrc } from "../../lib/api";
import { Button } from "../ui/button";

export const BrandTab = ({ logoPath, onChanged }) => {
  const ref = useRef(null);
  const [loading, setLoading] = useState(false);
  const src = fileSrc(logoPath);

  const upload = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      await adminApi.uploadLogo(file);
      toast.success("Logo atualizado");
      onChanged();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="h-48 rounded-xl border border-dashed border-white/15 flex items-center justify-center bg-white/[0.02]" data-testid="admin-logo-preview">
        {src ? <img src={src} alt="Logo" className="max-h-40 max-w-[90%] object-contain" /> : <span className="text-zinc-500 text-sm">Nenhum logo enviado</span>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} data-testid="admin-logo-upload-input" />
      <Button onClick={() => ref.current?.click()} disabled={loading} className="rk-btn-gold rounded-full" data-testid="admin-logo-upload-button">
        <ImageUp className="w-4 h-4 mr-2" /> {loading ? "Enviando..." : "Enviar logo"}
      </Button>
      <p className="text-xs text-zinc-500">Dica: PNG com fundo transparente fica melhor sobre o fundo escuro.</p>
    </div>
  );
};
