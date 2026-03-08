// Trigger a GitHub Actions workflow_dispatch to rebuild and redeploy the site
export async function onRequestPost(context) {
  const { GITHUB_TOKEN, GITHUB_REPO } = context.env;

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return Response.json(
      { error: "GITHUB_TOKEN and GITHUB_REPO secrets not configured" },
      { status: 503 }
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/deploy.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "isc2-tampa-admin",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (res.status === 204) {
    return Response.json({ success: true, message: "Site rebuild triggered" });
  }

  const body = await res.text();
  return Response.json(
    { error: "Failed to trigger rebuild", status: res.status, body },
    { status: 502 }
  );
}
