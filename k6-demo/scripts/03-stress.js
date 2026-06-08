/**
 * STRESS TEST — 03-stress.js
 *
 * Purpose: find the breaking point. Ramps aggressively to 100 VUs with no mercy.
 * No thresholds — just observe where things fall apart on the dashboard.
 *
 * Run this AFTER the load test for the dramatic finale.
 * Watch /products start returning 503s and checkout error rates hit 20%.
 *
 * Usage:
 *   k6 run -e BASE_URL=https://k6-app.<domain> -e ATTENDEE=yourname \
 *     -e K6_PROMETHEUS_RW_SERVER_URL=https://prometheus.<domain>/api/v1/write \
 *     --out experimental-prometheus-rw k6/03-stress.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, ATTENDEE, randomSessionId, randomProductId, PAYMENT_TOKEN, recordDegradation, annotate, submitSummary } from './lib/helpers.js';

export const options = {
  scenarios: {
    stress_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 20  }, // Quick ramp to establish baseline
        { duration: '30s', target: 50  }, // Into degradation territory
        { duration: '30s', target: 100 }, // Critical load — find the wall
        { duration: '1m',  target: 100 }, // Hold at breaking point
        { duration: '30s', target: 0   }, // Emergency shutdown
      ],
      tags: { scenario: 'stress_test' },
    },
  },
  // No thresholds — we want to observe, not pass/fail
  tags: { attendee: ATTENDEE },
};

export default function () {
  const sessionId = randomSessionId();
  const headers = { 'Content-Type': 'application/json' };

  // Hit every endpoint so all degradation tiers are visible on the dashboard
  http.get(`${BASE_URL}/products`);

  http.get(`${BASE_URL}/products/${randomProductId()}`);

  http.post(
    `${BASE_URL}/cart`,
    JSON.stringify({ session_id: sessionId, product_id: randomProductId(), quantity: 1 }),
    { headers }
  );

  const checkoutRes = http.post(
    `${BASE_URL}/checkout`,
    JSON.stringify({ session_id: sessionId, payment_token: PAYMENT_TOKEN }),
    { headers }
  );

  // Just track whether checkout succeeded — no thresholds, just data for Grafana
  check(checkoutRes, {
    'checkout succeeded': r => r.status === 200,
  });

  // Minimal think time — stress test should be aggressive
  sleep(0.1);

  recordDegradation();
}

export function setup()    { annotate('Stress Test Started',  '03-stress'); }
export function teardown() { annotate('Stress Test Finished', '03-stress'); }
export function handleSummary(data) { return submitSummary(data, '03-stress'); }
