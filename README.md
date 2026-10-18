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

The dashboard runs on the same EC2 host as the aqta API, served by the same nginx site at
`https://<ELASTIC_IP>/`, with `/api`, `/health`, `/ready` and `/docs` going to the API. Same
origin, so no CORS. The nginx site comes from aqta `deploy/scripts/setup-nginx-ip.sh`.

**Merging to `main` deploys automatically.** When CI passes on a push to `main`,
`.github/workflows/deploy.yml` builds `dist/`, copies it to the host over SSH and runs
[`deploy/release.sh`](deploy/release.sh), which:

- unpacks the build into `/var/www/aqta-webapp/releases/<sha>`,
- switches `/var/www/aqta-webapp/current` to it with an atomic symlink rename,
- checks the page and its JS through nginx, and switches back if that fails,
- keeps the 5 newest builds for rollback.

| Trigger                        | Inside 08:30-23:45 IST, Mon-Fri                          | Outside that window   |
| ------------------------------ | -------------------------------------------------------- | --------------------- |
| CI green on `main`             | skipped with a notice; the 23:55 IST nightly run deploys | deploys               |
| Nightly 23:55 IST (Mon-Fri)    | n/a                                                      | deploys `main`'s head |
| Manual run (Actions -> Deploy) | fails, unless `force=true` with a reason                 | deploys or rolls back |

Nothing deploys while the `DEPLOY_HOST` secret is unset.

### One-time setup

1. In this repo: **Settings -> Secrets and variables -> Actions**, add the same three secrets the
   aqta repo uses: `DEPLOY_HOST` (Elastic IP), `DEPLOY_USER` (`ubuntu`) and `DEPLOY_SSH_KEY` (the
   private deploy key). Optionally create a `production` environment with yourself as reviewer.
2. On the server, re-run the nginx script from the aqta repo once, so it serves the dashboard:
   `bash setup-nginx-ip.sh <ELASTIC_IP>`.
3. Actions -> **Deploy** -> Run workflow (outside trading hours).

Rollback: Actions -> Deploy -> action `rollback` (optionally a `sha`), or on the server
`/var/www/aqta-webapp/release.sh rollback`.
