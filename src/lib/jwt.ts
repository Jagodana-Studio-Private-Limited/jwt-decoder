// ── Base64URL helpers ──────────────────────────────────────────────────

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

export function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlEncodeString(str: string): string {
  return base64UrlEncode(new TextEncoder().encode(str));
}

// ── Timestamp helpers ──────────────────────────────────────────────────

/** Convert a Unix timestamp (seconds) to a human-readable local date string. */
export function formatUnixTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString();
}

/** Return true if the Unix timestamp is in the past. */
export function isTimestampExpired(unixSeconds: number): boolean {
  return unixSeconds < Math.floor(Date.now() / 1000);
}

// ── JWT types ──────────────────────────────────────────────────────────

export interface JWTHeader {
  alg: string;
  typ?: string;
  [key: string]: unknown;
}

export interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface DecodedJWT {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  /** Raw Base64URL parts of the original token. */
  raw: { header: string; payload: string; signature: string };
  /** True if the token is structurally well-formed (3 valid Base64URL parts). */
  isValid: boolean;
  /** True = expired, false = not expired, null = no `exp` claim present. */
  isExpired: boolean | null;
}

export interface TokenStatus {
  isExpired: boolean | null;
  expiresAt: Date | null;
  issuedAt: Date | null;
  notBefore: Date | null;
  /** Human-readable string like "Expires in 2d 3h" or "Expired 5m ago". */
  timeUntilExpiry: string | null;
}

// ── Core decode function ───────────────────────────────────────────────

/**
 * Decode a JWT string into its constituent parts.
 * Returns `null` if the token is not a valid 3-part JWT.
 */
export function decodeJWT(token: string): DecodedJWT | null {
  const trimmed = token.trim().replace(/^Bearer\s+/i, "");
  const parts = trimmed.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0])) as JWTHeader;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JWTPayload;
    const now = Math.floor(Date.now() / 1000);
    const isExpired =
      typeof payload.exp === "number" ? payload.exp < now : null;
    return {
      header,
      payload,
      signature: parts[2],
      raw: { header: parts[0], payload: parts[1], signature: parts[2] },
      isValid: true,
      isExpired,
    };
  } catch {
    return null;
  }
}

// ── Token status helper ────────────────────────────────────────────────

/** Derive expiration / issuance metadata from a decoded payload. */
export function getTokenStatus(payload: JWTPayload): TokenStatus {
  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === "number" ? payload.exp : null;
  const iat = typeof payload.iat === "number" ? payload.iat : null;
  const nbf = typeof payload.nbf === "number" ? payload.nbf : null;

  let timeUntilExpiry: string | null = null;
  if (exp !== null) {
    const diff = exp - now;
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / 86400);
    const hours = Math.floor((absDiff % 86400) / 3600);
    const minutes = Math.floor((absDiff % 3600) / 60);
    const seconds = absDiff % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0) parts.push(`${seconds}s`);
    timeUntilExpiry =
      diff > 0
        ? `Expires in ${parts.join(" ")}`
        : `Expired ${parts.join(" ")} ago`;
  }

  return {
    isExpired: exp !== null ? exp < now : null,
    expiresAt: exp !== null ? new Date(exp * 1000) : null,
    issuedAt: iat !== null ? new Date(iat * 1000) : null,
    notBefore: nbf !== null ? new Date(nbf * 1000) : null,
    timeUntilExpiry,
  };
}

// ── Claim labels ───────────────────────────────────────────────────────

/** Human-readable labels for registered JWT claim names. */
export const CLAIM_LABELS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expiration Time",
  nbf: "Not Before",
  iat: "Issued At",
  jti: "JWT ID",
  name: "Name",
  email: "Email",
  role: "Role",
  roles: "Roles",
  scope: "Scope",
  azp: "Authorized Party",
  nonce: "Nonce",
  at_hash: "Access Token Hash",
  c_hash: "Code Hash",
  auth_time: "Authentication Time",
  acr: "Auth Context Class Ref",
  amr: "Auth Methods Ref",
  typ: "Token Type",
};

/** Claim keys that hold Unix timestamps and should be formatted as dates. */
export const TIMESTAMP_CLAIMS = new Set(["exp", "iat", "nbf", "auth_time"]);
