# NiveshMitra 🪙

A conversational AI investment companion: empathetic onboarding, a personalized
rule-based investment plan, interactive allocation simulation, and an emotion-aware
Calm Mode that activates on detected distress.

> ⚠️ Not financial advice — demo / educational project only.

---

## Quick summary

- Backend: Express + Mongoose + Gemini (LLM) helpers — entry `src/server.js` (backend)
- Frontend: Vite + React — dev UI in `frontend`
- Default ports: frontend `5173`, backend `5000` (configurable via `backend/.env`)

## 🚀 Quick start

1) Backend

On macOS / Linux:

```bash
cd backend
cp .env.example .env
npm install
npm run dev   # uses nodemon (development)
```

On Windows (PowerShell):

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

To run the production server:

```bash
cd backend
npm start   # runs `node src/server.js`
```

2) Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at http://localhost:5173 and expects the backend API at http://localhost:5000 (the app proxies `/api` to the backend during dev).

## Environment (backend/.env)

Copy `backend/.env.example` and set values you need. Key vars:

- `PORT` — backend port (default: 5000)
- `MONGODB_URI` — MongoDB connection string (local or Atlas)
- `LLM_PROVIDER` — `gemini` (default)
- `GEMINI_API_KEY` / `GEMINI_MODEL` — Gemini native REST key + model
- `MOCK_LLM` — set `true` to force canned LLM responses (demo mode). If `GEMINI_API_KEY` is empty, mock mode turns on automatically.

## Files of interest

- Backend entry: `backend/src/server.js`
- Backend env example: `backend/.env.example`
- Frontend entry: `frontend/src/main.jsx` and `frontend/src/App.jsx`

## Project layout

```
money-logix-compass-backend/
├── backend/         Express + Mongoose + Gemini helpers
│   ├── src/
│   │   ├── config/      db connection
│   │   ├── models/      Mongoose schemas
│   │   ├── services/    llm, emotion, risk, plan, store
│   │   ├── prompts/     system prompts
│   │   └── routes/      auth / chat / profile / plan
│   └── .env.example
└── frontend/        Vite + React
    └── src/
        ├── Root.jsx
        ├── App.jsx
        ├── api/            backend client
        \/        └── components/     Landing, Login, BasicInfo, MessageBubble, PlanDashboard
```

## Notes

- Demo auth: email-based demo login accepts any password and is intended as a lightweight demo gate (not secure). Replace with hashed passwords for production.
- Emotion detection is hybrid: LLM inference plus a deterministic keyword/regex safety net that force-triggers Calm Mode on clear distress signals.

If you'd like, I can also add a short `README` at `backend/README.md` and `frontend/README.md` with focused start instructions.
