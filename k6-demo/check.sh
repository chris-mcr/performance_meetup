#!/usr/bin/env bash
# Preflight check — run this before the session to confirm all services are up.
#
# Usage:
#   bash check.sh mcr-test.com

DOMAIN=${1:-mcr-test.com}
PASS=0
FAIL=0

green()  { printf "\033[32m%s\033[0m" "$*"; }
red()    { printf "\033[31m%s\033[0m" "$*"; }
yellow() { printf "\033[33m%s\033[0m" "$*"; }

check_service() {
  local label="$1"
  local url="$2"
  local pattern="$3"

  local body
  if ! body=$(curl -sf --max-time 5 "$url" 2>/dev/null); then
    printf "  %s  %-12s  not reachable at %s\n" "$(red "[FAIL]")" "$label" "$url"
    FAIL=$((FAIL + 1))
    return
  fi

  if [ -n "$pattern" ] && ! echo "$body" | grep -q "$pattern"; then
    printf "  %s  %-12s  responded but health check failed\n" "$(red "[FAIL]")" "$label"
    FAIL=$((FAIL + 1))
    return
  fi

  printf "  %s  %s\n" "$(green "[ OK ]")" "$label"
  PASS=$((PASS + 1))
}

echo ""
printf "Checking runner...\n\n"

if command -v k6 &>/dev/null; then
  K6_VER=$(k6 version 2>&1 | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  printf "  %s  k6 %s\n" "$(green "[ OK ]")" "$K6_VER"
elif command -v docker &>/dev/null; then
  printf "  %s  Docker found — use %s to run tests\n" "$(green "[ OK ]")" "$(yellow "./run.sh")"
else
  printf "  %s  Neither k6 nor Docker found\n" "$(red "[WARN]")"
  printf "       Install one: brew install k6  or  https://www.docker.com/products/docker-desktop/\n"
fi

echo ""
printf "Checking services at %s...\n\n" "$(yellow "$DOMAIN")"

check_service "API"        "https://k6-app.$DOMAIN/health"         '"status":"ok"'
check_service "Grafana"    "https://grafana.$DOMAIN/api/health"    '"version"'
check_service "Prometheus" "https://prometheus.$DOMAIN/-/healthy"  "Prometheus"
check_service "AI"         "https://k6-ai.$DOMAIN/health"         '"status"'

echo ""
if [ "$FAIL" -eq 0 ]; then
  printf "%s\n\n" "$(green "All services reachable. You are ready to run tests.")"
  printf "  Dashboard:  https://grafana.%s\n" "$DOMAIN"
  printf "  AI service: https://k6-ai.%s\n\n" "$DOMAIN"
  exit 0
else
  printf "%s service(s) not reachable.\n" "$(red "$FAIL")"
  printf "Ask your presenter to check the server, then run this script again.\n\n"
  exit 1
fi
