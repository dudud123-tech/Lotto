const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../");
const inputArg = process.argv[2];
const outputPath = path.resolve(__dirname, "../public/data/lotto-history.json");

function findDefaultInput() {
  const files = fs.readdirSync(root);
  const target = files.find((file) => file.endsWith(".txt") && file.includes("당첨번호"));
  if (!target) {
    throw new Error(`No lotto history txt file found in ${root}`);
  }
  return path.join(root, target);
}

function parseHistory(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\s*:/.test(line))
    .map((line) => {
      const [roundText, valueText] = line.split(":");
      const values = valueText.split(",").map((value) => Number(value.trim())).filter(Boolean);
      return {
        round: Number(roundText.trim()),
        numbers: values.slice(0, 6),
        bonus: values[6]
      };
    })
    .filter((item) => item.round && item.numbers.length === 6 && item.bonus)
    .sort((a, b) => b.round - a.round);
}

function main() {
  const inputPath = inputArg ? path.resolve(inputArg) : findDefaultInput();
  const text = fs.readFileSync(inputPath, "utf8");
  const results = parseHistory(text);

  if (!results.length) {
    throw new Error(`No lotto history rows were parsed from ${inputPath}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), source: path.basename(inputPath), results }, null, 2)}\n`,
    "utf8"
  );

  console.log(`Wrote ${results.length} history rows to ${outputPath}`);
  console.log(`Latest round: ${results[0].round}`);
}

main();
