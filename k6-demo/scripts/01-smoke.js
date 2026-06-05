/**
 * SMOKE TEST — 01-smoke.js
 *
 * Purpose: verify the API is up and all endpoints respond correctly.
 * Run this first. If anything fails here, fix it before running the load test.
 *
 * Usage:
 *   k6 run k6/01-smoke.js
 *   k6 run -e K6_PROMETHEUS_RW_SERVER_URL=https://prometheus.<domain>/api/v1/write \
 *     --out experimental-prometheus-rw k6/01-smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, ATTENDEE, PAYMENT_TOKEN, annotate, submitSummary } from './lib/helpers.js';

// 1 VU for 30 seconds — just enough to confirm every endpoint works
export const options = {
  vus: 1,
  duration: '30s',
  tags: { attendee: ATTENDEE },
  thresholds: {
    // Smoke test must pass cleanly — no errors allowed
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const sessionId = `smoke_${__VU}_${__ITER}`;
  const headers = { 'Content-Type': 'application/json' };

  // --- Health check ---
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    'health: status 200':      r => r.status === 200,
    'health: status is ok':    r => JSON.parse(r.body).status === 'ok',
    'health: has rps field':   r => JSON.parse(r.body).rps !== undefined,
  });

  // --- Categories ---
  const cats = http.get(`${BASE_URL}/categories`);
  check(cats, {
    'categories: status 200':  r => r.status === 200,
    'categories: is array':    r => Array.isArray(JSON.parse(r.body)),
  });

  const cat = http.get(`${BASE_URL}/categories/electronics`);
  check(cat, {
    'category/electronics: 200': r => r.status === 200,
  });

  // --- Search ---
  const search = http.get(`${BASE_URL}/search?q=laptop&sort=rating`);
  check(search, {
    'search: status 200':      r => r.status === 200,
    'search: has results':     r => Array.isArray(JSON.parse(r.body).results),
  });

  // --- Products list ---
  const products = http.get(`${BASE_URL}/products`);
  check(products, {
    'products: status 200':    r => r.status === 200,
    'products: 20 items':      r => JSON.parse(r.body).length === 20,
  });

  // --- Single product ---
  const product = http.get(`${BASE_URL}/products/1`);
  check(product, {
    'product/1: status 200':   r => r.status === 200,
    'product/1: has id':       r => JSON.parse(r.body).id === 1,
  });

  // --- Related products (recommendation engine — has 150ms baseline delay) ---
  const related = http.get(`${BASE_URL}/products/1/related`);
  check(related, {
    'related: status 200':     r => r.status === 200,
    'related: is array':       r => Array.isArray(JSON.parse(r.body).related),
  });

  // --- 404 for missing product ---
  // responseCallback marks 404 as expected so it doesn't count as http_req_failed
  const notFound = http.get(`${BASE_URL}/products/999`, {
    responseCallback: http.expectedStatuses(404),
  });
  check(notFound, {
    'product/999: 404':        r => r.status === 404,
  });

  // --- Add to cart ---
  const cartAdd = http.post(
    `${BASE_URL}/cart`,
    JSON.stringify({ session_id: sessionId, product_id: 1, quantity: 2 }),
    { headers }
  );
  check(cartAdd, {
    'cart add: status 200':    r => r.status === 200,
    'cart add: has total':     r => JSON.parse(r.body).total > 0,
  });

  // --- View cart ---
  const cartView = http.get(`${BASE_URL}/cart/${sessionId}`);
  check(cartView, {
    'cart view: status 200':   r => r.status === 200,
    'cart view: has items':    r => JSON.parse(r.body).item_count > 0,
  });

  // --- Valid promo code ---
  const promoOk = http.post(
    `${BASE_URL}/cart/promo`,
    JSON.stringify({ session_id: sessionId, code: 'BLACKFRIDAY20' }),
    { headers }
  );
  check(promoOk, {
    'promo BLACKFRIDAY20: 200':      r => r.status === 200,
    'promo BLACKFRIDAY20: discount': r => JSON.parse(r.body).discount > 0,
  });

  // --- Invalid promo code — should 404 ---
  const promoBad = http.post(
    `${BASE_URL}/cart/promo`,
    JSON.stringify({ session_id: sessionId, code: 'NOTACODE' }),
    { headers, responseCallback: http.expectedStatuses(404) }
  );
  check(promoBad, {
    'promo NOTACODE: 404':     r => r.status === 404,
  });

  // --- Checkout ---
  const checkoutRes = http.post(
    `${BASE_URL}/checkout`,
    JSON.stringify({ session_id: sessionId, payment_token: PAYMENT_TOKEN }),
    { headers }
  );
  check(checkoutRes, {
    'checkout: status 200':    r => r.status === 200,
    'checkout: has order_id':  r => JSON.parse(r.body).order_id !== undefined,
  });

  // --- Order status ---
  if (checkoutRes.status === 200) {
    const orderId = JSON.parse(checkoutRes.body).order_id;
    const order = http.get(`${BASE_URL}/orders/${orderId}`);
    check(order, {
      'order status: 200':       r => r.status === 200,
      'order status: confirmed': r => JSON.parse(r.body).status === 'confirmed',
    });
  }

  // Small pause between iterations — smoke test isn't trying to load the system
  sleep(1);
}

export function setup()    { annotate('Smoke Started',  '01-smoke'); }
export function teardown() { annotate('Smoke Finished', '01-smoke'); }
export function handleSummary(data) { return submitSummary(data, '01-smoke'); }
