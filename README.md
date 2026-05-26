# NanoCare AI

NanoCare AI is an intelligent hospital automation platform focused on real-time monitoring, AI-powered triage, predictive analytics and operational management.

## Vision

NanoCare AI presents a futuristic hospital command center with live sector monitoring, critical-patient alerts, operational analytics, ambulance tracking and AI-assisted decision support.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Three.js, Recharts
- API Gateway: Node.js
- Core services: Go, Python FastAPI, WebSocket services and alert engine
- AI: Scikit-learn, TensorFlow and Pandas
- Database: PostgreSQL and Redis
- DevOps: Docker Compose

## Current Status

Phase 1 is focused on the frontend command center:

- Sector login: Administrativo, Enfermaria and Cirurgias
- Operator session with permissions, shift, last access and Demo Mode
- Internal command navigation by module
- Hospital Live Map
- Dynamic sector status: normal, attention and emergency
- Critical-patient cards
- Online doctors panel
- Executive metrics and charts
- Ambulance route visualization
- AI voice alert panel
- Three.js AI core visualization
- Simulated real-time hospital data
- AI action recommendations with confidence and operational impact
- Manual AI triage form with explainable risk scoring
- Live event feed and alert SLA recommendations
- System Architecture page for recruiter demos
- AI body scanner with rotating patient visualization
- Smart patient record with history, timeline and AI summary
- Presentation Mode with recruiter demo script
- Executive report print flow for PDF export
- Public case page for portfolio storytelling

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Build

```bash
cd frontend
npm run build
```

## Deploy

This repository includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.
After pushing the project to GitHub, enable Pages with GitHub Actions as the source.

## Planned Local Services

- Gateway: `http://localhost:8080`
- Hospital Core Go: `http://localhost:8090`
- Triage AI FastAPI: `http://localhost:8091`
- WebSocket Service: `ws://localhost:8092`

## Recruiter Demo Flow

1. Open the frontend.
2. Pick a sector: Administrativo, Enfermaria or Cirurgias.
3. Show operator permission context in the side panel.
4. Open Triagem IA and calculate risk using patient signals.
5. Open Arquitetura to explain the fullstack system design.
6. Open Comando to show the AI body scanner and live hospital map.
7. Use Apresentar Demo to follow a guided recruiter script.
