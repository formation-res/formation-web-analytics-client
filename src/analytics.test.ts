// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAnalytics } from './analytics';

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

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
    await flushAsyncWork();

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
    await flushAsyncWork();

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
    await flushAsyncWork();

    const identifyCall = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const eventCall = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(identifyCall.type).toBe('identify');
    expect(eventCall.user_id).toBe('user-123');
  });

  it('includes browser context on custom events', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    const analytics = createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      autoPageviews: false,
      sendBeacon: false,
    });

    analytics.event('checkout_started', { step: 'shipping' });
    await flushAsyncWork();

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.url).toBe('http://localhost:3000/pricing?plan=pro');
    expect(body.path).toBe('/pricing?plan=pro');
    expect(body.title).toBe('Pricing');
    expect(body.referrer).toBe('https://google.com');
  });

  it('merges default payload, context, and event payload in order', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    const analytics = createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      autoPageviews: false,
      sendBeacon: false,
      defaultPayload: {
        locale: 'en',
        plan: 'free',
      },
    });

    analytics.setContext({
      plan: 'pro',
      app_version: '1.0.0',
    });
    analytics.event('checkout_started', {
      plan: 'enterprise',
      cta: 'hero',
    });
    await flushAsyncWork();

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.payload).toEqual({
      locale: 'en',
      plan: 'enterprise',
      app_version: '1.0.0',
      cta: 'hero',
    });
  });

  it('fails fast on invalid config', () => {
    expect(() =>
      createAnalytics({
        endpoint: 'not-a-url',
        siteId: '',
      }),
    ).toThrow('Invalid analytics config');
  });

  it('reports invalid event names through onError without sending', async () => {
    const fetchMock = vi.fn();
    const onError = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const analytics = createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      autoPageviews: false,
      sendBeacon: false,
      onError,
    });

    analytics.event('bad event name');
    await flushAsyncWork();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'configuration_error',
        event: expect.objectContaining({
          type: 'bad event name',
        }),
      }),
    );
  });

  it('reports invalid identify calls through onError without sending', async () => {
    const fetchMock = vi.fn();
    const onError = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const analytics = createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      autoPageviews: false,
      sendBeacon: false,
      onError,
    });

    analytics.identify('   ');
    await flushAsyncWork();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'configuration_error',
      }),
    );
  });

  it('reports transport failures through onError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    const onError = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const analytics = createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      autoPageviews: false,
      sendBeacon: false,
      onError,
    });

    analytics.event('checkout_started');
    await flushAsyncWork();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'http_error',
        transport: 'fetch',
        status: 500,
        event: expect.objectContaining({
          type: 'checkout_started',
        }),
      }),
    );
  });

  it('emits one auto page view per navigation even after creating multiple clients', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      sendBeacon: false,
    });
    await flushAsyncWork();

    createAnalytics({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      sendBeacon: false,
    });
    await flushAsyncWork();

    window.history.pushState({}, '', '/contact');
    await flushAsyncWork();

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
