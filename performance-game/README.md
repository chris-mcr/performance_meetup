# Performance Game — Black Friday Survival

A turn-based strategy game where you prepare a system for Black Friday. Identify performance bottlenecks, apply fixes, and use your time wisely before the doors open.

Play at: **https://blackfriday.mcr-test.com**

## How to Play

You have **10 days** before Black Friday. Each action costs time. Your goal is to investigate the system, find the hidden issues, and fix them before time runs out.

### The Core Loop

1. **Investigate** — run tests, check logs, analyse the database. Each investigation reveals metrics and unlocks files that hint at what's wrong.
2. **Fix** — apply fixes to resolve the issues you've found. Some fixes require prior investigation to unlock.
3. **Simulate** — when you're done (or out of time), run the Black Friday simulation and see your score.

### Characters

Pick a character at the start — each one has access to different actions:

| Character | Role | Strengths |
|-----------|------|-----------|
| Alex | CTO | Architecture decisions, infrastructure scaling |
| Jordan | QA Engineer | Investigation, testing, log analysis |
| Sam | Frontend Dev | CDN, compression, client-side optimisation |
| Riley | Backend Dev | Database, caching, connection pool tuning |
| Morgan | Infra Engineer | Observability, networking, rate limiting |

### Actions

There are three types of actions:

- **Investigate** — reveal system metrics and unlock hint files. Do these first to understand what's broken.
- **Fix** — resolve the underlying issues. Most fixes require relevant investigation first.
- **Risk** — actions that sound useful but may have no effect or make things worse. Choose carefully.

### Scoring

Your score is calculated at the end of the simulation:

```
score = 100 - (unfixed issues × 25) + (days remaining / 10 × 10)
```

| Score | Result |
|-------|--------|
| 80–100 | Success — system survived Black Friday |
| 50–79 | Degraded — survived but with incidents |
| 0–49 | Failure — the system went down |

There are 3 hidden issues per game (randomly selected from 5 possible issues). Find and fix all three for the best score. Finishing with time to spare earns a bonus.

## Leaderboard

Scores are posted to the shared leaderboard automatically after each game. The leaderboard updates live — you can watch other attendees' scores come in at **https://blackfriday.mcr-test.com/leaderboard**.
