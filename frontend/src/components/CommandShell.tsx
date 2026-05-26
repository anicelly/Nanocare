import {
  Activity,
  Boxes,
  BriefcaseBusiness,
  Bed,
  Bell,
  BrainCircuit,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView, OperatorSession } from "../types/hospital";

export type SectorProfile = "Administrativo" | "Enfermaria" | "Cirurgias";

const profileMeta: Record<SectorProfile, { label: string; focus: string; icon: typeof Activity }> = {
  Administrativo: {
    label: "Administrativo",
    focus: "Ocupacao, eficiencia, alertas e fluxo executivo",
    icon: ClipboardList,
  },
  Enfermaria: {
    label: "Enfermaria",
    focus: "Pacientes, leitos, risco clinico e priorizacao",
    icon: Stethoscope,
  },
  Cirurgias: {
    label: "Cirurgias",
    focus: "Centro cirurgico, equipes, salas e tempo medio",
    icon: Activity,
  },
};

const navigation: Array<{ id: AppView; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Comando", icon: LayoutDashboard },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "beds", label: "Leitos", icon: Bed },
  { id: "alerts", label: "Alertas", icon: Bell },
  { id: "analytics", label: "IA", icon: BrainCircuit },
  { id: "triage", label: "Triagem IA", icon: Stethoscope },
  { id: "architecture", label: "Arquitetura", icon: Boxes },
  { id: "case", label: "Case", icon: BriefcaseBusiness },
];

export function CommandShell({
  activeView,
  profile,
  operator,
  onChangeView,
  onLogout,
  children,
}: {
  activeView: AppView;
  profile: SectorProfile;
  operator: OperatorSession;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const ProfileIcon = profileMeta[profile].icon;

  return (
    <main className="min-h-screen px-4 py-4 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1760px] gap-4 xl:grid-cols-[260px_1fr]">
        <aside className="hud-panel p-4 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-cyan-200/10 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-cyan-300/40 bg-cyan-300/10">
                <BrainCircuit className="h-7 w-7 text-cyan-100" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/80">NanoCare</p>
                <p className="text-sm font-black uppercase text-white">Command AI</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-3">
                <ProfileIcon className="h-5 w-5 text-cyan-100" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Setor</p>
                  <p className="font-black text-white">{profileMeta[profile].label}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-5 text-slate-300">{profileMeta[profile].focus}</p>
            </div>

            <div className="mt-3 rounded-lg border border-cyan-200/15 bg-cyan-300/10 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Operador</p>
              <p className="mt-1 font-black text-white">{operator.name}</p>
              <div className="mt-3 grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                <span>Permissao: {operator.permission}</span>
                <span>Turno: {operator.shift}</span>
                <span>Ultimo acesso: {operator.lastAccess}</span>
              </div>
              {operator.demoMode && (
                <span className="mt-3 inline-flex rounded-md border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-100">
                  Demo Mode
                </span>
              )}
            </div>

            <nav className="mt-5 grid gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeView(item.id)}
                    className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-left text-sm font-bold uppercase tracking-[0.12em] transition ${
                      isActive
                        ? "border-cyan-200/45 bg-cyan-300/14 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.16)]"
                        : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-cyan-200/25 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={onLogout}
              className="mt-5 flex min-h-11 items-center gap-3 rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 text-sm font-bold uppercase tracking-[0.14em] text-rose-100 xl:mt-auto"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </aside>

        <div>{children}</div>
      </div>
    </main>
  );
}
