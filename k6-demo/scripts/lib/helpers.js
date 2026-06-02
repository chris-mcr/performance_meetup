// Shared config for all k6 scripts.
// Override BASE_URL to point at the shared demo server:
//   k6 run -e BASE_URL=https://k6-app.<domain> -e ATTENDEE=yourname 02-load.js

import http from 'k6/http';
import { Gauge } from 'k6/metrics';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const ATTENDEE = __ENV.ATTENDEE || 'anonymous';

// Loud warning — without ATTENDEE every result on Grafana is unlabelled
if (!__ENV.ATTENDEE && __VU <= 1) {
  console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.warn('!! ATTENDEE not set — your data will appear as "anonymous" !!');
  console.warn('!! and be indistinguishable from everyone else\'s results.  !!');
  console.warn('!! Add  -e ATTENDEE=yourname  to your k6 command.          !!');
  console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
}

export const degradationGauge   = new Gauge('degradation_level');
export const dbPoolActiveGauge  = new Gauge('db_pool_active');
export const dbPoolWaitingGauge = new Gauge('db_pool_waiting');

// Used for Grafana annotations: set to 1 at test start, 0 at teardown.
// Grafana annotation query: k6_test_active > 0
const testActiveGauge = new Gauge('test_active');

const DEGRADATION_SCORES = { none: 0, low: 1, high: 2, critical: 3 };

// Per-VU auth token cache — k6 module state is isolated per VU, so this is safe.
let _authToken = null;

export const HEADERS = { 'Content-Type': 'application/json' };

export const SEARCH_TERMS = ['laptop', 'headphones', 'tv', 'keyboard', 'speaker', 'chair', 'tablet'];

export const PROMO_CODES = ['BLACKFRIDAY20', 'SAVE10', 'VIP50', 'INVALID123'];

// Logs in once per VU and caches the token for subsequent iterations.
export function ensureAuth() {
  if (_authToken) return _authToken;

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: `user${__VU}@blackfriday.demo`, password: 'password123' }),
    { headers: HEADERS, tags: { url: '/auth/login', attendee: ATTENDEE } }
  );

  if (res.status === 200) {
    _authToken = JSON.parse(res.body).token;
  }

  return _authToken;
}

export function randomSessionId() {
  return `sess_${Math.random().toString(36).slice(2, 10)}`;
}

export function randomProductId() {
  return Math.floor(Math.random() * 20) + 1;
}

export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const PAYMENT_TOKEN = 'tok_test_blackfriday';

export function recordDegradation() {
  const res = http.get(`${BASE_URL}/health`, {
    tags: { url: 'health_poll', attendee: ATTENDEE },
  });
  if (res.status === 200) {
    const body = JSON.parse(res.body);
    degradationGauge.add(DEGRADATION_SCORES[body.degradation_level] ?? 0);
    if (body.db_pool) {
      dbPoolActiveGauge.add(body.db_pool.active);
      dbPoolWaitingGauge.add(body.db_pool.waiting);
    }
  }
}

// Marks a test event in Prometheus so Grafana can show annotation lines.
// At test start: annotate('Load Test Started', '02-load')  → k6_test_active = 1
// At test end:   annotate('Load Test Finished', '02-load') → k6_test_active = 0
// Grafana annotation query: k6_test_active{attendee=~".*"} > 0
export function annotate(title, testName) {
  const active = title.toLowerCase().includes('start') ? 1 : 0;
  testActiveGauge.add(active, { attendee: ATTENDEE, test: testName });
}
