const stageSequence = [
  "decode",
  "grayscale",
  "blur",
  "sobel",
  "threshold",
  "colorize",
];

const stageTitles = {
  decode: "Decode and Fit",
  grayscale: "Grayscale",
  blur: "Blur",
  sobel: "Sobel Gradient",
  threshold: "Threshold",
  colorize: "Colorize",
};

const fallbackPalette = [
  [12, 28, 52],
  [0, 189, 171],
  [255, 151, 92],
];

const elements = {
  fileInput: document.getElementById("fileInput"),
  demoButton: document.getElementById("demoButton"),
  sensitivity: document.getElementById("sensitivity"),
  sensitivityValue: document.getElementById("sensitivityValue"),
  threshold: document.getElementById("threshold"),
  thresholdValue: document.getElementById("thresholdValue"),
  blur: document.getElementById("blur"),
  blurValue: document.getElementById("blurValue"),
  glow: document.getElementById("glow"),
  glowValue: document.getElementById("glowValue"),
  palette: document.getElementById("palette"),
  statusText: document.getElementById("statusText"),
  statusDetail: document.getElementById("statusDetail"),
  progressFill: document.getElementById("progressFill"),
  stageList: Array.from(document.querySelectorAll("#stageList li")),
  runButton: document.getElementById("runButton"),
  downloadButton: document.getElementById("downloadButton"),
  sourceCanvas: document.getElementById("sourceCanvas"),
  resultCanvas: document.getElementById("resultCanvas"),
};

const sourceCtx = elements.sourceCanvas.getContext("2d", {
  willReadFrequently: true,
});
const resultCtx = elements.resultCanvas.getContext("2d");

const state = {
  running: false,
  hasOutput: false,
  palette: fallbackPalette,
};

init();

function init() {
  bindEvents();
  syncSliderLabels();
  resetStageStates();
  setProgress(0);
  loadDemoScene();
}

function bindEvents() {
  elements.fileInput.addEventListener("change", handleFileSelection);
  elements.demoButton.addEventListener("click", () => {
    if (!state.running) {
      loadDemoScene();
    }
  });
  elements.runButton.addEventListener("click", runAnimatedPipeline);
  elements.downloadButton.addEventListener("click", downloadOutput);
  elements.sensitivity.addEventListener("input", syncSliderLabels);
  elements.threshold.addEventListener("input", syncSliderLabels);
  elements.blur.addEventListener("input", syncSliderLabels);
  elements.glow.addEventListener("input", syncSliderLabels);
}

function syncSliderLabels() {
  elements.sensitivityValue.textContent = `${Number(elements.sensitivity.value).toFixed(
    1
  )}x`;
  elements.thresholdValue.textContent = elements.threshold.value;
  elements.blurValue.textContent = elements.blur.value;
  elements.glowValue.textContent = `${elements.glow.value}%`;
}

function loadDemoScene() {
  const demoCanvas = document.createElement("canvas");
  demoCanvas.width = 1180;
  demoCanvas.height = 760;
  const demoCtx = demoCanvas.getContext("2d");

  drawDemoScene(demoCtx, demoCanvas.width, demoCanvas.height);
  applySourceCanvas(demoCanvas, "Demo scene loaded. Tune controls and run.");
}

function drawDemoScene(ctx, width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#192338");
  sky.addColorStop(0.48, "#225f79");
  sky.addColorStop(1, "#f08f5a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const sun = ctx.createRadialGradient(
    width * 0.75,
    height * 0.26,
    16,
    width * 0.75,
    height * 0.26,
    height * 0.22
  );
  sun.addColorStop(0, "rgba(255, 238, 162, 0.95)");
  sun.addColorStop(1, "rgba(255, 238, 162, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(8, 30, 54, 0.72)";
  mountainBand(
    ctx,
    height * 0.65,
    [
      [0.08, 0.17],
      [0.2, 0.05],
      [0.34, 0.19],
      [0.5, 0.07],
      [0.67, 0.21],
      [0.86, 0.08],
      [1, 0.16],
    ],
    width,
    height
  );

  ctx.fillStyle = "rgba(4, 20, 37, 0.85)";
  mountainBand(
    ctx,
    height * 0.74,
    [
      [0.02, 0.09],
      [0.16, -0.02],
      [0.31, 0.08],
      [0.45, -0.04],
      [0.58, 0.11],
      [0.79, -0.03],
      [0.92, 0.09],
      [1, 0.03],
    ],
    width,
    height
  );

  const water = ctx.createLinearGradient(0, height * 0.53, 0, height);
  water.addColorStop(0, "rgba(21, 104, 133, 0.7)");
  water.addColorStop(1, "rgba(5, 19, 34, 0.96)");
  ctx.fillStyle = water;
  ctx.fillRect(0, height * 0.53, width, height * 0.47);

  ctx.strokeStyle = "rgba(255, 244, 193, 0.12)";
  ctx.lineWidth = 1;
  for (let y = height * 0.56; y < height; y += 9) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.018) * 3);
    ctx.lineTo(width, y + Math.cos(y * 0.012) * 3);
    ctx.stroke();
  }

  for (let i = 0; i < 34; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * (height * 0.45);
    const size = Math.random() * 2 + 0.4;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(x, y, size, size);
  }
}

