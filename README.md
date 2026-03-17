# Formation Analytics Client

Small browser tracker with a low-surprise API close to Google Analytics. Intended to be used together with our [analytics server](https://github.com/formation-res/formation-web-analytics).

## Usage

```ts
import { createAnalytics } from 'formation-analytics-client';

const analytics = createAnalytics({
  endpoint: 'https://analytics.example.com/collect',
  siteId: 'marketing-site',
});

analytics.page();
analytics.event('cta_click', { label: 'hero-demo-button' });
```

## Outputs

- `dist/analytics.js` for ESM
- `dist/analytics.iife.js` for script tags
- `dist/index.d.ts` for types

## Commands

- `npm run build`
- `npm run test`
