import type { NextConfig } from 'next';

const config: NextConfig = {
  // better-sqlite3 is a native binding; mark it external so Next doesn't try
  // to bundle it for server routes.
  serverExternalPackages: ['better-sqlite3', 'better-auth'],
};

export default config;
