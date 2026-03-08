export async function onRequestPost(context) {
  const { UPLOADS } = context.env;
  if (!UPLOADS) {
    return Response.json({ error: "R2 not configured" }, { status: 503 });
  }

  const formData = await context.request.formData();
  const file = formData.get("file");
  const prefix = formData.get("prefix") || "uploads"; // headshots, slides, etc.

  if (!file || !file.name) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  // Sanitize filename
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
  const key = `${prefix}/${Date.now()}-${safeName}`;

  await UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return Response.json({ key, url: `/uploads/${key}` }, { status: 201 });
}
