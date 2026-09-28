import type { TimelineData } from './timeline';

// ── Storage Keys ─────────────────────────────────────────────────────
const USERS_KEY = 'tl_local_users';
const ACTIVE_LOCAL_USER_KEY = 'tl_local_active_user';
const LOCAL_TOKEN_MAP_KEY = 'tl_local_token_map'; // token → owner username

// ── Types ─────────────────────────────────────────────────────────────
export interface LocalUser {
  username: string;
  hashedPassword: string;
  createdAt: string;
  shareToken: string; // e.g. "LOKAL-AB12-XY34" — shareable join token
}

export interface LocalUserSession {
  username: string;
  loggedInAt: string;
}

// ── Token Generation ──────────────────────────────────────────────────

/**
 * Generates a random share token in the format LOKAL-XXXX-XXXX.
 * Uses uppercase letters + digits, excluding ambiguous chars (0/O, 1/I/L).
 */
export function generateLocalShareToken(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `LOKAL-${seg()}-${seg()}`;
}

/** Returns the full token → username map from localStorage. */
function getTokenMap(): Record<string, string> {
  const raw = localStorage.getItem(LOCAL_TOKEN_MAP_KEY);
  return raw ? JSON.parse(raw) : {};
}

/** Saves the token → username map to localStorage. */
function saveTokenMap(map: Record<string, string>): void {
  localStorage.setItem(LOCAL_TOKEN_MAP_KEY, JSON.stringify(map));
}

// ── Pure JS SHA-256 (works in Capacitor WebView without secure context) ─
// Cached constants — computed once, reused across calls
let _sha256InitH: number[] = [];  // Initial hash values (8 values from sqrt of first 8 primes)
let _sha256K: number[] = [];      // Round constants (64 values from cbrt of first 64 primes)

function sha256(str: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i, j;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = str.length * 8;

  // Lazily initialize constants on first call only
  if (_sha256K.length < 64) {
    const isComposite: Record<number, boolean> = {};
    let primeCounter = 0;
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let ii = 0; ii < 313; ii += candidate) {
          isComposite[ii] = true;
        }
        // First 8 primes → initial H values (fractional parts of sqrt)
        if (primeCounter < 8) {
          _sha256InitH[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        }
        // 64 primes → round constants K (fractional parts of cbrt)
        _sha256K[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
  }

  // ⚠️ Fresh copy of initial H values each call — never reuse previous hash output
  let hash = _sha256InitH.slice();
  const k = _sha256K;

  str += '\x80';
  while (str.length % 64 - 56) str += '\x00';
  for (i = 0; i < str.length; i++) {
    j = str.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.length = 8;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  // Encode result — _sha256InitH is NOT overwritten here (bug fix)
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Hash a password using SHA-256.
 * Prefers Web Crypto API (needs secure context), falls back to
 * pure-JS implementation for Capacitor WebViews without HTTPS.
 */
async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fall through to pure JS implementation below
  }
  return sha256(password);
}

// ── Helper: get timeline key per-user ────────────────────────────────
function timelineKey(username: string): string {
  return `tl_moments_${username.toLowerCase()}`;
}

// ── User Management ───────────────────────────────────────────────────

/**
 * Returns all registered local users on this device
 */
function getLocalUsers(): LocalUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? (JSON.parse(raw) as LocalUser[]) : [];
}

/**
 * Creates a new local user account (username + password).
 * Throws if the username is already taken on this device.
 */
