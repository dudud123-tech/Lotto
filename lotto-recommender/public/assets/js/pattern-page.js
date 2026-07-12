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
const selectedSummary = document.querySelector(".board-summary");
const patternTab = document.getElementById("patternTab");
const zodiacTab = document.getElementById("zodiacTab");

const cells = [];
let boardLines = null;
let activeCatalog = "zodiac";
const state = { numbers: [], lineOrder: [], activePatternIndex: 0, dragNumber: null, dragGhost: null };

const ZODIAC_POINTS = {
  "Aries.png": [[15,20],[28,32],[40,43],[44,48],[48,53],[51,65]],
  "Taurus.png": [[19,31],[31,41],[30,15],[43,33],[46,41],[56,54]],
  "Gemini.png": [[19,18],[36,18],[12,30],[22,47],[46,38],[55,71]],
  "Cancer.png": [[14,25],[31,43],[50,16],[33,55],[27,70],[56,63]],
  "Leo.png": [[49,17],[58,22],[40,26],[41,35],[20,43],[12,64]],
  "Virgo.png": [[36,18],[36,30],[26,42],[18,43],[35,57],[26,69]],
  "Libra.png": [[32,22],[50,30],[18,39],[18,56],[52,56],[32,39]],
  "Scorpio.png": [[54,14],[58,27],[36,28],[29,35],[19,45],[11,61]],
  "Sagittarius.png": [[18,23],[28,38],[36,41],[40,23],[42,46],[54,55]],
  "Capricorn.png": [[11,37],[32,37],[58,28],[44,63],[24,52],[18,46]]
};

function drawZodiacPreview(svg, pattern) {
  const points = ZODIAC_POINTS[pattern.image];
  if (!points) {
    drawMiniPatternCard(svg, pattern.numbers);
    return;
  }
  svg.setAttribute("viewBox", "0 0 70 100");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const balls = points.map(([x, y], index) => {
    const number = pattern.numbers[index];
    const palette = core.getBallPalette(number);
    return `<circle cx="${x}" cy="${y}" r="4.7" fill="${palette.fill}" stroke="#fff" stroke-width=".8"/><text x="${x}" y="${y + 1.5}" text-anchor="middle" font-family="Arial,sans-serif" font-size="3.7" font-weight="900" fill="#fff">${number}</text>`;
  }).join("");
  svg.innerHTML = `<polyline points="${line}" fill="none" stroke="rgba(255,255,255,.84)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/>${balls}`;
}

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
  for (let n = 1; n <= 49; n++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    if (n <= 45) {
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
      cells.push(cell);
    } else {
      cell.classList.add("empty");
      cell.setAttribute("aria-hidden", "true");
    }
    board.appendChild(cell);
  }
  requestAnimationFrame(drawBoardLines);
}

