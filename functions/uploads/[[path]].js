// Serve R2 files publicly at /uploads/*
export async function onRequestGet(context) {
  const { UPLOADS } = context.env;
  if (!UPLOADS) {
    return new Response("R2 not configured", { status: 503 });
  }

  const key = context.params.path.join("/");
  const object = await UPLOADS.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
