export async function onRequestPost(context) {
  const db = context.env.DB;
  if (!db) return json({ error: "D1 binding DB is not configured." }, 500);

  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const numbers = normalizeNumbers(body.numbers);
  if (numbers.length !== 6) {
    return json({ error: "numbers must contain 6 unique values between 1 and 45." }, 400);
  }

  const sourceType = normalizeSourceType(body.sourceType || body.source_type);
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 120) : null;
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO generated_tickets
       (id, session_id, source_type, n1, n2, n3, n4, n5, n6)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, sessionId, sourceType, ...numbers)
    .run();

  return json({ ticket: { id, sessionId, sourceType, numbers } }, 201);
}

function normalizeNumbers(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((number) => Number.isInteger(number) && number >= 1 && number <= 45))]
    .sort((a, b) => a - b)
    .slice(0, 6);
}

function normalizeSourceType(value) {
  const allowed = new Set(["pattern", "zodiac", "marble", "manual", "random", "unknown"]);
  const type = typeof value === "string" ? value.toLowerCase().trim() : "unknown";
  return allowed.has(type) ? type : "unknown";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
