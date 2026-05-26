import { motion } from "framer-motion";
import {
  Activity,
  Ambulance,
  Bed,
  Bell,
  BrainCircuit,
  Boxes,
  FileText,
  HeartPulse,
  Mic2,
  Network,
  RadioTower,
  Server,
  ShieldAlert,
  Siren,
  Stethoscope,
  Users,
  Waves,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState, type ReactNode } from "react";
import { AiCore } from "../components/AiCore";
import { PatientScanner } from "../components/PatientScanner";
import type { SectorProfile } from "../components/CommandShell";
import type { Alert, AppView, HospitalSnapshot, Patient, RealtimeStatus, Sector, SectorState, TriageResult } from "../types/hospital";

const stateStyles: Record<SectorState, string> = {
  normal: "border-emerald-300/70 bg-emerald-400/15 text-emerald-100 shadow-emerald-400/20",
  warning: "border-amber-300/80 bg-amber-300/18 text-amber-100 shadow-amber-300/25",
  critical:
    "border-rose-400/90 bg-rose-500/18 text-rose-100 shadow-rose-500/35 animate-[emergencyPulse_1.1s_ease-in-out_infinite]",
};

const statusLabel: Record<SectorState, string> = {
  normal: "NORMAL",
  warning: "ATENCAO",
  critical: "EMERGENCIA",
};

const priorityStyles: Record<Patient["priority"], string> = {
  Baixa: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  Media: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  Alta: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  Critica: "border-rose-300/30 bg-rose-500/12 text-rose-100",
};

export default function HospitalDashboard({
  view,
  profile,
  snapshot,
  selectedSector,
  selectedSectorId,
  realtimeEnabled,
  realtimeStatus,
  onRunManualTriage,
  onSelectSector,
  onToggleRealtime,
}: {
  view: AppView;
  profile: SectorProfile;
  snapshot: HospitalSnapshot;
  selectedSector: Sector;
  selectedSectorId: string;
  realtimeEnabled: boolean;
  realtimeStatus: RealtimeStatus;
  onRunManualTriage: (input: {
    saturation: number;
    heartRate: number;
    temperature: number;
    fatigue: number;
  }) => TriageResult;
  onSelectSector: (sectorId: string) => void;
  onToggleRealtime: () => void;
}) {
  const metrics = buildMetrics(snapshot);
  const criticalPatients = snapshot.patients
    .filter((patient) => patient.priority === "Critica" || patient.priority === "Alta")
    .slice(0, 3);
  const emergencyMode = snapshot.sectors.some((sector) => sector.state === "critical");
  const [presentationOpen, setPresentationOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <header
        className={`hud-panel p-4 ${emergencyMode ? "ring-1 ring-rose-400/35" : ""}`}
      >
        <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.22)]">
              <BrainCircuit className="h-8 w-8 text-cyan-100" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-cyan-200/80">
                Hospital Command Center
              </p>
              <h1 className="mt-1 text-3xl font-black uppercase text-white sm:text-5xl">
                NanoCare AI
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-300">Acesso: {profile}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={onToggleRealtime}
                className={`min-h-10 rounded-lg border px-4 text-sm font-black uppercase tracking-[0.16em] ${
                  realtimeEnabled
                    ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                    : "border-slate-300/20 bg-white/5 text-slate-200"
                }`}
              >
                {realtimeStatus === "connected" ? "WebSocket real" : realtimeEnabled ? "Tempo real simulado" : "Tempo real pausado"}
              </button>
              <button
                type="button"
                onClick={() => setPresentationOpen(true)}
                className="min-h-10 rounded-lg border border-cyan-200/25 bg-cyan-300/10 px-4 text-sm font-black uppercase tracking-[0.14em] text-cyan-50"
              >
                Apresentar demo
              </button>
              <button
                type="button"
                onClick={() => exportExecutiveReport(snapshot)}
                className="min-h-10 rounded-lg border border-white/15 bg-white/[0.06] px-4 text-sm font-black uppercase tracking-[0.14em] text-white"
              >
                Relatorio PDF
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.id} icon={metric.icon} label={metric.label} value={metric.value} tone={metric.tone} />
              ))}
            </div>
          </div>
        </div>
      </header>

      {view === "dashboard" && (
        <DashboardView
          snapshot={snapshot}
          criticalPatients={criticalPatients}
          selectedSectorId={selectedSectorId}
          onSelectSector={onSelectSector}
        />
      )}
      {view === "patients" && <PatientsView patients={snapshot.patients} />}
      {view === "beds" && <BedsView sectors={snapshot.sectors} selectedSector={selectedSector} onSelectSector={onSelectSector} />}
      {view === "alerts" && <AlertsView alerts={snapshot.alerts} />}
      {view === "analytics" && <AnalyticsView snapshot={snapshot} />}
      {view === "triage" && <TriageView onRunManualTriage={onRunManualTriage} />}
      {view === "architecture" && <ArchitectureView />}
      {view === "case" && <CaseView />}
      {presentationOpen && <PresentationOverlay onClose={() => setPresentationOpen(false)} />}
    </div>
  );
}