function mountainBand(ctx, baseY, points, width, height) {
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (const [xRatio, yRatio] of points) {
    ctx.lineTo(xRatio * width, baseY - yRatio * height);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
}

function handleFileSelection(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      applySourceImage(image, `Loaded ${file.name}. Ready to process.`);
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function applySourceImage(image, detail) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const { width, height } = fitSize(sourceWidth, sourceHeight, 980, 620);
  prepareCanvases(width, height);
  sourceCtx.drawImage(image, 0, 0, width, height);
  afterSourceUpdated(detail);
}

function applySourceCanvas(canvas, detail) {
  const { width, height } = fitSize(canvas.width, canvas.height, 980, 620);
  prepareCanvases(width, height);
  sourceCtx.drawImage(canvas, 0, 0, width, height);
  afterSourceUpdated(detail);
}

function afterSourceUpdated(detail) {
  resultCtx.clearRect(0, 0, elements.resultCanvas.width, elements.resultCanvas.height);
  resultCtx.drawImage(elements.sourceCanvas, 0, 0);

  const sourceData = sourceCtx.getImageData(
    0,
    0,
    elements.sourceCanvas.width,
    elements.sourceCanvas.height
  );

  state.palette = extractPalette(sourceData.data);
  renderPalette(state.palette);
  resetStageStates();
  state.hasOutput = false;
  setProgress(0);
  setStatus("Ready", detail || "Image prepared. Start the animated process.");
  elements.downloadButton.disabled = true;
}

function prepareCanvases(width, height) {
  elements.sourceCanvas.width = width;
  elements.sourceCanvas.height = height;
  elements.resultCanvas.width = width;
  elements.resultCanvas.height = height;
}

function fitSize(width, height, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(220, Math.round(width * ratio)),
    height: Math.max(160, Math.round(height * ratio)),
  };
}

async function runAnimatedPipeline() {
  if (state.running) {
    return;
  }

  state.running = true;
  lockControls(true);
  resetStageStates();
  setProgress(0);

  try {
    const width = elements.sourceCanvas.width;
    const height = elements.sourceCanvas.height;
    const source = sourceCtx.getImageData(0, 0, width, height);

    await runStage(
      "decode",
      source.data,
      width,
      height,
      "Image decoded and fit to processing canvas."
    );

    const gray = toGrayscale(source.data);
    await runStage(
      "grayscale",
      monoToRgba(gray, width, height),
      width,
      height,
      "Converted RGB channels into luminance."
    );

    const blurRadius = Number(elements.blur.value);
    const blurred = boxBlur(gray, width, height, blurRadius);
    await runStage(
      "blur",
      monoToRgba(blurred, width, height),
      width,
      height,
      `Applied box blur (radius ${blurRadius}) to reduce noise.`
    );

    const sobel = sobelMagnitude(blurred, width, height);
    const normalized = normalizeMono(
      sobel.magnitude,
      sobel.max || 1,
      Number(elements.sensitivity.value)
    );
    await runStage(
      "sobel",
      heatToRgba(normalized, width, height),
      width,
      height,
      "Computed gradient magnitude with Sobel kernels."
    );

    const thresholdValue = Number(elements.threshold.value);
    const mask = thresholdMap(normalized, thresholdValue);
    await runStage(
      "threshold",
      monoToRgba(mask, width, height),
      width,
      height,
      `Kept strong gradients above threshold ${thresholdValue}.`
    );

    const glow = Number(elements.glow.value) / 100;
    const colorized = colorizeMap(mask, width, height, state.palette, glow);
    await runStage(
      "colorize",
      colorized,
      width,
      height,
      "Mapped edge energy into a palette-aware gradient render."
    );

    state.hasOutput = true;
    setStatus("Complete", "Animation finished. Download the PNG or tune and rerun.");
  } catch (error) {
    console.error(error);
    setStatus("Error", "Processing failed. Try another image and run again.");
  } finally {
    state.running = false;
    lockControls(false);
    elements.downloadButton.disabled = !state.hasOutput;
  }
}

