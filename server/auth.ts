import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const COOKIE_NAME = 'studio_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const RUNTIME_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(process.cwd() + ':safiqul-studio-key').digest('hex');

export interface SessionPayload {
  username: string;
  exp: number;
}

function getExpectedCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME || 'Your Username',
    password: process.env.ADMIN_PASSWORD || 'Your Pass',
  };
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to keep timing constant
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyCredentials(
  username: string,
  password: string,
  overridePasswordHash?: string | null,
): boolean {
  const expected = getExpectedCredentials();
  const userMatches = safeEqualString(username.trim(), expected.username);

  if (overridePasswordHash) {
    const parts = overridePasswordHash.split(':');
    if (parts.length === 2) {
      const [salt, hashHex] = parts;
      const derived = crypto.scryptSync(password, salt, 64).toString('hex');
      return userMatches && safeEqualString(derived, hashHex);
    }
  }

  const passMatches = safeEqualString(password, expected.password);
  return userMatches && passMatches;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function signToken(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', RUNTIME_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): SessionPayload | null {
  const dotIndex = token.indexOf('.');
  if (dotIndex <= 0) return null;

  const encoded = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const expectedSig = crypto
    .createHmac('sha256', RUNTIME_SECRET)
    .update(encoded)
    .digest('base64url');

  if (!safeEqualString(sig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed || typeof parsed.username !== 'string' || typeof parsed.exp !== 'number') {
      return null;
    }
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) {
      out[key] = decodeURIComponent(val);
    }
  }
  return out;
}

export function getSessionFromRequest(req: Request): SessionPayload | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(req: Request, res: Response, username: string): void {
  const token = signToken({
    username,
    exp: Date.now() + SESSION_TTL_MS,
  });

  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.headers.origin?.startsWith('https://') ?? false);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: SESSION_TTL_MS,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
  });
}

export function clearSessionCookie(req: Request, res: Response): void {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.headers.origin?.startsWith('https://') ?? false);

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    path: '/',
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  (req as Request & { adminUser?: string }).adminUser = session.username;
  next();
}
