"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldX,
  Trash2,
  ClipboardPaste,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToolEvents } from "@/lib/analytics";

interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

interface TokenStatus {
  isExpired: boolean | null;
  expiresAt: Date | null;
  issuedAt: Date | null;
  notBefore: Date | null;
  timeUntilExpiry: string | null;
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
      diff > 0 ? `Expires in ${parts.join(" ")}` : `Expired ${parts.join(" ")} ago`;
  }

  return {
    isExpired: exp !== null ? exp < now : null,
    expiresAt: exp !== null ? new Date(exp * 1000) : null,
    issuedAt: iat !== null ? new Date(iat * 1000) : null,
    notBefore: nbf !== null ? new Date(nbf * 1000) : null,
    timeUntilExpiry,
  };
}

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

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQxNjAwMDAwLCJleHAiOjE3NzMxMzYwMDAsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

function CopyButton({ text, label }: { text: string; label: string }) {
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
      className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function JsonView({
  data,
  title,
  raw,
}: {
  data: Record<string, unknown>;
  title: string;
  raw: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <CopyButton text={JSON.stringify(data, null, 2)} label={title} />
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed">
          {Object.entries(data).map(([key, value], i) => {
            const label = CLAIM_LABELS[key];
            const isTimestamp =
              typeof value === "number" &&
              ["exp", "iat", "nbf", "auth_time"].includes(key);

            return (
              <div key={key} className="flex flex-wrap gap-x-1">
                <span className="text-muted-foreground">
                  {i === 0 ? "{ " : "  "}
                </span>
                <span className="text-brand">&quot;{key}&quot;</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-foreground">
                  {typeof value === "string"
                    ? `"${value}"`
                    : JSON.stringify(value)}
                </span>
                {i < Object.entries(data).length - 1 && (
                  <span className="text-muted-foreground">,</span>
                )}
                {label && (
                  <span className="text-muted-foreground/60 text-xs ml-2 self-center">
                    // {label}
                    {isTimestamp && (
                      <> — {new Date((value as number) * 1000).toUTCString()}</>
                    )}
                  </span>
                )}
              </div>
            );
          })}
          <span className="text-muted-foreground">{"}"}</span>
        </pre>
      </div>
      <div className="px-4 py-2 border-t border-border/30 bg-muted/20">
        <p className="text-xs text-muted-foreground/60 font-mono truncate">
          Raw: {raw}
        </p>
      </div>
    </div>
  );
}

export function JWTDecoderTool() {
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = useCallback(
    (value: string) => {
      setInput(value);
      if (!value.trim()) {
        setDecoded(null);
        setStatus(null);
        setError(null);
        return;
      }

      const cleaned = value.trim().replace(/^Bearer\s+/i, "");
      const result = decodeJWT(cleaned);

      if (result) {
        setDecoded(result);
        setStatus(getTokenStatus(result.payload));
        setError(null);
        ToolEvents.toolUsed("decode");
      } else {
        setDecoded(null);
        setStatus(null);
        setError(
          "Invalid JWT format. A valid JWT has three Base64-encoded parts separated by dots (header.payload.signature)."
        );
      }
    },
    []
  );

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleDecode(text);
      toast.success("Pasted from clipboard");
    } catch {
      toast.error("Could not read clipboard");
    }
  }, [handleDecode]);

  const handleClear = useCallback(() => {
    setInput("");
    setDecoded(null);
    setStatus(null);
    setError(null);
  }, []);

  const handleSample = useCallback(() => {
    handleDecode(SAMPLE_JWT);
    toast.success("Sample JWT loaded");
  }, [handleDecode]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">Token Input</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePaste} className="h-7 text-xs gap-1.5">
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSample} className="h-7 text-xs">
              Sample
            </Button>
            {input && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => handleDecode(e.target.value)}
          placeholder="Paste your JWT token here (e.g., eyJhbGciOiJIUzI1NiIs...)"
          className="w-full p-4 bg-transparent text-sm font-mono resize-none focus:outline-none placeholder:text-muted-foreground/40 min-h-[120px]"
          spellCheck={false}
        />
      </div>

      {/* Error */}
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

      {/* Decoded Output */}
      <AnimatePresence>
        {decoded && status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            {/* Token Status Banner */}
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                status.isExpired === null
                  ? "border-border/50 bg-muted/30"
                  : status.isExpired
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-brand/30 bg-brand/5"
              }`}
            >
              {status.isExpired === null ? (
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
              ) : status.isExpired ? (
                <ShieldX className="h-5 w-5 text-destructive shrink-0" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-brand shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    status.isExpired === null
                      ? "text-muted-foreground"
                      : status.isExpired
                      ? "text-destructive"
                      : "text-brand"
                  }`}
                >
                  {status.isExpired === null
                    ? "No expiration claim (exp) found"
                    : status.isExpired
                    ? "Token is expired"
                    : "Token is valid"}
                </p>
                {status.timeUntilExpiry && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {status.timeUntilExpiry}
                    {status.expiresAt && (
                      <> — {status.expiresAt.toLocaleString()}</>
                    )}
                  </p>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-0.5 shrink-0">
                {status.issuedAt && (
                  <p>Issued: {status.issuedAt.toLocaleString()}</p>
                )}
                {status.notBefore && (
                  <p>Not before: {status.notBefore.toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Algorithm Badge */}
            <div className="flex flex-wrap gap-2">
              {"alg" in decoded.header && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-xs font-medium text-brand">
                  Algorithm: {String(decoded.header.alg)}
                </span>
              )}
              {"typ" in decoded.header && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border/50 text-xs font-medium text-muted-foreground">
                  Type: {String(decoded.header.typ)}
                </span>
              )}
              {"iss" in decoded.payload && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border/50 text-xs font-medium text-muted-foreground">
                  Issuer: {String(decoded.payload.iss)}
                </span>
              )}
            </div>

            {/* Header */}
            <JsonView data={decoded.header} title="Header (JOSE)" raw={decoded.raw.header} />

            {/* Payload */}
            <JsonView data={decoded.payload} title="Payload (Claims)" raw={decoded.raw.payload} />

            {/* Signature */}
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">Signature</h3>
                <CopyButton text={decoded.signature} label="Signature" />
              </div>
              <div className="p-4">
                <p className="text-sm font-mono text-muted-foreground break-all">
                  {decoded.signature}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  Signature verification requires the signing secret or public key (not done client-side).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
