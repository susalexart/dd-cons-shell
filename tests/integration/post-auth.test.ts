import { describe, expect, it } from 'vitest';
import {
  DEFAULT_POST_AUTH_ROUTE,
  POST_AUTH_ROUTES,
  resolvePostAuthRoute,
} from '../../apps/web/src/lib/post-auth.ts';

describe('resolvePostAuthRoute', () => {
  it('maps known dests to their dashboards', () => {
    expect(resolvePostAuthRoute('dev-division')).toBe('/dev-division/dashboard');
    expect(resolvePostAuthRoute('consulting')).toBe('/consulting/dashboard');
  });

  it('defaults to the dev-division dashboard, never "/"', () => {
    expect(DEFAULT_POST_AUTH_ROUTE).toBe('/dev-division/dashboard');
    expect(resolvePostAuthRoute(null)).toBe(DEFAULT_POST_AUTH_ROUTE);
    expect(resolvePostAuthRoute(undefined)).toBe(DEFAULT_POST_AUTH_ROUTE);
    expect(resolvePostAuthRoute('')).toBe(DEFAULT_POST_AUTH_ROUTE);
  });

  it('falls back for unknown or prototype-polluting dests', () => {
    expect(resolvePostAuthRoute('nope')).toBe(DEFAULT_POST_AUTH_ROUTE);
    expect(resolvePostAuthRoute('constructor')).toBe(DEFAULT_POST_AUTH_ROUTE);
    expect(resolvePostAuthRoute('__proto__')).toBe(DEFAULT_POST_AUTH_ROUTE);
  });

  it('every table entry resolves to itself (table and resolver stay in sync)', () => {
    for (const [dest, route] of Object.entries(POST_AUTH_ROUTES)) {
      expect(resolvePostAuthRoute(dest)).toBe(route);
    }
  });
});
