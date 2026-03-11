export const siteConfig = {
  name: "JWT Decoder",
  title: "JWT Decoder — Decode & Inspect JSON Web Tokens Instantly",
  description:
    "Paste any JWT token to instantly decode its header, payload, and signature. Verify expiration, inspect claims, and debug auth issues — 100% client-side, no data sent to any server.",
  url: "https://jwt-decoder.tools.jagodana.com",
  ogImage: "/opengraph-image",

  // Header
  headerIcon: "KeyRound",
  brandAccentColor: "#6366f1",

  // SEO
  keywords: [
    "jwt decoder",
    "jwt token decoder",
    "json web token decoder",
    "jwt debugger",
    "jwt inspector",
    "decode jwt online",
    "jwt payload viewer",
    "jwt claims inspector",
    "jwt expiration checker",
    "jwt header decoder",
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
      "JWT Decoder is a free, privacy-first tool that decodes JSON Web Tokens entirely in your browser. Inspect headers, payloads, claims, and expiration — no data ever leaves your machine.",
    featuresTitle: "Features",
    features: [
      "Instant JWT decoding",
      "Header & payload inspection",
      "Expiration status check",
      "100% client-side processing",
    ],
  },

  // Hero Section
  hero: {
    badge: "Free & Private JWT Inspector",
    titleLine1: "Decode Any",
    titleGradient: "JSON Web Token",
    subtitle:
      "Paste a JWT to instantly see its header, payload, and claims. Check expiration, inspect algorithms, and debug authentication — all in your browser, nothing sent to a server.",
  },

  // Feature Cards
  featureCards: [
    {
      icon: "🔓",
      title: "Instant Decode",
      description:
        "Paste any JWT and instantly see the decoded header, payload, and signature — no waiting, no server calls.",
    },
    {
      icon: "⏱️",
      title: "Expiration Check",
      description:
        "Automatically detects exp, iat, and nbf claims and shows whether the token is expired, valid, or not yet active.",
    },
    {
      icon: "🔒",
      title: "100% Client-Side",
      description:
        "Your tokens never leave your browser. Zero network requests — completely safe for production JWTs.",
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
      name: "Paste Your JWT",
      text: "Copy a JSON Web Token from your application, API response, or auth header and paste it into the input field.",
      url: "",
    },
    {
      name: "View Decoded Output",
      text: "The header and payload are instantly decoded and displayed with syntax highlighting and formatted JSON.",
      url: "",
    },
    {
      name: "Inspect Claims & Expiration",
      text: "Check token claims like iss, sub, aud, exp, and iat. The tool automatically shows whether the token is expired or still valid.",
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
        "This tool decodes and inspects JWTs but does not verify signatures, since that requires the signing secret or public key. It's designed for debugging and inspecting token contents.",
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
      title: "JWT Decoder — Decode & Inspect JSON Web Tokens Instantly",
      description:
        "Paste any JWT token to instantly decode its header, payload, and signature. Verify expiration, inspect claims, and debug auth issues — 100% client-side.",
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
