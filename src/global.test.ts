// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import analytics from './global';

describe('global analytics wrapper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    document.title = 'Home';
    window.history.replaceState({}, '', '/');
  });

  it('requires init before use', () => {
    expect(() => analytics.page()).toThrow('window.analytics.init(config) must be called first');
  });

  it('reinitializes without duplicating automatic page views', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    analytics.init({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      sendBeacon: false,
    });
    await Promise.resolve();

    analytics.init({
      endpoint: 'https://analytics.example.com/collect',
      siteId: 'marketing-site',
      sendBeacon: false,
    });
    await Promise.resolve();

    window.history.pushState({}, '', '/pricing');
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
