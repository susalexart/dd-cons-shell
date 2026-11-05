import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_POST_AUTH_ROUTE,
  POST_AUTH_ROUTES,
  resolvePostAuthRoute,
  safeReturnTo,
} from '../../apps/web/src/lib/post-auth.ts';

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  it('returns the original page when a safe next is supplied', () => {
    expect(resolvePostAuthRoute('consulting', '/engagements?tab=open')).toBe(
      '/engagements?tab=open',
    );
  });

  it('accepts absolute next URLs on umbrella hosts only', () => {
    vi.stubEnv('SHELL_COOKIE_DOMAIN', '.boukhatem.dev');
    expect(resolvePostAuthRoute(null, 'https://consulting.boukhatem.dev/engagements')).toBe(
      'https://consulting.boukhatem.dev/engagements',
    );
    expect(resolvePostAuthRoute(null, 'https://evil.example/steal')).toBe(DEFAULT_POST_AUTH_ROUTE);
  });

  it('rejects protocol-relative and backslash return paths', () => {
    expect(safeReturnTo('//evil.example')).toBeNull();
    expect(safeReturnTo('/\\evil.example')).toBeNull();
    expect(safeReturnTo('javascript:alert(1)')).toBeNull();
  });
});
