function generateId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet(context) {
  const { DB } = context.env;
  const { results } = await DB.prepare(
    "SELECT * FROM events ORDER BY date DESC"
  ).all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const { DB } = context.env;
  const body = await context.request.json();
  const id = generateId();

  await DB.prepare(
    `INSERT INTO events (id, title, date, end_date, start_time, end_time, location, type, description, url, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.title,
    body.date,
    body.endDate || null,
    body.startTime,
    body.endTime,
    body.location,
    body.type,
    body.description || null,
    body.url || null,
    body.image || null
  ).run();

  const event = await DB.prepare("SELECT * FROM events WHERE id = ?").bind(id).first();
  return Response.json(event, { status: 201 });
}

export async function onRequestPut(context) {
  const { DB } = context.env;
  const body = await context.request.json();
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });

  await DB.prepare(
    `UPDATE events SET title=?, date=?, end_date=?, start_time=?, end_time=?, location=?, type=?, description=?, url=?, image=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(
    body.title,
    body.date,
    body.endDate || null,
    body.startTime,
    body.endTime,
    body.location,
    body.type,
    body.description || null,
    body.url || null,
    body.image || null,
    body.id
  ).run();

  const event = await DB.prepare("SELECT * FROM events WHERE id = ?").bind(body.id).first();
  return Response.json(event);
}

export async function onRequestDelete(context) {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await DB.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
  return Response.json({ deleted: true });
}
