export const siteConfig = {
  name: "JWT Encoder & Decoder",
  title: "JWT Encoder & Decoder — Encode, Decode & Verify JSON Web Tokens",
  description:
    "Encode, decode, and verify JSON Web Tokens like jwt.io. Edit header & payload, sign with HMAC (HS256/384/512), verify signatures, color-coded sections — 100% client-side.",
  url: "https://jwt-decoder.tools.jagodana.com",
  ogImage: "/opengraph-image",

  // Header
  headerIcon: "KeyRound",
  brandAccentColor: "#6366f1",

  // SEO
  keywords: [
    "jwt encoder",
    "jwt decoder",
    "jwt encoder decoder",
    "jwt token generator",
    "json web token encoder",
    "jwt debugger",
    "jwt inspector",
    "jwt signature verification",
    "jwt.io alternative",
    "jwt payload viewer",
    "jwt claims inspector",
    "jwt expiration checker",
    "jwt header decoder",
    "create jwt token online",
    "verify jwt signature",
  ],
  applicationCategory: "DeveloperApplication",

  // Theme
  themeColor: "#3b82f6",

  // Branding
  creator: "Jagodana",
  creatorUrl: "https://jagodana.com",
  twitterHandle: "@jagodana",

  socialProfiles: [
    "https://twitter.com/jagodana",
  ],

  // Links
  links: {
    github: "https://github.com/Jagodana-Studio-Private-Limited/jwt-decoder",
    website: "https://jagodana.com",
  },

  // Footer
  footer: {
    about:
      "JWT Encoder & Decoder is a free, privacy-first tool for encoding, decoding, and verifying JSON Web Tokens entirely in your browser. Edit headers & payloads, sign with HMAC, verify signatures — no data ever leaves your machine.",
    featuresTitle: "Features",
    features: [
      "JWT encoding & decoding",
      "HMAC signature signing & verification",
      "Color-coded token sections",
      "Live bidirectional editing",
      "100% client-side processing",
    ],
  },

  // Hero Section
  hero: {
    badge: "Free & Private JWT Tool — Like jwt.io",
    titleLine1: "Encode & Decode",
    titleGradient: "JSON Web Tokens",
    subtitle:
      "Create, decode, and verify JWTs with color-coded sections. Edit header & payload, sign with HMAC (HS256/384/512), and verify signatures — all in your browser.",
  },

  // Feature Cards
  featureCards: [
    {
      icon: "🔐",
      title: "Encode & Sign",
      description:
        "Edit header and payload JSON, choose your algorithm, provide a secret — and get a signed JWT instantly.",
    },
    {
      icon: "🎨",
      title: "Color-Coded Sections",
      description:
        "Header (red), payload (purple), and signature (blue) are color-coded just like jwt.io for easy reading.",
    },
    {
      icon: "✅",
      title: "Verify Signatures",
      description:
        "Enter your HMAC secret to verify JWT signatures client-side. Supports HS256, HS384, and HS512.",
    },
  ],

  // Related Tools
  relatedTools: [
    {
      name: "JSON Formatter",
      url: "https://json-formatter.tools.jagodana.com",
      icon: "📋",
      description: "Format and beautify JSON with syntax highlighting.",
    },
    {
      name: "JSON Path Finder",
      url: "https://json-path-finder.tools.jagodana.com",
      icon: "🔍",
      description: "Find paths to any value in nested JSON instantly.",
    },
    {
      name: "Text Case Converter",
      url: "https://text-case-converter.tools.jagodana.com",
      icon: "🔤",
      description: "Convert text between camelCase, snake_case, and more.",
    },
    {
      name: "Regex Playground",
      url: "https://regex-playground.tools.jagodana.com",
      icon: "🧪",
      description: "Build, test & debug regular expressions in real-time.",
    },
    {
      name: "HTTP Status Debugger",
      url: "https://http-status-debugger.tools.jagodana.com",
      icon: "🌐",
      description: "Decode HTTP status codes and fix API errors fast.",
    },
    {
      name: "Password Generator",
      url: "https://password-generator.tools.jagodana.com",
      icon: "🔑",
      description: "Generate secure, random passwords instantly.",
    },
  ],

  // HowTo Steps
  howToSteps: [
    {
      name: "Decode a JWT",
      text: "Paste a JWT into the left panel. The header, payload, and signature are instantly decoded and displayed in color-coded sections on the right.",
      url: "",
    },
    {
      name: "Encode a JWT",
      text: "Edit the header and payload JSON on the right panel. Choose an algorithm (HS256/384/512), enter your signing secret, and the encoded JWT updates live on the left.",
      url: "",
    },
    {
      name: "Verify Signature",
      text: "Enter your HMAC secret in the signature section. The tool verifies whether the signature matches the token content — all client-side, nothing sent to a server.",
      url: "",
    },
  ],
  howToTotalTime: "PT1M",

  // FAQ
  faq: [
    {
      question: "Is it safe to paste my JWT token here?",
      answer:
        "Yes — JWT Decoder runs 100% in your browser. Your token is never sent to any server. All decoding happens locally using JavaScript. You can verify this by checking your browser's network tab.",
    },
    {
      question: "What is a JSON Web Token (JWT)?",
      answer:
        "A JWT is a compact, URL-safe token format used for authentication and authorization. It consists of three Base64-encoded parts separated by dots: a header (algorithm & type), a payload (claims like user ID, roles, expiration), and a signature.",
    },
    {
      question: "Can this tool verify JWT signatures?",
      answer:
        "Yes! Enter your HMAC secret key in the signature section and the tool will verify whether the signature is valid. It supports HS256, HS384, and HS512 algorithms — all verification happens client-side in your browser.",
    },
    {
      question: "What claims does the tool detect?",
      answer:
        "It detects and highlights all registered claims including iss (issuer), sub (subject), aud (audience), exp (expiration), nbf (not before), iat (issued at), and jti (JWT ID). Custom claims are also displayed.",
    },
    {
      question: "Does this work with expired tokens?",
      answer:
        "Yes. You can decode any JWT regardless of whether it's expired. The tool will show the expiration status and how long ago it expired or when it will expire.",
    },
  ],

  // Pages
  pages: {
    "/": {
      title: "JWT Encoder & Decoder — Encode, Decode & Verify JSON Web Tokens",
      description:
        "Encode, decode, and verify JSON Web Tokens like jwt.io. Edit header & payload, sign with HMAC (HS256/384/512), verify signatures — 100% client-side.",
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
