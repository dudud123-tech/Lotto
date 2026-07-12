const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const inputPath = path.join(root, "public", "data", "lotto-history.json");
const outputPath = path.join(root, "cloudflare", "d1", "seed-lotto-draws.sql");

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function normalizeDraw(draw) {
  const numbers = (draw.numbers || []).map(Number);
  if (!Number.isInteger(draw.round) || numbers.length !== 6) {
    throw new Error(`Invalid draw row: ${JSON.stringify(draw)}`);
  }
  return {
    round: Number(draw.round),
    drawDate: draw.date || null,
    numbers,
    bonus: Number(draw.bonus),
  };
}

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const rows = (data.results || []).map(normalizeDraw).sort((a, b) => a.round - b.round);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const lines = [
  "BEGIN TRANSACTION;",
  "DELETE FROM lotto_draws;",
];

for (const draw of rows) {
  const values = [
    draw.round,
    sqlString(draw.drawDate),
    ...draw.numbers,
    draw.bonus,
  ].join(", ");
  lines.push(
    `INSERT INTO lotto_draws (round, draw_date, n1, n2, n3, n4, n5, n6, bonus) VALUES (${values});`
  );
}

lines.push("COMMIT;");
lines.push("");

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(`Wrote ${rows.length} lotto draws to ${path.relative(root, outputPath)}`);
