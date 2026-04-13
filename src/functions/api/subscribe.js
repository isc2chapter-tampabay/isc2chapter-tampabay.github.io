// Cloudflare Pages Function: POST /api/subscribe
// Validates email, verifies Turnstile, adds subscriber to Mailchimp with
// status="pending" (triggers Mailchimp's double opt-in confirmation email),
// then tags them with the website-signup tag — whether they were newly added
// or were already in the audience.
//
// Required Cloudflare Pages environment variables:
//   MAILCHIMP_API_KEY        (secret)
//   MAILCHIMP_LIST_ID        (audience ID)
//   MAILCHIMP_SERVER_PREFIX  (e.g. "us21" — the subdomain in Mailchimp API URLs)
//   TURNSTILE_SECRET_KEY     (secret)
// Optional:
//   MAILCHIMP_SIGNUP_TAG     (defaults to "Website Signup")

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  const turnstileToken = body.turnstileToken;

  if (!isValidEmail(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }
  if (!turnstileToken) {
    return json({ ok: false, error: "Bot check missing. Refresh and try again." }, 400);
  }

  const turnstileResult = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, request);
  if (!turnstileResult.success) {
    return json({ ok: false, error: "Bot check failed. Please try again." }, 403);
  }

  const mc = await addToMailchimp(email, env);
  if (mc.ok) {
    return json({ ok: true, message: "Almost done — check your inbox to confirm your subscription." });
  }
  return json({ ok: false, error: mc.error || "Something went wrong. Please try again." }, 500);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function verifyTurnstile(token, secret, request) {
  if (!secret) return { success: false };
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  return res.json();
}

async function addToMailchimp(email, env) {
  const { MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_SIGNUP_TAG } = env;
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_SERVER_PREFIX) {
    return { ok: false, error: "Subscription service is not configured." };
  }

  const basicAuth = `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`;
  const listUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}`;

  // Step 1: add as pending (triggers double opt-in for new members, errors with
  // "Member Exists" for existing members — which we treat as success).
  const addRes = await fetch(`${listUrl}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: basicAuth },
    body: JSON.stringify({ email_address: email, status: "pending" }),
  });

  if (!addRes.ok) {
    const err = await addRes.json().catch(() => ({}));
    const alreadyMember = err.title === "Member Exists" || /already a list member/i.test(err.detail || "");
    if (!alreadyMember) {
      return { ok: false, error: err.detail || err.title || "Mailchimp error." };
    }
  }

  // Step 2: add the signup tag. Uses POST /members/{hash}/tags which appends
  // rather than replacing — and works regardless of whether the member is
  // new, pending, or already subscribed. Tag failure is non-fatal; the
  // subscription itself already succeeded.
  const tagName = MAILCHIMP_SIGNUP_TAG || "Website Signup";
  const hash = await subscriberHash(email);
  const tagRes = await fetch(`${listUrl}/members/${hash}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: basicAuth },
    body: JSON.stringify({ tags: [{ name: tagName, status: "active" }] }),
  });
  if (!tagRes.ok) {
    console.error("Tagging failed:", tagRes.status, await tagRes.text().catch(() => ""));
  }

  return { ok: true };
}

// Mailchimp uses MD5(lowercase email) as the member-level URL identifier.
async function subscriberHash(email) {
  const digest = await crypto.subtle.digest("MD5", new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
