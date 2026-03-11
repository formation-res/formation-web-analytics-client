import { sendEvent } from './transport';
import type {
  AnalyticsClient,
  AnalyticsConfig,
  EventPayload,
  OutboundEvent,
} from './types';

const DEFAULT_ANON_KEY = 'formation_analytics_anonymous_id';
const DEFAULT_SESSION_KEY = 'formation_analytics_session_id';

type State = {
  anonymousId: string;
  sessionId: string;
  userId: string | null;
  context: EventPayload;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function createAnalytics(config: AnalyticsConfig): AnalyticsClient {
  const resolved: Required<
    Pick<
      AnalyticsConfig,
      | 'siteId'
      | 'endpoint'
      | 'autoPageviews'
      | 'anonymousIdStorageKey'
      | 'sessionStorageKey'
      | 'sendBeacon'
      | 'debug'
      | 'defaultPayload'
    >
  > = {
    endpoint: config.endpoint,
    siteId: config.siteId,
    autoPageviews: config.autoPageviews ?? true,
    anonymousIdStorageKey:
      config.anonymousIdStorageKey ?? DEFAULT_ANON_KEY,
    sessionStorageKey: config.sessionStorageKey ?? DEFAULT_SESSION_KEY,
    sendBeacon: config.sendBeacon ?? true,
    debug: config.debug ?? false,
    defaultPayload: config.defaultPayload ?? {},
  };

  const state: State = {
    anonymousId: loadOrCreateId(
      safeStorage(() => window.localStorage),
      resolved.anonymousIdStorageKey,
    ),
    sessionId: loadOrCreateId(
      safeStorage(() => window.sessionStorage),
      resolved.sessionStorageKey,
    ),
    userId: null,
    context: { ...resolved.defaultPayload },
  };

  const client: AnalyticsClient = {
    page(payload) {
      void track(pageEvent(resolved, state, payload));
    },
    event(type, payload) {
      void track(customEvent(resolved, state, type, payload));
    },
    identify(userId, payload) {
      state.userId = userId;
      void track(customEvent(resolved, state, 'identify', {
        ...(payload ?? {}),
        identified_user_id: userId,
      }));
    },
    setContext(payload) {
      state.context = {
        ...state.context,
        ...payload,
      };
    },
  };

  if (resolved.autoPageviews && typeof window !== 'undefined') {
    installSpaTracking(client);
    client.page();
  }

  return client;

  async function track(event: OutboundEvent) {
    try {
      await sendEvent(event, {
        endpoint: resolved.endpoint,
        sendBeacon: resolved.sendBeacon,
        debug: resolved.debug,
      });
    } catch (error) {
      if (resolved.debug && typeof console !== 'undefined') {
        console.warn('[formation-analytics] failed to send event', error);
      }
    }
  }
}

function pageEvent(
  config: Required<Pick<AnalyticsConfig, 'siteId' | 'defaultPayload'>>,
  state: State,
  payload?: EventPayload,
): OutboundEvent {
  return {
    ...baseEvent(config, state, 'page_view', payload),
    url: currentUrl(),
    path: currentPath(),
    referrer: currentReferrer(),
    title: currentTitle(),
  };
}

function customEvent(
  config: Required<Pick<AnalyticsConfig, 'siteId' | 'defaultPayload'>>,
  state: State,
  type: string,
  payload?: EventPayload,
): OutboundEvent {
  return baseEvent(config, state, type, payload);
}

function baseEvent(
  config: Required<Pick<AnalyticsConfig, 'siteId' | 'defaultPayload'>>,
  state: State,
  type: string,
  payload?: EventPayload,
): OutboundEvent {
  return {
    type,
    site_id: config.siteId,
    timestamp: new Date().toISOString(),
    session_id: state.sessionId,
    anonymous_id: state.anonymousId,
    user_id: state.userId,
    payload: {
      ...config.defaultPayload,
      ...state.context,
      ...(payload ?? {}),
    },
  };
}

function installSpaTracking(client: AnalyticsClient) {
  const emit = () => client.page();
  window.addEventListener('popstate', emit);
  window.addEventListener('hashchange', emit);

  const pushState = window.history.pushState.bind(window.history);
  window.history.pushState = function patchedPushState(...args) {
    pushState(...args);
    emit();
  };

  const replaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = function patchedReplaceState(...args) {
    replaceState(...args);
    emit();
  };
}

function loadOrCreateId(storage: StorageLike, key: string): string {
  const existing = storage.getItem(key);
  if (existing) {
    return existing;
  }
  const value = generateId();
  storage.setItem(key, value);
  return value;
}

function safeStorage(factory: () => Storage): StorageLike {
  try {
    return factory();
  } catch {
    const values = new Map<string, string>();
    return {
      getItem(key) {
        return values.get(key) ?? null;
      },
      setItem(key, value) {
        values.set(key, value);
      },
    };
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fa_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function currentUrl(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location.href;
}

function currentPath(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function currentReferrer(): string | undefined {
  return typeof document === 'undefined' ? undefined : document.referrer || undefined;
}

function currentTitle(): string | undefined {
  return typeof document === 'undefined' ? undefined : document.title || undefined;
}
