import cors from "cors";
import express from "express";
import morgan from "morgan";

const app = express();
const port = process.env.PORT ?? 8080;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.json({
    service: "nanocare-gateway",
    status: "online",
    upstreams: ["hospital-core-go", "triagem-ia-python", "websocket-service", "alert-engine"],
  });
});

app.get("/api/command-center", (_request, response) => {
  response.json({
    hospital: "NanoCare AI",
    mode: "command-center",
    realtime: true,
    sectors: ["Administrativo", "Enfermaria", "Cirurgias"],
  });
});

app.get("/api/patients", (_request, response) => {
  response.json([
    { id: "p-001", name: "Maria Silva", room: "UTI-03", saturation: 82, heartRate: 132, riskScore: 94 },
    { id: "p-002", name: "Joao Martins", room: "TRI-07", saturation: 90, heartRate: 118, riskScore: 74 },
    { id: "p-003", name: "Ana Costa", room: "PED-11", saturation: 94, heartRate: 104, riskScore: 58 },
  ]);
});

app.get("/api/sectors", (_request, response) => {
  response.json([
    { id: "recepcao", label: "Recepcao", occupancy: 62, status: "normal" },
    { id: "triagem", label: "Triagem", occupancy: 91, status: "warning" },
    { id: "uti", label: "UTI", occupancy: 98, status: "critical" },
    { id: "centro-cirurgico", label: "Centro Cirurgico", occupancy: 58, status: "normal" },
    { id: "pediatria", label: "Pediatria", occupancy: 84, status: "warning" },
  ]);
});

app.get("/api/alerts", (_request, response) => {
  response.json([
    {
      id: "a-001",
      sector: "UTI",
      severity: "critical",
      message: "Paciente critico detectado na UTI.",
      recommendation: "Transferir medico intensivista para UTI-03.",
      slaMinutes: 4,
    },
  ]);
});

app.post("/api/triage/proxy", (request, response) => {
  const saturation = Number(request.body.saturation ?? 96);
  const heartRate = Number(request.body.heartRate ?? 88);
  const temperature = Number(request.body.temperature ?? 36.8);
  const fatigue = Number(request.body.fatigue ?? 30);
  const riskScore = Math.min(
    98,
    Math.max(5, Math.round((100 - saturation) * 2.4 + Math.max(0, heartRate - 70) * 0.42 + Math.max(0, temperature - 37) * 9 + fatigue * 0.22)),
  );

  response.json({
    riskScore,
    priority: riskScore >= 86 ? "Critica" : riskScore >= 68 ? "Alta" : riskScore >= 42 ? "Media" : "Baixa",
    confidence: Math.min(97, Math.max(76, Math.round(72 + riskScore / 4))),
    recommendedAction:
      riskScore >= 86
        ? "Acionar equipe de resposta e preparar leito critico."
        : riskScore >= 68
          ? "Priorizar atendimento medico em ate 10 minutos."
          : "Manter observacao e repetir sinais vitais.",
    source: "gateway-simulated-proxy",
  });
});

app.listen(port, () => {
  console.log(`NanoCare gateway online at http://localhost:${port}`);
});
