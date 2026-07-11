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
if (!window.LottoCore) {
  const target = document.getElementById("patternGrid") || document.body;
  target.innerHTML = `<p class="small">LottoCore failed to load. Refresh the page.</p>`;
  throw new Error("LottoCore failed to load");
}

const core = window.LottoCore;
const patternData = core.patterns;
const zodiacPatternData = core.zodiacPatterns;
const drawMiniPatternCard = core.drawMiniPattern;
const applyBallStyle = core.setBallStyle;

const board = document.getElementById("board");
const patternGrid = document.getElementById("patternGrid");
const catalogTitle = document.getElementById("catalogTitle");
const catalogDesc = document.getElementById("catalogDesc");
const statusText = document.getElementById("statusText");
const selectedNumbers = document.getElementById("selectedNumbers");
const analysisText = document.getElementById("analysisText");
const clearBtn = document.getElementById("clearBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const autoBtn = document.getElementById("autoBtn");
const patternTab = document.getElementById("patternTab");
const zodiacTab = document.getElementById("zodiacTab");

const cells = [];
let boardLines = null;
let activeCatalog = "pattern";
const state = { numbers: [], lineOrder: [], activePatternIndex: 0, dragNumber: null, dragGhost: null };

function getSource() {
  return activeCatalog === "pattern" ? patternData : zodiacPatternData;
}

function cellPosition(number) {
  return cells[number - 1];
}

function renderBoardShell() {
  board.innerHTML = "";
  cells.length = 0;
  boardLines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  boardLines.classList.add("board-lines");
  boardLines.setAttribute("aria-hidden", "true");
  board.appendChild(boardLines);
  for (let n = 1; n <= 45; n++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.number = String(n);
    cell.innerHTML = `<span class="cell-num">${n}</span>`;
    cell.addEventListener("dragover", (e) => e.preventDefault());
    cell.addEventListener("drop", (e) => {
      e.preventDefault();
      if (state.dragNumber) {
        moveNumber(state.dragNumber, n);
        clearDragState();
      }
    });
    board.appendChild(cell);
    cells.push(cell);
  }
  requestAnimationFrame(drawBoardLines);
}

function renderPatternCards() {
  patternGrid.innerHTML = "";
  getSource().forEach((pattern, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pattern";
    card.dataset.index = String(index);
    card.innerHTML = `
      <h3>${pattern.name}</h3>
      <p class="desc">${pattern.round}<br>${pattern.desc}</p>
      <svg class="mini" viewBox="0 0 100 100" aria-hidden="true"></svg>
    `;
    card.addEventListener("click", () => applyPattern(index));
    patternGrid.appendChild(card);
    drawMiniPatternCard(card.querySelector("svg"), pattern.numbers);
  });
}

function renderBalls() {
  cells.forEach((cell) => cell.querySelectorAll(".ball").forEach((el) => el.remove()));
  state.numbers.forEach((number) => {
    const cell = cellPosition(number);
    if (!cell) return;
    const ball = document.createElement("div");
    ball.className = "ball";
    ball.textContent = number;
    applyBallStyle(ball, number);
    ball.addEventListener("pointerdown", onBallPointerDown);
    cell.appendChild(ball);
  });
  syncUI();
  drawBoardLines();
}

function moveNumber(fromNumber, toNumber) {
  const fromIndex = state.numbers.indexOf(fromNumber);
  if (fromIndex === -1) return;
  if (state.numbers.includes(toNumber)) {
    statusText.textContent = "Already used. Move to an empty cell.";
    return;
  }
  state.numbers[fromIndex] = toNumber;
  state.lineOrder = state.lineOrder.map((number) => number === fromNumber ? toNumber : number);
  state.numbers = [...new Set(state.numbers)].sort((a, b) => a - b);
  renderBalls();
  statusText.textContent = "Pattern updated.";
}

function drawBoardLines() {
  if (!boardLines) return;
  const boardRect = board.getBoundingClientRect();
  const points = state.lineOrder.map((number) => {
    const ball = state.dragNumber === number && state.dragGhost ? state.dragGhost : cellPosition(number)?.querySelector(".ball");
    if (!ball) return null;
    const rect = ball.getBoundingClientRect();
    return { x: rect.left - boardRect.left + rect.width / 2, y: rect.top - boardRect.top + rect.height / 2 };
  }).filter(Boolean);
  boardLines.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);
  boardLines.innerHTML = "";
  if (points.length < 2) return;
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", points.map((p) => `${p.x},${p.y}`).join(" "));
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "rgba(255,255,255,.9)");
  polyline.setAttribute("stroke-width", "3.2");
  polyline.setAttribute("stroke-linecap", "round");
  polyline.setAttribute("stroke-linejoin", "round");
  boardLines.appendChild(polyline);
}

