# trading-react

Web dashboard for **AQTA**, the AI Quant Trading Assistant (BRD-AQTA-001 v1.1). It talks to the
FastAPI backend in [`kechitrading/trading-app`](https://github.com/kechitrading/trading-app)
(`/api/v1`). Personal use only (RULE-008).

## Stack

- Vite + React 19 + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (components in `src/components/ui`, owned in this repo)
- React Router, TanStack Query
- Charts: TradingView lightweight-charts (candles) and ECharts (fan charts, payoff, OI, heatmaps)
- Vitest + Testing Library, oxlint, Prettier

## Getting started

Needs Node 22 or later and the aqta API running on `http://127.0.0.1:8000`.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with the backend `API_TOKEN`. The dev server proxies
`/api`, `/health` and `/ready` to the backend. To use another address, copy `.env.example` to
`.env.local` and set `AQTA_API_URL`.

| Command          | What it does                                          |
| ---------------- | ----------------------------------------------------- |
| `npm run dev`    | Dev server with hot reload                            |
| `npm run build`  | Type-check and build to `dist/`                       |
| `npm run check`  | Type-check, lint, format check and tests (same as CI) |
| `npm test`       | Unit and component tests                              |
| `npm run format` | Format with Prettier                                  |

## Security model

- **Sign-in**: the API bearer token, checked against `/api/v1/mode`. It is kept in
  `sessionStorage`, so closing the tab signs you out (FR-052).
- **TOTP**: approving a proposal and releasing the kill switch ask for a fresh authenticator code,
  sent once in `X-TOTP` and never stored (NFR-009). Triggering the kill switch needs no code so it
  is always one step away (FR-034).
- **Mode**: PAPER or LIVE is shown on every screen; an unreachable backend shows MODE UNKNOWN,
  and an unreadable kill switch is shown as blocked (fail closed).
- In live mode, approval sends nothing to the broker: you place the order ticket in the Angel One
  app (CR-003, RULE-016). This app never talks to the broker directly.
- No secrets in this repo (NFR-008); CI runs gitleaks.

## Screens

| Screen                                                                                                                     | BRD                    | Status                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------- |
| Overview                                                                                                                   | FR-030, FR-034         | Wired                                    |
| Proposals (list, detail, approve, reject, reduce size)                                                                     | FR-011, FR-023, FR-077 | Wired                                    |
| Portfolio, Arbitrage, Analysis, Forecasts, Institutional, Astrology, Strategies, Reports, Audit log, Performance, Settings | see `src/app/nav.ts`   | Placeholder until the backend APIs exist |

## Deployment

Served by the aqta nginx on the AWS host, same origin as the API, so no CORS is needed. Build with
`npm run build`, copy `dist/` to `/opt/aqta/webapp`, and use
[`deploy/nginx-webapp.conf.example`](deploy/nginx-webapp.conf.example). Do not deploy during
trading hours (NFR-015: no deploys 08:30 to 23:45 IST on trading days).
