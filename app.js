const POINT_SETS = {
  top: [
    { key: 'refLeft', label: 'Reference left' },
    { key: 'refRight', label: 'Reference right' },
    { key: 'outerLeft', label: 'Disc outer left' },
    { key: 'outerRight', label: 'Disc outer right' },
    { key: 'innerLeft', label: 'Inner rim left' },
    { key: 'innerRight', label: 'Inner rim right' },
  ],
  side: [
    { key: 'refLeft', label: 'Reference left' },
    { key: 'refRight', label: 'Reference right' },
    { key: 'shoulderLeft', label: 'Left shoulder' },
    { key: 'shoulderRight', label: 'Right shoulder' },
    { key: 'apex', label: 'Dome apex' },
    { key: 'bottomLeft', label: 'Left bottom' },
    { key: 'bottomRight', label: 'Right bottom' },
    { key: 'plhLeft', label: 'Left parting line' },
    { key: 'plhRight', label: 'Right parting line' },
  ],
};

const state = {
  stream: null,
  top: { image: null, points: {} },
  side: { image: null, points: {} },
};

const elements = {
  cameraFeed: document.getElementById('cameraFeed'),
  cameraStatus: document.getElementById('cameraStatus'),
  topCanvas: document.getElementById('topCanvas'),
  sideCanvas: document.getElementById('sideCanvas'),
  topPointList: document.getElementById('topPointList'),
  sidePointList: document.getElementById('sidePointList'),
  topReferenceWidth: document.getElementById('topReferenceWidth'),
  sideReferenceWidth: document.getElementById('sideReferenceWidth'),
  geometryResults: document.getElementById('geometryResults'),
  flightSummary: document.getElementById('flightSummary'),
  metricItemTemplate: document.getElementById('metricItemTemplate'),
};

const canvases = {
  top: elements.topCanvas,
  side: elements.sideCanvas,
};

const contexts = {
  top: elements.topCanvas.getContext('2d'),
  side: elements.sideCanvas.getContext('2d'),
};

function pointOrder(view) {
  return POINT_SETS[view];
}

function nextPointKey(view) {
  return pointOrder(view).find((point) => !state[view].points[point.key])?.key ?? null;
}

function setStatus(message, isError = false) {
  elements.cameraStatus.textContent = message;
  elements.cameraStatus.style.color = isError ? '#fca5a5' : '';
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });

    state.stream = stream;
    elements.cameraFeed.srcObject = stream;
    setStatus('Camera running. Capture a top view and a side profile with a known-width reference visible.');
  } catch (error) {
    console.error(error);
    setStatus('Unable to access camera. Check browser permissions and make sure the app is served over HTTPS or localhost.', true);
  }
}

function stopCamera() {
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }
  elements.cameraFeed.srcObject = null;
  setStatus('Camera stopped. You can still annotate any captured frames.');
}

