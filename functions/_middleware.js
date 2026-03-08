// Cloudflare Access JWT verification middleware
// Protects /admin/* and mutation endpoints on /api/*

const CERTS_URL_TEMPLATE = "https://{team}.cloudflareaccess.com/cdn-cgi/access/certs";

async function verifyJwt(request, env) {
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN; // e.g. "myteam"
  if (!teamDomain) return false;

  const token =
    request.headers.get("Cf-Access-Jwt-Assertion") ||
    getCookie(request, "CF_Authorization");
  if (!token) return false;

  try {
    const certsUrl = CERTS_URL_TEMPLATE.replace("{team}", teamDomain);
    const certsResp = await fetch(certsUrl);
    const { keys } = await certsResp.json();

    const parts = token.split(".");
    const header = JSON.parse(atob(parts[0]));
    const key = keys.find((k) => k.kid === header.kid);
    if (!key) return false;

    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      key,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = Uint8Array.from(
      atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signature, data);
    if (!valid) return false;

    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) return false;

    return payload;
  } catch {
    return false;
  }
}

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Public routes: GET on /api/* is open (for build-time fetch and public pages)
  if (path.startsWith("/api/") && request.method === "GET") {
    return context.next();
  }

  // All /admin/* and non-GET /api/* require auth
  if (path.startsWith("/admin") || path.startsWith("/api/")) {
    // In development (no team domain configured), skip auth
    if (!env.CF_ACCESS_TEAM_DOMAIN) {
      return context.next();
    }

    const payload = await verifyJwt(request, env);
    if (!payload) {
      return new Response("Unauthorized", { status: 401 });
    }
    // Attach user info to request for downstream handlers
    context.data.user = payload;
  }

  return context.next();
}
