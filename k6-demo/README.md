# k6 Demo — Black Friday Survival Lab

A hands-on load testing lab. Run real k6 scripts against a live API and watch the system degrade in real time on a shared Grafana dashboard.

## Prerequisites

You need either **k6** or **Docker** — pick whichever is easier.

### Option A — Install k6

| OS | Command |
|----|---------|
| Mac | `brew install k6` |
| Windows | `winget install k6 --source winget` |
| Linux | See [k6.io/docs/get-started/installation](https://grafana.com/docs/k6/latest/set-up/install-k6/) |

Verify: `k6 version`

### Option B — Docker (no k6 needed)

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and make sure it's running. That's it — the `run.sh` wrapper handles the rest.

## Step 1 — Set Your Name

Every k6 command needs `-e ATTENDEE=yourname`. Without it your results show up as `anonymous` on Grafana and get mixed in with everyone else's.

Pick something short with no spaces — your first name is fine.

## Step 2 — Preflight Check

Confirm all services are reachable before you start:

```bash
bash check.sh mcr-test.com
```

You should see `[ OK ]` for your runner (k6 or Docker) and four `[ OK ]` service lines. If anything fails, tell the presenter.

## Step 3 — Run the Scripts

All commands below use `run.sh`, which works whether you have k6 or Docker. Run them from inside the `k6-demo/` directory.

Replace `yourname` with your chosen name.

### Smoke test — start here (30 seconds)

Verifies every endpoint responds correctly. Run this first.

```bash
./run.sh smoke yourname
```

Expected: all checks pass, no errors. Nothing appears on Grafana — this is intentional.

---

### Load test — the main event (~4.5 minutes)

Simulates a realistic Black Friday surge. Thresholds will turn red during the surge — that's the point.

```bash
./run.sh load yourname
```

| Time | What happens |
|------|-------------|
| 0:00–0:30 | Ramp to 10 VUs — response times green, degradation NONE |
| 0:30–2:30 | Steady at 10 VUs — system coping fine |
| 2:30–3:00 | Ramp to 30 VUs — latency climbs, degradation goes LOW then HIGH |
| 3:00–4:00 | 30 VUs sustained — p95 turns red, errors climb, thresholds fail |
| 4:00–4:20 | Ramp down — metrics recover |

---

### Stress test — find the wall (~3 minutes)

Ramps aggressively to 100 VUs. No thresholds — just observe where things fall apart.

```bash
./run.sh stress yourname
```

| Time | What happens |
|------|-------------|
| 0:00–0:30 | 0→20 VUs — LOW degradation |
| 0:30–1:00 | 20→50 VUs — HIGH degradation, checkout errors start |
| 1:00–1:30 | 50→100 VUs — CRITICAL, /products returns 503s |
| 1:30–2:30 | Hold at 100 VUs — everything red |
| 2:30–3:00 | Ramp down — watch metrics recover |

---

### Combined test — three shopper personas (~4 minutes)

Three concurrent user types with staggered starts. Watch Grafana tell a story as each group joins.

```bash
./run.sh combined yourname
```

| Time | Who joins |
|------|-----------|
| 0:00 | Browsing only (catalogue hits, search latency) |
| 1:00 | Cart heavy joins (LOW degradation, cart slows) |
| 2:00 | Checkout heavy joins (HIGH/CRITICAL, errors spike) |
| 3:30 | Cart heavy exits |
| 4:00 | Browsing exits, done |

### Running without run.sh (Windows / manual)

If you're on Windows PowerShell or prefer explicit commands, see the [manual commands](#manual-commands) section below.

## Scripts

| Script | Description | Duration |
|--------|-------------|----------|
| `01-smoke.js` | Verify all endpoints respond — run first | 30s |
| `02-load.js` | Realistic Black Friday surge with thresholds | ~4.5 min |
| `03-stress.js` | Aggressive ramp to 100 VUs, no thresholds | ~3 min |
| `04-combined.js` | Three shopper personas with staggered starts | ~4 min |
| `lib/helpers.js` | Shared config and utilities used by all scripts | — |

## Service URLs

| Service | URL |
|---------|-----|
| API | https://k6-app.mcr-test.com |
| Grafana | https://grafana.mcr-test.com |
| Prometheus | https://prometheus.mcr-test.com |
| AI Analysis | https://k6-ai.mcr-test.com |

## AI Analysis

After a k6 run, copy the JSON printed at the end of your terminal and paste it into the **Analyse Results** tab at https://k6-ai.mcr-test.com. You'll get a verdict, findings, and a Slack-ready postmortem.

## Manual commands

If you can't use `run.sh` (e.g. Windows PowerShell without WSL), run the commands directly.

**Native k6:**
```bash
k6 run -e BASE_URL=https://k6-app.mcr-test.com -e ATTENDEE=yourname scripts/01-smoke.js
```

**Docker (Mac/Linux):**
```bash
docker run --rm \
  -v $(pwd):/k6 \
  -e BASE_URL=https://k6-app.mcr-test.com \
  -e ATTENDEE=yourname \
  grafana/k6 run /k6/scripts/01-smoke.js
```

**Docker (Windows PowerShell):**
```powershell
docker run --rm `
  -v "${PWD}:/k6" `
  -e BASE_URL=https://k6-app.mcr-test.com `
  -e ATTENDEE=yourname `
  grafana/k6 run /k6/scripts/01-smoke.js
```

For tests 02–04, add the Prometheus flags before `grafana/k6` (Docker) or before the script path (native):
```bash
-e K6_PROMETHEUS_RW_SERVER_URL=https://k6lab:mcrtest2026@prometheus.mcr-test.com/api/v1/write \
--out experimental-prometheus-rw   # native: after k6 run | docker: after grafana/k6 run
```

## Troubleshooting

**`k6: command not found`** — k6 is not installed. Use `run.sh` instead — it falls back to Docker automatically if k6 isn't found.

**Threshold errors in the load test** — expected and intentional. The thresholds in `02-load.js` are set to fail during the surge.

**High error rate before you start** — another attendee is probably running the stress test. Wait for the presenter to reset and try again.

**`unable to open file (./scripts/01-smoke.js)`** — you're not in the right directory. Run the commands from inside `k6-demo/`.

**Smoke test passes but nothing on Grafana** — the smoke test doesn't push metrics to Prometheus by design. Use it as a connectivity check only.
