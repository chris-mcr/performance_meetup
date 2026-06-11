# 🛒 Black Friday Survival — Performance Game

> *It's 10 days before Black Friday. Your system is showing cracks. Can you find the issues and fix them before the doors open?*

**▶ Play now: [blackfriday.mcr-test.com](https://blackfriday.mcr-test.com)**
**🏆 Leaderboard: [blackfriday.mcr-test.com/leaderboard](https://blackfriday.mcr-test.com/leaderboard)**

---

## 🎮 What is this?

A turn-based strategy game where you take on the role of an engineer preparing a production system for Black Friday traffic. The system is hiding up to 3 performance issues — your job is to investigate, diagnose, and fix them before your time runs out.

Every action costs time. Investigate wisely, apply the right fixes, and try not to make things worse.

---

## 🕹️ How to Play

### The Core Loop

```
Investigate → Find Issues → Apply Fixes → Run the Simulation → See your Score
```

1. **🔎 Investigate** — run tests, check logs, profile the database. Each investigation reveals metrics and unlocks hint files that expose what's broken.
2. **🔧 Fix** — apply targeted fixes to resolve the issues you've uncovered. Most fixes require prior investigation to unlock.
3. **⚠️ Risk** — some actions sound useful but have no effect, or actively make things worse. Be careful what you reach for.
4. **🚀 Simulate** — when you're done (or out of time), trigger the Black Friday simulation to see how your system holds up.

### The Clock

You have **10 days** before Black Friday. Each action costs days:

| Cost | Examples |
|------|---------|
| 0.5 days | Check Logs, Check Alerts, Increase Timeouts |
| 1 day | Run Performance Test, Analyze DB, Review Network Config |
| 2 days | Add Caching, Fix DB Indexes, Scale Infrastructure |
| 3–5 days | Rewrite Orders Service, Migrate to NoSQL *(danger zone)* |

---

## 👥 Characters

Pick one at the start — each character unlocks a different set of actions.

| Avatar | Name | Role | Strengths |
|--------|------|------|-----------|
| 👔 | **Alex** | CTO | Architecture reviews, infrastructure scaling |
| 🔍 | **Jordan** | QA Engineer | Log analysis, alerts, performance testing |
| 🖥️ | **Sam** | Frontend Dev | CDN, compression, HTTP/2 |
| ⚙️ | **Riley** | Backend Dev | Database analysis, caching, connection pools |
| 🌐 | **Morgan** | Infra Engineer | Observability, networking, rate limiting |

> **Tip:** Riley and Jordan together have the best coverage of the real issues — but you only pick one.

---

## 🔬 Actions Reference

### Investigate

These reveal system metrics and unlock hint files. **Do these first** — most fixes are locked until you've investigated the relevant area.

| Action | Cost | Who | What it reveals |
|--------|------|-----|----------------|
| Architecture Review | 1d | Alex | Structural risks — no cache layer, single DB, suspected leak |
| Check Logs | 0.5d | Jordan | Error rates, cache misses, memory warnings |
| Check Alerts | 0.5d | Jordan | P99 latency and error rate from on-call history |
| Run Performance Test | 1d | Jordan | Cache hit rate, throughput, p99 under load |
| Analyze DB | 1d | Riley | Slow queries, connection pool saturation |
| Enable Observability | 2d | Morgan | Heap profiling, GC pause, memory leak evidence |
| Review Network Config | 1d | Morgan | Network latency (spoiler: it's fine) |
| Audit Dependencies | 1d | Jordan | Outdated packages (spoiler: not the problem) |
| Profile Frontend | 1d | Jordan | Bundle size, LCP (spoiler: also fine) |

### Fix

Targeted solutions to real issues. Each one addresses a specific root cause.

| Action | Cost | Who | Effect |
|--------|------|-----|--------|
| Add Caching | 2d | Riley | Cache hit rate → 94%, throughput → 340 req/s |
| Fix DB Indexes | 2d | Riley | Query time 1,840ms → 22ms, pool usage normalises |
| Fix Memory Leak | 2d | Riley | Memory 74% → 28%, GC pause 340ms → 12ms |
| Scale Infrastructure | 2d | Alex | More instances — helps throughput, doesn't fix root causes |
| Tune Connection Pool | 1d | Riley | Reduces pool exhaustion; doesn't fix slow queries |
| Enable HTTP/2 | 1d | Sam | Marginal improvement on connection overhead |
| Add Rate Limiting | 2d | Morgan | Protects backend from spikes; doesn't fix underlying issues |

### ⚠️ Risk Actions

These *sound* useful. Some are pointless. Some make things worse.

| Action | Cost | Who | What actually happens |
|--------|------|-----|----------------------|
| Rewrite Orders Service | 5d | Alex | Partial rewrite with regressions — old bugs + new ones |
| Upgrade Node.js | 2d | Sam | Negligible impact on response times |
| Add CDN Layer | 2d | Sam | Static assets only — no improvement for dynamic APIs |
| Migrate to NoSQL | 5d | Alex | Schema mismatches, data errors, rolled back. Don't. |
| Increase Timeouts | 0.5d | Jordan | Error rate drops but pool exhaustion gets *worse* |
| Enable Gzip | 1d | Sam | CPU overhead increases; latency unchanged |
| Add DB Read Replica | 3d | Riley | Slow queries run equally slowly on both nodes |

---

## 🐛 The Hidden Issues

Each game randomly picks **3 of these 5 issues**. You won't know which ones until you investigate.

| Issue | Penalty | Revealed by | Fixed by |
|-------|---------|-------------|----------|
| 🗃️ Missing DB Index | −35 pts | Analyze DB | Fix DB Indexes |
| 🔌 Connection Pool Saturation | −30 pts | Analyze DB | Tune Connection Pool |
| ⚡ High Cache Miss Rate | −25 pts | Run Performance Test | Add Caching |
| 📈 Server Saturation | −25 pts | Run Performance Test | Scale Infrastructure |
| 🧠 Memory Leak | −15 pts | Enable Observability | Fix Memory Leak |

---

## 🏅 Scoring

Your score is calculated at the end of the simulation:

```
score = 100 - (unfixed issue penalties) + (days remaining ÷ 10 × 10)
```

| Score | Outcome |
|-------|---------|
| 🟢 80–100 | **Success** — system survived Black Friday |
| 🟡 50–79 | **Degraded** — survived but with incidents |
| 🔴 0–49 | **Failure** — the system went down |

Find and fix all 3 issues for the best score. Finishing early earns a time bonus.

---

## 💡 Tips

- **Investigate before you fix.** Most fixes are locked until you've revealed the relevant issue.
- **Not everything is broken.** Network config, frontend performance, and dependencies are all clean — don't waste days on them.
- **Risk actions are traps.** The Rewrite and NoSQL Migration in particular will cost you 5 days and leave things worse.
- **Watch the metrics panel.** Investigations update your live system metrics — use them to prioritise.
- **Increasing timeouts is almost always wrong.** Hiding errors ≠ fixing them.

---

## 🔗 Links

| | URL |
|-|-----|
| 🎮 Game | [blackfriday.mcr-test.com](https://blackfriday.mcr-test.com) |
| 🏆 Leaderboard | [blackfriday.mcr-test.com/leaderboard](https://blackfriday.mcr-test.com/leaderboard) |
