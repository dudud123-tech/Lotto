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
