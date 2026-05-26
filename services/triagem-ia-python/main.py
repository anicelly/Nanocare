from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="NanoCare Triage AI")


class TriageInput(BaseModel):
    saturation: int = 96
    heart_rate: int = 88
    temperature: float = 36.8
    fatigue: int = 30


@app.get("/health")
def health():
    return {"service": "triagem-ia-python", "status": "online"}


@app.post("/predict-risk")
def predict_risk(payload: TriageInput):
    risk = round(
        max(5, min(98, (100 - payload.saturation) * 2.4 + payload.heart_rate * 0.35 + payload.fatigue * 0.25))
    )
    if risk >= 86:
        priority = "Critica"
    elif risk >= 68:
        priority = "Alta"
    elif risk >= 42:
        priority = "Media"
    else:
        priority = "Baixa"

    return {
        "riskScore": risk,
        "priority": priority,
        "signals": ["saturation", "heart_rate", "temperature", "fatigue"],
        "model": "nanocare-triage-prototype",
    }
