# Formation Web Analytics Client

[![npm version](https://img.shields.io/npm/v/%40tryformation%2Fformation-web-analytics-client)](https://www.npmjs.com/package/@tryformation/formation-web-analytics-client)
[![CI](https://github.com/formation-res/formation-web-analytics-client/actions/workflows/ci.yml/badge.svg)](https://github.com/formation-res/formation-web-analytics-client/actions/workflows/ci.yml)

Small browser tracker with a low-surprise API close to Google Analytics. Intended to be used together with our [analytics server](https://github.com/tryformation/formation-web-analytics).

## Install

```bash
npm install @tryformation/formation-web-analytics-client
```

## Usage

```ts
import { createAnalytics } from '@tryformation/formation-web-analytics-client';

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

## Script Tag Usage

```html
<script src="/analytics.iife.js"></script>
<script>
  window.analytics.init({
    endpoint: 'https://analytics.example.com/collect',
    siteId: 'marketing-site'
  });

  window.analytics.event('signup_started');
</script>
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
- `autoPageviews` defaults to `true`; set it to `false` if you want full manual control

## Public API

- `page(payload?)`
- `event(type, payload?)`
- `identify(userId, payload?)`
- `setContext(payload)`

## Outputs

- `dist/analytics.js` for ESM
- `dist/analytics.iife.js` for script tags
- `dist/index.d.ts` for types

## Commands

- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run audit`
- `npm run verify`

## Releases

- Create and push a semver tag like `0.1.1`
- Wait until CI on `main` has completed successfully before pushing the release tag
- GitHub Actions will run tests, build, and publish to npm using npm trusted publishing via OIDC
- Configure the package's trusted publisher on npmjs.com to match `.github/workflows/publish.yml`
