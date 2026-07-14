const NAVER_LOTTO_URL = "https://search.naver.com/search.naver?where=nexearch&query=%EB%A1%9C%EB%98%90";
const DHLottery_API = "https://www.dhlottery.co.kr/common.do?method=getLottoNumber";

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(syncLatestDraw(env, { sourcePreference: "naver" }));
  },

  async fetch(request, env) {
    if (!isAuthorized(request, env)) {
      return json({ error: "Unauthorized" }, 401);
    }

    try {
      const url = new URL(request.url);
      const sourcePreference = url.searchParams.get("source") || "naver";
      const result = await syncLatestDraw(env, { sourcePreference });
      return json({ result });
    } catch (error) {
      return json({ error: error.message || "Lotto sync failed." }, 500);
    }
  },
};

async function syncLatestDraw(env, options = {}) {
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured.");
  }

  const latestStored = await getLatestStoredRound(env.DB);
  const draw = await fetchLatestDraw(options.sourcePreference);

  if (!draw || !Number.isInteger(draw.round)) {
    throw new Error("Could not fetch the latest lotto draw.");
  }

  if (latestStored && draw.round < latestStored) {
    return {
      status: "skipped",
      reason: "Fetched draw is older than the stored latest draw.",
      latestStored,
      fetched: draw,
    };
  }

  await upsertDraw(env.DB, draw);

  return {
    status: draw.round === latestStored ? "updated" : "inserted",
    latestStoredBeforeSync: latestStored,
    draw,
  };
}

async function fetchLatestDraw(sourcePreference) {
  const fetchers = sourcePreference === "dhlottery"
    ? [fetchFromDhlottery, fetchFromNaver]
    : [fetchFromNaver, fetchFromDhlottery];

  const errors = [];
  for (const fetcher of fetchers) {
    try {
      const draw = await fetcher();
      if (isValidDraw(draw)) return draw;
    } catch (error) {
      errors.push(error.message || String(error));
    }
  }

  throw new Error(`All lotto result fetchers failed: ${errors.join(" / ")}`);
}

async function fetchFromNaver() {
  const response = await fetch(NAVER_LOTTO_URL, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 LottoStudio/1.0",
      "accept-language": "ko-KR,ko;q=0.9",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Naver returned ${response.status}`);
  }

  const html = await response.text();
  const draw = parseNaverLotto(html);
  if (!draw) {
    throw new Error("Naver lotto panel was not found or changed.");
  }
  return draw;
}

async function fetchFromDhlottery() {
  const estimatedRound = estimateLatestRound();
  for (let round = estimatedRound + 2; round >= Math.max(1, estimatedRound - 8); round -= 1) {
    const response = await fetch(`${DHLottery_API}&drwNo=${round}`, {
      headers: { "user-agent": "LottoStudio/1.0" },
    });
    if (!response.ok) continue;

    const raw = await response.json().catch(() => null);
    if (raw?.returnValue === "success") {
      return {
        round: Number(raw.drwNo),
        date: raw.drwNoDate || null,
        numbers: [
          raw.drwtNo1,
          raw.drwtNo2,
          raw.drwtNo3,
          raw.drwtNo4,
          raw.drwtNo5,
          raw.drwtNo6,
        ].map(Number),
        bonus: Number(raw.bnusNo),
        source: "dhlottery",
      };
    }
  }

  throw new Error("dhlottery latest draw was not found.");
}

function parseNaverLotto(html) {
  const roundMatch = html.match(/class="text _select_trigger _text"[^>]*>\s*(\d+)\s*회차\s*\((\d{4})\.(\d{2})\.(\d{2})\.\)/);
  const panelMatch = html.match(/<div class="win_area type_lotto _panel"[^>]*aria-hidden="false"[\s\S]*?<div class="win_info_box">/);
  if (!roundMatch || !panelMatch) return null;

  const panel = panelMatch[0];
  const winningMatch = panel.match(/<div class="winning_number">([\s\S]*?)<\/div>/);
  const bonusMatch = panel.match(/<div class="bonus_number">([\s\S]*?)<\/div>/);
  if (!winningMatch || !bonusMatch) return null;

  const numbers = [...winningMatch[1].matchAll(/<span class="ball type\d+">(\d+)<\/span>/g)]
    .map((match) => Number(match[1]));
  const bonus = Number((bonusMatch[1].match(/<span class="ball type\d+">(\d+)<\/span>/) || [])[1]);

  const draw = {
    round: Number(roundMatch[1]),
    date: `${roundMatch[2]}-${roundMatch[3]}-${roundMatch[4]}`,
    numbers,
    bonus,
    source: "naver",
  };

  return isValidDraw(draw) ? draw : null;
}

function isValidDraw(draw) {
  return Boolean(
    draw &&
    Number.isInteger(draw.round) &&
    Array.isArray(draw.numbers) &&
    draw.numbers.length === 6 &&
    draw.numbers.every((number) => Number.isInteger(number) && number >= 1 && number <= 45) &&
    Number.isInteger(draw.bonus) &&
    draw.bonus >= 1 &&
    draw.bonus <= 45
  );
}

async function getLatestStoredRound(db) {
  const row = await db.prepare("SELECT MAX(round) AS round FROM lotto_draws").first();
  return Number.isInteger(row?.round) ? row.round : null;
}

async function upsertDraw(db, draw) {
  const [n1, n2, n3, n4, n5, n6] = draw.numbers;
  await db
    .prepare(
      `INSERT INTO lotto_draws (round, draw_date, n1, n2, n3, n4, n5, n6, bonus, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(round) DO UPDATE SET
         draw_date = excluded.draw_date,
         n1 = excluded.n1,
         n2 = excluded.n2,
         n3 = excluded.n3,
         n4 = excluded.n4,
         n5 = excluded.n5,
         n6 = excluded.n6,
         bonus = excluded.bonus,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(draw.round, draw.date || null, n1, n2, n3, n4, n5, n6, draw.bonus)
    .run();
}

function estimateLatestRound() {
  const firstDrawDate = Date.UTC(2002, 11, 7, 12, 0, 0);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - firstDrawDate) / weekMs) + 1;
}

function isAuthorized(request, env) {
  if (!env.ADMIN_TOKEN) return true;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const auth = request.headers.get("authorization") || "";
  return token === env.ADMIN_TOKEN || auth === `Bearer ${env.ADMIN_TOKEN}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
