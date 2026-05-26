import { useState } from "react";
import HospitalDashboard from "./pages/HospitalDashboard";
import LoginPage from "./pages/LoginPage";
import { CommandShell, type SectorProfile } from "./components/CommandShell";
import { useHospitalRealtime } from "./hooks/useHospitalRealtime";
import type { AppView, OperatorSession } from "./types/hospital";

export default function App() {
  const [selectedProfile, setSelectedProfile] = useState<SectorProfile>("Administrativo");
  const [activeProfile, setActiveProfile] = useState<SectorProfile | null>(null);
  const [operator, setOperator] = useState<OperatorSession>(operatorByProfile.Administrativo);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const hospital = useHospitalRealtime();

  const handleLogin = () => {
    setActiveProfile(selectedProfile);
    setOperator(operatorByProfile[selectedProfile]);
    setActiveView(defaultViewByProfile[selectedProfile]);
    hospital.setSelectedSectorId(defaultSectorByProfile[selectedProfile]);
  };

  if (!activeProfile) {
    return (
      <LoginPage
        selectedProfile={selectedProfile}
        onSelectProfile={setSelectedProfile}
        operator={operatorByProfile[selectedProfile]}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <CommandShell
      profile={activeProfile}
      operator={operator}
      activeView={activeView}
      onChangeView={setActiveView}
      onLogout={() => setActiveProfile(null)}
    >
      <HospitalDashboard
        view={activeView}
        profile={activeProfile}
        snapshot={hospital.snapshot}
        selectedSector={hospital.selectedSector}
        selectedSectorId={hospital.selectedSectorId}
        realtimeEnabled={hospital.realtimeEnabled}
        realtimeStatus={hospital.realtimeStatus}
        onRunManualTriage={hospital.runManualTriage}
        onSelectSector={hospital.setSelectedSectorId}
        onToggleRealtime={() => hospital.setRealtimeEnabled((current) => !current)}
      />
    </CommandShell>
  );
}

const defaultViewByProfile: Record<SectorProfile, AppView> = {
  Administrativo: "analytics",
  Enfermaria: "patients",
  Cirurgias: "dashboard",
};

const operatorByProfile: Record<SectorProfile, OperatorSession> = {
  Administrativo: {
    name: "Carla Mendes",
    profile: "Administrativo",
    permission: "EXECUTIVO",
    shift: "18h-00h",
    lastAccess: "hoje 18:17",
    demoMode: true,
  },
  Enfermaria: {
    name: "Bruno Alves",
    profile: "Enfermaria",
    permission: "CLINICO",
    shift: "12h-20h",
    lastAccess: "hoje 17:52",
    demoMode: true,
  },
  Cirurgias: {
    name: "Dra. Marina Rocha",
    profile: "Cirurgias",
    permission: "CIRURGICO",
    shift: "16h-23h",
    lastAccess: "hoje 18:04",
    demoMode: true,
  },
};

const defaultSectorByProfile: Record<SectorProfile, string> = {
  Administrativo: "recepcao",
  Enfermaria: "uti",
  Cirurgias: "centro-cirurgico",
};
