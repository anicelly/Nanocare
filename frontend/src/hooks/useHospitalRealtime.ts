import { useEffect, useMemo, useState } from "react";
import { initialSnapshot } from "../data/hospitalData";
import type { Alert, HospitalSnapshot, LiveEvent, Patient, RealtimeStatus, SectorState, TriageResult } from "../types/hospital";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getSectorState = (occupancy: number): SectorState => {
  if (occupancy >= 94) {
    return "critical";
  }

  if (occupancy >= 78) {
    return "warning";
  }

  return "normal";
};

const priorityFromRisk = (risk: number): Patient["priority"] => {
  if (risk >= 86) {
    return "Critica";
  }

  if (risk >= 68) {
    return "Alta";
  }

  if (risk >= 42) {
    return "Media";
  }

  return "Baixa";
};

const statusFromPriority = (priority: Patient["priority"]) => {
  if (priority === "Critica") {
    return "ALERTA CRITICO";
  }

  if (priority === "Alta") {
    return "PRIORIDADE MAXIMA";
  }

  if (priority === "Media") {
    return "OBSERVACAO IA";
  }

  return "ESTAVEL";
};

export function calculateTriageRisk(input: {
  saturation: number;
  heartRate: number;
  temperature: number;
  fatigue: number;
}): TriageResult {
  const oxygenRisk = (100 - input.saturation) * 2.4;
  const cardiacRisk = Math.max(0, input.heartRate - 70) * 0.42;
  const feverRisk = Math.max(0, input.temperature - 37) * 9;
  const fatigueRisk = input.fatigue * 0.22;
  const riskScore = clamp(Math.round(oxygenRisk + cardiacRisk + feverRisk + fatigueRisk), 5, 98);
  const priority = priorityFromRisk(riskScore);
  const explanation = [
    input.saturation <= 90 ? "saturacao baixa" : "saturacao dentro da margem",
    input.heartRate >= 115 ? "BPM elevado" : "BPM controlado",
    input.temperature >= 38 ? "temperatura elevada" : "temperatura estavel",
    input.fatigue >= 70 ? "fadiga operacional alta" : "fadiga operacional moderada",
  ];

  return {
    riskScore,
    priority,
    explanation,
    confidence: clamp(Math.round(72 + riskScore / 4), 76, 97),
    recommendedAction:
      priority === "Critica"
        ? "Acionar equipe de resposta e preparar leito critico."
        : priority === "Alta"
          ? "Priorizar atendimento medico em ate 10 minutos."
          : priority === "Media"
            ? "Manter observacao continua e repetir sinais vitais."
            : "Fluxo normal com reavaliacao programada.",
  };
}

