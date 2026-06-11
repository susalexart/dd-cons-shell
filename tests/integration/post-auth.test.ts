import { describe, expect, it } from 'vitest';
import {
  DEFAULT_POST_AUTH_ROUTE,
  POST_AUTH_ROUTES,
  resolvePostAuthRoute,
} from '../../apps/web/src/lib/post-auth.ts';

describe('resolvePostAuthRoute', () => {
  it('always lands on the launcher, carrying known dests as a query param', () => {
    expect(resolvePostAuthRoute('dev-division')).toBe('/launch?dest=dev-division');
    expect(resolvePostAuthRoute('consulting')).toBe('/launch?dest=consulting');
  });

  it('defaults to the launcher, never "/"', () => {
    expect(DEFAULT_POST_AUTH_ROUTE).toBe('/launch');
    expect(resolvePostAuthRoute(null)).toBe(DEFAULT_POST_AUTH_ROUTE);
    expect(resolvePostAuthRoute(undefined)).toBe(DEFAULT_POST_AUTH_ROUTE);
    expect(resolvePostAuthRoute('')).toBe(DEFAULT_POST_AUTH_ROUTE);
  });

  it('falls back for unknown or prototype-polluting dests', () => {
    expect(resolvePostAuthRoute('nope')).toBe(DEFAULT_POST_AUTH_ROUTE);
    expect(resolvePostAuthRoute('constructor')).toBe(DEFAULT_POST_AUTH_ROUTE);
    expect(resolvePostAuthRoute('__proto__')).toBe(DEFAULT_POST_AUTH_ROUTE);
  });

  it('the dashboard table still maps every product (launcher cards consume it)', () => {
    expect(POST_AUTH_ROUTES['dev-division']).toBe('/dev-division/dashboard');
    expect(POST_AUTH_ROUTES.consulting).toBe('/consulting/dashboard');
  });
});
