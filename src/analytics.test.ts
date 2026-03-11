// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAnalytics } from './analytics';

describe('analytics client', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.title = 'Pricing';
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://google.com',
    });
    window.history.replaceState({}, '', '/pricing?plan=pro');
    vi.restoreAllMocks();
  });

  it('persists anonymous and session ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    const analytics = createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      autoPageviews: false,
      sendBeacon: false,
    });

    analytics.event('cta_click');

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.anonymous_id).toBeTypeOf('string');
    expect(body.session_id).toBeTypeOf('string');
    expect(localStorage.getItem('formation_analytics_anonymous_id')).toBe(body.anonymous_id);
    expect(sessionStorage.getItem('formation_analytics_session_id')).toBe(body.session_id);
  });

  it('builds page view events from browser state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    const analytics = createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      autoPageviews: false,
      sendBeacon: false,
    });

    analytics.page({ utm_source: 'google' });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.type).toBe('page_view');
    expect(body.path).toBe('/pricing?plan=pro');
    expect(body.title).toBe('Pricing');
    expect(body.referrer).toBe('https://google.com');
    expect(body.payload.utm_source).toBe('google');
  });

  it('propagates identified user ids to future events', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    const analytics = createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      autoPageviews: false,
      sendBeacon: false,
    });

    analytics.identify('user-123', { plan: 'pro' });
    analytics.event('checkout_started');

    const identifyCall = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const eventCall = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(identifyCall.type).toBe('identify');
    expect(eventCall.user_id).toBe('user-123');
  });
});
