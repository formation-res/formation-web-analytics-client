import { sendEvent } from './transport';
import type {
  AnalyticsError,
  AnalyticsClient,
  AnalyticsConfig,
  EventPayload,
  OutboundEvent,
} from './types';

const DEFAULT_ANON_KEY = 'formation_analytics_anonymous_id';
const DEFAULT_SESSION_KEY = 'formation_analytics_session_id';
const IDENTIFIER_PATTERN = /^[a-zA-Z0-9_.:-]{1,128}$/;

type ResolvedConfig = Required<
  Pick<
    AnalyticsConfig,
    | 'siteId'
    | 'endpoint'
    | 'autoPageviews'
    | 'anonymousIdStorageKey'
    | 'sessionStorageKey'
    | 'debug'
    | 'defaultPayload'
  >
> & Pick<AnalyticsConfig, 'onError'>;

type State = {
  anonymousId: string;
  sessionId: string;
  userId: string | null;
  context: EventPayload;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
type BrowserContext = Pick<OutboundEvent, 'url' | 'path' | 'referrer' | 'title'>;

type SpaTrackingState = {
  emit: (() => void) | null;
};

let spaTrackingState: SpaTrackingState | null = null;

export function createAnalytics(config: AnalyticsConfig): AnalyticsClient {
  const resolved = resolveConfig(config);

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
    context: {},
  };

  const client: AnalyticsClient = {
    page(payload) {
      void track(pageEvent(resolved, state, payload));
    },
    event(type, payload) {
      const event = customEvent(resolved, state, type, payload);
      if (!assertValidEventType(resolved, event)) {
        return;
      }
      void track(event);
    },
    identify(userId, payload) {
      const normalizedUserId = userId.trim();
      if (!normalizedUserId) {
        reportConfigurationError(
          resolved,
          identifyEvent(resolved, state, userId, payload),
          'identify requires a non-empty user id',
        );
        return;
      }
      state.userId = normalizedUserId;
      void track(identifyEvent(resolved, state, normalizedUserId, payload));
    },
    setContext(payload) {
      state.context = {
        ...state.context,
        ...payload,
      };
    },
  };

  if (resolved.autoPageviews && typeof window !== 'undefined') {
    installSpaTracking(() => client.page());
    client.page();
  }

  return client;

  async function track(event: OutboundEvent) {
    try {
      await sendEvent(event, {
        endpoint: resolved.endpoint,
        debug: resolved.debug,
      });
    } catch (error) {
      reportError(resolved, coerceAnalyticsError(event, error));
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
  };
}

function customEvent(
  config: Required<Pick<AnalyticsConfig, 'siteId' | 'defaultPayload'>>,
  state: State,
  type: string,
  payload?: EventPayload,
): OutboundEvent {
  return {
    ...baseEvent(config, state, type, payload),
  };
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
    ...captureBrowserContext(),
    payload: {
      ...config.defaultPayload,
      ...state.context,
      ...(payload ?? {}),
    },
  };
}

function identifyEvent(
  config: Required<Pick<AnalyticsConfig, 'siteId' | 'defaultPayload'>>,
  state: State,
  userId: string,
  payload?: EventPayload,
): OutboundEvent {
  return customEvent(config, state, 'identify', {
    ...(payload ?? {}),
    identified_user_id: userId,
  });
}

function installSpaTracking(emit: () => void) {
  if (!spaTrackingState) {
    spaTrackingState = { emit };
    window.addEventListener('popstate', emitCurrentPage);
    window.addEventListener('hashchange', emitCurrentPage);

    const pushState = window.history.pushState.bind(window.history);
    window.history.pushState = function patchedPushState(...args) {
      pushState(...args);
      emitCurrentPage();
    };

    const replaceState = window.history.replaceState.bind(window.history);
    window.history.replaceState = function patchedReplaceState(...args) {
      replaceState(...args);
      emitCurrentPage();
    };
    return;
  }

  spaTrackingState.emit = emit;
}

function emitCurrentPage() {
  spaTrackingState?.emit?.();
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

function captureBrowserContext(): BrowserContext {
  return {
    url: currentUrl(),
    path: currentPath(),
    referrer: currentReferrer(),
    title: currentTitle(),
  };
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

function resolveConfig(config: AnalyticsConfig): ResolvedConfig {
  validateConfig(config);

  return {
    endpoint: config.endpoint,
    siteId: config.siteId.trim(),
    autoPageviews: config.autoPageviews ?? true,
    anonymousIdStorageKey: config.anonymousIdStorageKey ?? DEFAULT_ANON_KEY,
    sessionStorageKey: config.sessionStorageKey ?? DEFAULT_SESSION_KEY,
    debug: config.debug ?? false,
    defaultPayload: config.defaultPayload ?? {},
    onError: config.onError,
  };
}

function validateConfig(config: AnalyticsConfig) {
  const problems: string[] = [];

  if (!IDENTIFIER_PATTERN.test(config.siteId.trim())) {
    problems.push('siteId must match /^[a-zA-Z0-9_.:-]{1,128}$/');
  }

  try {
    const endpoint = new URL(config.endpoint);
    if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') {
      problems.push('endpoint must use http or https');
    }
  } catch {
    problems.push('endpoint must be a valid absolute URL');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid analytics config: ${problems.join('; ')}`);
  }
}

function assertValidEventType(
  config: ResolvedConfig,
  event: OutboundEvent,
): boolean {
  if (IDENTIFIER_PATTERN.test(event.type.trim())) {
    return true;
  }

  reportConfigurationError(
    config,
    event,
    'event type must match /^[a-zA-Z0-9_.:-]{1,128}$/',
  );
  return false;
}

function reportConfigurationError(
  config: ResolvedConfig,
  event: OutboundEvent,
  message: string,
) {
  reportError(config, createAnalyticsError('configuration_error', 'client', event, message));
}

function reportError(config: ResolvedConfig, error: AnalyticsError) {
  config.onError?.(error);
}

function createAnalyticsError(
  kind: AnalyticsError['kind'],
  transport: AnalyticsError['transport'],
  event: OutboundEvent,
  message: string,
  extras: Partial<Pick<AnalyticsError, 'status' | 'cause'>> = {},
): AnalyticsError {
  return Object.assign(new Error(message), {
    kind,
    transport,
    event,
    ...extras,
  });
}

function coerceAnalyticsError(event: OutboundEvent, error: unknown): AnalyticsError {
  if (isAnalyticsError(error)) {
    return error;
  }

  return createAnalyticsError(
    'network_error',
    'fetch',
    event,
    error instanceof Error ? error.message : 'Analytics request failed',
    { cause: error },
  );
}

function isAnalyticsError(value: unknown): value is AnalyticsError {
  return value instanceof Error && 'kind' in value && 'transport' in value && 'event' in value;
}
