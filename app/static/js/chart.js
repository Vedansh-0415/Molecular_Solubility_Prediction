// Renders the "predicted vs experimental logS" scatter plot for the
// currently selected model, and moves a live marker for the user's input.

const CHART = { W: 640, H: 360, PAD: 44, xmin: -12, xmax: 3, ymin: -12, ymax: 3 };

function chartSx(v) {
  return CHART.PAD + (v - CHART.xmin) / (CHART.xmax - CHART.xmin) * (CHART.W - 2 * CHART.PAD);
}
function chartSy(v) {
  return CHART.H - CHART.PAD - (v - CHART.ymin) / (CHART.ymax - CHART.ymin) * (CHART.H - 2 * CHART.PAD);
}

let _lastPredictedY = 0;

function renderChart(points, metrics) {
  const { W, H, PAD, xmin, xmax, ymin, ymax } = CHART;
  let svgHTML = "";

  for (let g = xmin; g <= xmax; g += 3) {
    svgHTML += `<line class="grid-line" x1="${chartSx(g)}" y1="${PAD}" x2="${chartSx(g)}" y2="${H - PAD}"/>`;
    svgHTML += `<text class="axis-label" x="${chartSx(g)}" y="${H - PAD + 16}" text-anchor="middle">${g}</text>`;
  }
  for (let g = ymin; g <= ymax; g += 3) {
    svgHTML += `<line class="grid-line" x1="${PAD}" y1="${chartSy(g)}" x2="${W - PAD}" y2="${chartSy(g)}"/>`;
    svgHTML += `<text class="axis-label" x="${PAD - 8}" y="${chartSy(g) + 3}" text-anchor="end">${g}</text>`;
  }
  svgHTML += `<text class="axis-label" x="${W / 2}" y="${H - 6}" text-anchor="middle">Experimental logS</text>`;
  svgHTML += `<text class="axis-label" x="14" y="${H / 2}" text-anchor="middle" transform="rotate(-90 14 ${H / 2})">Predicted logS</text>`;
  svgHTML += `<line class="diag-line" x1="${chartSx(xmin)}" y1="${chartSy(xmin)}" x2="${chartSx(xmax)}" y2="${chartSy(xmax)}"/>`;

  for (const [a, p] of points) {
    if (a < xmin || a > xmax || p < ymin || p > ymax) continue;
    svgHTML += `<circle class="dot" cx="${chartSx(a)}" cy="${chartSy(p)}" r="2.6"/>`;
  }

  svgHTML += `<circle class="user-dot" id="user-dot" cx="${chartSx(_lastPredictedY)}" cy="${chartSy(_lastPredictedY)}" r="6"/>`;

  document.getElementById("chart").innerHTML = svgHTML;

  const caption = document.getElementById("chart-caption");
  caption.textContent =
    `Each purple point is one molecule scored by ${metrics.label}; the dashed line is perfect agreement (y = x). ` +
    `Your current input is plotted in cyan. Test R² is ${metrics.test_r2.toFixed(3)} — ` +
    (metrics.test_r2 > 0.7
      ? "reasonably tight, though plenty of molecules still sit \u00b11-2 log units off."
      : "loose enough that this model shouldn't be trusted for close calls.");
}

function moveUserPoint(predictedY) {
  _lastPredictedY = predictedY;
  const dot = document.getElementById("user-dot");
  if (!dot) return;
  // No true experimental value exists for a hypothetical input, so the
  // marker sits on the y = x line at the predicted value as a reference point.
  dot.setAttribute("cx", chartSx(predictedY));
  dot.setAttribute("cy", chartSy(predictedY));
}
