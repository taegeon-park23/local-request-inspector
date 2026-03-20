import { describe, expect, it } from 'vitest';
import { URLSearchParams } from 'node:url';
import mockRuleEngine from './mock-rule-engine.js';

const { createMockRuleRecord, evaluateMockRules } = mockRuleEngine;

function createFallbackConfig() {
  return {
    statusCode: 200,
    contentType: 'application/json',
    body: '{"fallback":true}',
  };
}

describe('mock-rule-engine S16 MVP evaluation', () => {
  it('matches method, path, query, header, and body using the MVP matcher range', () => {
    const rule = createMockRuleRecord({
      name: 'Webhook rule',
      enabled: true,
      priority: 100,
      methodMode: 'exact',
      method: 'POST',
      pathMode: 'prefix',
      pathValue: '/webhooks',
      queryMatchers: [{ id: 'q1', key: 'env', operator: 'contains', value: 'dev', enabled: true }],
      headerMatchers: [{ id: 'h1', key: 'x-signature', operator: 'exists', value: '', enabled: true }],
      bodyMatcherMode: 'contains',
      bodyMatcherValue: 'invoice.paid',
      responseStatusCode: 202,
      responseHeaders: [{ id: 'r1', key: 'Content-Type', value: 'application/json', enabled: true }],
      responseBody: '{"mocked":true}',
      fixedDelayMs: 120,
    });

    const result = evaluateMockRules(
      [rule],
      {
        method: 'POST',
        pathname: '/webhooks/stripe',
        searchParams: new URLSearchParams('env=dev-preview'),
        headers: { 'x-signature': 'sig_demo' },
        rawBody: '{"event":"invoice.paid"}',
      },
      createFallbackConfig(),
    );

    expect(result.outcome).toBe('Mocked');
    expect(result.matchedRuleName).toBe('Webhook rule');
    expect(result.appliedDelayMs).toBe(120);
    expect(result.response.statusCode).toBe(202);
  });

  it('prefers higher priority enabled rules when multiple rules match', () => {
    const lowerPriority = createMockRuleRecord({
      name: 'Low priority',
      enabled: true,
      priority: 50,
      methodMode: 'exact',
      method: 'GET',
      pathMode: 'exact',
      pathValue: '/health',
      queryMatchers: [],
      headerMatchers: [],
      bodyMatcherMode: 'none',
      bodyMatcherValue: '',
      responseStatusCode: 200,
      responseHeaders: [],
      responseBody: 'low',
      fixedDelayMs: 0,
    });
    const higherPriority = createMockRuleRecord({
      ...lowerPriority,
      name: 'High priority',
      priority: 250,
      responseBody: 'high',
    });

    const result = evaluateMockRules(
      [lowerPriority, higherPriority],
      {
        method: 'GET',
        pathname: '/health',
        searchParams: new URLSearchParams(),
        headers: {},
        rawBody: '',
      },
      createFallbackConfig(),
    );

    expect(result.outcome).toBe('Mocked');
    expect(result.matchedRuleName).toBe('High priority');
    expect(result.response.body).toBe('high');
  });

  it('distinguishes bypassed, no-match, and blocked outcomes', () => {
    const disabledRule = createMockRuleRecord({
      name: 'Disabled rule',
      enabled: false,
      priority: 100,
      methodMode: 'any',
      method: 'GET',
      pathMode: 'exact',
      pathValue: '/health',
      queryMatchers: [],
      headerMatchers: [],
      bodyMatcherMode: 'none',
      bodyMatcherValue: '',
      responseStatusCode: 200,
      responseHeaders: [],
      responseBody: 'disabled',
      fixedDelayMs: 0,
    });
    const enabledNoMatchRule = createMockRuleRecord({
      ...disabledRule,
      name: 'Enabled but no match',
      enabled: true,
      pathValue: '/admin',
    });
    const blockedRule = {
      ...enabledNoMatchRule,
      pathValue: '',
    };

    const bypassed = evaluateMockRules(
      [disabledRule],
      { method: 'GET', pathname: '/health', searchParams: new URLSearchParams(), headers: {}, rawBody: '' },
      createFallbackConfig(),
    );
    const noMatch = evaluateMockRules(
      [enabledNoMatchRule],
      { method: 'GET', pathname: '/health', searchParams: new URLSearchParams(), headers: {}, rawBody: '' },
      createFallbackConfig(),
    );
    const blocked = evaluateMockRules(
      [blockedRule],
      { method: 'GET', pathname: '/health', searchParams: new URLSearchParams(), headers: {}, rawBody: '' },
      createFallbackConfig(),
    );

    expect(bypassed.outcome).toBe('Bypassed');
    expect(noMatch.outcome).toBe('No rule matched');
    expect(blocked.outcome).toBe('Blocked');
  });
});
