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
  const target = document.getElementById("machineStatus") || document.body;
  target.textContent = "LottoCore failed to load. Refresh the page.";
  throw new Error("LottoCore failed to load");
}

const machineCore = window.LottoCore;
const machineGetBallPalette = machineCore.getBallPalette;
const machineSetBallStyle = machineCore.setBallStyle;

const canvas = document.getElementById("machineCanvas");
const resultRail = document.getElementById("resultRail");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const statusText = document.getElementById("machineStatus");

const winners = [];
let engine;
let runner;
let render;
let balls = [];
let paddles = [];
let started = false;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const parentRect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.max(760, Math.floor(rect.width || parentRect.width || 960));
  canvas.height = Math.max(680, Math.floor(rect.height || parentRect.height || 720));
  if (render) {
    render.canvas.width = canvas.width;
    render.canvas.height = canvas.height;
    render.options.width = canvas.width;
    render.options.height = canvas.height;
  }
}

function board() {
  const w = canvas.width;
  const h = canvas.height;
  const left = w * 0.13;
  const right = w * 0.87;
  const top = 42;
  const finishY = h - 96;
  const slotCount = 9;
  const slotWidth = (right - left) / slotCount;
  return { w, h, left, right, top, finishY, slotCount, slotWidth };
}

function makeBallTexture(number) {
  const palette = machineGetBallPalette(number);
  const size = 72;
  const texture = document.createElement("canvas");
  texture.width = size;
  texture.height = size;
  const ctx = texture.getContext("2d");
  const gradient = ctx.createRadialGradient(23, 19, 4, 34, 34, 34);
  gradient.addColorStop(0, "#fff");
  gradient.addColorStop(0.16, palette.fill);
  gradient.addColorStop(0.72, palette.fill);
  gradient.addColorStop(1, palette.stroke);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(36, 36, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.beginPath();
  ctx.arc(24, 22, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(number, 36, 39);
  return texture.toDataURL();
}

function makeResultBall(number) {
  const ball = document.createElement("div");
  ball.className = "machine-result";
  ball.textContent = number;
  machineSetBallStyle(ball, number);
  return ball;
}

function createWalls(Matter) {
  const { Bodies, Composite } = Matter;
  const { w, h, left, right, top, finishY, slotCount, slotWidth } = board();
  const walls = [];

  walls.push(Bodies.rectangle(w / 2, h + 35, w, 70, { isStatic: true, render: { visible: false } }));
  walls.push(Bodies.rectangle(left - 18, h / 2, 26, h, {
    isStatic: true,
    angle: -0.04,
    render: { fillStyle: "rgba(210,232,255,.22)" }
  }));
  walls.push(Bodies.rectangle(right + 18, h / 2, 26, h, {
    isStatic: true,
    angle: 0.04,
    render: { fillStyle: "rgba(210,232,255,.22)" }
  }));
  walls.push(Bodies.rectangle(w / 2, top, right - left + 130, 18, {
    isStatic: true,
    render: { fillStyle: "rgba(210,232,255,.18)" }
  }));

  for (let row = 0; row < 8; row++) {
    const y = 150 + row * 54;
    const count = row % 2 ? 8 : 9;
    const gap = (right - left) / 9;
    for (let col = 0; col < count; col++) {
      const x = left + gap * (col + (row % 2 ? 1 : 0.5));
      walls.push(Bodies.circle(x, y, 8, {
        isStatic: true,
        restitution: 1.12,
        render: { fillStyle: "rgba(255,224,137,.92)" }
      }));
    }
  }

  for (let i = 0; i <= slotCount; i++) {
    const x = left + i * slotWidth;
    walls.push(Bodies.rectangle(x, finishY + 36, 10, 86, {
      isStatic: true,
      render: { fillStyle: "rgba(210,232,255,.24)" }
    }));
  }
  walls.push(Bodies.rectangle(w / 2, finishY + 82, right - left + 20, 14, {
    isStatic: true,
    render: { fillStyle: "rgba(255,107,107,.55)" }
  }));

  const ramps = [
    [left + 130, 305, 160, -0.24],
    [right - 130, 370, 160, 0.24],
    [left + 170, 465, 185, 0.18],
    [right - 170, 530, 185, -0.18]
  ];
  ramps.forEach(([x, y, width, angle]) => {
    walls.push(Bodies.rectangle(x, y, width, 12, {
      isStatic: true,
      angle,
      restitution: 0.6,
      render: { fillStyle: "rgba(126,164,214,.38)" }
    }));
  });

  const sensor = Bodies.rectangle(w / 2, finishY + 5, right - left, 12, {
    isStatic: true,
    isSensor: true,
    label: "finish-line",
    render: { fillStyle: "rgba(52,211,153,.14)" }
  });
  walls.push(sensor);
  Composite.add(engine.world, walls);
}

function createPaddles(Matter) {
  const { Bodies, Body, Composite } = Matter;
  const { left, right } = board();
  paddles = [
    Bodies.rectangle(left + 215, 250, 92, 10, { isStatic: true, label: "paddle", render: { fillStyle: "#7dd3fc" } }),
    Bodies.rectangle(right - 215, 250, 92, 10, { isStatic: true, label: "paddle", render: { fillStyle: "#fca5a5" } }),
    Bodies.rectangle(left + 290, 420, 105, 10, { isStatic: true, label: "paddle", render: { fillStyle: "#fde68a" } }),
    Bodies.rectangle(right - 290, 420, 105, 10, { isStatic: true, label: "paddle", render: { fillStyle: "#86efac" } })
  ];
  paddles.forEach((paddle, index) => {
    paddle.spin = index % 2 ? -0.055 : 0.055;
    Body.setAngle(paddle, index % 2 ? -0.45 : 0.45);
  });
  Composite.add(engine.world, paddles);
}

function createBalls(Matter) {
  const { Bodies, Body, Composite } = Matter;
  const { w } = board();
  balls = [];
  for (let n = 1; n <= 45; n++) {
    const row = Math.floor((n - 1) / 9);
    const col = (n - 1) % 9;
    const x = w / 2 - 172 + col * 43 + (row % 2) * 17;
    const y = 72 + row * 31;
    const body = Bodies.circle(x, y, 16, {
      restitution: 0.72,
      friction: 0.002,
      frictionAir: 0.006,
      density: 0.001,
      label: `ball-${n}`,
      render: {
        sprite: {
          texture: makeBallTexture(n),
          xScale: 0.47,
          yScale: 0.47
        }
      }
    });
    body.lottoNumber = n;
    Body.setStatic(body, true);
    balls.push(body);
  }
  Composite.add(engine.world, balls);
}

function initPhysics() {
  if (!window.Matter) {
    statusText.textContent = "Matter.js failed to load. Check network access.";
    startBtn.disabled = true;
    return;
  }

  const Matter = window.Matter;
  const { Engine, Render, Runner, Composite, Events } = Matter;

  resizeCanvas();
  if (runner) Runner.stop(runner);
  if (render) Render.stop(render);

  winners.length = 0;
  resultRail.innerHTML = "";
  started = false;
  startBtn.disabled = false;

  engine = Engine.create();
  engine.gravity.y = 0.82;
  render = Render.create({
    canvas,
    engine,
    options: {
      width: canvas.width,
      height: canvas.height,
      wireframes: false,
      background: "transparent",
      pixelRatio: window.devicePixelRatio || 1
    }
  });

  Composite.clear(engine.world, false);
  createWalls(Matter);
  createPaddles(Matter);
  createBalls(Matter);

  Events.on(engine, "beforeUpdate", updatePaddles);
  Events.on(engine, "collisionStart", handleCollisions);

  runner = Runner.create();
  Render.run(render);
  Runner.run(runner, engine);
  statusText.textContent = "Ready. 45 balls loaded.";
}

function updatePaddles() {
  if (!started) return;
  const Matter = window.Matter;
  paddles.forEach((paddle) => {
    Matter.Body.setAngle(paddle, paddle.angle + paddle.spin);
  });
}

function handleCollisions(event) {
  const Matter = window.Matter;
  event.pairs.forEach((pair) => {
    const bodies = [pair.bodyA, pair.bodyB];
    const ball = bodies.find((body) => body.lottoNumber);
    const finish = bodies.find((body) => body.label === "finish-line");
    if (!ball || !finish || winners.includes(ball.lottoNumber)) return;

    winners.push(ball.lottoNumber);
    resultRail.appendChild(makeResultBall(ball.lottoNumber));
    statusText.textContent = winners.length < 6
      ? `Ball ${ball.lottoNumber} finished. ${6 - winners.length} more to go.`
      : "Draw complete.";

    Matter.Composite.remove(engine.world, ball);
    if (winners.length >= 6) {
      started = false;
      startBtn.disabled = true;
      balls.forEach((candidate) => {
        if (!winners.includes(candidate.lottoNumber)) Matter.Body.setStatic(candidate, true);
      });
    }
  });
}

function startDraw() {
  if (started || winners.length >= 6) return;
  const Matter = window.Matter;
  started = true;
  startBtn.disabled = true;
  statusText.textContent = "Marbles dropped. Waiting for first six winners...";
  balls.forEach((ball, index) => {
    Matter.Body.setStatic(ball, false);
    Matter.Body.setVelocity(ball, {
      x: (Math.random() - 0.5) * 2.2,
      y: index * 0.006
    });
    Matter.Body.setAngularVelocity(ball, (Math.random() - 0.5) * 0.22);
  });
}

function resetDraw() {
  initPhysics();
}

startBtn.addEventListener("click", startDraw);
resetBtn.addEventListener("click", resetDraw);
window.addEventListener("resize", () => {
  clearTimeout(window.__machineResizeTimer);
  window.__machineResizeTimer = setTimeout(resetDraw, 250);
});

initPhysics();
