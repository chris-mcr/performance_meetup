# Performance Meetup

Resources for the performance meetup. The session has two parts — a strategy game followed by a live load testing lab.

## Contents

- [performance-game](./performance-game) — turn-based game where you prepare a system for Black Friday
- [k6-demo](./k6-demo) — hands-on k6 load testing lab against a live API

## Session Overview

### Part 1 — Performance Game

Play at **https://blackfriday.mcr-test.com**

A turn-based strategy game. You have 10 days before Black Friday to investigate a system, find hidden performance bottlenecks, and apply fixes. Your score determines whether the system survives the surge.

See [performance-game/README.md](./performance-game/README.md) for how to play.

### Part 2 — k6 Load Testing Lab

Run real k6 scripts against a live API and watch the system degrade in real time on a shared Grafana dashboard.

**Install k6 before the session:**

| OS | Command |
|----|---------|
| Mac | `brew install k6` |
| Windows | `winget install k6 --source winget` |
| Linux | See [k6.io/docs/get-started/installation](https://grafana.com/docs/k6/latest/set-up/install-k6/) |

See [k6-demo/README.md](./k6-demo/README.md) for the full lab guide.