function renderPatternCards() {
  patternGrid.innerHTML = "";
  getSource().slice(0, 10).forEach((pattern, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pattern";
    if (activeCatalog === "zodiac" && pattern.image) {
      card.classList.add("zodiac-pattern");
      card.style.setProperty("--zodiac-image", `url("/assets/images/zodiac/${encodeURIComponent(pattern.image)}")`);
    }
    card.dataset.index = String(index);
    card.innerHTML = `
      <h3>${pattern.name}</h3>
      <svg class="mini" viewBox="0 0 100 100" aria-hidden="true"></svg>
    `;
    card.addEventListener("click", () => applyPattern(index));
    patternGrid.appendChild(card);
    const preview = card.querySelector("svg");
    drawMiniPatternCard(preview, pattern.numbers);
    if (activeCatalog === "zodiac" && pattern.image) {
      card.addEventListener("mouseenter", () => drawMiniPatternCard(preview, pattern.numbers, { variant: "zodiac" }));
      card.addEventListener("mouseleave", () => drawMiniPatternCard(preview, pattern.numbers));
    }
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
    statusText.textContent = "\uC774\uBBF8 \uC120\uD0DD\uB41C \uBC88\uD638\uC785\uB2C8\uB2E4.";
    return;
  }
  state.numbers[fromIndex] = toNumber;
  state.lineOrder = state.lineOrder.map((number) => number === fromNumber ? toNumber : number);
  state.numbers = [...new Set(state.numbers)].sort((a, b) => a - b);
  renderBalls();
  statusText.textContent = "\uD328\uD134\uC744 \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4.";
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
  polyline.setAttribute("stroke", "rgba(17,24,39,.82)");
  polyline.setAttribute("stroke-width", "4.8");
  polyline.setAttribute("vector-effect", "non-scaling-stroke");
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
  statusText.textContent = `${source[index].name} \uC801\uC6A9\uB428. \uB4DC\uB798\uADF8\uB85C \uC218\uC815\uD558\uC138\uC694.`;
}

function syncUI() {
  selectedNumbers.innerHTML = state.numbers.length
    ? state.numbers.map((n) => `<span class="result-ball" data-number="${n}">${n}</span>`).join("")
    : `<span class="small">No numbers selected yet.</span>`;
  analysisText.textContent = "";
  selectedNumbers.querySelectorAll(".result-ball").forEach((ball) => {
    applyBallStyle(ball, Number(ball.dataset.number));
  });
}

function sendSelectedNumbersToRecent() {
  if (state.numbers.length === 6 && window.parent !== window) {
    window.parent.postMessage({ type: "lotto:recentNumbers", numbers: state.numbers }, "*");
  }
}

function clearBoard() {
  state.numbers = [];
  state.lineOrder = [];
  patternGrid.querySelectorAll(".pattern").forEach((el) => el.classList.remove("active"));
  cells.forEach((cell) => cell.classList.remove("selected"));
  renderBalls();
  statusText.textContent = "\uD328\uD134\uC744 \uC120\uD0DD\uD558\uBA74 \uBC88\uD638\uAC00 \uBC30\uCE58\uB429\uB2C8\uB2E4.";
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
  statusText.textContent = "\uD604\uC7AC \uBC88\uD638\uB97C \uC11E\uC5C8\uC2B5\uB2C8\uB2E4.";
}

function autoPickPattern() {
  applyPattern(Math.floor(Math.random() * getSource().length));
}

function setCatalog(mode) {
  activeCatalog = mode;
  catalogTitle.textContent = mode === "pattern" ? "\uCD94\uCC9C \uD328\uD134" : "\uBCC4\uC790\uB9AC \uD328\uD134";
  catalogDesc.textContent = mode === "pattern"
    ? "AI가 이전 당첨번호 흐름을 참고해 뽑아낸 추천 패턴입니다."
    : "\uBCC4\uC790\uB9AC \uC774\uBBF8\uC9C0\uC640 \uBC88\uD638 \uBC30\uCE58\uB97C \uBE44\uAD50\uD558\uBA70 \uB098\uB9CC\uC758 \uD328\uD134\uC744 \uCC3E\uC544\uBCF4\uC138\uC694.";
  patternTab.classList.toggle("primary", mode === "pattern");
  zodiacTab.classList.toggle("primary", mode === "zodiac");
  renderPatternCards();
  applyPattern(0);
}

patternTab.addEventListener("click", () => setCatalog("pattern"));
zodiacTab.addEventListener("click", () => setCatalog("zodiac"));
selectedSummary?.addEventListener("click", sendSelectedNumbersToRecent);
window.addEventListener("message", (event) => {
  if (event.data?.type !== "lotto:setCatalog") return;
  if (event.data.mode !== "pattern" && event.data.mode !== "zodiac") return;
  setCatalog(event.data.mode);
});
window.addEventListener("resize", drawBoardLines);

renderBoardShell();
setCatalog("zodiac");
document.documentElement.dataset.patternReady = "true";