function captureFrame(view) {
  if (!elements.cameraFeed.videoWidth || !elements.cameraFeed.videoHeight) {
    setStatus('Camera feed is not ready yet. Start the camera and wait for the preview.', true);
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = elements.cameraFeed.videoWidth;
  canvas.height = elements.cameraFeed.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(elements.cameraFeed, 0, 0, canvas.width, canvas.height);

  const image = new Image();
  image.onload = () => {
    state[view].image = image;
    state[view].points = {};
    drawView(view);
    renderPointList(view);
    setStatus(`${view === 'top' ? 'Top' : 'Side'} view captured. Click the measurement points on the image in order.`);
  };
  image.src = canvas.toDataURL('image/jpeg', 0.92);
}

function mapCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function drawView(view) {
  const canvas = canvases[view];
  const context = contexts[view];
  const image = state[view].image;
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (image) {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } else {
    context.fillStyle = '#020617';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#9fb1ca';
    context.font = '600 24px Inter, sans-serif';
    context.fillText(`No ${view} image captured yet.`, 28, 48);
  }

  pointOrder(view).forEach((point, index) => {
    const coordinates = state[view].points[point.key];
    if (!coordinates) {
      return;
    }

    context.beginPath();
    context.arc(coordinates.x, coordinates.y, 8, 0, Math.PI * 2);
    context.fillStyle = index < 2 ? '#7dd3fc' : '#7ef29a';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = '#08111f';
    context.stroke();

    context.fillStyle = '#f8fafc';
    context.font = '700 18px Inter, sans-serif';
    context.fillText(`${index + 1}. ${point.label}`, coordinates.x + 12, coordinates.y - 10);
  });

  drawGuideLines(view, context);
}

function drawGuideLines(view, context) {
  const points = state[view].points;
  context.save();
  context.lineWidth = 2;
  context.setLineDash([8, 8]);

  if (view === 'top' && points.outerLeft && points.outerRight) {
    context.strokeStyle = '#7dd3fc';
    drawLine(context, points.outerLeft, points.outerRight);
    if (points.innerLeft && points.innerRight) {
      context.strokeStyle = '#7ef29a';
      drawLine(context, points.innerLeft, points.innerRight);
    }
  }

  if (view === 'side') {
    if (points.shoulderLeft && points.shoulderRight) {
      context.strokeStyle = '#7dd3fc';
      drawLine(context, points.shoulderLeft, points.shoulderRight);
    }
    if (points.bottomLeft && points.bottomRight) {
      context.strokeStyle = '#f6c66d';
      drawLine(context, points.bottomLeft, points.bottomRight);
    }
  }

  context.restore();
}

function drawLine(context, a, b) {
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}

function renderPointList(view) {
  const list = view === 'top' ? elements.topPointList : elements.sidePointList;
  list.innerHTML = '';
  pointOrder(view).forEach((point, index) => {
    const node = document.createElement('div');
    node.className = 'point-chip';
    const coordinates = state[view].points[point.key];
    node.innerHTML = `
      <strong>${index + 1}. ${point.label}</strong>
      <span>${coordinates ? `${coordinates.x.toFixed(0)}, ${coordinates.y.toFixed(0)}` : 'Pending'}</span>
    `;
    list.appendChild(node);
  });
}

function resetView(view) {
  state[view].points = {};
  drawView(view);
  renderPointList(view);
}

function handleCanvasClick(view, event) {
  if (!state[view].image) {
    setStatus(`Capture the ${view} view before annotating it.`, true);
    return;
  }

  const key = nextPointKey(view);
  if (!key) {
    setStatus(`All ${view} points have been placed. Reset the points if you want to re-measure.`);
    return;
  }

  state[view].points[key] = mapCanvasPoint(event, canvases[view]);
  drawView(view);
  renderPointList(view);

  const upcoming = nextPointKey(view);
  if (upcoming) {
    const label = pointOrder(view).find((point) => point.key === upcoming)?.label;
    setStatus(`${view === 'top' ? 'Top' : 'Side'} point saved. Next: ${label}.`);
  } else {
    setStatus(`${view === 'top' ? 'Top' : 'Side'} view annotation complete. Run the analysis when both views are ready.`);
  }
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function yOnLineAtX(a, b, x) {
  if (a.x === b.x) {
    return (a.y + b.y) / 2;
  }
  const t = (x - a.x) / (b.x - a.x);
  return a.y + t * (b.y - a.y);
}

function calculateMetrics() {
  const topRef = Number(elements.topReferenceWidth.value);
  const sideRef = Number(elements.sideReferenceWidth.value);
  const topPoints = state.top.points;
  const sidePoints = state.side.points;

  const topComplete = pointOrder('top').every((point) => topPoints[point.key]);
  const sideComplete = pointOrder('side').every((point) => sidePoints[point.key]);

  if (!topComplete || !sideComplete || !topRef || !sideRef) {
    return null;
  }

  const topScale = topRef / distance(topPoints.refLeft, topPoints.refRight);
  const sideScale = sideRef / distance(sidePoints.refLeft, sidePoints.refRight);

  const diameter = distance(topPoints.outerLeft, topPoints.outerRight) * topScale;
  const flightPlateWidth = distance(topPoints.innerLeft, topPoints.innerRight) * topScale;
  const rimWidth = Math.max((diameter - flightPlateWidth) / 2, 0);
  const rimRatio = rimWidth / diameter;

  const shoulderBaselineAtApex = yOnLineAtX(sidePoints.shoulderLeft, sidePoints.shoulderRight, sidePoints.apex.x);
  const bottomBaselineAtApex = yOnLineAtX(sidePoints.bottomLeft, sidePoints.bottomRight, sidePoints.apex.x);
  const domeHeight = Math.max((shoulderBaselineAtApex - sidePoints.apex.y) * sideScale, 0);
  const totalHeight = Math.max((bottomBaselineAtApex - sidePoints.apex.y) * sideScale, 0);

  const leftPlh = Math.max((sidePoints.bottomLeft.y - sidePoints.plhLeft.y) * sideScale, 0);
  const rightPlh = Math.max((sidePoints.bottomRight.y - sidePoints.plhRight.y) * sideScale, 0);
  const plh = (leftPlh + rightPlh) / 2;

  const domeRatio = totalHeight ? domeHeight / totalHeight : 0;
  const plhRatio = totalHeight ? plh / totalHeight : 0;

  return {
    diameter,
    flightPlateWidth,
    rimWidth,
    rimRatio,
    domeHeight,
    totalHeight,
    plh,
    domeRatio,
    plhRatio,
    topScale,
    sideScale,
  };
}

function classifyFlight(metrics) {
  const speedIndex = clamp(2 + metrics.rimRatio * 44, 1, 14);
  const glideIndex = clamp(2 + metrics.domeRatio * 6.5, 1, 7);
  const stabilityScore = (metrics.plhRatio - 0.46) * 18 + (0.13 - metrics.domeRatio) * 6 + (metrics.rimRatio - 0.12) * 22;

  let stabilityLabel = 'Neutral';
  let badgeClass = 'neutral';
  let turnEstimate = -1;
  let fadeEstimate = 2;

  if (stabilityScore >= 1.75) {
    stabilityLabel = 'Overstable';
    badgeClass = 'overstable';
    turnEstimate = clamp(Math.round(-3 + stabilityScore), -1, 1);
    fadeEstimate = clamp(Math.round(2 + stabilityScore / 2), 2, 5);
  } else if (stabilityScore <= -1.4) {
    stabilityLabel = 'Understable';
    badgeClass = 'understable';
    turnEstimate = clamp(Math.round(-2 + stabilityScore), -5, -2);
    fadeEstimate = clamp(Math.round(2 + stabilityScore / 3), 0, 2);
  } else {
    turnEstimate = clamp(Math.round(-1 + stabilityScore / 2), -2, 0);
    fadeEstimate = clamp(Math.round(2 + stabilityScore / 3), 1, 3);
  }

  const notes = [];
  notes.push(metrics.rimRatio > 0.135 ? 'Wide rim suggests a faster driver-style geometry.' : 'Moderate rim width points toward fairway, hybrid, or control-disc speed.');
  notes.push(metrics.domeRatio > 0.18 ? 'Pronounced dome should add glide and can soften high-speed stability.' : 'Flatter top should feel faster and generally resist extra glide-driven turn.');
  notes.push(metrics.plhRatio > 0.5 ? 'Higher parting line height usually correlates with stronger fade and resistance to turn.' : 'Lower parting line height usually correlates with easier turn and reduced finish.');

  return {
    stabilityLabel,
    badgeClass,
    speedIndex: Math.round(speedIndex),
    glideIndex: Number(glideIndex.toFixed(1)),
    turnEstimate,
    fadeEstimate,
    notes,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function renderMetrics(metrics) {
  const items = [
    ['Outer diameter', `${metrics.diameter.toFixed(1)} mm`],
    ['Flight plate width', `${metrics.flightPlateWidth.toFixed(1)} mm`],
    ['Average rim width', `${metrics.rimWidth.toFixed(1)} mm`],
    ['Rim ratio', `${(metrics.rimRatio * 100).toFixed(1)}% of diameter`],
    ['Dome height', `${metrics.domeHeight.toFixed(1)} mm`],
    ['Total profile height', `${metrics.totalHeight.toFixed(1)} mm`],
    ['Parting line height', `${metrics.plh.toFixed(1)} mm`],
    ['Dome ratio', `${(metrics.domeRatio * 100).toFixed(1)}%`],
    ['PLH ratio', `${(metrics.plhRatio * 100).toFixed(1)}%`],
  ];

  elements.geometryResults.innerHTML = '';
  items.forEach(([label, value]) => {
    const fragment = elements.metricItemTemplate.content.cloneNode(true);
    fragment.querySelector('dt').textContent = label;
    fragment.querySelector('dd').textContent = value;
    elements.geometryResults.appendChild(fragment);
  });
}

function renderSummary(metrics, flight) {
  elements.flightSummary.innerHTML = `
    <div class="badge-row">
      <span class="badge ${flight.badgeClass}">${flight.stabilityLabel}</span>
      <span class="badge neutral">Speed ~${flight.speedIndex}</span>
      <span class="badge neutral">Glide ~${flight.glideIndex}</span>
      <span class="badge neutral">Turn ${flight.turnEstimate}</span>
      <span class="badge neutral">Fade ${flight.fadeEstimate}</span>
    </div>
    <p>
      Based on your measurements, this disc profiles as <strong>${flight.stabilityLabel.toLowerCase()}</strong> with an
      estimated speed/glide/turn/fade neighborhood of <strong>${flight.speedIndex} / ${flight.glideIndex} /
      ${flight.turnEstimate} / ${flight.fadeEstimate}</strong>.
    </p>
    <ul>
      ${flight.notes.map((note) => `<li>${note}</li>`).join('')}
    </ul>
    <p>
      Heuristic note: geometry is only one part of flight. Plastic stiffness, wear, nose angle, weight, and molding
      variations can still shift real-world stability.
    </p>
  `;
}

function analyzeProfile() {
  const metrics = calculateMetrics();
  if (!metrics) {
    setStatus('Complete all top and side measurements, and make sure both reference widths are set, before analyzing.', true);
    return;
  }

  renderMetrics(metrics);
  renderSummary(metrics, classifyFlight(metrics));
  setStatus('Profile analysis complete. Review the calculated geometry and flight interpretation.');
}

function attachEvents() {
  document.getElementById('startCameraBtn').addEventListener('click', startCamera);
  document.getElementById('stopCameraBtn').addEventListener('click', stopCamera);
  document.getElementById('captureTopBtn').addEventListener('click', () => captureFrame('top'));
  document.getElementById('captureSideBtn').addEventListener('click', () => captureFrame('side'));
  document.getElementById('resetTopBtn').addEventListener('click', () => resetView('top'));
  document.getElementById('resetSideBtn').addEventListener('click', () => resetView('side'));
  document.getElementById('analyzeBtn').addEventListener('click', analyzeProfile);
  elements.topCanvas.addEventListener('click', (event) => handleCanvasClick('top', event));
  elements.sideCanvas.addEventListener('click', (event) => handleCanvasClick('side', event));
}

attachEvents();
drawView('top');
drawView('side');
renderPointList('top');
renderPointList('side');
