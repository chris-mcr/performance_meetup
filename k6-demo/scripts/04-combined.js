/**
 * COMBINED TEST — 04-combined.js
 *
 * Three shopper profiles run in parallel with staggered start times so the
 * Grafana dashboard shows distinct shapes as each one joins:
 *
 *   0:00 — browsing only         (catalogue hits, search latency visible)
 *   1:00 — cart_heavy joins      (LOW degradation, cart endpoint slows)
 *   2:00 — checkout_heavy joins  (HIGH/CRITICAL, errors start spiking)
 *   3:00 — checkout_heavy exits
 *   3:30 — cart_heavy exits
 *   4:00 — browsing exits, done
 *
 * Usage:
 *   k6 run -e BASE_URL=https://k6-app.<domain> -e ATTENDEE=yourname \
 *     -e K6_PROMETHEUS_RW_SERVER_URL=https://prometheus.<domain>/api/v1/write \
 *     --out experimental-prometheus-rw k6/04-combined.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import {
  BASE_URL, ATTENDEE, HEADERS, SEARCH_TERMS, PROMO_CODES,
  ensureAuth, randomSessionId, randomProductId, randomItem,
  PAYMENT_TOKEN, recordDegradation, annotate,
} from './lib/helpers.js';

export const options = {
  tags: { attendee: ATTENDEE },
  scenarios: {

    // Window shoppers — browse catalogue, search, and read product pages
    browsing: {
      executor: 'ramping-vus',
      startTime: '0s',
      stages: [
        { duration: '30s', target: 15 },
        { duration: '2m',  target: 15 },
        { duration: '30s', target: 20 },
        { duration: '30s', target: 0  },
      ],
      exec: 'browse',
      tags: { scenario: 'browsing' },
    },

    // Cart abandoners — browse, add to cart, apply promo, never checkout
    cart_heavy: {
      executor: 'ramping-vus',
      startTime: '1m',
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m',  target: 10 },
        { duration: '30s', target: 15 },
        { duration: '30s', target: 0  },
      ],
      exec: 'addToCart',
      tags: { scenario: 'cart_heavy' },
    },

    // Determined buyers — full journey, hammers checkout and order polling
    checkout_heavy: {
      executor: 'ramping-vus',
      startTime: '2m',
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m',  target: 10 },
        { duration: '30s', target: 0  },
      ],
      exec: 'fullJourney',
      tags: { scenario: 'checkout_heavy' },
    },
  },
};

// Window shopper: auth → categories → search → product → related
export function browse() {
  ensureAuth();

  const cats = http.get(`${BASE_URL}/categories`);
  check(cats, { 'categories: 200': r => r.status === 200 });
  sleep(Math.random() * 0.5 + 0.3);

  const search = http.get(`${BASE_URL}/search?q=${randomItem(SEARCH_TERMS)}&sort=rating`);
  check(search, { 'search: ok': r => r.status === 200 || r.status === 503 });
  sleep(Math.random() * 0.5 + 0.3);

  const productId = randomProductId();
  http.get(`${BASE_URL}/products/${productId}`);
  sleep(0.3);

  http.get(`${BASE_URL}/products/${productId}/related`);
  sleep(Math.random() * 0.5 + 0.3);

  recordDegradation();
}

// Cart abandoner: product → add to cart → view cart → promo code
export function addToCart() {
  ensureAuth();
  const sessionId = randomSessionId();

  const productId = randomProductId();
  http.get(`${BASE_URL}/products/${productId}`);
  sleep(0.2);

  const cartAdd = http.post(
    `${BASE_URL}/cart`,
    JSON.stringify({ session_id: sessionId, product_id: productId, quantity: 1 }),
    { headers: HEADERS }
  );
  check(cartAdd, { 'cart: 200': r => r.status === 200 });
  sleep(0.2);

  http.get(`${BASE_URL}/cart/${sessionId}`);
  sleep(0.2);

  // Always try a promo code — drives promo service load
  http.post(
    `${BASE_URL}/cart/promo`,
    JSON.stringify({ session_id: sessionId, code: randomItem(PROMO_CODES) }),
    { headers: HEADERS }
  );
  sleep(Math.random() * 0.5 + 0.3);

  recordDegradation();
}

// Determined buyer: cart → checkout → order status
export function fullJourney() {
  ensureAuth();
  const sessionId = randomSessionId();

  http.post(
    `${BASE_URL}/cart`,
    JSON.stringify({ session_id: sessionId, product_id: randomProductId(), quantity: 1 }),
    { headers: HEADERS }
  );
  sleep(0.2);

  const checkout = http.post(
    `${BASE_URL}/checkout`,
    JSON.stringify({ session_id: sessionId, payment_token: PAYMENT_TOKEN }),
    { headers: HEADERS }
  );
  check(checkout, {
    'checkout: success or surge error': r => r.status === 200 || r.status === 500,
  });

  if (checkout.status === 200) {
    const orderId = JSON.parse(checkout.body).order_id;
    http.get(`${BASE_URL}/orders/${orderId}`);
  }

  sleep(Math.random() * 0.3 + 0.2);
  recordDegradation();
}

export function setup()    { annotate('Combined Test Started',  '04-combined'); }
export function teardown() { annotate('Combined Test Finished', '04-combined'); }
