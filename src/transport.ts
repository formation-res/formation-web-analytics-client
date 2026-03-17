import type {
  AnalyticsError,
  AnalyticsErrorKind,
  AnalyticsTransport,
  OutboundEvent,
  TransportOptions,
} from './types';

export async function sendEvent(
  event: OutboundEvent,
  options: TransportOptions,
): Promise<void> {
  const body = JSON.stringify(event);

  if (
    shouldUseSendBeacon(options) &&
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function'
  ) {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(options.endpoint, blob)) {
      debugLog(options, 'sendBeacon', event);
      return;
    }
  }

  if (typeof fetch !== 'function') {
    throw new Error('fetch is not available in this environment');
  }

  await fetch(options.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
    mode: 'cors',
  })
    .then((response) => {
      if (!response.ok) {
        throw createAnalyticsError(
          'http_error',
          'fetch',
          event,
          `Analytics request failed with status ${response.status}`,
          { status: response.status },
        );
      }
    })
    .catch((error: unknown) => {
      if (isAnalyticsError(error)) {
        throw error;
      }
      throw createAnalyticsError(
        'network_error',
        'fetch',
        event,
        'Analytics request failed',
        { cause: error },
      );
    });
  debugLog(options, 'fetch', event);
}

function shouldUseSendBeacon(options: TransportOptions): boolean {
  if (!options.sendBeacon) {
    return false;
  }

  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return new URL(options.endpoint).origin === window.location.origin;
  } catch {
    return true;
  }
}

function debugLog(
  options: TransportOptions,
  transport: 'sendBeacon' | 'fetch',
  event: OutboundEvent,
) {
  if (!options.debug || typeof console === 'undefined') {
    return;
  }
  console.debug(`[formation-analytics] sent via ${transport}`, event);
}

function createAnalyticsError(
  kind: AnalyticsErrorKind,
  transport: AnalyticsTransport,
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

function isAnalyticsError(value: unknown): value is AnalyticsError {
  return value instanceof Error && 'kind' in value && 'transport' in value && 'event' in value;
}
