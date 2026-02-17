const stageSequence = [
  "decode",
  "grayscale",
  "vector",
  "extract",
  "rank",
  "paint",
];

const stageTitles = {
  decode: "Decode and Fit",
  grayscale: "Grayscale and Blur",
  vector: "Gradient Vector Field",
  extract: "Stroke Extraction",
  rank: "Goodness Ranking",
  paint: "Brush Painting",
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
  const demoImage = new Image();
  demoImage.onload = () => {
    applySourceImage(demoImage, "Eiffel Tower demo loaded. Tune controls and paint.");
  };
  demoImage.onerror = () => {
    loadFallbackDemoScene();
  };
  demoImage.src = "assets/eiffel-input.jpg";
}

function loadFallbackDemoScene() {
  const demoCanvas = document.createElement("canvas");
  demoCanvas.width = 1180;
  demoCanvas.height = 760;
  const demoCtx = demoCanvas.getContext("2d");

  drawDemoScene(demoCtx, demoCanvas.width, demoCanvas.height);
  applySourceCanvas(demoCanvas, "Demo scene loaded. Tune controls and paint.");
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
      applySourceImage(image, `Loaded ${file.name}. Ready to paint.`);
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
  setStatus("Ready", detail || "Image prepared. Start the painterly process.");
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
    const sourceImage = sourceCtx.getImageData(0, 0, width, height);
    const sourcePixels = sourceImage.data;

    await runStageFrame(
      "decode",
      sourcePixels,
      width,
      height,
      "Decoded image and prepared analysis canvas."
    );

    const gray = toGrayscale(sourcePixels);
    const blurRadius = Number(elements.blur.value);
    const blurred = boxBlur(gray, width, height, blurRadius);
    await runStageFrame(
      "grayscale",
      monoToRgba(blurred, width, height),
      width,
      height,
      `Converted to luminance and smoothed with blur radius ${blurRadius}.`
    );

    const sensitivity = Number(elements.sensitivity.value);
    const field = computeGradientField(blurred, width, height, sensitivity);
    const vectorPreview = renderVectorFieldPreview(field, width, height);
    await runStageFrame(
      "vector",
      vectorPreview,
      width,
      height,
      "Built first-order gradient field and tangent flow (perpendicular direction)."
    );

    const threshold = Number(elements.threshold.value);
    const brushLoad = Number(elements.glow.value) / 100;
    const extraction = extractStrokeSet(field, sourcePixels, width, height, {
      threshold,
      brushLoad,
    });
    const extractionPreview = renderStrokePreview(extraction.strokes, width, height, "extract");
    await runStageFrame(
      "extract",
      extractionPreview,
      width,
      height,
      `Captured ${extraction.strokes.length} high-gradient paths as candidate strokes.`
    );

    const orderedStrokes = rankAndOrderStrokes(extraction.strokes);
    const rankPreview = renderStrokePreview(orderedStrokes, width, height, "rank");
    await runStageFrame(
      "rank",
      rankPreview,
      width,
      height,
      "Ranked by goodness (length x intensity) and reordered by local proximity."
    );

    markStage("paint", "active");
    setStatus(stageTitles.paint, "Rendering painterly brush strokes.");
    await paintStrokesAnimated(orderedStrokes, sourcePixels, width, height, {
      brushLoad,
      palette: state.palette,
    });
    markStage("paint", "done");
    setProgress(100);

    state.hasOutput = true;
    if (orderedStrokes.length > 0) {
      setStatus(
        "Complete",
        `Painterly animation finished with ${orderedStrokes.length} strokes.`
      );
    } else {
      setStatus(
        "Complete",
        "No strong strokes found at this threshold. Lower threshold to extract more paths."
      );
    }
  } catch (error) {
    console.error(error);
    setStatus("Error", "Painterly process failed. Try another image and run again.");
  } finally {
    state.running = false;
    lockControls(false);
    elements.downloadButton.disabled = !state.hasOutput;
  }
}