function tickSnapshot(snapshot: HospitalSnapshot): HospitalSnapshot {
  const now = new Date();

  const sectors = snapshot.sectors.map((sector, index) => {
    const wave = Math.sin(Date.now() / 5000 + index) * 4;
    const occupancy = clamp(Math.round(sector.occupancy + wave + (index % 2 === 0 ? 1 : -1)), 38, 99);
    const availableBeds = clamp(Math.round(sector.beds * (1 - occupancy / 100)), 0, sector.beds);
    return {
      ...sector,
      occupancy,
      availableBeds,
      fatigue: clamp(Math.round(sector.fatigue + wave), 18, 96),
      avgWait: clamp(Math.round(sector.avgWait + wave / 2), 4, 42),
      state: getSectorState(occupancy),
    };
  });

  const patients = snapshot.patients.map((patient, index) => {
    const riskShift = Math.round(Math.sin(Date.now() / 4300 + index * 1.7) * 5);
    const riskScore = clamp(patient.riskScore + riskShift, 12, 98);
    const priority = priorityFromRisk(riskScore);

    return {
      ...patient,
      riskScore,
      priority,
      status: statusFromPriority(priority),
      saturation: clamp(patient.saturation + (riskShift > 0 ? -1 : 1), 78, 99),
      heartRate: clamp(patient.heartRate + riskShift, 62, 148),
    };
  });

  const criticalSector = sectors.find((sector) => sector.state === "critical") ?? sectors[0];
  const newAlert: Alert = {
    id: `a-${now.getTime()}`,
    time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    sector: criticalSector.label,
    severity: criticalSector.state,
    message:
      criticalSector.state === "critical"
        ? `Emergencia operacional em ${criticalSector.label}. Acionar equipe de resposta.`
        : `Monitoramento automatico atualizado em ${criticalSector.label}.`,
    recommendation:
      criticalSector.state === "critical"
        ? `IA recomenda realocar equipe para ${criticalSector.label} e liberar leito de contingencia.`
        : `IA recomenda manter observacao e revisar fila de ${criticalSector.label}.`,
    slaMinutes: criticalSector.state === "critical" ? 5 : 18,
  };
  const newEvent: LiveEvent = {
    id: `ev-${now.getTime()}`,
    time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    title: criticalSector.state === "critical" ? "Modo emergencia ativado" : "Atualizacao realtime recebida",
    detail:
      criticalSector.state === "critical"
        ? `${criticalSector.label} ultrapassou limite operacional.`
        : `${criticalSector.label} sincronizado com gateway.`,
    severity: criticalSector.state,
  };

  const criticalCount = patients.filter((patient) => patient.priority === "Critica").length;
  const highCount = patients.filter((patient) => patient.priority === "Alta").length;
  const averageOccupancy = Math.round(
    sectors.reduce((total, sector) => total + sector.occupancy, 0) / sectors.length,
  );
  const efficiency = clamp(100 - Math.round(sectors.reduce((total, sector) => total + sector.fatigue, 0) / sectors.length / 3), 62, 97);
  const hour = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return {
    ...snapshot,
    sectors,
    patients,
    efficiency,
    ambulanceProgress: (snapshot.ambulanceProgress + 11) % 100,
    voiceAlert:
      criticalCount > 0
        ? "Paciente critico detectado na UTI."
        : "Operacao hospitalar dentro dos parametros.",
    alerts: [newAlert, ...snapshot.alerts].slice(0, 8),
    liveEvents: [newEvent, ...snapshot.liveEvents].slice(0, 8),
    recommendations: snapshot.recommendations.map((recommendation, index) => ({
      ...recommendation,
      confidence: clamp(recommendation.confidence + (index === 0 && criticalCount > 0 ? 1 : -1), 72, 98),
    })),
    occupancyData: [...snapshot.occupancyData.slice(-5), { hour, ocupacao: averageOccupancy, eficiencia: efficiency }],
    triageData: [
      { level: "Baixo", value: patients.filter((patient) => patient.priority === "Baixa").length * 8 },
      { level: "Medio", value: patients.filter((patient) => patient.priority === "Media").length * 11 },
      { level: "Alto", value: highCount * 13 },
      { level: "Critico", value: criticalCount * 15 },
    ],
  };
}

export function useHospitalRealtime() {
  const [snapshot, setSnapshot] = useState<HospitalSnapshot>(initialSnapshot);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting");
  const [selectedSectorId, setSelectedSectorId] = useState("uti");
  const [manualTriageResult, setManualTriageResult] = useState<TriageResult | null>(null);

  useEffect(() => {
    if (!realtimeEnabled) {
      return;
    }

    const interval = window.setInterval(() => {
      setSnapshot((current) => tickSnapshot(current));
    }, 3200);

    return () => window.clearInterval(interval);
  }, [realtimeEnabled]);

  useEffect(() => {
    if (!realtimeEnabled) {
      setRealtimeStatus("fallback");
      return;
    }

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket("ws://localhost:8092");
      socket.onopen = () => setRealtimeStatus("connected");
      socket.onerror = () => setRealtimeStatus("fallback");
      socket.onclose = () => setRealtimeStatus("fallback");
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as { type?: string; sector?: string; status?: SectorState };
          if (payload.type === "hospital:update") {
            const now = new Date();
            const liveEvent: LiveEvent = {
              id: `ws-${now.getTime()}`,
              time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              title: "Evento WebSocket recebido",
              detail: `${payload.sector ?? "Hospital"} atualizou status via canal real.`,
              severity: payload.status ?? "normal",
            };
            setSnapshot((current) => ({ ...current, liveEvents: [liveEvent, ...current.liveEvents].slice(0, 8) }));
          }
        } catch {
          setRealtimeStatus("fallback");
        }
      };
    } catch {
      setRealtimeStatus("fallback");
    }

    return () => socket?.close();
  }, [realtimeEnabled]);

  const selectedSector = useMemo(
    () => snapshot.sectors.find((sector) => sector.id === selectedSectorId) ?? snapshot.sectors[0],
    [selectedSectorId, snapshot.sectors],
  );

  return {
    snapshot,
    selectedSector,
    selectedSectorId,
    setSelectedSectorId,
    realtimeEnabled,
    realtimeStatus,
    setRealtimeEnabled,
    manualTriageResult,
    runManualTriage: (input: { saturation: number; heartRate: number; temperature: number; fatigue: number }) => {
      const result = calculateTriageRisk(input);
      setManualTriageResult(result);
      return result;
    },
  };
}
