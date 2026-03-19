import type { RuntimeCaptureTransportEvent } from '@client/features/runtime-events/runtime-events.types';

export const syntheticRuntimeCaptureEvents: RuntimeCaptureTransportEvent[] = [
  {
    id: 'cap-stripe-webhook',
    method: 'POST',
    url: 'http://localhost:5671/webhooks/stripe?env=dev',
    receivedAtIso: '2026-03-19T10:14:33.000Z',
    parsedHeaders: {
      host: 'localhost:5671',
      'content-type': 'application/json',
      'x-signature': 'sig_demo',
    },
    parsedBody: {
      event: 'invoice.paid',
      customerId: 'cus_demo',
    },
    mockOutcome: 'Mocked',
    mockRuleName: 'Stripe webhook success',
    workspaceLabel: 'Payments workspace',
  },
  {
    id: 'cap-health-probe',
    method: 'GET',
    url: 'http://localhost:5671/health',
    receivedAtIso: '2026-03-19T10:13:02.000Z',
    parsedHeaders: {
      host: 'localhost:5671',
      accept: 'application/json',
    },
    mockOutcome: 'Bypassed',
  },
  {
    id: 'cap-user-create',
    method: 'POST',
    url: 'http://localhost:5671/api/users',
    receivedAtIso: '2026-03-19T10:09:11.000Z',
    parsedHeaders: {
      host: 'localhost:5671',
      'content-type': 'application/json',
    },
    parsedBody: {
      email: 'demo@example.com',
      role: 'admin',
    },
    mockOutcome: 'No rule matched',
  },
  {
    id: 'cap-admin-blocked',
    method: 'DELETE',
    url: 'http://localhost:5671/admin/purge?dryRun=false',
    receivedAtIso: '2026-03-19T10:05:47.000Z',
    parsedHeaders: {
      host: 'localhost:5671',
      authorization: 'Bearer redacted',
    },
    rawBody: '',
    mockOutcome: 'Blocked',
    workspaceLabel: 'Security review workspace',
  },
];