async function runStageFrame(stageId, rgba, width, height, detail) {
  markStage(stageId, "active");
  setStatus(stageTitles[stageId], detail);
  await revealFrame(rgba, width, height, 440);
  markStage(stageId, "done");
  setProgress(((stageSequence.indexOf(stageId) + 1) / stageSequence.length) * 100);
  await wait(130);
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
      resultCtx.fillStyle = "rgba(2, 8, 14, 0.36)";
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

function computeGradientField(mono, width, height, sensitivity) {
  const gx = new Float32Array(width * height);
  const gy = new Float32Array(width * height);
  const magnitude = new Float32Array(width * height);
  const normalized = new Float32Array(width * height);
  const tangentX = new Float32Array(width * height);
  const tangentY = new Float32Array(width * height);

  let maxMagnitude = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;

      const tl = mono[idx - width - 1];
      const tc = mono[idx - width];
      const tr = mono[idx - width + 1];
      const ml = mono[idx - 1];
      const mr = mono[idx + 1];
      const bl = mono[idx + width - 1];
      const bc = mono[idx + width];
      const br = mono[idx + width + 1];

      const gX = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gY = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const mag = Math.hypot(gX, gY);

      gx[idx] = gX;
      gy[idx] = gY;
      magnitude[idx] = mag;
      if (mag > maxMagnitude) {
        maxMagnitude = mag;
      }
    }
  }

  const magnitudeScale = maxMagnitude || 1;
  for (let i = 0; i < magnitude.length; i += 1) {
    const mag = magnitude[i];
    normalized[i] = clamp((mag / magnitudeScale) * 255 * sensitivity, 0, 255);

    if (mag > 1e-5) {
      tangentX[i] = -gy[i] / mag;
      tangentY[i] = gx[i] / mag;
    }
  }

  return { gx, gy, magnitude, normalized, tangentX, tangentY };
}