function DashboardView({
  snapshot,
  criticalPatients,
  selectedSectorId,
  onSelectSector,
}: {
  snapshot: HospitalSnapshot;
  criticalPatients: Patient[];
  selectedSectorId: string;
  onSelectSector: (sectorId: string) => void;
}) {
  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <HospitalMap sectors={snapshot.sectors} selectedSectorId={selectedSectorId} onSelectSector={onSelectSector} />

        <aside className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
          <LiveFeed snapshot={snapshot} />
          <Panel title="Pacientes criticos" icon={HeartPulse}>
            <div className="space-y-3">
              {criticalPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} compact />
              ))}
            </div>
          </Panel>

          <Panel title="Medicos online" icon={Stethoscope}>
            <div className="space-y-3">
              {snapshot.doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-cyan-200/12 bg-white/[0.04] p-3"
                >
                  <div>
                    <p className="font-bold text-white">{doctor.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{doctor.zone}</p>
                  </div>
                  <span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs font-black text-emerald-200">
                    {doctor.status}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr_0.8fr]">
        <AiPanel />
        <ExecutivePanel snapshot={snapshot} />
        <VoicePanel snapshot={snapshot} />
      </section>
      <ScannerPanel />
      <RecommendationPanel snapshot={snapshot} />
    </>
  );
}

function HospitalMap({
  sectors,
  selectedSectorId,
  onSelectSector,
}: {
  sectors: Sector[];
  selectedSectorId: string;
  onSelectSector: (sectorId: string) => void;
}) {
  return (
    <div className="hud-panel scanline min-h-[540px] p-4 sm:p-5">
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">Live Map</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Hospital Live Map</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
            <StatusDot color="bg-emerald-300" label="Normal" />
            <StatusDot color="bg-amber-300" label="Atencao" />
            <StatusDot color="bg-rose-400" label="Emergencia" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-cyan-200/10 bg-[#040a10]/70">
          <div className="relative h-[430px] min-w-[760px] overflow-hidden">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M4 86 C 20 72, 24 60, 36 50 S 58 36, 77 25 S 91 14, 96 8"
                fill="none"
                stroke="rgba(125, 221, 255, 0.36)"
                strokeWidth="0.7"
                className="route-path"
              />
              <path
                d="M18 28 H 79 M31 72 H 82 M50 15 V 82"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.45"
              />
            </svg>

            <div className="absolute left-[4%] top-[76%] flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-cyan-950/60 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
              <Ambulance className="h-4 w-4" />
              rota hospitalar
            </div>

            <div
              className="absolute flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-300/14 text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.28)]"
              style={{
                offsetPath:
                  "path('M 24 370 C 150 315, 205 250, 315 212 S 500 140, 620 88 S 700 48, 736 28')",
                animation: "ambulanceRoute 8s linear infinite",
              }}
              aria-label="Ambulancia em rota"
            >
              <Ambulance className="h-5 w-5" />
            </div>

            {sectors.map((sector, index) => (
              <motion.button
                key={sector.id}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ scale: 1.04 }}
                onClick={() => onSelectSector(sector.id)}
                className={`absolute w-[28%] min-w-[140px] rounded-lg border p-3 text-left shadow-2xl ${
                  stateStyles[sector.state]
                } ${selectedSectorId === sector.id ? "ring-2 ring-white/50" : ""}`}
                style={{ left: sector.x, top: sector.y }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] opacity-80">
                      [ {sector.name} ]
                    </p>
                    <h3 className="mt-2 text-lg font-black">{statusLabel[sector.state]}</h3>
                  </div>
                  <RadioTower className="h-5 w-5 shrink-0" />
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-current" style={{ width: `${sector.occupancy}%` }} />
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
                  Ocupacao {sector.occupancy}%
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientsView({ patients }: { patients: Patient[] }) {
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Panel title="Pacientes monitorados" icon={Users}>
        <div className="grid gap-3 lg:grid-cols-2">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} onOpen={() => setSelectedPatient(patient)} />
          ))}
        </div>
      </Panel>

      <SmartRecord patient={selectedPatient} />
    </section>
  );
}

