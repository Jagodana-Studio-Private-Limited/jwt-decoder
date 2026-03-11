"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldX,
  ClipboardPaste,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToolEvents } from "@/lib/analytics";

// ── Base64URL helpers ──────────────────────────────────────────────────

function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeString(str: string): string {
  return base64UrlEncode(new TextEncoder().encode(str));
}

function base64UrlDecode(str: string): string {
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

// ── HMAC Signing (Web Crypto API) ──────────────────────────────────────

const HASH_MAP: Record<string, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

async function signHMAC(
  algorithm: string,
  secret: string,
  data: string
): Promise<string> {
  const hash = HASH_MAP[algorithm];
  if (!hash) return "";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  return base64UrlEncode(new Uint8Array(signature));
}

async function verifyHMAC(
  algorithm: string,
  secret: string,
  data: string,
  signature: string
): Promise<boolean> {
  const hash = HASH_MAP[algorithm];
  if (!hash) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash },
    false,
    ["verify"]
  );

  // Decode the base64url signature
  let base64 = signature.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  const binary = atob(base64);
  const sigBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    sigBytes[i] = binary.charCodeAt(i);
  }

  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
}

// ── JWT decode ─────────────────────────────────────────────────────────

interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

function decodeJWT(token: string): DecodedJWT | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return {
      header,
      payload,
      signature: parts[2],
      raw: { header: parts[0], payload: parts[1], signature: parts[2] },
    };
  } catch {
    return null;
  }
}

// ── Token status ───────────────────────────────────────────────────────

interface TokenStatus {
  isExpired: boolean | null;
  expiresAt: Date | null;
  issuedAt: Date | null;
  notBefore: Date | null;
  timeUntilExpiry: string | null;
}

