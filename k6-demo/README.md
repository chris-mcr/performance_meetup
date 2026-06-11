# 📊 k6 Load Testing Lab — Black Friday Survival

> *Run real load tests against a live API. Watch it degrade in real time. Then ask the AI what went wrong.*

**🔗 API:** [k6-app.mcr-test.com](https://k6-app.mcr-test.com) &nbsp;|&nbsp; **📈 Grafana:** [grafana.mcr-test.com](https://grafana.mcr-test.com) &nbsp;|&nbsp; **🤖 AI Analysis:** [k6-ai.mcr-test.com](https://k6-ai.mcr-test.com)

---

## 🗺️ What You'll Do

```
1. Install k6 (or use Docker)  →  2. Run smoke test  →  3. Run load test
→  4. Watch Grafana degrade    →  5. Run stress test  →  6. AI analysis
```

Four scripts, ordered by intensity. Each one pushes the system a little harder. The load test will turn red by design — that's the point.

---

## ⚙️ Prerequisites

You need **k6** or **Docker** — pick whichever is easier.

### Option A — Install k6

| OS | Command |
|----|---------|
| 🍎 Mac | `brew install k6` |
| 🪟 Windows | `winget install k6 --source winget` |
| 🐧 Linux | [k6.io install docs](https://grafana.com/docs/k6/latest/set-up/install-k6/) |

Verify it works: `k6 version`

### Option B — Docker (no k6 needed)

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and make sure it's running. The `run.sh` wrapper handles everything else automatically — it uses k6 if installed, falls back to Docker if not.

---

## 🚀 Quick Start

### Step 1 — Choose your name

Every command needs `-e ATTENDEE=yourname` so your results appear separately on Grafana. Without it your data shows as `anonymous` and gets mixed in with everyone else's. **Pick something short with no spaces** — your first name is fine.

### Step 2 — Preflight check

Confirm the services are reachable before you start:

```bash
bash check.sh mcr-test.com
```

You should see `[ OK ]` for your runner and four `[ OK ]` service lines. If anything fails, tell the presenter.

### Step 3 — Run the scripts

All commands use `run.sh` from inside the `k6-demo/` directory. If you get a permission error, prefix with `bash`: `bash run.sh smoke yourname`.

---

## 📋 Scripts

| # | Script | Purpose | Duration |
|---|--------|---------|----------|
| 1️⃣ | `01-smoke.js` | Verify all endpoints respond — **run this first** | 30s |
| 2️⃣ | `02-load.js` | Realistic Black Friday surge with thresholds | ~4.5 min |
| 3️⃣ | `03-stress.js` | Aggressive ramp to 100 VUs, no thresholds | ~3 min |
| 4️⃣ | `04-combined.js` | Three shopper personas with staggered starts | ~4 min |

---

## 💡 What each test type does

If you haven't run load tests before, here's the plain-English version of what these scripts are actually doing — and why.

### 🔎 Smoke test — "is it even working?"

Sends a single virtual user through every endpoint once, just to confirm the API is alive and responding correctly. Think of it like a health check before the real work starts.

You're not trying to break anything — you're making sure there's nothing obviously broken *before* you put load on it. If the smoke test fails, something is already wrong and there's no point running the other tests.

**One user. Thirty seconds. All clear or fix it.**

---

### 📈 Load test — "can it handle real traffic?"

Simulates what Black Friday traffic actually looks like: a steady warm-up, then a surge as the doors open, then sustained peak load. Each virtual user walks through a realistic shopping journey — browse, search, add to cart, checkout.

This is the closest thing to "what will actually happen on the day." The thresholds are set tight on purpose — they *will* turn red during the surge so you can see the system degrade live on the dashboard. That's the lesson: **realistic load reveals real problems.**

**Ramps to 30 users. Thresholds fail at peak. Watch Grafana.**

---

### 💥 Stress test — "where does it break?"

Throws as many users at the system as possible, as fast as possible. No thresholds, no pass/fail — just pure observation. The goal isn't to run a good test, it's to find the ceiling: the point where response times go vertical and errors start spiking.

Every system has a breaking point. This test finds it. You'll see `/products` return 503s, checkout errors climb past 20%, and the degradation level hit CRITICAL. That's not a failure — that's information.

**Ramps to 100 users. No mercy. Find the wall.**

---

### 👥 Combined test — "what happens with mixed traffic?"

Runs three different types of shoppers at the same time, each with their own behaviour and staggered start times. Window shoppers arrive first, then cart abandoners, then determined buyers hammering checkout.

This is more realistic than a single wave of identical users, and it tells a different story on the dashboard — you can see exactly which group tips the system over, and which endpoints take the hit.

**Three personas. Staggered starts. Watch the shapes on Grafana.**

---

## 🧪 Test Details

### 1️⃣ Smoke Test — start here (30s)

Verifies every endpoint responds correctly before you put the system under load. Uses 1 VU with strict thresholds: **zero errors, p95 under 2s**.

```bash
bash run.sh smoke yourname
```

Checks all 11 endpoints: health, categories, search, product list, product detail, related products, cart add, cart view, promo code (valid + invalid), checkout, and order status.

> **Note:** The smoke test doesn't push to Grafana — this is intentional. Use it as a connectivity check only.

Expected: all checks pass ✅, no errors, nothing appears on Grafana.

---

### 2️⃣ Load Test — the main event (~4.5 min)

Simulates a realistic Black Friday shopping journey. Each virtual user walks a full **9-step flow**:

```
Login → Browse categories → Search → Product page → Recommendations
→ Add to cart → View cart → Apply promo (30%) → Checkout → Order status
```

The thresholds are set to **intentionally fail** during the surge so you can see real failure, not just warnings.

```bash
bash run.sh load yourname
```

| Time | VUs | What to watch on Grafana |
|------|-----|--------------------------|
| 0:00–0:30 | 0 → 10 | Response times green, degradation: NONE |
| 0:30–2:30 | 10 | Steady state — system coping fine |
| 2:30–3:00 | 10 → 30 | Latency climbs, degradation: LOW → HIGH |
| 3:00–4:00 | 30 | p95 turns red, errors climb, **thresholds fail** |
| 4:00–4:20 | 30 → 0 | Metrics recover as load drops |

---

### 3️⃣ Stress Test — find the wall (~3 min)

Ramps aggressively to 100 VUs with no thresholds — just observe where things fall apart. Watch `/products` start returning 503s and checkout error rates hit 20%+.

**Run this after the load test for the dramatic finale.**

```bash
bash run.sh stress yourname
```

| Time | VUs | What to watch |
|------|-----|---------------|
| 0:00–0:30 | 0 → 20 | Degradation: LOW |
| 0:30–1:00 | 20 → 50 | Degradation: HIGH, checkout errors appear |
| 1:00–1:30 | 50 → 100 | Degradation: CRITICAL, `/products` returns 503s |
| 1:30–2:30 | 100 | Everything red — holding at breaking point |
| 2:30–3:00 | 100 → 0 | Watch the recovery |

---

### 4️⃣ Combined Test — three shopper personas (~4 min)

Three concurrent user types with **staggered start times**. Watch the Grafana dashboard tell a story as each group joins.

```bash
bash run.sh combined yourname
```

| Time | Who | What they do |
|------|-----|-------------|
| 0:00 | 🛍️ **Browsing** (15 VUs) | Browse catalogue, search, read product pages |
| 1:00 | 🛒 **Cart Heavy** joins (10 VUs) | Add to cart, view cart, apply promo — never checkout |
| 2:00 | 💳 **Checkout Heavy** joins (10 VUs) | Full purchase journey — hammers checkout endpoint |
| 3:00 | 💳 Checkout Heavy exits | Error rate starts to recover |
| 3:30 | 🛒 Cart Heavy exits | Load continues to drop |
| 4:00 | 🛍️ Browsing exits | Test complete |

---

## 🤖 AI Analysis

After any test run, your results are **automatically posted** to the AI service — just visit [k6-ai.mcr-test.com](https://k6-ai.mcr-test.com) and look for your attendee name in the **Analyse Results** tab.

You'll get:
- A plain-English **verdict** on what happened
- Specific **findings** with metric evidence
- A Slack-ready **postmortem** you can copy

Alternatively, copy the `summary.json` output from your terminal and paste it into the Analyse tab manually.

---

## 🔧 Manual Commands

If `run.sh` doesn't work (e.g. Windows PowerShell without WSL), use these directly.

### Smoke test — native k6

```bash
k6 run \
  -e BASE_URL=https://k6-app.mcr-test.com \
  -e ATTENDEE=yourname \
  scripts/01-smoke.js
```

### Load / stress / combined — native k6

```bash
k6 run \
  -e BASE_URL=https://k6-app.mcr-test.com \
  -e ATTENDEE=yourname \
  -e K6_PROMETHEUS_RW_SERVER_URL=https://k6lab:mcrtest2026@prometheus.mcr-test.com/api/v1/write \
  -e K6_PROMETHEUS_RW_TREND_STATS="p(95),p(99)" \
  --out experimental-prometheus-rw \
  scripts/02-load.js
```

Replace `02-load.js` with `03-stress.js` or `04-combined.js` as needed.

### Docker — Mac/Linux

```bash
docker run --rm \
  -v $(pwd):/k6 \
  -e BASE_URL=https://k6-app.mcr-test.com \
  -e ATTENDEE=yourname \
  -e K6_PROMETHEUS_RW_SERVER_URL=https://k6lab:mcrtest2026@prometheus.mcr-test.com/api/v1/write \
  -e K6_PROMETHEUS_RW_TREND_STATS="p(95),p(99)" \
  grafana/k6 run --out experimental-prometheus-rw /k6/scripts/02-load.js
```

### Docker — Windows PowerShell

```powershell
docker run --rm `
  -v "${PWD}:/k6" `
  -e BASE_URL=https://k6-app.mcr-test.com `
  -e ATTENDEE=yourname `
  -e K6_PROMETHEUS_RW_SERVER_URL=https://k6lab:mcrtest2026@prometheus.mcr-test.com/api/v1/write `
  -e K6_PROMETHEUS_RW_TREND_STATS="p(95),p(99)" `
  grafana/k6 run --out experimental-prometheus-rw /k6/scripts/02-load.js
```

---

## 🔗 Services

| Service | URL |
|---------|-----|
| 🛒 API | [k6-app.mcr-test.com](https://k6-app.mcr-test.com) |
| 📈 Grafana | [grafana.mcr-test.com](https://grafana.mcr-test.com) |
| 🗄️ Prometheus | [prometheus.mcr-test.com](https://prometheus.mcr-test.com) |
| 🤖 AI Analysis | [k6-ai.mcr-test.com](https://k6-ai.mcr-test.com) |

---

## 🩺 Troubleshooting

**`k6: command not found`** — k6 isn't installed. Use `bash run.sh` instead — it falls back to Docker automatically.

**Threshold errors in the load test** — expected and intentional. The thresholds in `02-load.js` are designed to fail during the surge so the room can see real failure.

**High error rate before you've run anything** — another attendee is probably running the stress test. Wait for the presenter to reset and try again.

**`unable to open file (./scripts/01-smoke.js)`** — wrong directory. Run all commands from inside `k6-demo/`.

**Smoke test passes but nothing on Grafana** — correct. The smoke test doesn't push metrics to Prometheus by design. Only tests 02–04 appear on the dashboard.

**`ATTENDEE not set` warning in terminal** — add `-e ATTENDEE=yourname` to your command. Without it your results appear as `anonymous` and can't be separated from other attendees' runs.
