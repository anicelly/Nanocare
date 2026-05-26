import { Activity, Building2, LockKeyhole, ShieldCheck, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import type { SectorProfile } from "../components/CommandShell";
import type { OperatorSession } from "../types/hospital";

const sectors: Array<{
  id: SectorProfile;
  title: string;
  description: string;
  icon: typeof Building2;
}> = [
  {
    id: "Administrativo",
    title: "Administrativo",
    description: "Indicadores, ocupacao, eficiencia, alertas e operacao executiva.",
    icon: Building2,
  },
  {
    id: "Enfermaria",
    title: "Enfermaria",
    description: "Pacientes, leitos, prioridade clinica, risco e acompanhamento em tempo real.",
    icon: Stethoscope,
  },
  {
    id: "Cirurgias",
    title: "Cirurgias",
    description: "Centro cirurgico, salas, equipe medica, preparo e fluxo intra-hospitalar.",
    icon: Activity,
  },
];

export default function LoginPage({
  selectedProfile,
  operator,
  onSelectProfile,
  onLogin,
}: {
  selectedProfile: SectorProfile;
  operator: OperatorSession;
  onSelectProfile: (profile: SectorProfile) => void;
  onLogin: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8 text-slate-50">
      <section className="grid w-full max-w-6xl gap-4 lg:grid-cols-[1fr_420px]">
        <div className="hud-panel scanline min-h-[560px] p-6 sm:p-8">
          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.38em] text-cyan-200/75">
                Hospital Command Center
              </p>
              <h1 className="mt-4 text-4xl font-black uppercase text-white sm:text-6xl">
                NanoCare AI
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Acesso operacional por setor para monitoramento hospitalar, triagem inteligente,
                alertas clinicos e controle executivo em tempo real.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <LoginSignal label="Tempo real" value="WebSocket ready" />
              <LoginSignal label="IA triagem" value="Risk engine" />
              <LoginSignal label="Seguranca" value="Setor isolado" />
            </div>
          </div>
        </div>

        <div className="hud-panel p-5">
          <div className="relative z-10">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/75">
                  Login setorial
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">Selecionar acesso</h2>
              </div>
              <LockKeyhole className="h-6 w-6 text-cyan-100" />
            </div>

            <div className="grid gap-3">
              {sectors.map((sector) => {
                const Icon = sector.icon;
                const isActive = selectedProfile === sector.id;

                return (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => onSelectProfile(sector.id)}
                    className={`rounded-lg border p-4 text-left transition ${
                      isActive
                        ? "border-cyan-200/55 bg-cyan-300/14 shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                        : "border-white/10 bg-white/[0.04] hover:border-cyan-200/28"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-200/20 bg-black/25">
                        <Icon className="h-5 w-5 text-cyan-100" />
                      </div>
                      <div>
                        <p className="font-black text-white">{sector.title}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-300">{sector.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-cyan-200/15 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                Acesso autorizado
              </p>
              <p className="mt-2 font-black text-white">{operator.name}</p>
              <div className="mt-3 grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                <span>Permissao: {operator.permission}</span>
                <span>Turno: {operator.shift}</span>
                <span>Ultimo acesso: {operator.lastAccess}</span>
              </div>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={onLogin}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-cyan-200/35 bg-cyan-300/16 px-4 text-sm font-black uppercase tracking-[0.18em] text-cyan-50"
            >
              <ShieldCheck className="h-5 w-5" />
              Entrar no setor
            </motion.button>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 font-black text-cyan-50">{value}</p>
    </div>
  );
}
