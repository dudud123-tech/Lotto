export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) return json({ error: "D1 binding DB is not configured." }, 500);

  const draw = await db
    .prepare(
      `SELECT round, draw_date, n1, n2, n3, n4, n5, n6, bonus
       FROM lotto_draws
       ORDER BY round DESC
       LIMIT 1`
    )
    .first();

  if (!draw) return json({ error: "No lotto draw data found." }, 404);
  return json({ result: formatDraw(draw) });
}

function formatDraw(draw) {
  return {
    round: draw.round,
    date: draw.draw_date,
    numbers: [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.n6],
    bonus: draw.bonus,
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": status === 200 ? "public, max-age=120" : "no-store",
    },
  });
}
