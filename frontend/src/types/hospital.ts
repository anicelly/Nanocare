import type { LucideIcon } from "lucide-react";

export type SectorState = "normal" | "warning" | "critical";

export type Sector = {
  id: string;
  name: string;
  label: string;
  state: SectorState;
  occupancy: number;
  beds: number;
  availableBeds: number;
  fatigue: number;
  avgWait: number;
  x: string;
  y: string;
};

export type Patient = {
  id: string;
  name: string;
  room: string;
  sector: string;
  saturation: number;
  heartRate: number;
  riskScore: number;
  priority: "Baixa" | "Media" | "Alta" | "Critica";
  status: string;
  diagnosis: string;
  doctor: string;
  history: string[];
  timeline: Array<{ time: string; event: string }>;
};

export type Doctor = {
  id: string;
  name: string;
  zone: string;
  status: "ONLINE" | "EM ROTA" | "CIRURGIA" | "PAUSA";
};

export type Alert = {
  id: string;
  time: string;
  sector: string;
  message: string;
  severity: SectorState;
  recommendation: string;
  slaMinutes: number;
};

export type LiveEvent = {
  id: string;
  time: string;
  title: string;
  detail: string;
  severity: SectorState;
};

export type AiRecommendation = {
  id: string;
  sector: string;
  action: string;
  reason: string;
  confidence: number;
  impact: string;
};

export type TriageResult = {
  riskScore: number;
  priority: Patient["priority"];
  explanation: string[];
  confidence: number;
  recommendedAction: string;
};

export type OperatorSession = {
  name: string;
  profile: string;
  permission: "EXECUTIVO" | "CLINICO" | "CIRURGICO";
  shift: string;
  lastAccess: string;
  demoMode: boolean;
};

export type Metric = {
  id: string;
  label: string;
  value: string;
  tone: "cyan" | "green" | "red" | "white" | "amber";
  icon: LucideIcon;
};

export type HospitalSnapshot = {
  sectors: Sector[];
  patients: Patient[];
  doctors: Doctor[];
  alerts: Alert[];
  occupancyData: Array<{ hour: string; ocupacao: number; eficiencia: number }>;
  triageData: Array<{ level: string; value: number }>;
  ambulanceProgress: number;
  voiceAlert: string;
  efficiency: number;
  recommendations: AiRecommendation[];
  liveEvents: LiveEvent[];
};

export type RealtimeStatus = "connecting" | "connected" | "fallback";

export type AppView =
  | "dashboard"
  | "patients"
  | "beds"
  | "alerts"
  | "analytics"
  | "triage"
  | "architecture"
  | "case";
