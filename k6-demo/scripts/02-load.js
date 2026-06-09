/**
 * LOAD TEST — 02-load.js
 *
 * Purpose: simulate a realistic Black Friday shopping journey with a surge.
 * Each VU walks through a full 9-step flow: login → browse → search →
 * product detail → recommendations → cart → promo → checkout → order status.
 *
 * Watch the Grafana dashboard — response times climb and errors appear as
 * the combined VU count pushes past the degradation thresholds.
 *
 * Usage:
 *   k6 run --out experimental-prometheus-rw k6/02-load.js
 *   k6 run -e BASE_URL=https://k6-app.<domain> -e ATTENDEE=yourname \
 *     -e K6_PROMETHEUS_RW_SERVER_URL=https://prometheus.<domain>/api/v1/write \
 *     --out experimental-prometheus-rw k6/02-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import {
  BASE_URL, ATTENDEE, HEADERS, SEARCH_TERMS, PROMO_CODES,
  ensureAuth, randomSessionId, randomProductId, randomItem,
  PAYMENT_TOKEN, recordDegradation, annotate, submitSummary,
} from './lib/helpers.js';

export const options = {
  tags: { attendee: ATTENDEE },
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 10 },  // Ramp up: normal pre-sale traffic
        { duration: '2m',  target: 10 },  // Steady state: baseline load
        { duration: '30s', target: 30 },  // Surge: Black Friday doors open
        { duration: '1m',  target: 30 },  // Sustained pressure: peak shopping
        { duration: '20s', target: 0  },  // Ramp down
      ],
      tags: { scenario: 'load_test' },
    },
  },
  // These thresholds are intentionally aggressive — they WILL turn red during
  // the surge so the room can see real failure, not just yellow warnings.
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed:   ['rate<0.05'],
  },
};

export default function () {
  const sessionId = randomSessionId();

  // Step 1: Authenticate (cached after first iteration per VU)
  ensureAuth();
  sleep(0.2);

  // Step 2: Browse categories
  const cats = http.get(`${BASE_URL}/categories`);
  check(cats, { 'categories: 200': r => r.status === 200 });
  sleep(Math.random() * 0.5 + 0.3);

  // Step 3: Search for a product
  const term = randomItem(SEARCH_TERMS);
  const search = http.get(`${BASE_URL}/search?q=${term}&sort=rating`, { tags: { name: 'GET /search' } });
  check(search, { 'search: 200 or 503': r => r.status === 200 || r.status === 503 });
  sleep(Math.random() * 0.5 + 0.3);

  // Step 4: View a product detail page
  const productId = randomProductId();
  const product = http.get(`${BASE_URL}/products/${productId}`, { tags: { name: 'GET /products/:id' } });
  check(product, { 'product: 200': r => r.status === 200 });
  sleep(Math.random() * 0.3 + 0.2);

  // Step 5: Check related products (recommendation engine)
  const related = http.get(`${BASE_URL}/products/${productId}/related`, { tags: { name: 'GET /products/:id/related' } });
  check(related, { 'related: 200': r => r.status === 200 });
  sleep(Math.random() * 0.3 + 0.2);

  // Step 6: Add to cart
  const cartAdd = http.post(
    `${BASE_URL}/cart`,
    JSON.stringify({ session_id: sessionId, product_id: productId, quantity: 1 }),
    { headers: HEADERS }
  );
  check(cartAdd, {
    'add to cart: 200': r => r.status === 200,
    'add to cart: under 2s': r => r.timings.duration < 2000,
  });
  sleep(Math.random() * 0.3 + 0.2);

  // Step 7: View cart
  http.get(`${BASE_URL}/cart/${sessionId}`, { tags: { name: 'GET /cart/:sessionId' } });
  sleep(0.2);

  // Step 8: Apply promo code (30% of shoppers try a code)
  if (Math.random() < 0.3) {
    const code = randomItem(PROMO_CODES);
    http.post(
      `${BASE_URL}/cart/promo`,
      JSON.stringify({ session_id: sessionId, code }),
      { headers: HEADERS }
    );
    sleep(0.2);
  }

  // Step 9: Checkout
  const checkout = http.post(
    `${BASE_URL}/checkout`,
    JSON.stringify({ session_id: sessionId, payment_token: PAYMENT_TOKEN }),
    { headers: HEADERS }
  );
  check(checkout, {
    'checkout: 200': r => r.status === 200,
    'checkout: under 3s': r => r.timings.duration < 3000,
  });

  // Step 10: Poll order status (only if checkout succeeded)
  if (checkout.status === 200) {
    const orderId = JSON.parse(checkout.body).order_id;
    const order = http.get(`${BASE_URL}/orders/${orderId}`, { tags: { name: 'GET /orders/:orderId' } });
    check(order, { 'order status: 200': r => r.status === 200 });
  }

  sleep(Math.random() * 0.5 + 0.3);
  recordDegradation();
}

export function setup()    { annotate('Load Test Started',  '02-load'); }
export function teardown() { annotate('Load Test Finished', '02-load'); }
export function handleSummary(data) { return submitSummary(data, '02-load'); }
