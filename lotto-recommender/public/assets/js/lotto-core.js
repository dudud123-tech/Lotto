const BOARD_COLS = 7;

const COLOR_BY_RANGE = [
  { max: 10, fill: "#f0a000", stroke: "#c57d00" },
  { max: 20, fill: "#0d6edc", stroke: "#0552ab" },
  { max: 30, fill: "#db3355", stroke: "#b42343" },
  { max: 40, fill: "#7e8494", stroke: "#666d7e" },
  { max: 45, fill: "#2fa84f", stroke: "#23823c" }
];

const patterns = [
  { name: "중앙 방사형", numbers: [4, 6, 13, 17, 26, 28] },
  { name: "가로 기둥형", numbers: [16, 18, 20, 32, 33, 39] },
  { name: "완만한 상승형", numbers: [6, 13, 18, 28, 30, 36] },
  { name: "상하 대각형", numbers: [1, 2, 15, 28, 39, 45] },
  { name: "우측 꺾임형", numbers: [3, 28, 31, 32, 42, 45] },
  { name: "중앙 횡단형", numbers: [13, 15, 19, 21, 44, 45] },
  { name: "상단 확장형", numbers: [1, 7, 9, 17, 27, 38] },
  { name: "꺾인 연결형", numbers: [1, 3, 17, 26, 27, 42] },
  { name: "세로 낙하형", numbers: [1, 9, 16, 23, 24, 38] },
  { name: "중앙 군집형", numbers: [16, 24, 25, 30, 31, 32] }
];

const zodiacPatterns = [
  { name: "\uC591\uC790\uB9AC", image: "Aries.png", numbers: [9, 17, 25, 26, 33, 41] },
  { name: "\uD669\uC18C\uC790\uB9AC", image: "Taurus.png", numbers: [16, 10, 18, 25, 33, 41] },
  { name: "\uC30D\uB465\uC774\uC790\uB9AC", image: "Gemini.png", numbers: [40, 32, 23, 9, 11, 35] },
  { name: "\uAC8C\uC790\uB9AC", image: "Cancer.png", numbers: [16, 25, 13, 32, 38, 41] },
  { name: "\uC0AC\uC790\uC790\uB9AC", image: "Leo.png", numbers: [36, 23, 18, 11, 5, 13] },
  { name: "\uCC98\uB140\uC790\uB9AC", image: "Virgo.png", numbers: [36, 23, 24, 18, 11, 21] },
  { name: "\uCC9C\uCE6D\uC790\uB9AC", image: "Libra.png", numbers: [37, 30, 23, 11, 20, 34] },
  { name: "\uC804\uAC08\uC790\uB9AC", image: "Scorpio.png", numbers: [37, 38, 24, 18, 13, 27] },
  { name: "\uC0AC\uC218\uC790\uB9AC", image: "Sagittarius.png", numbers: [9, 17, 23, 31, 24, 34] },
  { name: "\uC5FC\uC18C\uC790\uB9AC", image: "Capricorn.png", numbers: [22, 20, 14, 40, 31, 23] },
  { name: "\uBB3C\uBCD1\uC790\uB9AC \uD30C\uB3D9\uD615", numbers: [8, 15, 23, 30, 38, 45] },
  { name: "\uBB3C\uACE0\uAE30\uC790\uB9AC V\uD615", numbers: [3, 11, 19, 27, 21, 15] }
];

function getBallPalette(number) {
  return COLOR_BY_RANGE.find((row) => number <= row.max) || COLOR_BY_RANGE[COLOR_BY_RANGE.length - 1];
}

function setBallStyle(ball, number) {
  const palette = getBallPalette(number);
  ball.style.background = `radial-gradient(circle at 32% 28%, #fff 0 12%, ${palette.fill} 16%, ${palette.fill} 55%, ${palette.stroke} 100%)`;
}

function drawMiniPattern(svg, numbers, options = {}) {
  const size = 11.8;
  const gap = 0;
  const start = 2;
  svg.setAttribute("viewBox", "0 0 87 87");
  svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
  const mapX = (n) => ((n - 1) % BOARD_COLS) * (size + gap) + start;
  const mapY = (n) => Math.floor((n - 1) / BOARD_COLS) * (size + gap) + start;
  const isZodiac = options.variant === "zodiac";
  const cellFill = isZodiac ? "rgba(2,13,34,.18)" : "#fff";
  const cellStroke = isZodiac ? "rgba(255,255,255,.72)" : "#eef1f6";
  const numberFill = isZodiac ? "rgba(255,255,255,.86)" : "#98a2b3";
  const lineStroke = isZodiac ? "rgba(255,255,255,.86)" : "rgba(79,112,179,.72)";
  let out = `<defs>${COLOR_BY_RANGE.map((color, index) => `<radialGradient id="ball-${index}" cx="32%" cy="28%" r="72%"><stop offset="0%" stop-color="#fff"/><stop offset="14%" stop-color="#fff"/><stop offset="19%" stop-color="${color.fill}"/><stop offset="68%" stop-color="${color.fill}"/><stop offset="100%" stop-color="${color.stroke}"/></radialGradient>`).join("")}</defs>${isZodiac ? "" : '<rect width="87" height="87" rx="6" fill="#fff"/>'}`;
  if (!isZodiac) {
    for (let n = 1; n <= 45; n++) {
      out += `<rect x="${mapX(n)}" y="${mapY(n)}" width="${size}" height="${size}" fill="${cellFill}" stroke="${cellStroke}" stroke-width=".7"/>`;
      out += `<text x="${mapX(n) + size / 2}" y="${mapY(n) + size / 2 + 1.6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.9" font-weight="700" fill="${numberFill}">${n}</text>`;
    }
    out += `<polyline points="${numbers.map((n) => `${mapX(n) + size / 2},${mapY(n) + size / 2}`).join(" ")}" fill="none" stroke="${lineStroke}" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  numbers.forEach((n) => {
    const palette = getBallPalette(n);
    const paletteIndex = COLOR_BY_RANGE.indexOf(palette);
    const opacity = isZodiac ? ".76" : "1";
    const textShadow = isZodiac ? ' stroke="rgba(0,0,0,.55)" stroke-width=".45" paint-order="stroke"' : "";
    out += `<circle cx="${mapX(n) + size / 2}" cy="${mapY(n) + size / 2}" r="4.1" fill="url(#ball-${paletteIndex})" stroke="${isZodiac ? "#fff" : palette.stroke}" stroke-width="${isZodiac ? "0.75" : "0.55"}" opacity="${opacity}"/>`;
    out += `<text x="${mapX(n) + size / 2}" y="${mapY(n) + size / 2 + 1.5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.2" font-weight="800" fill="#fff" opacity="${isZodiac ? ".9" : "1"}"${textShadow}>${n}</text>`;
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