export async function createLocalUser(username: string, password: string): Promise<LocalUserSession & { shareToken: string }> {
  const users = getLocalUsers();
  const normalizedUsername = username.trim().toLowerCase();

  if (users.find(u => u.username === normalizedUsername)) {
    throw new Error(`Username "${username}" sudah digunakan di perangkat ini.`);
  }

  const hashedPassword = await hashPassword(password);

  // Generate a unique share token — retry on collision (extremely rare)
  const tokenMap = getTokenMap();
  let shareToken = generateLocalShareToken();
  while (tokenMap[shareToken]) shareToken = generateLocalShareToken();

  const newUser: LocalUser = {
    username: normalizedUsername,
    hashedPassword,
    createdAt: new Date().toISOString(),
    shareToken,
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Register token → username in global map
  tokenMap[shareToken] = normalizedUsername;
  saveTokenMap(tokenMap);

  const session: LocalUserSession = {
    username: normalizedUsername,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(session));

  return { ...session, shareToken };
}

/**
 * Verifies credentials and returns a local session.
 * Throws if username not found or password incorrect.
 */
export async function loginLocalUser(username: string, password: string): Promise<LocalUserSession & { shareToken: string }> {
  const users = getLocalUsers();
  const normalizedUsername = username.trim().toLowerCase();
  const user = users.find(u => u.username === normalizedUsername);

  if (!user) {
    throw new Error(`Username "${username}" tidak ditemukan di perangkat ini.`);
  }

  const hashedPassword = await hashPassword(password);
  if (user.hashedPassword !== hashedPassword) {
    throw new Error('Password salah. Coba lagi.');
  }

  // Migration: give old accounts a token if they don't have one yet
  if (!user.shareToken) {
    const tokenMap = getTokenMap();
    let token = generateLocalShareToken();
    while (tokenMap[token]) token = generateLocalShareToken();
    user.shareToken = token;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    tokenMap[token] = normalizedUsername;
    saveTokenMap(tokenMap);
  }

  const session: LocalUserSession = {
    username: normalizedUsername,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(session));

  return { ...session, shareToken: user.shareToken };
}

/**
 * Returns the currently active local user session, if any.
 */
export function getActiveLocalSession(): LocalUserSession | null {
  const raw = localStorage.getItem(ACTIVE_LOCAL_USER_KEY);
  return raw ? (JSON.parse(raw) as LocalUserSession) : null;
}

/**
 * Joins an existing local timeline by its share token.
 * Resolves the token to the owner's username and creates a session
 * pointing to that user's timeline data.
 *
 * Returns { ownerUsername, shareToken } on success.
 * Throws if the token is not registered on this device.
 */
export function joinByLocalToken(token: string): { ownerUsername: string; shareToken: string } {
  const normalizedToken = token.trim().toUpperCase();
  const tokenMap = getTokenMap();
  const ownerUsername = tokenMap[normalizedToken];

  if (!ownerUsername) {
    throw new Error(
      'Token lokal tidak ditemukan di perangkat ini. '
      + 'Token hanya berlaku di HP yang sama tempat akun dibuat.'
    );
  }

  // Start a session pointing to the owner's timeline
  const session: LocalUserSession = {
    username: ownerUsername,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(session));

  return { ownerUsername, shareToken: normalizedToken };
}

/**
 * Returns the share token for the currently active local user.
 * Returns null if no session or user has no token yet.
 */
export function getActiveLocalShareToken(): string | null {
  const session = getActiveLocalSession();
  if (!session) return null;
  const users = getLocalUsers();
  const user = users.find(u => u.username === session.username);
  return user?.shareToken ?? null;
}

/**
 * Clears the active local session (logout).
 */
export function logoutLocalUser(): void {
  localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
}

// ── Local Timeline CRUD ───────────────────────────────────────────────

/**
 * Returns all timeline moments stored locally for a given username.
 */
export function getLocalTimeline(username: string): TimelineData[] {
  const raw = localStorage.getItem(timelineKey(username));
  return raw ? (JSON.parse(raw) as TimelineData[]) : [];
}

/**
 * Saves the entire timeline array for a given username.
 */
function saveLocalTimeline(username: string, data: TimelineData[]): void {
  localStorage.setItem(timelineKey(username), JSON.stringify(data));
}

/**
 * Adds a new moment entry to the local timeline of a specific user.
 * Auto-generates a unique local ID unless a cloud UUID is provided.
 */
export function addLocalMoment(username: string, moment: TimelineData): TimelineData {
  const timeline = getLocalTimeline(username);
  const newMoment: TimelineData = {
    ...moment,
    id: (moment.id && !moment.id.toString().startsWith('local_')) ? moment.id : `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  };
  timeline.push(newMoment);
  saveLocalTimeline(username, timeline);
  return newMoment;
}

/**
 * Updates an existing local moment by ID with partial data.
 */
export function updateLocalMoment(username: string, momentId: string, updates: Partial<TimelineData>): void {
  const timeline = getLocalTimeline(username);
  const index = timeline.findIndex(m => m.id === momentId);
  if (index !== -1) {
    timeline[index] = { ...timeline[index], ...updates, id: momentId };
    saveLocalTimeline(username, timeline);
  }
}

/**
 * Deletes a moment by ID from the local timeline.
 */
export function deleteLocalMoment(username: string, momentId: string): void {
  const timeline = getLocalTimeline(username).filter(m => m.id !== momentId);
  saveLocalTimeline(username, timeline);
}

/**
 * Clears all moment data for a user (use with caution).
 */
export function clearLocalTimeline(username: string): void {
  localStorage.removeItem(timelineKey(username));
}
