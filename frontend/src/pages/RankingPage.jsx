import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API, getToken, setToken } from "../lib/api";
import { RankingHeader } from "../components/ranking/RankingHeader";
import { Podium } from "../components/ranking/Podium";
import { SellerList } from "../components/ranking/SellerList";
import { AdminFab } from "../components/admin/AdminFab";
import { AdminPanel } from "../components/admin/AdminPanel";

const POLL_MS = 5000;

export default function RankingPage() {
  const [data, setData] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(!!getToken());
  const [panelOpen, setPanelOpen] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);

  const load = useCallback(async () => {
    const url = isAdmin ? `${API}/admin/ranking` : `${API}/public/ranking`;
    const cfg = { params: { ranking_id: viewId || undefined } };
    if (isAdmin) cfg.headers = { Authorization: `Bearer ${getToken()}` };
    try {
      const { data } = await axios.get(url, cfg);
      setData(data);
    } catch (e) {
      if (e?.response?.status === 401) {
        setToken(null);
        setIsAdmin(false);
      }
    }
  }, [isAdmin, viewId]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const logout = () => {
    setToken(null);
    setIsAdmin(false);
    setPanelOpen(false);
    setShowNumbers(false);
  };

  const sellers = data?.sellers || [];
  const numbersOn = isAdmin && showNumbers;

  return (
    <main className="rk-stage min-h-screen relative overflow-x-hidden" data-testid="ranking-page">
      <div className="rk-noise" aria-hidden />
      <div className="relative z-10 max-w-[1500px] mx-auto px-5 sm:px-10 lg:px-16 pb-32">
        <RankingHeader data={data} viewId={viewId} onChangeView={setViewId} />
        {data && sellers.length === 0 && (
          <p className="text-center text-zinc-500 py-24" data-testid="empty-ranking-msg">
            Nenhum vendedor neste ranking ainda.
          </p>
        )}
        <Podium sellers={sellers.slice(0, 3)} showNumbers={numbersOn} />
        <SellerList sellers={sellers.slice(3)} showNumbers={numbersOn} />
      </div>
      <AdminFab
        isAdmin={isAdmin}
        onLoggedIn={() => {
          setIsAdmin(true);
          setPanelOpen(true);
        }}
        onOpenPanel={() => setPanelOpen(true)}
      />
      {isAdmin && (
        <AdminPanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          publicData={data}
          viewId={viewId || data?.ranking?.id}
          onViewChange={setViewId}
          onChanged={load}
          showNumbers={showNumbers}
          setShowNumbers={setShowNumbers}
          onLogout={logout}
        />
      )}
    </main>
  );
}
