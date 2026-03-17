export type EventPayload = Record<string, unknown>;

export type AnalyticsConfig = {
  endpoint: string;
  siteId: string;
  autoPageviews?: boolean;
  anonymousIdStorageKey?: string;
  sessionStorageKey?: string;
  sendBeacon?: boolean;
  debug?: boolean;
  defaultPayload?: EventPayload;
  onError?: (error: AnalyticsError) => void;
};

export type OutboundEvent = {
  type: string;
  site_id: string;
  timestamp: string;
  session_id: string;
  anonymous_id: string;
  user_id?: string | null;
  url?: string;
  path?: string;
  referrer?: string;
  title?: string;
  payload?: EventPayload;
};

export interface AnalyticsClient {
  page(payload?: EventPayload): void;
  event(type: string, payload?: EventPayload): void;
  identify(userId: string, payload?: EventPayload): void;
  setContext(payload: EventPayload): void;
}

export type TransportOptions = {
  endpoint: string;
  sendBeacon: boolean;
  debug: boolean;
};

export type AnalyticsErrorKind =
  | 'sendBeacon_rejected'
  | 'network_error'
  | 'http_error'
  | 'configuration_error';

export type AnalyticsTransport = 'sendBeacon' | 'fetch' | 'client';

export type AnalyticsError = Error & {
  kind: AnalyticsErrorKind;
  transport: AnalyticsTransport;
  event: OutboundEvent;
  status?: number;
  cause?: unknown;
};
