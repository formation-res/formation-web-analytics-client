import type { OutboundEvent, TransportOptions } from './types';

export async function sendEvent(
  event: OutboundEvent,
  options: TransportOptions,
): Promise<void> {
  const body = JSON.stringify(event);

  if (
    options.sendBeacon &&
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
  });
  debugLog(options, 'fetch', event);
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
