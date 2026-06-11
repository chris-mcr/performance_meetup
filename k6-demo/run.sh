#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: ./run.sh <test> <attendee>"
  echo ""
  echo "  Tests:    smoke  load  stress  combined"
  echo "  Example:  ./run.sh smoke alice"
  echo ""
  echo "  Uses k6 if installed, otherwise falls back to Docker."
  exit 1
fi

ATTENDEE="$2"
BASE_URL="http://84.46.251.26:3000"
PROM_URL="https://prometheus.mcr-test.com/api/v1/write"
PROM_USER="k6lab"
PROM_PASS="mcrtest2026"

case "$1" in
  smoke|01)    SCRIPT="01-smoke.js"; PUSH=false ;;
  load|02)     SCRIPT="02-load.js";  PUSH=true ;;
  stress|03)   SCRIPT="03-stress.js"; PUSH=true ;;
  combined|04) SCRIPT="04-combined.js"; PUSH=true ;;
  *)
    echo "Unknown test '$1'. Choose: smoke, load, stress, combined"
    exit 1
    ;;
esac

if [[ "${FORCE_DOCKER:-}" != "1" ]] && command -v k6 &>/dev/null; then
  ARGS=(-e "BASE_URL=$BASE_URL" -e "ATTENDEE=$ATTENDEE")
  if [[ "$PUSH" == "true" ]]; then
    ARGS+=(
      -e "K6_PROMETHEUS_RW_SERVER_URL=$PROM_URL"
      -e "K6_PROMETHEUS_RW_USERNAME=$PROM_USER"
      -e "K6_PROMETHEUS_RW_PASSWORD=$PROM_PASS"
      -e "K6_PROMETHEUS_RW_TREND_STATS=p(95),p(99)"
      --out experimental-prometheus-rw
    )
  fi
  exec k6 run "${ARGS[@]}" "scripts/$SCRIPT"

elif command -v docker &>/dev/null; then
  DOCKER_ARGS=(run --rm -v "$(pwd):/k6"
    -e "BASE_URL=$BASE_URL"
    -e "ATTENDEE=$ATTENDEE")
  K6_ARGS=(run)
  if [[ "$PUSH" == "true" ]]; then
    DOCKER_ARGS+=(
      -e "K6_PROMETHEUS_RW_SERVER_URL=$PROM_URL"
      -e "K6_PROMETHEUS_RW_USERNAME=$PROM_USER"
      -e "K6_PROMETHEUS_RW_PASSWORD=$PROM_PASS"
      -e "K6_PROMETHEUS_RW_TREND_STATS=p(95),p(99)"
    )
    K6_ARGS+=(--out experimental-prometheus-rw)
  fi
  K6_ARGS+=("/k6/scripts/$SCRIPT")
  exec docker "${DOCKER_ARGS[@]}" grafana/k6 "${K6_ARGS[@]}"

else
  echo "Neither k6 nor Docker found. Install one:"
  echo "  k6:     brew install k6  (Mac) / winget install k6 (Windows)"
  echo "  Docker: https://www.docker.com/products/docker-desktop/"
  exit 1
fi
