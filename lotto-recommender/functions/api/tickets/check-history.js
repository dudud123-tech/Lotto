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

  const rows = await db
    .prepare(
      `SELECT round, draw_date, n1, n2, n3, n4, n5, n6, bonus
       FROM lotto_draws
       ORDER BY round DESC`
    )
    .all();

  const summary = summarizeHistory(numbers, rows.results || []);
  return json({ numbers, ...summary });
}

function summarizeHistory(numbers, draws) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let best = null;

  for (const draw of draws) {
    const rank = getRank(numbers, draw);
    if (!rank) continue;
    counts[rank] += 1;
    if (!best || rank < best.rank) {
      best = { round: draw.round, rank, date: draw.draw_date || null };
    }
  }

  return {
    counts,
    best,
    totalHits: Object.values(counts).reduce((sum, count) => sum + count, 0),
  };
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

function normalizeNumbers(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((number) => Number.isInteger(number) && number >= 1 && number <= 45))]
    .sort((a, b) => a - b)
    .slice(0, 6);
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
