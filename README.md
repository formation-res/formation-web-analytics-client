# Formation Analytics Client

Small browser tracker with a low-surprise API close to Google Analytics. Intended to be used together with our [analytics server](https://github.com/formation-res/formation-web-analytics).

## Usage

```ts
import { createAnalytics } from 'formation-analytics-client';

const analytics = createAnalytics({
  endpoint: 'https://analytics.example.com/collect',
  siteId: 'marketing-site',
  onError(error) {
    console.warn('analytics delivery failed', error.kind, error.status);
  },
});

analytics.page();
analytics.event('cta_click', { label: 'hero-demo-button' });
```

## Behavior

- validates `endpoint`, `siteId`, event names, and `identify` user ids
- sends page context (`url`, `path`, `title`, `referrer`) on all events
- prefers `navigator.sendBeacon()` and falls back to `fetch`
- treats non-2xx responses and network failures as delivery errors
- reports failures through the optional `onError` hook while keeping public tracking calls best-effort

## Notes

- Keep custom event names backend-compatible: letters, digits, `_`, `.`, `:`, and `-`
- The wire format is intended to stay compatible with the collector in the sibling `formation-web-analytics` project

## Outputs

- `dist/analytics.js` for ESM
- `dist/analytics.iife.js` for script tags
- `dist/index.d.ts` for types

## Commands

- `npm run build`
- `npm run test`
