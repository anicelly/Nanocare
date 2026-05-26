const rules = [
  {
    id: "oxygen-critical",
    test: (patient) => patient.saturation <= 86,
    message: (patient) => `Paciente critico detectado em ${patient.room}.`,
  },
  {
    id: "risk-critical",
    test: (patient) => patient.riskScore >= 86,
    message: (patient) => `Risco de parada elevado para ${patient.name}.`,
  },
];

export function evaluatePatient(patient) {
  return rules
    .filter((rule) => rule.test(patient))
    .map((rule) => ({
      ruleId: rule.id,
      severity: "critical",
      message: rule.message(patient),
    }));
}

const demoPatient = {
  name: "Maria Silva",
  room: "UTI-03",
  saturation: 82,
  riskScore: 94,
};

console.log(JSON.stringify({ service: "alert-engine", alerts: evaluatePatient(demoPatient) }, null, 2));
