/**
 * Admin-only operational service links shown on the launcher per product.
 *
 * Langfuse / Forgejo / Dokploy live behind explicit public URLs configured
 * per deploy (LANGFUSE_PUBLIC_URL etc. — e.g. https://dd-langfuse.<domain>);
 * a link only renders when its env is set, so the launcher never shows dead
 * links. Mastra Studio has NO public vhost — it is only reachable through
 * the in-app admin-gated proxies, so its link points at the product
 * dashboard hub where those proxies live.
 */
import type { ProductId } from './entitlements';

export interface ServiceLink {
  label: string;
  href: string;
  external: boolean;
  note?: string;
}

function publicUrl(envName: string): string | null {
  const v = (process.env[envName] ?? '').trim().replace(/\/+$/, '');
  return v.length > 0 ? v : null;
}

export function serviceLinks(product: ProductId): ServiceLink[] {
  const langfuse = publicUrl('LANGFUSE_PUBLIC_URL');
  const forgejo = publicUrl('FORGEJO_PUBLIC_URL');
  const dokploy = publicUrl('DOKPLOY_PUBLIC_URL');

  if (product === 'dev-division') {
    const links: ServiceLink[] = [];
    if (langfuse) links.push({ label: 'Langfuse', href: langfuse, external: true, note: 'LLM observability' });
    if (forgejo) links.push({ label: 'Forgejo', href: forgejo, external: true, note: 'Git hosting' });
    if (dokploy) links.push({ label: 'Dokploy', href: dokploy, external: true, note: 'Deployments' });
    links.push({
      label: 'Mastra Studio',
      href: '/dev-division/dashboard',
      external: false,
      note: 'Per-project, inside the dashboard',
    });
    return links;
  }

  // consulting
  const links: ServiceLink[] = [
    {
      label: 'Mastra Studio',
      href: '/consulting/dashboard',
      external: false,
      note: 'Per-engagement, inside the dashboard',
    },
  ];
  if (langfuse) {
    links.push({ label: 'Langfuse', href: langfuse, external: true, note: 'Shared observability' });
  }
  return links;
}
