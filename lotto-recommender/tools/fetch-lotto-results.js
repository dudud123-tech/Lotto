const fs = require("fs");
const https = require("https");
const path = require("path");

const FIRST_DRAW_DATE = new Date("2002-12-07T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const RESULT_COUNT = Number(process.argv[2] || 10);
const OUTPUT_PATH = path.resolve(__dirname, "../public/data/lotto-results.json");

function estimateLatestRound() {
  return Math.floor((Date.now() - FIRST_DRAW_DATE.getTime()) / WEEK_MS) + 1;
}

function fetchRound(round) {
  const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "LottoStudio/1.0" } }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            resolve({ returnValue: "fail", error: `Round ${round} returned invalid JSON` });
          }
        });
      })
      .on("error", reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "ko-KR,ko;q=0.9",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

function normalizeResult(raw) {
  return {
    round: raw.drwNo,
    date: raw.drwNoDate,
    numbers: [raw.drwtNo1, raw.drwtNo2, raw.drwtNo3, raw.drwtNo4, raw.drwtNo5, raw.drwtNo6],
    bonus: raw.bnusNo
  };
}

function parseNaverLatest(html) {
  const roundMatch = html.match(/class="text _select_trigger _text"[^>]*>\s*(\d+)회차\s*\((\d{4})\.(\d{2})\.(\d{2})\.\)/);
  const panelMatch = html.match(/<div class="win_area type_lotto _panel"[^>]*aria-hidden="false"[\s\S]*?<\/div>\s*<div class="win_info_box">/);
  if (!roundMatch || !panelMatch) return null;

  const panel = panelMatch[0];
  const winningMatch = panel.match(/<div class="winning_number">([\s\S]*?)<\/div>/);
  const bonusMatch = panel.match(/<div class="bonus_number">([\s\S]*?)<\/div>/);
  if (!winningMatch || !bonusMatch) return null;

  const numbers = [...winningMatch[1].matchAll(/<span class="ball type\d+">(\d+)<\/span>/g)].map((match) => Number(match[1]));
  const bonus = Number((bonusMatch[1].match(/<span class="ball type\d+">(\d+)<\/span>/) || [])[1]);
  if (numbers.length !== 6 || !bonus) return null;

  return {
    round: Number(roundMatch[1]),
    date: `${roundMatch[2]}-${roundMatch[3]}-${roundMatch[4]}`,
    numbers,
    bonus
  };
}

async function fetchNaverLatest() {
  const html = await fetchText("https://search.naver.com/search.naver?where=nexearch&query=%EB%A1%9C%EB%98%90");
  return parseNaverLatest(html);
}

async function fetchFromDhlottery() {
  const results = [];
  let round = estimateLatestRound() + 2;
  let misses = 0;

  while (results.length < RESULT_COUNT && round > 0 && misses < 30) {
    const raw = await fetchRound(round);
    if (raw.returnValue === "success") {
      results.push(normalizeResult(raw));
      misses = 0;
    } else {
      misses += 1;
    }
    round -= 1;
  }

  if (!results.length) {
    return [];
  }
  return results;
}

async function main() {
  let results = await fetchFromDhlottery();
  let source = "dhlottery.co.kr";

  if (!results.length) {
    console.warn("dhlottery JSON fetch failed. Trying Naver search HTML fallback.");
    const latest = await fetchNaverLatest();
    if (latest) {
      results = [latest];
      source = "naver-search";
    }
  }

  if (!results.length) {
    throw new Error("No lotto results were fetched.");
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), source, results }, null, 2)}\n`,
    "utf8"
  );
  console.log(`Wrote ${results.length} lotto results to ${OUTPUT_PATH}`);
  console.log(`Latest round: ${results[0].round} (${results[0].date})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
