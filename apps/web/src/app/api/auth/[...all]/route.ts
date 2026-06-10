/**
 * better-auth catch-all handler.
 *
 * Mounted at /api/auth/* — this is the path dev-division and consulting-agency
 * will hit (server-to-server) in P27 to verify the shell-issued session via
 * /api/auth/get-session.
 */
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '../../../../lib/auth';

export const { GET, POST } = toNextJsHandler(auth.handler);
