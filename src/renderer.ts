import Phaser from "phaser";
import {
  hexDistance,
  residentMode,
  type Cell,
  type ResidentMode,
  type World,
} from "./simulation.ts";

type Ctx = CanvasRenderingContext2D;

type Point = [number, number];

type Paint = string | CanvasGradient | null;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

interface Hover {
  c: Cell;
  d: number;
}

export interface WorldRenderer {
  sprinkle(cellId: number, color: string): void;
  setTarget(id: number): void;
  pause(value: boolean): void;
  debug(): { particles: number; canvas: number; fps: number; frames: number };
  destroy(): void;
}

export interface WorldCallbacks {
  getWorld: () => World;
  onTap: (cellId: number) => void;
}

export const project = (cell: Cell) => ({
  x: 480 + (cell.q + cell.r / 2) * 48,
  y: 332 + cell.r * 27 - (cell.land ? 25 : 0),
});

const ellipse = (
  ctx: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: Paint,
  stroke?: string,
) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
};

function path(ctx: Ctx, points: Point[], fill: Paint, stroke?: string) {
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function line(ctx: Ctx, points: Point[], color: string, width = 2) {
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function tree(ctx: Ctx, x: number, y: number, scale: number, variant: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ellipse(ctx, 0, 4, 12, 4, "#4c6d4933");
  line(
    ctx,
    [
      [0, 1],
      [0, -29],
    ],
    "#596748",
    3,
  );
  const greens = ["#658449", "#78964c", "#477c59", "#849f57"];
  ellipse(ctx, -8, -26, 12, 16, greens[variant]);
  ellipse(ctx, 7, -32, 13, 18, greens[(variant + 1) % 4]);
  ellipse(ctx, 0, -42, 10, 12, greens[variant]);
  line(
    ctx,
    [
      [0, -13],
      [-7, -27],
    ],
    "#9eb06b",
    1,
  );
  ctx.restore();
}

function sprout(ctx: Ctx, x: number, y: number, id: number, time: number, mode: ResidentMode) {
  ctx.save();
  ctx.translate(x, y);

  if (mode === "flying") {
    ellipse(ctx, 0, -23, 15, 22, "#edf8e333", "#bedbd3");
    ellipse(ctx, -5, -29, 3, 7, "#fff8");
    line(
      ctx,
      [
        [-8, -6],
        [-5, 6],
        [5, 6],
        [8, -6],
      ],
      "#8a9874",
      1,
    );
  }

  if (mode === "sailing") {
    path(
      ctx,
      [
        [-17, 6],
        [17, 6],
        [10, 15],
        [-10, 15],
      ],
      "#edc282",
      "#927857",
    );
    line(
      ctx,
      [
        [4, 7],
        [4, -19],
      ],
      "#685747",
      1.5,
    );
    path(
      ctx,
      [
        [4, -18],
        [4, 2],
        [18, 0],
      ],
      "#f9e9c6",
    );
  }

  ellipse(ctx, 0, 12, 11, 4, "#304c4424");
  const bounce = Math.sin(time * 2 + id) * 1.5;
  ellipse(
    ctx,
    0,
    0 + bounce,
    8,
    10,
    id % 3 === 0 ? "#f2cc86" : id % 3 === 1 ? "#e7d9b1" : "#f6e9c7",
    "#847a51",
  );
  line(
    ctx,
    [
      [-4, 8 + bounce],
      [-5, 13],
      [0, 12],
    ],
    "#726949",
    1.5,
  );
  line(
    ctx,
    [
      [4, 8 + bounce],
      [6, 12],
      [9, 11],
    ],
    "#726949",
    1.5,
  );
  ellipse(ctx, -2, -2 + bounce, 1, 1.5, "#514f39");
  ellipse(ctx, 3, -2 + bounce, 1, 1.5, "#514f39");
  ctx.beginPath();
  ctx.arc(1, 1 + bounce, 2, 0, Math.PI);
  ctx.strokeStyle = "#81734e";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  line(
    ctx,
    [
      [0, -9 + bounce],
      [0, -17 + bounce],
    ],
    "#557247",
    1.2,
  );
  ellipse(ctx, -4, -15 + bounce, 5, 2.8, "#749452");
  ellipse(ctx, 4, -18 + bounce, 5, 2.8, "#90aa5e");
  ctx.restore();
}

function cloud(ctx: Ctx, x: number, y: number, scale: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#fffdf3";
  ctx.beginPath();
  ctx.moveTo(-47, 10);
  ctx.bezierCurveTo(-72, 8, -66, -20, -45, -18);
  ctx.bezierCurveTo(-42, -50, -7, -47, 0, -23);
  ctx.bezierCurveTo(22, -40, 48, -19, 39, 0);
  ctx.bezierCurveTo(66, -1, 61, 19, 42, 19);
  ctx.lineTo(-47, 19);
  ctx.fill();
  ctx.restore();
}

export function mountWorld(parent: HTMLElement, callbacks: WorldCallbacks): WorldRenderer {
  const { getWorld, onTap } = callbacks;

  let selected = 30,
    hovered: Hover | null = null,
    phase = 0,
    frames = 0,
    reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const particles: Particle[] = [];

  class BowlScene extends Phaser.Scene {
    bowl: Phaser.Textures.CanvasTexture | null = null;

    create() {
      this.game.canvas.setAttribute("aria-hidden", "true");
      this.bowl = this.textures.createCanvas("bowl", 960, 640);
      this.add.image(0, 0, "bowl").setOrigin(0);
      const canvas = this.game.canvas;

      const position = (event: PointerEvent) => {
        const box = canvas.getBoundingClientRect();

        return {
          x: ((event.clientX - box.left) * 960) / box.width,
          y: ((event.clientY - box.top) * 640) / box.height,
        };
      };

      let start: { id: number; x: number; y: number } | null = null;
      canvas.addEventListener("pointermove", (event) => {
        const p = position(event);
        hovered = getWorld()
          .cells.map((c) => ({
            c,
            d: Math.hypot(project(c).x - p.x, (project(c).y - p.y) * 1.4),
          }))
          .sort((a, b) => a.d - b.d)[0];

        if (hovered && hovered.d > 47) hovered = null;
      });
      canvas.addEventListener("pointerleave", () => {
        hovered = null;
      });
      canvas.addEventListener("pointerdown", (event) => {
        if (event.isPrimary && event.button === 0)
          start = { id: event.pointerId, x: event.clientX, y: event.clientY };
      });
      canvas.addEventListener("pointercancel", () => {
        start = null;
      });
      canvas.addEventListener("pointerup", (event) => {
        if (!start || start.id !== event.pointerId) return;

        const moved = Math.hypot(start.x - event.clientX, start.y - event.clientY);

        start = null;

        if (moved > 12) return;
        const pointer = position(event);

        const closest = getWorld()
          .cells.map((c) => ({
            c,
            d: Math.hypot(project(c).x - pointer.x, (project(c).y - pointer.y) * 1.4),
          }))
          .sort((a, b) => a.d - b.d)[0];

        if (closest && closest.d < 47) {
          selected = closest.c.id;
          onTap(selected);
        }
      });
    }
    update(_time: number, delta: number) {
      const context = this.bowl?.context;

      if (!context) return;
      frames = (frames + 1) % 1000000000;
      phase += reduced ? 0 : Math.min(delta, 80) / 1000;
      draw(context, getWorld(), phase);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= Math.min(delta, 80) / 1000;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        p.y += (p.vy * delta) / 1000;
        p.x += (p.vx * delta) / 1000;
        ellipse(context, p.x, p.y, p.size, p.size * 0.8, p.color);
      }
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: 960,
    height: 640,
    transparent: true,
    scene: BowlScene,
    fps: { target: 30, forceSetTimeOut: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
    render: { antialias: true, roundPixels: false },
    input: { mouse: false, touch: false },
  });

  function draw(ctx: Ctx, w: World, t: number) {
    ctx.clearRect(0, 0, 960, 640);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    // Pencil-like environmental marks keep the world a small, hand-made object.
    ctx.strokeStyle = "#d8d2bf";
    ctx.lineWidth = 1;

    for (const [x, y] of [
      [164, 195],
      [791, 235],
      [155, 426],
      [762, 489],
    ]) {
      line(
        ctx,
        [
          [x - 5, y],
          [x + 5, y],
        ],
        "#d8d2bf",
        1,
      );
      line(
        ctx,
        [
          [x, y - 5],
          [x, y + 5],
        ],
        "#d8d2bf",
        1,
      );
    }

    ellipse(ctx, 480, 547, 252, 35, "#d9cbb741");
    ellipse(ctx, 480, 544, 194, 18, "#c5bda633");
    // Ceramic body, painted first so the water and habitat sit inside the rim.
    const bowlGradient = ctx.createLinearGradient(0, 335, 0, 535);
    bowlGradient.addColorStop(0, "#efe0c7");
    bowlGradient.addColorStop(0.8, "#e5c9a8");
    bowlGradient.addColorStop(1, "#d2af8d");
    ctx.beginPath();
    ctx.moveTo(187, 338);
    ctx.bezierCurveTo(209, 574, 750, 574, 773, 338);
    ctx.bezierCurveTo(650, 417, 308, 417, 187, 338);
    ctx.fillStyle = bowlGradient;
    ctx.fill();
    ctx.strokeStyle = "#aa9378";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.strokeStyle = "#c48560";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(480, 346, 285, 171, 0, 0.12, Math.PI - 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(480, 364, 281, 167, 0, 0.19, Math.PI - 0.19);
    ctx.stroke();

    for (let i = 0; i < 17; i++) {
      const a = 0.3 + (i * (Math.PI - 0.6)) / 16;

      const x = 480 + 266 * Math.cos(a),
        y = 364 + 164 * Math.sin(a);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a - Math.PI / 2);
      path(
        ctx,
        [
          [-4, -8],
          [0, -14],
          [4, -8],
          [0, -2],
        ],
        null,
        "#c38b69",
      );
      ctx.restore();
    }

    ctx.restore();
    ellipse(ctx, 480, 326, 294, 169, "#f3e5cc", "#af9779");
    const sea = ctx.createLinearGradient(0, 220, 0, 490);
    sea.addColorStop(0, w.salinity > 30 ? "#4e908a" : "#6aa29a");
    sea.addColorStop(1, w.salinity > 30 ? "#2f716f" : "#3f8580");
    ellipse(ctx, 480, 326, 274, 151, sea, "#b7b795");
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(480, 326, 271, 148, 0, 0, Math.PI * 2);
    ctx.clip();

    for (let i = 0; i < 16; i++) {
      const x = 245 + ((i * 89) % 470) + Math.sin(t * 0.4 + i) * 6,
        y = 230 + ((i * 41) % 200);

      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.quadraticCurveTo(x, y + 3, x + 10, y);
      ctx.strokeStyle = "#c5e0c849";
      ctx.lineWidth = 1.7;
      ctx.stroke();
    }

    if (w.salinity >= 30)
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;

        const x = 480 + 225 * Math.cos(a),
          y = 326 + 115 * Math.sin(a);

        line(
          ctx,
          [
            [x, y],
            [x - 2 + Math.sin(t + i) * 3, y - 12],
            [x + 3, y - 23],
          ],
          "#a3b967",
          2,
        );
      }

    ctx.restore();

    const cells = [...w.cells].sort((a, b) => project(a).y - project(b).y || a.q - b.q);

    for (const c of cells.filter((c) => c.land)) {
      const { x, y } = project(c),
        points: Point[] = [
          [x - 24, y - 14],
          [x, y - 25],
          [x + 24, y - 14],
          [x + 24, y + 14],
          [x, y + 25],
          [x - 24, y + 14],
        ];

      const shore = w.cells.some((n) => !n.land && hexDistance(n, c) <= 1);

      if (shore) {
        path(
          ctx,
          points.map(([px, py]): Point => [px, py + 14]),
          "#a3945e",
        );
      }

      const color =
        c.salt >= 65
          ? "#cab780"
          : c.moisture < 25
            ? "#bdb47d"
            : ["#a9bc78", "#b4c681", "#a6bc76", "#b8c78a"][c.variant];

      path(ctx, points, color);
      ctx.strokeStyle = "#afc08244";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tiny strokes make ground readable without a grid overlay.
      for (let j = 0; j < 3; j++) {
        const xx = x - 13 + j * 11,
          yy = y + 6 + (j % 2) * 5;

        line(
          ctx,
          [
            [xx - 2, yy],
            [xx, yy - 3],
            [xx + 2, yy],
          ],
          c.salt > 65 ? "#a69764" : "#72945766",
          1,
        );
      }

      if (c.sugar > 18) {
        ellipse(ctx, x + 12, y + 3, 2, 2, "#dfc363");
        ellipse(ctx, x - 9, y - 7, 1.8, 1.8, "#f4db94");
      }

      if (c.acid > 12) ellipse(ctx, x + 8, y + 9, 4, 2, "#d5be4a");

      if (c.soda > 12) ellipse(ctx, x - 8, y + 10, 4, 2, "#e8e4d5");
    }

    const chosen = w.cells[hovered?.c.id ?? selected];

    if (chosen) {
      const { x, y } = project(chosen);
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1.5;
      ellipse(ctx, x, y, 25, 16, null, "#fdf3dc");
      ctx.restore();
    }

    // Trees and residents are sorted together for predictable depth.
    const objects: { y: number; draw: () => void }[] = [];

    for (const c of cells.filter((c) => c.land)) {
      const p = project(c);

      if (c.herbs > 40)
        objects.push({
          y: p.y,
          draw: () =>
            tree(ctx, p.x + (c.variant - 1) * 4, p.y, Math.min(1.3, c.herbs / 60), c.variant),
        });
      else if (c.herbs > 25)
        objects.push({
          y: p.y,
          draw: () => {
            line(
              ctx,
              [
                [p.x, p.y],
                [p.x, p.y - 10],
              ],
              "#6d8948",
              1.5,
            );
            ellipse(ctx, p.x - 4, p.y - 8, 5, 3, "#739448");
            ellipse(ctx, p.x + 4, p.y - 11, 5, 3, "#83a34f");
          },
        });

      if (c.flowers > 3)
        for (let j = 0; j < Math.min(4, Math.ceil(c.flowers / 12)); j++) {
          const x = p.x - 14 + j * 8,
            y = p.y + 11;

          line(
            ctx,
            [
              [x, y],
              [x, y - 8],
            ],
            "#729653",
            1,
          );
          ellipse(ctx, x, y - 8, 3, 3, j % 2 ? "#ecb680" : "#f4deac");
          ellipse(ctx, x + Math.sin(t + j) * 7, y - 19 - Math.cos(t + j) * 3, 2, 2, "#ffe2a5");
        }
    }

    w.residents.forEach((r) => {
      const p = project(w.cells[r.cell]);
      const mode = residentMode(w, r);
      const a = r.id * 0.5236 + t * 0.06;

      const x = mode === "sailing" ? 480 + 220 * Math.cos(a) : p.x + Math.sin(t * 0.8 + r.id) * 8;

      const y =
        mode === "sailing"
          ? 326 + 109 * Math.sin(a)
          : p.y +
            10 +
            (mode === "flying" ? -63 - Math.sin(t + r.id) * 14 : Math.cos(t * 0.5 + r.id) * 3);

      objects.push({
        y: y + (mode === "flying" ? 100 : 0),
        draw: () => sprout(ctx, x, y, r.id, t, mode),
      });
    });
    objects.sort((a, b) => a.y - b.y).forEach((o) => o.draw());
    // Three clouds and a sun: a strict fixed weather budget.
    ellipse(ctx, 677, 151, 22, 22, "#e7c479");
    ellipse(ctx, 671, 146, 18, 18, "#efd49b");
    cloud(ctx, 310 + Math.sin(t * 0.1) * 11, 137, 0.8, 0.9);
    cloud(ctx, 661 + Math.sin(t * 0.08) * 13, 207, 0.65, 0.95);

    if (w.heat > 40) cloud(ctx, 456 + Math.sin(t * 0.15) * 20, 111, 1.05, 0.88);

    if (w.heat >= 42 && w.humidity >= 58) {
      for (let i = 0; i < 26; i++) {
        const x = 280 + ((i * 73) % 390),
          y = 181 + ((i * 49 + t * 55) % 215);

        line(
          ctx,
          [
            [x, y],
            [x - 3, y + 7],
          ],
          "#779aa082",
          1,
        );
      }
    }

    if (w.fizz > 10)
      for (let i = 0; i < 8; i++) {
        const x = 340 + ((i * 57) % 280),
          y = 230 - ((t * 19 + i * 24) % 90);

        ellipse(ctx, x, y, 4 + (i % 4), 6 + (i % 5), "#f2ffec20", "#edf9db77");
      }

    ctx.fillStyle = "#6a7356";
    ctx.font = "italic 17px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("a little world, made from little things", 480, 597);
  }

  return {
    sprinkle(cellId, color) {
      if (reduced) return;
      const p = project(getWorld().cells[cellId]);

      for (let i = 0; i < 16; i++)
        particles.push({
          x: p.x + ((i % 4) - 2) * 4,
          y: p.y - 45 - i * 2,
          vx: ((i % 3) - 1) * 8,
          vy: 55 + i * 2,
          size: 1.5 + (i % 2),
          color,
          life: 0.65,
        });

      if (particles.length > 48) particles.splice(0, particles.length - 48);
    },
    setTarget(id) {
      selected = id;
    },
    pause(value) {
      if (value) game.loop.sleep();
      else game.loop.wake();
    },
    debug() {
      return {
        particles: particles.length,
        canvas: game.canvas.width * game.canvas.height,
        fps: 30,
        frames,
      };
    },
    destroy() {
      game.destroy(true);
    },
  };
}
