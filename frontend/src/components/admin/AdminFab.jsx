import { useState } from "react";
import axios from "axios";
import { Lock, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { API, errMsg, setToken } from "../../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export const AdminFab = ({ isAdmin, onLoggedIn, onOpenPanel }) => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, { password });
      setToken(data.token);
      setOpen(false);
      setPassword("");
      toast.success("Bem-vindo, administrador");
      onLoggedIn();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => (isAdmin ? onOpenPanel() : setOpen(true))}
        className="rk-fab fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full flex items-center justify-center"
        aria-label="Área do administrador"
        data-testid="admin-nivelinha-button"
      >
        {isAdmin ? <Settings2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 max-w-sm" data-testid="admin-login-modal">
          <DialogHeader>
            <DialogTitle className="rk-display text-xl">Área do administrador</DialogTitle>
            <DialogDescription className="text-zinc-400">Digite a senha para gerenciar o ranking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4 mt-2">
            <Input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="bg-white/5 border-white/10"
              data-testid="admin-password-input"
            />
            <Button type="submit" disabled={loading || !password} className="w-full rk-btn-gold rounded-full" data-testid="admin-login-submit">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
