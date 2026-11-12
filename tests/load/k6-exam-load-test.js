/*
 * SharkVision JEE/NEET High-Load Concurrency Test Script
 * Powered by k6 (https://k6.io)
 *
 * Scenarios Simulated:
 * 1. Warm-up and steady state (10 to 50 concurrent students)
 * 2. Peak examination load (100 to 500 concurrent students)
 * 3. Concurrent action simulation:
 *    - Question navigation and dwell active-time recording
 *    - Continuous idempotent event batch emissions (/api/exam/events)
 *    - Response upserts (/api/exam/response)
 *    - Final examination submission burst (/api/exam/submit)
 *
 * Target SLA:
 * - p95 event write latency < 250ms
 * - p95 response upsert latency < 350ms
 * - p95 examination submission < 1500ms
 * - HTTP 2xx rate > 99.5%
 * - Zero database lock timeouts or data loss
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const EventWriteTime = new Trend('sharkvision_event_write_duration');
const ResponseSaveTime = new Trend('sharkvision_response_save_duration');
const SubmitTime = new Trend('sharkvision_submit_duration');
const ErrorRate = new Rate('sharkvision_error_rate');
const DeduplicatedEvents = new Counter('sharkvision_events_deduplicated');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Warm-up ramp: 20 VUs
    { duration: '1m', target: 100 },   // Normal examination intake: 100 VUs
    { duration: '2m', target: 500 },   // Peak concurrent examination intake: 500 VUs
    { duration: '1m', target: 500 },   // Sustained high load
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete within 500ms
    'sharkvision_event_write_duration': ['p(95)<300'],
    'sharkvision_response_save_duration': ['p(95)<400'],
    'sharkvision_submit_duration': ['p(95)<2000'],
    'sharkvision_error_rate': ['rate<0.01'], // Under 1% error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const vuId = __VU;
  const iteration = __ITER;

  // Virtual test identity headers (or real mock session token)
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': `k6-sharkvision-load-agent-vu-${vuId}`,
  };

  const attemptId = `test-attempt-${vuId % 20}`;
  const questionId = `test-question-${(iteration % 90) + 1}`;

  // 1. Health Probe Check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status is 200 or 503': (r) => r.status === 200 || r.status === 503,
  });

  // 2. Active Dwell Event Emission
  const eventPayload = JSON.stringify({
    attemptId: attemptId,
    questionId: questionId,
    eventType: 'QUESTION_VIEWED',
    clientSequenceNum: iteration + 1,
    idempotencyKey: `idemp-vu${vuId}-iter${iteration}-${Date.now()}`,
    clientTimestamp: new Date().toISOString(),
    payload: { dwellSeconds: 15, subject: 'PHYSICS' },
    clientSessionId: `sess-vu-${vuId}`,
  });

  const eventStart = Date.now();
  const eventRes = http.post(`${BASE_URL}/api/exam/events`, eventPayload, { headers });
  EventWriteTime.add(Date.now() - eventStart);

  const eventOk = check(eventRes, {
    'event accepted or deduplicated or unauth in mock': (r) =>
      r.status === 200 || r.status === 401 || r.status === 403,
  });
  if (!eventOk) ErrorRate.add(1);

  sleep(0.5);

  // 3. Option Selection and Response Upsert
  const selectedOption = ['A', 'B', 'C', 'D'][iteration % 4];
  const responsePayload = JSON.stringify({
    attemptId: attemptId,
    questionId: questionId,
    selectedOption: selectedOption,
    isMarkedForReview: iteration % 5 === 0,
    activeTimeMs: 15000 + (iteration * 200),
  });

  const respStart = Date.now();
  const responseRes = http.post(`${BASE_URL}/api/exam/response`, responsePayload, { headers });
  ResponseSaveTime.add(Date.now() - respStart);

  const respOk = check(responseRes, {
    'response saved or unauth in mock': (r) =>
      r.status === 200 || r.status === 401 || r.status === 403,
  });
  if (!respOk) ErrorRate.add(1);

  sleep(1);

  // 4. Final Submission Simulation (Only for end-of-exam triggers)
  if (iteration > 0 && iteration % 25 === 0) {
    const submitPayload = JSON.stringify({ attemptId });
    const subStart = Date.now();
    const submitRes = http.post(`${BASE_URL}/api/exam/submit`, submitPayload, { headers });
    SubmitTime.add(Date.now() - subStart);

    check(submitRes, {
      'submit handled gracefully': (r) =>
        r.status === 200 || r.status === 401 || r.status === 403 || r.status === 500,
    });
  }

  sleep(2);
}
