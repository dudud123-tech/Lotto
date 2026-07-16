export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) return json({ error: "D1 binding DB is not configured." }, 500);

  await ensureTicketSchema(db);
  await pruneOldTickets(db);

  const rows = await db
    .prepare(
      `SELECT
         t.target_round,
         COUNT(*) AS ticket_count,
         d.draw_date,
         d.n1 AS d1, d.n2 AS d2, d.n3 AS d3, d.n4 AS d4, d.n5 AS d5, d.n6 AS d6, d.bonus
       FROM generated_tickets t
       LEFT JOIN lotto_draws d ON d.round = t.target_round
       WHERE t.target_round IS NOT NULL
       GROUP BY t.target_round
       ORDER BY t.target_round DESC
       LIMIT 12`
    )
    .all();

  const rounds = [];
  for (const row of rows.results || []) {
    const tickets = await db
      .prepare(
        `SELECT n1, n2, n3, n4, n5, n6
         FROM generated_tickets
         WHERE target_round = ?`
      )
      .bind(row.target_round)
      .all();

    const hasDraw = row.d1 !== null && row.d1 !== undefined;
    const draw = hasDraw
      ? { n1: row.d1, n2: row.d2, n3: row.d3, n4: row.d4, n5: row.d5, n6: row.d6, bonus: row.bonus }
      : null;
    const rankCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (draw) {
      for (const ticket of tickets.results || []) {
        const rank = getRank([ticket.n1, ticket.n2, ticket.n3, ticket.n4, ticket.n5, ticket.n6], draw);
        if (rank) rankCounts[rank] += 1;
      }
    }

    const winCount = Object.values(rankCounts).reduce((sum, count) => sum + count, 0);
    rounds.push({
      round: row.target_round,
      date: row.draw_date || null,
      ticketCount: row.ticket_count,
      status: draw ? "complete" : "pending",
      rankCounts,
      winCount,
      winRate: row.ticket_count ? Number(((winCount / row.ticket_count) * 100).toFixed(2)) : 0,
    });
  }

  return json({ rounds, retentionDays: 90 });
}

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

  await ensureTicketSchema(db);
  await pruneOldTickets(db);

  const sourceType = normalizeSourceType(body.sourceType || body.source_type);
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 120) : null;
  const targetRound = await resolveTargetRound(db, body.targetRound || body.target_round);
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO generated_tickets
       (id, session_id, source_type, n1, n2, n3, n4, n5, n6, target_round)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, sessionId, sourceType, ...numbers, targetRound)
    .run();

  return json({ ticket: { id, sessionId, sourceType, numbers, targetRound } }, 201);
}

async function ensureTicketSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS generated_tickets (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        source_type TEXT NOT NULL DEFAULT 'unknown',
        n1 INTEGER NOT NULL,
        n2 INTEGER NOT NULL,
        n3 INTEGER NOT NULL,
        n4 INTEGER NOT NULL,
        n5 INTEGER NOT NULL,
        n6 INTEGER NOT NULL,
        target_round INTEGER,
        latest_checked_round INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();

  try {
    await db.prepare(`ALTER TABLE generated_tickets ADD COLUMN target_round INTEGER`).run();
  } catch (error) {
    // The production database may already have the column. D1 throws on duplicates.
  }

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_generated_tickets_target_round ON generated_tickets(target_round)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_generated_tickets_created_at ON generated_tickets(created_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_generated_tickets_source_type ON generated_tickets(source_type)`).run();
}

async function pruneOldTickets(db) {
  await db.prepare(`DELETE FROM generated_tickets WHERE created_at < datetime('now', '-90 days')`).run();
}

async function resolveTargetRound(db, value) {
  const requested = Number(value);
  if (Number.isInteger(requested) && requested > 0) return requested;

  const latest = await db.prepare(`SELECT round FROM lotto_draws ORDER BY round DESC LIMIT 1`).first();
  return latest?.round ? latest.round + 1 : null;
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
