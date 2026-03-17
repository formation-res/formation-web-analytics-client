// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { sendEvent } from './transport';

describe('transport', () => {
  it('uses sendBeacon when available', async () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await sendEvent(
      {
        type: 'page_view',
        site_id: 'site',
        timestamp: new Date().toISOString(),
        session_id: 'session',
        anonymous_id: 'anon',
      },
      {
        endpoint: 'https://analytics.example.com/collect',
        sendBeacon: true,
        debug: false,
      },
    );

    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to fetch when sendBeacon returns false', async () => {
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    await sendEvent(
      {
        type: 'page_view',
        site_id: 'site',
        timestamp: new Date().toISOString(),
        session_id: 'session',
        anonymous_id: 'anon',
      },
      {
        endpoint: 'https://analytics.example.com/collect',
        sendBeacon: true,
        debug: false,
      },
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('throws when fetch rejects', async () => {
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      value: undefined,
    });
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendEvent(
        {
          type: 'page_view',
          site_id: 'site',
          timestamp: new Date().toISOString(),
          session_id: 'session',
          anonymous_id: 'anon',
        },
        {
          endpoint: 'https://analytics.example.com/collect',
          sendBeacon: true,
          debug: false,
        },
      ),
    ).rejects.toMatchObject({
      kind: 'network_error',
      transport: 'fetch',
    });
  });

  it('throws when fetch returns a non-ok response', async () => {
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      value: undefined,
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response('bad request', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendEvent(
        {
          type: 'page_view',
          site_id: 'site',
          timestamp: new Date().toISOString(),
          session_id: 'session',
          anonymous_id: 'anon',
        },
        {
          endpoint: 'https://analytics.example.com/collect',
          sendBeacon: true,
          debug: false,
        },
      ),
    ).rejects.toMatchObject({
      kind: 'http_error',
      transport: 'fetch',
      status: 400,
    });
  });
});