function onBallPointerDown(e) {
  const ball = e.currentTarget;
  const cell = ball.parentElement;
  const number = Number(cell?.dataset.number);
  if (!number) return;
  e.preventDefault();
  state.dragNumber = number;
  highlightSelectedCell(number);
  const rect = ball.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  const ghost = ball.cloneNode(true);
  ghost.classList.add("dragging");
  ghost.style.position = "absolute";
  ghost.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
  ghost.style.top = `${rect.top - boardRect.top + rect.height / 2}px`;
  ghost.style.transform = "translate(-50%, -50%) scale(1.08)";
  ghost.style.pointerEvents = "none";
  ghost.style.zIndex = "6";
  board.appendChild(ghost);
  state.dragGhost = ghost;
  drawBoardLines();
  const onMove = (ev) => {
    ghost.style.left = `${ev.clientX - boardRect.left}px`;
    ghost.style.top = `${ev.clientY - boardRect.top}px`;
    drawBoardLines();
  };
  const onUp = (ev) => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".cell");
    if (target) {
      const targetNumber = Number(target.dataset.number);
      if (targetNumber && targetNumber !== number) moveNumber(number, targetNumber);
      else renderBalls();
    } else {
      renderBalls();
    }
    clearDragState();
  };
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

function clearDragState() {
  state.dragNumber = null;
  state.dragGhost?.remove();
  state.dragGhost = null;
  document.querySelectorAll(".ball.dragging").forEach((el) => el.classList.remove("dragging"));
  cells.forEach((cell) => cell.classList.remove("selected"));
  drawBoardLines();
}

function highlightSelectedCell(number) {
  cells.forEach((cell) => cell.classList.remove("selected"));
  cellPosition(number)?.classList.add("selected");
}

function applyPattern(index) {
  const source = getSource();
  state.activePatternIndex = index;
  state.lineOrder = [...source[index].numbers];
  state.numbers = [...source[index].numbers].sort((a, b) => a - b);
  patternGrid.querySelectorAll(".pattern").forEach((el) => el.classList.remove("active"));
  patternGrid.querySelector(`.pattern[data-index="${index}"]`)?.classList.add("active");
  renderBalls();
  statusText.textContent = `${source[index].name} applied. Drag a ball to edit it.`;
}

function syncUI() {
  selectedNumbers.innerHTML = state.numbers.length
    ? state.numbers.map((n) => `<span class="tag">${n}</span>`).join("")
    : `<span class="small">No numbers selected yet.</span>`;
  const odds = state.numbers.filter((n) => n % 2 === 1).length;
  const evens = state.numbers.length - odds;
  const low = state.numbers.filter((n) => n <= 22).length;
  const high = state.numbers.filter((n) => n >= 23).length;
  analysisText.textContent = state.numbers.length
    ? `Odd/even ${odds}:${evens}, low/high ${low}:${high}. Editing ${activeCatalog === "pattern" ? "pattern" : "zodiac"} mode.`
    : "Select a pattern to see the summary.";
}

function clearBoard() {
  state.numbers = [];
  state.lineOrder = [];
  patternGrid.querySelectorAll(".pattern").forEach((el) => el.classList.remove("active"));
  cells.forEach((cell) => cell.classList.remove("selected"));
  renderBalls();
  statusText.textContent = "Select a pattern to place numbers.";
}

function shuffleCurrent() {
  if (!state.numbers.length) {
    applyPattern(Math.floor(Math.random() * getSource().length));
    return;
  }
  state.numbers = state.numbers
    .map((n) => ({ n, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((item) => item.n)
    .sort((a, b) => a - b);
  state.lineOrder = [...state.numbers];
  renderBalls();
  statusText.textContent = "Current numbers shuffled.";
}

function autoPickPattern() {
  applyPattern(Math.floor(Math.random() * getSource().length));
}

function setCatalog(mode) {
  activeCatalog = mode;
  catalogTitle.textContent = mode === "pattern" ? "10 Patterns" : "12 Zodiac";
  catalogDesc.textContent = mode === "pattern"
    ? "Pattern cards based on previous winning rounds."
    : "Zodiac silhouettes compressed onto the 1-45 board.";
  patternTab.classList.toggle("primary", mode === "pattern");
  zodiacTab.classList.toggle("primary", mode === "zodiac");
  renderPatternCards();
  applyPattern(0);
}

clearBtn.addEventListener("click", clearBoard);
shuffleBtn.addEventListener("click", shuffleCurrent);
autoBtn.addEventListener("click", autoPickPattern);
patternTab.addEventListener("click", () => setCatalog("pattern"));
zodiacTab.addEventListener("click", () => setCatalog("zodiac"));
window.addEventListener("resize", drawBoardLines);

renderBoardShell();
setCatalog("pattern");
document.documentElement.dataset.patternReady = "true";
