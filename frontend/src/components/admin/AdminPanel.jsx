import { LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { SellersTab } from "./SellersTab";
import { RankingsTab } from "./RankingsTab";
import { BrandTab } from "./BrandTab";

export const AdminPanel = ({ open, onOpenChange, publicData, viewId, onViewChange, onChanged, showNumbers, setShowNumbers, onLogout }) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full sm:max-w-2xl bg-zinc-950 border-white/10 text-zinc-100 overflow-y-auto" data-testid="admin-panel-drawer">
      <SheetHeader className="text-left">
        <SheetTitle className="rk-display text-2xl text-zinc-50">Painel do administrador</SheetTitle>
        <SheetDescription className="text-zinc-400">
          Editando: <span className="text-amber-300" data-testid="admin-editing-title">{publicData?.ranking?.title}</span>
        </SheetDescription>
      </SheetHeader>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-sm font-medium">Mostrar números na tela</p>
          <p className="text-xs text-zinc-500">Visível somente neste dispositivo (administrador)</p>
        </div>
        <Switch checked={showNumbers} onCheckedChange={setShowNumbers} data-testid="admin-toggle-numbers-switch" />
      </div>

      <Tabs defaultValue="sellers" className="mt-6">
        <TabsList className="bg-white/5 w-full grid grid-cols-3">
          <TabsTrigger value="sellers" data-testid="admin-tab-sellers">Vendedores</TabsTrigger>
          <TabsTrigger value="rankings" data-testid="admin-tab-rankings">Rankings / Meses</TabsTrigger>
          <TabsTrigger value="brand" data-testid="admin-tab-brand">Logo</TabsTrigger>
        </TabsList>
        <TabsContent value="sellers">
          <SellersTab rankingId={viewId} sellers={publicData?.sellers || []} onChanged={onChanged} />
        </TabsContent>
        <TabsContent value="rankings">
          <RankingsTab data={publicData} viewId={viewId} onViewChange={onViewChange} onChanged={onChanged} />
        </TabsContent>
        <TabsContent value="brand">
          <BrandTab logoPath={publicData?.logo_path} onChanged={onChanged} />
        </TabsContent>
      </Tabs>

      <Button variant="ghost" onClick={onLogout} className="mt-8 text-zinc-400 hover:text-red-400" data-testid="admin-logout-button">
        <LogOut className="w-4 h-4 mr-2" /> Sair
      </Button>
    </SheetContent>
  </Sheet>
);
