import { createAnalytics } from '../src';

const analytics = createAnalytics({
  endpoint: 'https://analytics.example.com/collect',
  siteId: 'app',
});

analytics.setContext({ app_version: '1.0.0' });
analytics.event('route_changed', { route_name: 'dashboard' });
