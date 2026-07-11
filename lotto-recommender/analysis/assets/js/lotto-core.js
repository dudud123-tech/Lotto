const BOARD_COLS = 7;

const COLOR_BY_RANGE = [
  { max: 10, fill: "#f0a000", stroke: "#c57d00" },
  { max: 20, fill: "#0d6edc", stroke: "#0552ab" },
  { max: 30, fill: "#db3355", stroke: "#b42343" },
  { max: 40, fill: "#7e8494", stroke: "#666d7e" },
  { max: 45, fill: "#2fa84f", stroke: "#23823c" }
];

const patterns = [
  { name: "Balanced", round: "Round 1226", desc: "Evenly spread across the board", numbers: [4, 6, 13, 17, 26, 28] },
  { name: "Horizontal / Pillar", round: "Round 1223", desc: "Band, pillar, and cluster mixed", numbers: [16, 18, 20, 32, 33, 39] },
  { name: "Staircase", round: "Round 1221", desc: "Descending staircase line", numbers: [6, 13, 18, 28, 30, 36] },
  { name: "Zigzag", round: "Round 1219", desc: "Strong Z shaped swing", numbers: [1, 2, 15, 28, 39, 45] },
  { name: "Dense Corner", round: "Round 1218", desc: "Clustered near the right edge", numbers: [3, 28, 31, 32, 42, 45] },
  { name: "Tight Band", round: "Round 1215", desc: "Dense central band", numbers: [13, 15, 19, 21, 44, 45] },
  { name: "Large Spread", round: "Round 1210", desc: "Wide spread with direction changes", numbers: [1, 7, 9, 17, 27, 38] },
  { name: "Line-like", round: "Round 1206", desc: "Simple connected line", numbers: [1, 3, 17, 26, 27, 42] },
  { name: "Vertical Ladder", round: "Round 1081", desc: "Repeating vertical ladder", numbers: [1, 9, 16, 23, 24, 38] },
  { name: "Diagonal Chain", round: "Round 1199", desc: "Diagonal and band chain", numbers: [16, 24, 25, 30, 31, 32] }
];

const zodiacPatterns = [
  { name: "Aries", round: "12 Zodiac", desc: "Short curved ram line", numbers: [4, 5, 11, 18, 24, 31] },
  { name: "Taurus", round: "12 Zodiac", desc: "Sideways V bull head", numbers: [3, 9, 16, 23, 17, 11] },
  { name: "Gemini", round: "12 Zodiac", desc: "Twin columns for Castor and Pollux", numbers: [4, 11, 18, 6, 13, 20] },
  { name: "Cancer", round: "12 Zodiac", desc: "Small Y shape around the center", numbers: [11, 18, 24, 30, 25, 19] },
  { name: "Leo", round: "12 Zodiac", desc: "Sickle head and rear body", numbers: [7, 13, 19, 25, 33, 40] },
  { name: "Virgo", round: "12 Zodiac", desc: "Long flow toward Spica", numbers: [1, 8, 16, 24, 32, 41] },
  { name: "Libra", round: "12 Zodiac", desc: "Balanced scale line", numbers: [9, 15, 23, 17, 25, 31] },
  { name: "Scorpio", round: "12 Zodiac", desc: "Curved S shaped scorpion tail", numbers: [2, 10, 17, 25, 32, 40] },
  { name: "Sagittarius", round: "12 Zodiac", desc: "Teapot-like Sagittarius bend", numbers: [16, 10, 17, 24, 32, 26] },
  { name: "Capricorn", round: "12 Zodiac", desc: "Folded Capricorn line", numbers: [4, 12, 19, 27, 34, 42] },
  { name: "Aquarius", round: "12 Zodiac", desc: "Double wave stream", numbers: [8, 15, 23, 30, 38, 45] },
  { name: "Pisces", round: "12 Zodiac", desc: "V shaped cord between two fish", numbers: [3, 11, 19, 27, 21, 15] }
];

function getBallPalette(number) {
  return COLOR_BY_RANGE.find((row) => number <= row.max) || COLOR_BY_RANGE[COLOR_BY_RANGE.length - 1];
}

function setBallStyle(ball, number) {
  const palette = getBallPalette(number);
  ball.style.background = `radial-gradient(circle at 32% 28%, #fff 0 12%, ${palette.fill} 16%, ${palette.fill} 55%, ${palette.stroke} 100%)`;
}

function drawMiniPattern(svg, numbers) {
  const size = 9.2;
  const gap = 1.2;
  const mapX = (n) => ((n - 1) % BOARD_COLS) * (size + gap) + 4;
  const mapY = (n) => Math.floor((n - 1) / BOARD_COLS) * (size + gap) + 4;
  let out = "";
  for (let n = 1; n <= 45; n++) {
    out += `<rect x="${mapX(n)}" y="${mapY(n)}" width="${size}" height="${size}" rx="1.8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)"/>`;
  }
  out += `<polyline points="${numbers.map((n) => `${mapX(n) + size / 2},${mapY(n) + size / 2}`).join(" ")}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  numbers.forEach((n) => {
    const palette = getBallPalette(n);
    out += `<circle cx="${mapX(n) + size / 2}" cy="${mapY(n) + size / 2}" r="4.1" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="0.8"/>`;
  });
  svg.innerHTML = out;
}

window.LottoCore = {
  BOARD_COLS,
  COLOR_BY_RANGE,
  patterns,
  zodiacPatterns,
  getBallPalette,
  setBallStyle,
  drawMiniPattern
};
