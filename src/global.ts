import { createAnalytics } from './analytics';
import type { AnalyticsClient, AnalyticsConfig, EventPayload } from './types';

type BrowserAnalytics = AnalyticsClient & {
  init(config: AnalyticsConfig): AnalyticsClient;
};

let client: AnalyticsClient | null = null;

function getClient(): AnalyticsClient {
  if (!client) {
    throw new Error('window.analytics.init(config) must be called first');
  }
  return client;
}

const analytics: BrowserAnalytics = {
  init(config) {
    client = createAnalytics(config);
    return client;
  },
  page(payload?: EventPayload) {
    getClient().page(payload);
  },
  event(type: string, payload?: EventPayload) {
    getClient().event(type, payload);
  },
  identify(userId: string, payload?: EventPayload) {
    getClient().identify(userId, payload);
  },
  setContext(payload: EventPayload) {
    getClient().setContext(payload);
  },
};

declare global {
  interface Window {
    analytics: BrowserAnalytics;
  }
}

if (typeof window !== 'undefined') {
  window.analytics = analytics;
}

export default analytics;