function BedsView({
  sectors,
  selectedSector,
  onSelectSector,
}: {
  sectors: Sector[];
  selectedSector: Sector;
  onSelectSector: (sectorId: string) => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel title="Leitos por setor" icon={Bed}>
        <div className="grid gap-3">
          {sectors.map((sector) => (
            <button
              key={sector.id}
              type="button"
              onClick={() => onSelectSector(sector.id)}
              className={`rounded-lg border p-4 text-left ${
                selectedSector.id === sector.id
                  ? "border-cyan-200/45 bg-cyan-300/12"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-white">{sector.label}</p>
                <span className={`rounded-md px-2 py-1 text-xs font-black ${stateStyles[sector.state]}`}>
                  {statusLabel[sector.state]}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-200" style={{ width: `${sector.occupancy}%` }} />
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Sala selecionada" icon={Activity}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ExecutiveStat label="Setor" value={selectedSector.label} />
          <ExecutiveStat label="Ocupacao" value={`${selectedSector.occupancy}%`} />
          <ExecutiveStat label="Leitos livres" value={`${selectedSector.availableBeds}`} />
          <ExecutiveStat label="Fadiga" value={`${selectedSector.fatigue}%`} />
          <ExecutiveStat label="Tempo medio" value={`${selectedSector.avgWait} min`} />
          <ExecutiveStat label="Capacidade" value={`${selectedSector.beds} leitos`} />
        </div>
      </Panel>
    </section>
  );
}

function AlertsView({ alerts }: { alerts: Alert[] }) {
  return (
    <Panel title="Historico de alertas" icon={Bell}>
      <div className="grid gap-3">
        {alerts.map((alert) => (
          <div key={alert.id} className={`rounded-lg border p-4 ${stateStyles[alert.severity]}`}>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <p className="font-black text-white">{alert.message}</p>
              <span className="text-xs font-black uppercase tracking-[0.18em]">{alert.time}</span>
            </div>
            <p className="mt-2 text-sm font-semibold opacity-80">{alert.sector}</p>
            <div className="mt-3 grid gap-2 rounded-md border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_110px]">
              <p className="text-sm font-semibold text-white">IA recomenda: {alert.recommendation}</p>
              <p className="text-xs font-black uppercase tracking-[0.16em]">SLA {alert.slaMinutes} min</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AnalyticsView({ snapshot }: { snapshot: HospitalSnapshot }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
      <AiPanel />
      <ExecutivePanel snapshot={snapshot} />
      <RecommendationPanel snapshot={snapshot} />
      <ScannerPanel />
      <Panel title="Heatmap de fadiga hospitalar" icon={Activity} className="xl:col-span-2">
        <div className="grid gap-3 md:grid-cols-5">
          {snapshot.sectors.map((sector) => (
            <div key={sector.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{sector.label}</p>
              <div className="mt-3 h-28 rounded-lg border border-white/10 bg-black/25 p-2">
                <div
                  className="h-full rounded-md"
                  style={{
                    background: `linear-gradient(180deg, rgba(34,211,238,.15), rgba(244,63,94,${sector.fatigue / 100}))`,
                  }}
                />
              </div>
              <p className="mt-3 text-2xl font-black text-white">{sector.fatigue}%</p>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function TriageView({
  onRunManualTriage,
}: {
  onRunManualTriage: (input: {
    saturation: number;
    heartRate: number;
    temperature: number;
    fatigue: number;
  }) => TriageResult;
}) {
  const [result, setResult] = useState<TriageResult | null>(null);
  const [form, setForm] = useState({ saturation: 88, heartRate: 124, temperature: 38.4, fatigue: 72 });

  const updateNumber = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: Number(value) }));
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
      <Panel title="Triagem manual IA" icon={Stethoscope}>
        <div className="grid gap-3">
          <NumberField label="Saturacao" value={form.saturation} min={78} max={100} onChange={(value) => updateNumber("saturation", value)} />
          <NumberField label="BPM" value={form.heartRate} min={55} max={160} onChange={(value) => updateNumber("heartRate", value)} />
          <NumberField label="Temperatura" value={form.temperature} min={35} max={41} step={0.1} onChange={(value) => updateNumber("temperature", value)} />
          <NumberField label="Fadiga hospitalar" value={form.fatigue} min={0} max={100} onChange={(value) => updateNumber("fatigue", value)} />
          <button
            type="button"
            onClick={() => setResult(onRunManualTriage(form))}
            className="min-h-12 rounded-lg border border-cyan-200/35 bg-cyan-300/16 px-4 text-sm font-black uppercase tracking-[0.18em] text-cyan-50"
          >
            Calcular risco IA
          </button>
        </div>
      </Panel>

      <Panel title="Resultado e explicabilidade" icon={BrainCircuit}>
        {result ? (
          <div className="grid gap-4">
            <div className={`rounded-lg border p-4 ${priorityStyles[result.priority]}`}>
              <p className="text-xs font-black uppercase tracking-[0.2em]">Prioridade {result.priority}</p>
              <p className="mt-3 text-5xl font-black text-white">{result.riskScore}%</p>
              <p className="mt-2 text-sm font-bold">Confianca do modelo: {result.confidence}%</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {result.explanation.map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 font-semibold text-slate-200">
                  {item}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">IA recomenda acao</p>
              <p className="mt-2 text-lg font-black text-white">{result.recommendedAction}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-slate-300">
            Preencha os sinais e execute a triagem para ver score, prioridade, explicacao e recomendacao.
          </div>
        )}
      </Panel>
    </section>
  );
}

function ArchitectureView() {
  const nodes = [
    ["Frontend", "React + TypeScript + Tailwind + Three.js"],
    ["Gateway", "Node API Gateway / BFF"],
    ["Core", "Go hospital-core para pacientes, leitos e setores"],
    ["IA", "Python FastAPI para triagem e previsao"],
    ["Realtime", "WebSocket + Redis para eventos vivos"],
    ["Dados", "PostgreSQL como base operacional"],
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="System Architecture" icon={Network}>
        <div className="grid gap-3">
          {nodes.map(([title, detail], index) => (
            <div key={title} className="flex items-center gap-3 rounded-lg border border-cyan-200/14 bg-white/[0.04] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-200/25 bg-cyan-300/10 text-sm font-black text-cyan-50">
                {index + 1}
              </div>
              <div>
                <p className="font-black text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-300">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Fluxo enterprise" icon={Server}>
        <div className="grid gap-3">
          <ArchitectureStep label="Login setorial" detail="Administrativo, Enfermaria e Cirurgias entram com permissao e contexto." />
          <ArchitectureStep label="Gateway" detail="Centraliza chamadas e protege o frontend de detalhes dos microservicos." />
          <ArchitectureStep label="Core Go" detail="Entrega APIs rapidas para pacientes, leitos, ocupacao e setores." />
          <ArchitectureStep label="IA FastAPI" detail="Calcula risco, prioridade, explicabilidade e recomendacao clinica." />
          <ArchitectureStep label="WebSocket" detail="Atualiza mapa, alertas, ambulancia e feed de eventos em tempo real." />
        </div>
      </Panel>

      <Panel title="Demo Mode para recrutador" icon={Boxes} className="xl:col-span-2">
        <div className="grid gap-3 md:grid-cols-4">
          <ExecutiveStat label="Case" value="Healthtech" />
          <ExecutiveStat label="Stack" value="Fullstack" />
          <ExecutiveStat label="IA" value="Explicavel" />
          <ExecutiveStat label="Realtime" value="WebSocket" />
        </div>
      </Panel>
    </section>
  );
}

function CaseView() {
  return (
    <section className="grid gap-4">
      <Panel title="Case publico" icon={FileText}>
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-cyan-200/15 bg-cyan-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">Problema</p>
            <h2 className="mt-3 text-3xl font-black text-white">Hospitais precisam decidir rapido com dados vivos.</h2>
            <p className="mt-3 leading-7 text-slate-300">
              O NanoCare AI centraliza pacientes, setores, leitos, ambulancia, triagem e alertas
              em um command center com IA explicavel.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Solucao</p>
            <div className="mt-4 grid gap-3">
              <ArchitectureStep label="Command center" detail="Mapa vivo, feed de eventos e indicadores executivos." />
              <ArchitectureStep label="IA clinica demonstravel" detail="Score de risco, explicabilidade e recomendacao operacional." />
              <ArchitectureStep label="Stack enterprise" detail="React, Node Gateway, Go Core, Python FastAPI, WebSocket, Redis e PostgreSQL." />
            </div>
          </div>
        </div>
      </Panel>
      <Panel title="Impacto esperado" icon={Activity}>
        <div className="grid gap-3 md:grid-cols-4">
          <ExecutiveStat label="Decisao" value="-35%" />
          <ExecutiveStat label="Triagem" value="+42%" />
          <ExecutiveStat label="Alertas" value="SLA" />
          <ExecutiveStat label="Portfolio" value="Top" />
        </div>
      </Panel>
    </section>
  );
}

function AiPanel() {
  return (
    <Panel title="Nucleo IA" icon={BrainCircuit} className="min-h-[310px]">
      <div className="relative h-[210px] overflow-hidden rounded-lg border border-cyan-200/10 bg-black/30">
        <AiCore />
        <div className="absolute inset-x-4 bottom-4 rounded-lg border border-cyan-200/20 bg-black/45 p-3 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">IA funcionando</p>
          <p className="mt-1 text-sm text-slate-200">
            Calculando risco de parada, lotacao, prioridade, tempo medio e fadiga hospitalar.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function ScannerPanel() {
  return (
    <Panel title="Scanner corporal IA" icon={Activity}>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <PatientScanner />
        <div className="grid gap-3">
          <div className="rounded-lg border border-rose-300/20 bg-rose-500/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-100">Paciente em varredura</p>
            <p className="mt-2 text-2xl font-black text-white">Maria Silva</p>
            <p className="mt-1 text-sm font-semibold text-slate-300">UTI-03 - saturacao 82%</p>
          </div>
          <div className="rounded-lg border border-cyan-200/15 bg-cyan-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Leitura IA</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Scanner identifica padrao de hipoxia, estresse cardiaco e prioridade critica.
              Recomenda suporte respiratorio e medico intensivista em ate 4 minutos.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ExecutiveStat label="Cardio" value="132" />
            <ExecutiveStat label="SpO2" value="82%" />
            <ExecutiveStat label="Risco" value="94%" />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ExecutivePanel({ snapshot }: { snapshot: HospitalSnapshot }) {
  const criticalCount = snapshot.patients.filter((patient) => patient.priority === "Critica").length;
  const averageOccupancy = Math.round(
    snapshot.sectors.reduce((total, sector) => total + sector.occupancy, 0) / snapshot.sectors.length,
  );

  return (
    <Panel title="Painel executivo" icon={Activity}>
      <div className="grid gap-3 sm:grid-cols-3">
        <ExecutiveStat label="Ocupacao" value={`${averageOccupancy}%`} />
        <ExecutiveStat label="Eficiencia" value={`${snapshot.efficiency}%`} />
        <ExecutiveStat label="Criticos" value={`${criticalCount}`.padStart(2, "0")} />
      </div>
      <div className="mt-5 h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={snapshot.occupancyData}>
            <defs>
              <linearGradient id="occupancy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="hour" stroke="#9fb7c7" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9fb7c7" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#06101a", border: "1px solid rgba(125,221,255,.25)" }} />
            <Area type="monotone" dataKey="ocupacao" stroke="#22d3ee" fill="url(#occupancy)" />
            <Area type="monotone" dataKey="eficiencia" stroke="#f8fbff" fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function VoicePanel({ snapshot }: { snapshot: HospitalSnapshot }) {
  return (
    <Panel title="Voz IA" icon={Mic2}>
      <div className="rounded-lg border border-cyan-200/12 bg-cyan-300/7 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-100">
            <Waves className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">Transmissao ativa</p>
            <p className="mt-1 text-sm text-slate-300">Canal hospitalar seguro</p>
          </div>
        </div>
        <blockquote className="mt-5 border-l-2 border-rose-300 pl-4 text-lg font-bold text-white">
          {snapshot.voiceAlert}
        </blockquote>
      </div>
      <div className="mt-4 h-[155px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={snapshot.triageData}>
            <XAxis dataKey="level" stroke="#9fb7c7" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "#06101a", border: "1px solid rgba(125,221,255,.25)" }} />
            <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function LiveFeed({ snapshot }: { snapshot: HospitalSnapshot }) {
  return (
    <Panel title="Eventos ao vivo" icon={Bell}>
      <div className="space-y-3">
        {snapshot.liveEvents.slice(0, 4).map((event) => (
          <div key={event.id} className={`rounded-lg border p-3 ${stateStyles[event.severity]}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-white">{event.title}</p>
              <span className="text-xs font-black uppercase tracking-[0.16em]">{event.time}</span>
            </div>
            <p className="mt-2 text-sm font-semibold opacity-80">{event.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RecommendationPanel({ snapshot }: { snapshot: HospitalSnapshot }) {
  return (
    <Panel title="IA recomenda acao" icon={BrainCircuit}>
      <div className="grid gap-3 lg:grid-cols-3">
        {snapshot.recommendations.map((recommendation) => (
          <div key={recommendation.id} className="rounded-lg border border-cyan-200/15 bg-cyan-300/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">{recommendation.sector}</p>
              <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs font-black text-white">
                {recommendation.confidence}%
              </span>
            </div>
            <p className="mt-3 font-black text-white">{recommendation.action}</p>
            <p className="mt-2 text-sm text-slate-300">{recommendation.reason}</p>
            <p className="mt-3 text-sm font-bold text-emerald-100">{recommendation.impact}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SmartRecord({ patient }: { patient: Patient }) {
  return (
    <Panel title="Prontuario inteligente" icon={ShieldAlert}>
      <div className={`rounded-lg border p-4 ${priorityStyles[patient.priority]}`}>
        <p className="text-xs font-black uppercase tracking-[0.18em]">Paciente selecionado</p>
        <h3 className="mt-2 text-2xl font-black text-white">{patient.name}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-300">
          {patient.room} - {patient.doctor}
        </p>
        <p className="mt-4 text-sm leading-6 text-white">{patient.diagnosis}</p>
      </div>
      <div className="mt-3 grid gap-2">
        {patient.history.map((item) => (
          <div key={item} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-slate-200">
            {item}
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {patient.timeline.map((item) => (
          <div key={`${item.time}-${item.event}`} className="rounded-lg border border-cyan-200/12 bg-cyan-300/10 p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">{item.time}</p>
            <p className="mt-1 text-sm font-semibold text-white">{item.event}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Resumo clinico IA</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">
          Paciente com prioridade {patient.priority}, risco IA de {patient.riskScore}% e sinais
          compatíveis com necessidade de reavaliacao imediata.
        </p>
      </div>
    </Panel>
  );
}

function PatientCard({ patient, compact = false, onOpen }: { patient: Patient; compact?: boolean; onOpen?: () => void }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-white">{patient.name}</p>
          <p className="mt-1 text-sm text-slate-300">
            {patient.room} - {patient.sector}
          </p>
        </div>
        <ShieldAlert className="h-5 w-5 text-current" />
      </div>
      <div className={`mt-3 grid gap-2 ${compact ? "" : "sm:grid-cols-3"}`}>
        <MiniReading label="Saturacao" value={`${patient.saturation}%`} />
        <MiniReading label="BPM" value={`${patient.heartRate}`} />
        <MiniReading label="Risco IA" value={`${patient.riskScore}%`} />
      </div>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.18em]">{patient.status}</p>
    </>
  );

  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={`rounded-lg border p-3 text-left ${priorityStyles[patient.priority]}`}>
        {content}
      </button>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${priorityStyles[patient.priority]}`}>
      {content}
    </div>
  );
}

function MiniReading({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-2">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-lg border border-cyan-200/15 bg-black/35 px-3 text-lg font-black text-white outline-none focus:border-cyan-200/45"
      />
    </label>
  );
}

function ArchitectureStep({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}

function PresentationOverlay({ onClose }: { onClose: () => void }) {
  const steps = [
    ["Login setorial", "Mostre Administrativo, Enfermaria e Cirurgias com permissao por operador."],
    ["Mapa vivo", "Explique setores mudando entre normal, atencao e emergencia."],
    ["Scanner corporal IA", "Mostre o paciente 3D girando, varredura ativa e sinais criticos."],
    ["Triagem IA", "Calcule risco manualmente e mostre explicabilidade do modelo."],
    ["Arquitetura", "Feche com stack fullstack e microservicos planejados."],
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/72 p-4 backdrop-blur-sm">
      <div className="hud-panel max-w-3xl p-5">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100">Modo apresentacao</p>
              <h2 className="mt-2 text-3xl font-black text-white">Roteiro para recrutador</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-black uppercase tracking-[0.14em] text-white"
            >
              Fechar
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            {steps.map(([title, detail], index) => (
              <div key={title} className="rounded-lg border border-cyan-200/15 bg-cyan-300/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                  Passo {index + 1}
                </p>
                <p className="mt-2 text-lg font-black text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-300">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function exportExecutiveReport(snapshot: HospitalSnapshot) {
  const criticalCount = snapshot.patients.filter((patient) => patient.priority === "Critica").length;
  const averageOccupancy = Math.round(
    snapshot.sectors.reduce((total, sector) => total + sector.occupancy, 0) / snapshot.sectors.length,
  );
  const report = `
    <html>
      <head>
        <title>NanoCare AI - Relatorio Executivo</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f8fbff; color: #07111c; padding: 32px; }
          h1 { margin-bottom: 4px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; background: white; }
          .label { color: #475569; text-transform: uppercase; font-size: 11px; font-weight: 700; letter-spacing: .12em; }
          .value { font-size: 28px; font-weight: 900; margin-top: 8px; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <h1>NanoCare AI</h1>
        <p>Relatorio executivo gerado pelo Hospital Command Center.</p>
        <div class="grid">
          <div class="card"><div class="label">Ocupacao media</div><div class="value">${averageOccupancy}%</div></div>
          <div class="card"><div class="label">Eficiencia</div><div class="value">${snapshot.efficiency}%</div></div>
          <div class="card"><div class="label">Pacientes criticos</div><div class="value">${criticalCount}</div></div>
        </div>
        <h2>Alertas e recomendacoes</h2>
        <ul>
          ${snapshot.alerts
            .slice(0, 5)
            .map((alert) => `<li><strong>${alert.sector}</strong>: ${alert.message} Recomendacao: ${alert.recommendation}</li>`)
            .join("")}
        </ul>
        <script>window.print()</script>
      </body>
    </html>
  `;
  const popup = window.open("", "_blank", "width=920,height=720");
  popup?.document.write(report);
  popup?.document.close();
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: "cyan" | "green" | "red" | "white" | "amber";
}) {
  const tones = {
    cyan: "text-cyan-100 border-cyan-200/20 bg-cyan-300/10",
    green: "text-emerald-100 border-emerald-200/20 bg-emerald-300/10",
    red: "text-rose-100 border-rose-200/20 bg-rose-300/10",
    amber: "text-amber-100 border-amber-200/20 bg-amber-300/10",
    white: "text-white border-white/15 bg-white/7",
  };

  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="flex min-w-[128px] items-center justify-between gap-3">
        <Icon className="h-5 w-5" />
        <span className="text-2xl font-black">{value}</span>
      </div>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">{label}</p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  className = "",
  children,
}: {
  title: string;
  icon: typeof Activity;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`hud-panel p-4 ${className}`}>
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">{title}</h2>
          <Icon className="h-5 w-5 text-cyan-100" />
        </div>
        {children}
      </div>
    </section>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-slate-200">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function ExecutiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function buildMetrics(snapshot: HospitalSnapshot) {
  const totalBeds = snapshot.sectors.reduce((total, sector) => total + sector.beds, 0);
  const availableBeds = snapshot.sectors.reduce((total, sector) => total + sector.availableBeds, 0);
  const criticalCount = snapshot.patients.filter((patient) => patient.priority === "Critica").length;

  return [
    { id: "patients", icon: Users, label: "Pacientes", value: "124", tone: "cyan" as const },
    { id: "beds", icon: Bed, label: "Leitos livres", value: `${availableBeds}/${totalBeds}`, tone: "green" as const },
    { id: "alerts", icon: Siren, label: "Alertas", value: `${snapshot.alerts.length}`, tone: "red" as const },
    { id: "critical", icon: HeartPulse, label: "Criticos", value: `${criticalCount}`, tone: "amber" as const },
  ];
}