function renderVectorFieldPreview(field, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#06111b";
  ctx.fillRect(0, 0, width, height);

  const stride = clamp(Math.round(Math.min(width, height) / 105), 5, 10);
  for (let y = 2; y < height - 2; y += stride) {
    for (let x = 2; x < width - 2; x += stride) {
      const idx = y * width + x;
      const strength = field.normalized[idx];
      if (strength < 18) {
        continue;
      }

      const tx = field.tangentX[idx];
      const ty = field.tangentY[idx];
      if (tx === 0 && ty === 0) {
        continue;
      }

      const t = strength / 255;
      const color = mixColor([0, 174, 165], [255, 143, 84], t);
      const length = 1.5 + t * 4.2;

      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${0.2 + t * 0.72})`;
      ctx.lineWidth = 0.75 + t * 1.25;
      ctx.beginPath();
      ctx.moveTo(x - tx * length, y - ty * length);
      ctx.lineTo(x + tx * length, y + ty * length);
      ctx.stroke();
    }
  }

  return ctx.getImageData(0, 0, width, height).data;
}

function extractStrokeSet(field, sourcePixels, width, height, options) {
  const threshold = clamp(options.threshold, 1, 255);
  const brushLoad = clamp(options.brushLoad, 0, 1);
  const lowThreshold = Math.max(4, threshold * 0.45);

  const seedStride = clamp(Math.round(6 - brushLoad * 2.4), 2, 6);
  const maxStrokes = clamp(
    Math.round((width * height) / (seedStride * seedStride) * 0.09),
    260,
    3200
  );
  const maxSteps = clamp(Math.round(36 + brushLoad * 58), 26, 96);
  const minPoints = clamp(Math.round(5 + brushLoad * 6), 5, 12);
  const stepSize = 1.05 + brushLoad * 0.25;
  const occupyRadius = clamp(Math.round(0.8 + brushLoad * 1.4), 1, 2);

  let seeds = collectSeedCandidates(field.normalized, width, height, threshold, seedStride, false);
  if (seeds.length < 40) {
    seeds = collectSeedCandidates(
      field.normalized,
      width,
      height,
      threshold * 0.72,
      Math.max(2, seedStride - 1),
      false
    );
  }
  seeds.sort((a, b) => b.strength - a.strength);

  const occupied = new Uint8Array(width * height);
  const strokes = [];

  for (const seed of seeds) {
    if (strokes.length >= maxStrokes) {
      break;
    }

    const seedIndex = seed.y * width + seed.x;
    if (occupied[seedIndex]) {
      continue;
    }

    const stroke = traceStrokeFromSeed(
      seed.x,
      seed.y,
      field,
      width,
      height,
      lowThreshold,
      maxSteps,
      stepSize,
      minPoints
    );
    if (!stroke) {
      continue;
    }

    stroke.sampleColor = sampleStrokeColor(stroke.points, sourcePixels, width, height);
    const normIntensity = stroke.avgIntensity / 255;
    stroke.goodness = stroke.length * Math.pow(normIntensity, 1.3) + stroke.peakIntensity * 0.04;

    strokes.push(stroke);
    markStrokeOccupied(stroke.points, occupied, width, height, occupyRadius);
  }

  return { strokes };
}

function collectSeedCandidates(magnitude, width, height, threshold, stride, requirePeak) {
  const seeds = [];
  const t = Math.max(1, threshold);

  for (let y = 2; y < height - 2; y += stride) {
    for (let x = 2; x < width - 2; x += stride) {
      const idx = y * width + x;
      const strength = magnitude[idx];
      if (strength < t) {
        continue;
      }
      if (requirePeak && !isLocalPeak(magnitude, width, x, y, strength)) {
        continue;
      }
      seeds.push({ x, y, strength });
    }
  }

  return seeds;
}

function isLocalPeak(magnitude, width, x, y, value) {
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) {
        continue;
      }
      if (magnitude[(y + oy) * width + (x + ox)] > value) {
        return false;
      }
    }
  }
  return true;
}

function traceStrokeFromSeed(
  seedX,
  seedY,
  field,
  width,
  height,
  lowThreshold,
  maxSteps,
  stepSize,
  minPoints
) {
  const forward = followFlow(
    seedX,
    seedY,
    1,
    field,
    width,
    height,
    lowThreshold,
    maxSteps,
    stepSize
  );
  const backward = followFlow(
    seedX,
    seedY,
    -1,
    field,
    width,
    height,
    lowThreshold,
    maxSteps,
    stepSize
  );

  if (forward.length === 0 && backward.length === 0) {
    return null;
  }

  const points = backward.slice().reverse();
  if (forward.length > 0) {
    points.push(...forward.slice(1));
  }

  if (points.length < minPoints) {
    return null;
  }

  let intensitySum = 0;
  let peakIntensity = 0;
  let length = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    intensitySum += point.strength;
    peakIntensity = Math.max(peakIntensity, point.strength);
    centroidX += point.x;
    centroidY += point.y;
    if (i > 0) {
      const prev = points[i - 1];
      length += Math.hypot(point.x - prev.x, point.y - prev.y);
    }
  }

  const avgIntensity = intensitySum / points.length;
  if (avgIntensity < lowThreshold * 0.92 || length < minPoints) {
    return null;
  }

  return {
    points,
    length,
    avgIntensity,
    peakIntensity,
    centroid: {
      x: centroidX / points.length,
      y: centroidY / points.length,
    },
    goodness: 0,
    strengthRank: 0,
    sampleColor: [220, 220, 220],
  };
}

function followFlow(
  startX,
  startY,
  direction,
  field,
  width,
  height,
  lowThreshold,
  maxSteps,
  stepSize
) {
  const points = [];
  let x = startX;
  let y = startY;
  let prevDx = 0;
  let prevDy = 0;

  for (let step = 0; step < maxSteps; step += 1) {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 1 || yi < 1 || xi >= width - 1 || yi >= height - 1) {
      break;
    }

    const idx = yi * width + xi;
    const strength = field.normalized[idx];
    if (strength < lowThreshold) {
      break;
    }

    let dx = field.tangentX[idx];
    let dy = field.tangentY[idx];
    if (dx === 0 && dy === 0) {
      break;
    }

    if (direction < 0) {
      dx = -dx;
      dy = -dy;
    }

    if (prevDx !== 0 || prevDy !== 0) {
      if (dx * prevDx + dy * prevDy < 0) {
        dx = -dx;
        dy = -dy;
      }
      dx = prevDx * 0.4 + dx * 0.6;
      dy = prevDy * 0.4 + dy * 0.6;
      const tangentNorm = Math.hypot(dx, dy) || 1;
      dx /= tangentNorm;
      dy /= tangentNorm;
    }

    points.push({ x, y, strength });

    x += dx * stepSize;
    y += dy * stepSize;
    prevDx = dx;
    prevDy = dy;
  }

  return points;
}

function markStrokeOccupied(points, occupied, width, height, radius) {
  const r2 = radius * radius;
  for (const point of points) {
    const cx = Math.round(point.x);
    const cy = Math.round(point.y);
    for (let oy = -radius; oy <= radius; oy += 1) {
      for (let ox = -radius; ox <= radius; ox += 1) {
        if (ox * ox + oy * oy > r2) {
          continue;
        }
        const x = cx + ox;
        const y = cy + oy;
        if (x < 0 || y < 0 || x >= width || y >= height) {
          continue;
        }
        occupied[y * width + x] = 1;
      }
    }
  }
}

function sampleStrokeColor(points, sourcePixels, width, height) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  const step = Math.max(1, Math.floor(points.length / 12));

  for (let i = 0; i < points.length; i += step) {
    const x = clamp(Math.round(points[i].x), 0, width - 1);
    const y = clamp(Math.round(points[i].y), 0, height - 1);
    const idx = (y * width + x) * 4;
    r += sourcePixels[idx];
    g += sourcePixels[idx + 1];
    b += sourcePixels[idx + 2];
    count += 1;
  }

  if (count === 0) {
    return [220, 220, 220];
  }

  return [
    Math.round(r / count),
    Math.round(g / count),
    Math.round(b / count),
  ];
}

function rankAndOrderStrokes(strokes) {
  if (strokes.length === 0) {
    return [];
  }

  const ranked = [...strokes].sort((a, b) => b.goodness - a.goodness);
  const peakGoodness = ranked[0].goodness || 1;
  for (const stroke of ranked) {
    stroke.strengthRank = clamp(stroke.goodness / peakGoodness, 0, 1);
  }

  const ordered = [ranked.shift()];
  const windowSize = 36;

  while (ranked.length > 0) {
    const anchor = ordered[ordered.length - 1].centroid;
    const limit = Math.min(windowSize, ranked.length);
    let bestIndex = 0;
    let bestCost = Number.POSITIVE_INFINITY;

    for (let i = 0; i < limit; i += 1) {
      const stroke = ranked[i];
      const dist = Math.hypot(anchor.x - stroke.centroid.x, anchor.y - stroke.centroid.y);
      const strengthPenalty = i * 2.4;
      const cost = dist + strengthPenalty;
      if (cost < bestCost) {
        bestCost = cost;
        bestIndex = i;
      }
    }

    ordered.push(ranked.splice(bestIndex, 1)[0]);
  }

  return ordered;
}

function renderStrokePreview(strokes, width, height, mode) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = mode === "extract" ? "#06101a" : "#071322";
  ctx.fillRect(0, 0, width, height);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const stroke of strokes) {
    const t = stroke.strengthRank;
    if (mode === "extract") {
      ctx.strokeStyle = `rgba(238,247,255,${0.08 + t * 0.44})`;
      ctx.lineWidth = 0.8 + t * 1.6;
    } else {
      const color = mixColor([0, 198, 182], [255, 168, 98], t);
      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${0.14 + t * 0.5})`;
      ctx.lineWidth = 0.9 + t * 2.1;
    }
    drawBrushPath(ctx, stroke.points, 0, 0.05);
    ctx.stroke();
  }

  return ctx.getImageData(0, 0, width, height).data;
}

