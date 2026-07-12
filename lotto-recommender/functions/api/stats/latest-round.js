export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) return json({ error: "D1 binding DB is not configured." }, 500);

  const latest = await db
    .prepare(
      `SELECT round, draw_date, n1, n2, n3, n4, n5, n6, bonus
       FROM lotto_draws
       ORDER BY round DESC
       LIMIT 1`
    )
    .first();

  if (!latest) return json({ error: "No lotto draw data found." }, 404);

  const tickets = await db
    .prepare(
      `SELECT id, n1, n2, n3, n4, n5, n6
       FROM generated_tickets`
    )
    .all();

  const rankCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const rows = tickets.results || [];

  for (const ticket of rows) {
    const rank = getRank([ticket.n1, ticket.n2, ticket.n3, ticket.n4, ticket.n5, ticket.n6], latest);
    if (rank) rankCounts[rank] += 1;
  }

  const winCount = Object.values(rankCounts).reduce((sum, count) => sum + count, 0);
  const winRate = rows.length ? Number(((winCount / rows.length) * 100).toFixed(2)) : 0;

  return json({
    round: latest.round,
    date: latest.draw_date,
    ticketCount: rows.length,
    rankCounts,
    winCount,
    winRate,
  });
}

function getRank(numbers, draw) {
  const selected = new Set(numbers);
  const drawNumbers = [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.n6];
  const matchCount = drawNumbers.filter((number) => selected.has(number)).length;
  const bonusMatched = selected.has(draw.bonus);

  if (matchCount === 6) return 1;
  if (matchCount === 5 && bonusMatched) return 2;
  if (matchCount === 5) return 3;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 5;
  return 0;
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
