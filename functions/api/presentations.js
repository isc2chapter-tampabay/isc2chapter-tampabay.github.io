function generateId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet(context) {
  const { DB } = context.env;
  const { results } = await DB.prepare(
    "SELECT * FROM presentations ORDER BY date DESC"
  ).all();
  // Parse tags from JSON string to array
  return Response.json(
    results.map((r) => ({ ...r, tags: JSON.parse(r.tags || "[]") }))
  );
}

export async function onRequestPost(context) {
  const { DB } = context.env;
  const body = await context.request.json();
  const id = generateId();

  await DB.prepare(
    `INSERT INTO presentations (id, title, speaker, linkedin, date, event, description, slides, video, image, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.title,
    body.speaker || "",
    body.linkedin || null,
    body.date,
    body.event,
    body.description || null,
    body.slides || null,
    body.video || null,
    body.image || null,
    JSON.stringify(body.tags || [])
  ).run();

  const pres = await DB.prepare("SELECT * FROM presentations WHERE id = ?").bind(id).first();
  return Response.json({ ...pres, tags: JSON.parse(pres.tags || "[]") }, { status: 201 });
}

export async function onRequestPut(context) {
  const { DB } = context.env;
  const body = await context.request.json();
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });

  await DB.prepare(
    `UPDATE presentations SET title=?, speaker=?, linkedin=?, date=?, event=?, description=?, slides=?, video=?, image=?, tags=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(
    body.title,
    body.speaker || "",
    body.linkedin || null,
    body.date,
    body.event,
    body.description || null,
    body.slides || null,
    body.video || null,
    body.image || null,
    JSON.stringify(body.tags || []),
    body.id
  ).run();

  const pres = await DB.prepare("SELECT * FROM presentations WHERE id = ?").bind(body.id).first();
  return Response.json({ ...pres, tags: JSON.parse(pres.tags || "[]") });
}

export async function onRequestDelete(context) {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await DB.prepare("DELETE FROM presentations WHERE id = ?").bind(id).run();
  return Response.json({ deleted: true });
}
