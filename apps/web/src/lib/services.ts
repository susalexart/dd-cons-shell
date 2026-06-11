/**
 * Admin-only operational service links shown on the launcher per product.
 *
 * Langfuse / Forgejo / Dokploy have their own public vhosts (and their own
 * logins) under `*.dev-division.<DEPLOY_DOMAIN>`. Mastra Studio has NO public
 * vhost — it is only reachable through the in-app admin-gated proxies, so its
 * link points at the product dashboard hub where those proxies live.
 */
import type { ProductId } from './entitlements';

export interface ServiceLink {
  label: string;
  href: string;
  external: boolean;
  note?: string;
}

function deployDomain(): string | null {
  const d = (process.env.DEPLOY_DOMAIN ?? '').trim();
  return d.length > 0 ? d : null;
}

export function serviceLinks(product: ProductId): ServiceLink[] {
  const domain = deployDomain();
  if (product === 'dev-division') {
    const links: ServiceLink[] = [];
    if (domain) {
      links.push(
        { label: 'Langfuse', href: `https://langfuse.dev-division.${domain}`, external: true, note: 'LLM observability' },
        { label: 'Forgejo', href: `https://forgejo.dev-division.${domain}`, external: true, note: 'Git hosting' },
        { label: 'Dokploy', href: `https://dokploy.dev-division.${domain}`, external: true, note: 'Deployments' },
      );
    }
    links.push({
      label: 'Mastra Studio',
      href: '/dev-division/dashboard',
      external: false,
      note: 'Per-project, inside the dashboard',
    });
    return links;
  }
  // consulting
  const links: ServiceLink[] = [];
  links.push({
    label: 'Mastra Studio',
    href: '/consulting/dashboard',
    external: false,
    note: 'Per-engagement, inside the dashboard',
  });
  if (domain) {
    links.push({
      label: 'Langfuse',
      href: `https://langfuse.dev-division.${domain}`,
      external: true,
      note: 'Shared observability',
    });
  }
  return links;
}