async function runStage(stageId, rgba, width, height, detail) {
  markStage(stageId, "active");
  setStatus(stageTitles[stageId], detail);
  await revealFrame(rgba, width, height, 460);
  markStage(stageId, "done");
  setProgress(((stageSequence.indexOf(stageId) + 1) / stageSequence.length) * 100);
  await wait(160);
}

function revealFrame(rgba, width, height, duration) {
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const offscreenCtx = offscreen.getContext("2d");
  offscreenCtx.putImageData(new ImageData(rgba, width, height), 0, 0);

  return new Promise((resolve) => {
    const start = performance.now();

    function draw(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const revealWidth = Math.max(1, Math.floor(width * eased));

      resultCtx.clearRect(0, 0, width, height);
      resultCtx.drawImage(
        offscreen,
        0,
        0,
        revealWidth,
        height,
        0,
        0,
        revealWidth,
        height
      );
      resultCtx.fillStyle = "rgba(2, 8, 14, 0.38)";
      resultCtx.fillRect(revealWidth, 0, width - revealWidth, height);

      if (t < 1) {
        requestAnimationFrame(draw);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(draw);
  });
}

function toGrayscale(rgba) {
  const gray = new Float32Array(rgba.length / 4);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p += 1) {
    gray[p] = rgba[i] * 0.299 + rgba[i + 1] * 0.587 + rgba[i + 2] * 0.114;
  }
  return gray;
}

function boxBlur(source, width, height, radius) {
  if (radius <= 0) {
    return new Float32Array(source);
  }

  const horizontal = new Float32Array(width * height);
  const output = new Float32Array(width * height);
  const windowSize = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let x = -radius; x <= radius; x += 1) {
      const clampedX = clamp(x, 0, width - 1);
      sum += source[y * width + clampedX];
    }

    for (let x = 0; x < width; x += 1) {
      horizontal[y * width + x] = sum / windowSize;
      const left = clamp(x - radius, 0, width - 1);
      const right = clamp(x + radius + 1, 0, width - 1);
      sum += source[y * width + right] - source[y * width + left];
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let y = -radius; y <= radius; y += 1) {
      const clampedY = clamp(y, 0, height - 1);
      sum += horizontal[clampedY * width + x];
    }

    for (let y = 0; y < height; y += 1) {
      output[y * width + x] = sum / windowSize;
      const top = clamp(y - radius, 0, height - 1);
      const bottom = clamp(y + radius + 1, 0, height - 1);
      sum += horizontal[bottom * width + x] - horizontal[top * width + x];
    }
  }

  return output;
}

function sobelMagnitude(source, width, height) {
  const magnitude = new Float32Array(width * height);
  let max = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;

      const tl = source[idx - width - 1];
      const tc = source[idx - width];
      const tr = source[idx - width + 1];
      const ml = source[idx - 1];
      const mr = source[idx + 1];
      const bl = source[idx + width - 1];
      const bc = source[idx + width];
      const br = source[idx + width + 1];

      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const value = Math.hypot(gx, gy);
      magnitude[idx] = value;
      if (value > max) {
        max = value;
      }
    }
  }

  return { magnitude, max };
}

function normalizeMono(mono, maxValue, sensitivity) {
  const normalized = new Float32Array(mono.length);
  const scale = (255 / Math.max(maxValue, 1)) * sensitivity;
  for (let i = 0; i < mono.length; i += 1) {
    normalized[i] = clamp(mono[i] * scale, 0, 255);
  }
  return normalized;
}

function thresholdMap(mono, threshold) {
  const out = new Float32Array(mono.length);
  const range = Math.max(1, 255 - threshold);
  for (let i = 0; i < mono.length; i += 1) {
    const lifted = mono[i] - threshold;
    out[i] = lifted > 0 ? (lifted / range) * 255 : 0;
  }
  return out;
}

function monoToRgba(mono, width, height) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, p = 0; i < mono.length; i += 1, p += 4) {
    const value = clamp(mono[i], 0, 255);
    rgba[p] = value;
    rgba[p + 1] = value;
    rgba[p + 2] = value;
    rgba[p + 3] = 255;
  }
  return rgba;
}