function paintStrokesAnimated(strokes, sourcePixels, width, height, options) {
  const brushLoad = clamp(options.brushLoad, 0, 1);
  const total = strokes.length;
  const startProgress = (stageSequence.indexOf("paint") / stageSequence.length) * 100;
  const spanProgress = 100 - startProgress;

  const base = createPaintBase(sourcePixels, width, height, options.palette);
  resultCtx.putImageData(new ImageData(base, width, height), 0, 0);

  if (total === 0) {
    setProgress(100);
    return Promise.resolve();
  }

  const targetDuration = clamp(2400 + total * 2.2, 2600, 8200);
  let drawn = 0;
  let startTime = null;
  let lastStatusUpdate = 0;

  return new Promise((resolve) => {
    function step(now) {
      if (startTime === null) {
        startTime = now;
      }

      const elapsed = now - startTime;
      let targetCount = Math.floor((elapsed / targetDuration) * total);
      targetCount = clamp(targetCount, 0, total);
      if (targetCount <= drawn) {
        targetCount = Math.min(total, drawn + Math.max(1, Math.floor(total / 380)));
      }

      while (drawn < targetCount) {
        paintStrokeWithBrush(resultCtx, strokes[drawn], brushLoad, options.palette);
        drawn += 1;
      }

      setProgress(startProgress + spanProgress * (drawn / total));
      if (now - lastStatusUpdate > 120 || drawn === total) {
        setStatus(stageTitles.paint, `Painting strokes ${drawn}/${total} from strong to light.`);
        lastStatusUpdate = now;
      }

      if (drawn < total) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}

function paintStrokeWithBrush(ctx, stroke, brushLoad, palette) {
  if (stroke.points.length < 2) {
    return;
  }

  const strength = stroke.strengthRank;
  const sampled = stroke.sampleColor;
  const accent = mixColor(palette[1], palette[2], 0.25 + strength * 0.65);
  const bodyColor = mixColor(sampled, accent, 0.36 + strength * 0.34);
  const darkEdge = mixColor(bodyColor, palette[0], 0.34);

  const baseWidth = 0.9 + brushLoad * 2.4 + strength * 2.8;
  const baseAlpha = 0.08 + brushLoad * 0.12 + strength * 0.2;

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = rgbaString(darkEdge, baseAlpha * 0.9);
  ctx.lineWidth = baseWidth * 1.35;
  drawBrushPath(ctx, stroke.points, 0, 0.16);
  ctx.stroke();

  const bristlePasses = 2 + Math.round(brushLoad * 4 + strength * 2);
  for (let i = 0; i < bristlePasses; i += 1) {
    const center = (bristlePasses - 1) / 2;
    const offset = (i - center) * (baseWidth / (bristlePasses + 0.8));
    const toneShift = (Math.random() - 0.5) * 26;
    const bristleColor = shiftColor(bodyColor, toneShift);

    ctx.strokeStyle = rgbaString(
      bristleColor,
      baseAlpha * (0.78 + Math.random() * 0.34)
    );
    ctx.lineWidth = Math.max(0.5, baseWidth * (0.24 + Math.random() * 0.23));
    drawBrushPath(ctx, stroke.points, offset, 0.32 + Math.random() * 0.35);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = rgbaString(mixColor(bodyColor, [255, 255, 255], 0.24), baseAlpha * 0.35);
  ctx.lineWidth = Math.max(0.45, baseWidth * 0.22);
  drawBrushPath(ctx, stroke.points, 0, 0.18);
  ctx.stroke();

  ctx.restore();
}

function drawBrushPath(ctx, points, offset, jitter) {
  if (points.length < 2) {
    return;
  }

  ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) {
    const point = displacedPoint(points, i, offset, jitter);
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
}

function displacedPoint(points, index, offset, jitter) {
  const point = points[index];
  const prev = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  const tangentX = next.x - prev.x;
  const tangentY = next.y - prev.y;
  const norm = Math.hypot(tangentX, tangentY) || 1;
  const normalX = -tangentY / norm;
  const normalY = tangentX / norm;

  return {
    x: point.x + normalX * offset + (Math.random() * 2 - 1) * jitter,
    y: point.y + normalY * offset + (Math.random() * 2 - 1) * jitter,
  };
}

function createPaintBase(sourcePixels, width, height, palette) {
  const out = new Uint8ClampedArray(sourcePixels.length);
  const dark = palette[0];
  const mid = palette[1];

  for (let i = 0; i < sourcePixels.length; i += 4) {
    const r = sourcePixels[i];
    const g = sourcePixels[i + 1];
    const b = sourcePixels[i + 2];

    const lum = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
    const tone = mixColor(dark, mid, 0.16 + lum * 0.36);
    const grain = ((((i / 4) * 13) % 17) - 8) * 0.35;

    out[i] = clamp(tone[0] * 0.82 + r * 0.12 + grain, 0, 255);
    out[i + 1] = clamp(tone[1] * 0.82 + g * 0.12 + grain * 0.9, 0, 255);
    out[i + 2] = clamp(tone[2] * 0.82 + b * 0.12 + grain * 0.7, 0, 255);
    out[i + 3] = 255;
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
  return [
    selected[0],
    selected[Math.floor(selected.length / 2)],
    selected[selected.length - 1],
  ];
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

function shiftColor(color, delta) {
  return [
    clamp(Math.round(color[0] + delta), 0, 255),
    clamp(Math.round(color[1] + delta * 0.75), 0, 255),
    clamp(Math.round(color[2] + delta * 0.55), 0, 255),
  ];
}

function rgbaString(color, alpha) {
  return `rgba(${color[0]},${color[1]},${color[2]},${clamp(alpha, 0, 1)})`;
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