function getTokenStatus(payload: Record<string, unknown>): TokenStatus {
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

const CLAIM_LABELS: Record<string, string> = {
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

// ── Constants ──────────────────────────────────────────────────────────

const DEFAULT_HEADER = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2);
const DEFAULT_PAYLOAD = JSON.stringify(
  {
    sub: "1234567890",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    iat: 1741600000,
    exp: 1773136000,
    iss: "https://auth.example.com",
    aud: "https://api.example.com",
  },
  null,
  2
);
const DEFAULT_SECRET = "your-256-bit-secret";

const ALGORITHMS = ["HS256", "HS384", "HS512"] as const;

// ── Copy button ────────────────────────────────────────────────────────

function CopyButton({
  text,
  label,
  className = "",
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied`);
    ToolEvents.resultCopied();
    setTimeout(() => setCopied(false), 2000);
  }, [text, label]);

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${className}`}
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function JWTEncoderDecoderTool() {
  // State
  const [headerText, setHeaderText] = useState(DEFAULT_HEADER);
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState(DEFAULT_SECRET);
  const [encodedJwt, setEncodedJwt] = useState("");
  const [algorithm, setAlgorithm] = useState<string>("HS256");
  const [signatureVerified, setSignatureVerified] = useState<
    boolean | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [isBase64Secret, setIsBase64Secret] = useState(false);

  // Track which side triggered the update to prevent loops
  const updateSource = useRef<"encode" | "decode" | null>(null);

  // ── Encode: header + payload + secret → JWT ───────────────────────

  const encodeJWT = useCallback(
    async (
      hText: string,
      pText: string,
      sec: string,
      alg: string
    ): Promise<string | null> => {
      try {
        const header = JSON.parse(hText);
        const payload = JSON.parse(pText);

        // Ensure algorithm matches
        header.alg = alg;
        const headerB64 = base64UrlEncodeString(JSON.stringify(header));
        const payloadB64 = base64UrlEncodeString(JSON.stringify(payload));
        const signingInput = `${headerB64}.${payloadB64}`;

        const actualSecret = isBase64Secret
          ? atob(sec.replace(/-/g, "+").replace(/_/g, "/"))
          : sec;
        const signature = await signHMAC(alg, actualSecret, signingInput);

        if (!signature) return null;
        return `${signingInput}.${signature}`;
      } catch {
        return null;
      }
    },
    [isBase64Secret]
  );

  // ── Decode: JWT string → header + payload ─────────────────────────

  const decodeFromJWT = useCallback(
    async (jwt: string) => {
      const decoded = decodeJWT(jwt);
      if (!decoded) {
        setError(
          "Invalid JWT format. A JWT has three Base64-encoded parts separated by dots."
        );
        setTokenStatus(null);
        setSignatureVerified(null);
        return;
      }

      setError(null);
      setHeaderText(JSON.stringify(decoded.header, null, 2));
      setPayloadText(JSON.stringify(decoded.payload, null, 2));
      setTokenStatus(getTokenStatus(decoded.payload));

      // Extract algorithm
      const alg = String(decoded.header.alg || "HS256");
      if (ALGORITHMS.includes(alg as (typeof ALGORITHMS)[number])) {
        setAlgorithm(alg);
      }

      // Verify signature if we have a secret
      if (secret && HASH_MAP[alg]) {
        try {
          const actualSecret = isBase64Secret
            ? atob(secret.replace(/-/g, "+").replace(/_/g, "/"))
            : secret;
          const verified = await verifyHMAC(
            alg,
            actualSecret,
            `${decoded.raw.header}.${decoded.raw.payload}`,
            decoded.signature
          );
          setSignatureVerified(verified);
        } catch {
          setSignatureVerified(false);
        }
      } else {
        setSignatureVerified(null);
      }

      ToolEvents.toolUsed("decode");
    },
    [secret, isBase64Secret]
  );

  // ── Effect: re-encode when right panel changes ────────────────────

  useEffect(() => {
    if (updateSource.current === "decode") {
      updateSource.current = null;
      return;
    }
    updateSource.current = "encode";

    const timer = setTimeout(async () => {
      try {
        JSON.parse(headerText);
        JSON.parse(payloadText);
      } catch {
        // Invalid JSON, don't encode
        return;
      }

      const jwt = await encodeJWT(headerText, payloadText, secret, algorithm);
      if (jwt) {
        setEncodedJwt(jwt);
        setSignatureVerified(true);
        setError(null);

        try {
          const payload = JSON.parse(payloadText);
          setTokenStatus(getTokenStatus(payload));
        } catch {
          // ignore
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [headerText, payloadText, secret, algorithm, encodeJWT]);

  // ── Generate initial JWT on mount ─────────────────────────────────

  useEffect(() => {
    (async () => {
      const jwt = await encodeJWT(
        DEFAULT_HEADER,
        DEFAULT_PAYLOAD,
        DEFAULT_SECRET,
        "HS256"
      );
      if (jwt) {
        setEncodedJwt(jwt);
        setSignatureVerified(true);
        try {
          setTokenStatus(getTokenStatus(JSON.parse(DEFAULT_PAYLOAD)));
        } catch {
          // ignore
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleEncodedChange = useCallback(
    (value: string) => {
      setEncodedJwt(value);
      if (!value.trim()) {
        setHeaderText(DEFAULT_HEADER);
        setPayloadText(DEFAULT_PAYLOAD);
        setError(null);
        setTokenStatus(null);
        setSignatureVerified(null);
        return;
      }
      updateSource.current = "decode";
      const cleaned = value.trim().replace(/^Bearer\s+/i, "");
      decodeFromJWT(cleaned);
    },
    [decodeFromJWT]
  );

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleEncodedChange(text);
      toast.success("Pasted from clipboard");
    } catch {
      toast.error("Could not read clipboard");
    }
  }, [handleEncodedChange]);

  const handleClear = useCallback(() => {
    setEncodedJwt("");
    setHeaderText(DEFAULT_HEADER);
    setPayloadText(DEFAULT_PAYLOAD);
    setSecret(DEFAULT_SECRET);
    setAlgorithm("HS256");
    setError(null);
    setTokenStatus(null);
    setSignatureVerified(null);
  }, []);

  // ── Color-code JWT parts in the encoded textarea ──────────────────

  const jwtParts = encodedJwt.split(".");
  const hasThreeParts = jwtParts.length === 3;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Token Status Banner */}
      <AnimatePresence>
        {tokenStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 p-4 rounded-xl border ${
              tokenStatus.isExpired === null
                ? "border-border/50 bg-muted/30"
                : tokenStatus.isExpired
                ? "border-destructive/30 bg-destructive/5"
                : "border-emerald-500/30 bg-emerald-500/5"
            }`}
          >
            {tokenStatus.isExpired === null ? (
              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
            ) : tokenStatus.isExpired ? (
              <ShieldX className="h-5 w-5 text-destructive shrink-0" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  tokenStatus.isExpired === null
                    ? "text-muted-foreground"
                    : tokenStatus.isExpired
                    ? "text-destructive"
                    : "text-emerald-500"
                }`}
              >
                {tokenStatus.isExpired === null
                  ? "No expiration claim (exp) found"
                  : tokenStatus.isExpired
                  ? "Token is expired"
                  : "Token is valid"}
              </p>
              {tokenStatus.timeUntilExpiry && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tokenStatus.timeUntilExpiry}
                  {tokenStatus.expiresAt && (
                    <> — {tokenStatus.expiresAt.toLocaleString()}</>
                  )}
                </p>
              )}
            </div>
            <div className="text-right text-xs text-muted-foreground space-y-0.5 shrink-0">
              {tokenStatus.issuedAt && (
                <p>Issued: {tokenStatus.issuedAt.toLocaleString()}</p>
              )}
              {tokenStatus.notBefore && (
                <p>Not before: {tokenStatus.notBefore.toLocaleString()}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5"
          >
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-panel layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── LEFT: Encoded ─── */}
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">
              Encoded
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePaste}
                className="h-7 text-xs gap-1.5"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                Paste
              </Button>
              <CopyButton
                text={encodedJwt}
                label="JWT"
                className="text-muted-foreground hover:text-foreground"
              />
              {encodedJwt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Color-coded display + editable textarea */}
          <div className="relative flex-1 min-h-[400px]">
            {/* Color overlay (non-interactive) */}
            <div
              className="absolute inset-0 p-4 pointer-events-none font-mono text-sm leading-relaxed break-all whitespace-pre-wrap"
              aria-hidden="true"
            >
              {hasThreeParts ? (
                <>
                  <span className="text-[#fb015b]">{jwtParts[0]}</span>
                  <span className="text-foreground/30">.</span>
                  <span className="text-[#d63aff]">{jwtParts[1]}</span>
                  <span className="text-foreground/30">.</span>
                  <span className="text-[#00b9f1]">{jwtParts[2]}</span>
                </>
              ) : (
                <span className="text-foreground">{encodedJwt}</span>
              )}
            </div>
            {/* Transparent editable textarea */}
            <textarea
              value={encodedJwt}
              onChange={(e) => handleEncodedChange(e.target.value)}
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-foreground font-mono text-sm leading-relaxed resize-none focus:outline-none break-all"
              spellCheck={false}
              placeholder="Paste a JWT token here..."
            />
          </div>

          {/* Signature status bar */}
          <div
            className={`px-4 py-2.5 border-t text-xs font-medium flex items-center gap-2 ${
              signatureVerified === true
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                : signatureVerified === false
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-border/50 bg-muted/20 text-muted-foreground"
            }`}
          >
            {signatureVerified === true ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                Signature Verified
              </>
            ) : signatureVerified === false ? (
              <>
                <ShieldX className="h-4 w-4" />
                Invalid Signature
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Enter secret to verify signature
              </>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Decoded ─── */}
        <div className="space-y-4">
          {/* Header */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#fb015b]/20 bg-[#fb015b]/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#fb015b]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#fb015b]">
                  Header
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Algorithm selector */}
                <select
                  value={algorithm}
                  onChange={(e) => {
                    const alg = e.target.value;
                    setAlgorithm(alg);
                    // Also update header text
                    try {
                      const h = JSON.parse(headerText);
                      h.alg = alg;
                      setHeaderText(JSON.stringify(h, null, 2));
                    } catch {
                      // ignore
                    }
                  }}
                  className="h-6 text-xs bg-muted/50 border border-border/50 rounded px-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-[#fb015b]/50"
                >
                  {ALGORITHMS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <CopyButton
                  text={headerText}
                  label="Header"
                  className="text-muted-foreground hover:text-foreground"
                />
              </div>
            </div>
            <textarea
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className="w-full p-4 bg-transparent text-sm font-mono resize-none focus:outline-none text-foreground min-h-[100px]"
              spellCheck={false}
              rows={4}
            />
          </div>

          {/* Payload */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#d63aff]/20 bg-[#d63aff]/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#d63aff]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#d63aff]">
                  Payload
                </h3>
              </div>
              <CopyButton
                text={payloadText}
                label="Payload"
                className="text-muted-foreground hover:text-foreground"
              />
            </div>
            <div className="relative">
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="w-full p-4 bg-transparent text-sm font-mono resize-none focus:outline-none text-foreground min-h-[200px]"
                spellCheck={false}
                rows={10}
              />
              {/* Claim labels overlay */}
              {(() => {
                try {
                  const payload = JSON.parse(payloadText);
                  const claimInfo = Object.entries(payload)
                    .filter(([key]) => CLAIM_LABELS[key])
                    .map(([key]) => ({
                      key,
                      label: CLAIM_LABELS[key],
                    }));
                  if (claimInfo.length === 0) return null;
                  return (
                    <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                      {claimInfo.map(({ key, label }) => {
                        const isTimestamp = ["exp", "iat", "nbf", "auth_time"].includes(key);
                        const value = payload[key];
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border/30 text-[10px] text-muted-foreground"
                          >
                            <span className="font-semibold text-[#d63aff]/70">
                              {key}
                            </span>
                            <span>= {label}</span>
                            {isTimestamp && typeof value === "number" && (
                              <span className="text-muted-foreground/60">
                                ({new Date(value * 1000).toUTCString()})
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>

          {/* Verify Signature */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#00b9f1]/20 bg-[#00b9f1]/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00b9f1]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#00b9f1]">
                  Verify Signature
                </h3>
              </div>
              {signatureVerified !== null && (
                <span
                  className={`text-xs font-medium ${
                    signatureVerified
                      ? "text-emerald-500"
                      : "text-destructive"
                  }`}
                >
                  {signatureVerified ? "✓ Valid" : "✗ Invalid"}
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              {/* Signature formula */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <pre className="text-xs font-mono text-muted-foreground leading-relaxed overflow-x-auto">
                  <span className="text-[#00b9f1]">
                    HMAC{algorithm.slice(2)}
                  </span>
                  {"(\n  "}
                  <span className="text-[#fb015b]">
                    base64UrlEncode(header)
                  </span>
                  {' + "." +\n  '}
                  <span className="text-[#d63aff]">
                    base64UrlEncode(payload)
                  </span>
                  {",\n  "}
                  <span className="text-foreground">secret</span>
                  {"\n)"}
                </pre>
              </div>

              {/* Secret input */}
              <div className="relative">
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter your secret key..."
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00b9f1]/30 focus:border-[#00b9f1]/50 text-foreground placeholder:text-muted-foreground/40"
                  spellCheck={false}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {secret ? (
                    <Unlock className="h-4 w-4 text-muted-foreground/40" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
              </div>

              {/* Base64 encoded toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBase64Secret}
                  onChange={(e) => setIsBase64Secret(e.target.checked)}
                  className="rounded border-border accent-[#00b9f1]"
                />
                <span className="text-xs text-muted-foreground">
                  secret base64 encoded
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