function heatToRgba(mono, width, height) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  const cold = [20, 34, 51];
  const mid = [3, 169, 156];
  const hot = [255, 142, 79];

  for (let i = 0, p = 0; i < mono.length; i += 1, p += 4) {
    const t = clamp(mono[i], 0, 255) / 255;
    const color =
      t < 0.5 ? mixColor(cold, mid, t * 2) : mixColor(mid, hot, (t - 0.5) * 2);
    rgba[p] = color[0];
    rgba[p + 1] = color[1];
    rgba[p + 2] = color[2];
    rgba[p + 3] = 255;
  }
  return rgba;
}

function colorizeMap(mask, width, height, palette, glow) {
  const out = new Uint8ClampedArray(width * height * 4);
  const dark = palette[0];
  const mid = palette[1];
  const bright = palette[2];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const pixel = idx * 4;
      const edge = clamp(mask[idx], 0, 255) / 255;

      const nx = x / Math.max(width - 1, 1);
      const ny = y / Math.max(height - 1, 1);
      const vignette = clamp(1 - Math.hypot(nx - 0.5, ny - 0.5) * 1.25, 0, 1);

      const background = mixColor(dark, mid, 0.14 + 0.28 * vignette);
      const ramp = edge < 0.5
        ? mixColor(mid, bright, edge * 2)
        : mixColor(bright, [255, 249, 220], (edge - 0.5) * 2);

      const energy = Math.pow(edge, 0.82) * (0.58 + glow * 1.25);
      const grain = ((x * 17 + y * 11) % 23) * 0.18;

      out[pixel] = clamp(background[0] + ramp[0] * energy + grain, 0, 255);
      out[pixel + 1] = clamp(
        background[1] + ramp[1] * energy + grain * 0.8,
        0,
        255
      );
      out[pixel + 2] = clamp(
        background[2] + ramp[2] * energy + grain * 0.6,
        0,
        255
      );
      out[pixel + 3] = 255;
    }
  }

  return out;
}

function extractPalette(rgba) {
  const buckets = new Map();
  const sampleStep = 24;

  for (let i = 0; i < rgba.length; i += sampleStep) {
    if (rgba[i + 3] < 200) {
      continue;
    }

    const r = Math.min(255, Math.round(rgba[i] / 32) * 32);
    const g = Math.min(255, Math.round(rgba[i + 1] / 32) * 32);
    const b = Math.min(255, Math.round(rgba[i + 2] / 32) * 32);
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const sorted = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key.split(",").map((v) => Number(v)));

  if (sorted.length === 0) {
    return fallbackPalette;
  }

  const selected = [];
  for (const color of sorted) {
    const tooClose = selected.some((existing) => colorDistance(existing, color) < 42);
    if (!tooClose) {
      selected.push(color);
    }
    if (selected.length >= 5) {
      break;
    }
  }

  while (selected.length < 3) {
    selected.push(fallbackPalette[selected.length]);
  }

  selected.sort((a, b) => luminance(a) - luminance(b));
  return [selected[0], selected[Math.floor(selected.length / 2)], selected[selected.length - 1]];
}

function renderPalette(palette) {
  elements.palette.innerHTML = "";
  for (const color of palette) {
    const node = document.createElement("div");
    node.className = "swatch";
    node.style.background = `rgb(${color[0]} ${color[1]} ${color[2]})`;
    node.dataset.hex = rgbToHex(color);
    elements.palette.appendChild(node);
  }
}

function rgbToHex(color) {
  return `#${color.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function colorDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function luminance(color) {
  return color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
}

function mixColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function resetStageStates() {
  for (const stage of elements.stageList) {
    stage.classList.remove("active", "done");
  }
}

function markStage(id, status) {
  const stageNode = elements.stageList.find((node) => node.dataset.stage === id);
  if (!stageNode) {
    return;
  }
  stageNode.classList.remove("active", "done");
  if (status) {
    stageNode.classList.add(status);
  }
}

function setStatus(title, detail) {
  elements.statusText.textContent = title;
  elements.statusDetail.textContent = detail;
}

function setProgress(percent) {
  elements.progressFill.style.width = `${clamp(percent, 0, 100)}%`;
}

function lockControls(locked) {
  elements.fileInput.disabled = locked;
  elements.demoButton.disabled = locked;
  elements.sensitivity.disabled = locked;
  elements.threshold.disabled = locked;
  elements.blur.disabled = locked;
  elements.glow.disabled = locked;
  elements.runButton.disabled = locked;
  elements.downloadButton.disabled = locked || !state.hasOutput;
}

function downloadOutput() {
  if (!state.hasOutput) {
    return;
  }
  const link = document.createElement("a");
  link.href = elements.resultCanvas.toDataURL("image/png");
  link.download = "gradient-motion-output.png";
  link.click();
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
