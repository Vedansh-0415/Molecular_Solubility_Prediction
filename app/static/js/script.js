const FEATURES = ["MolLogP", "MolWt", "NumRotatableBonds", "AromaticProportion"];
const els = {
  logp: document.getElementById("logp"),
  wt: document.getElementById("wt"),
  rot: document.getElementById("rot"),
  arom: document.getElementById("arom"),
};

const INIT_METRICS = JSON.parse(document.getElementById("init-data").textContent);

let currentModel = "lr";
let lrCoefficients = null;
let lrIntercept = null;
let rfImportance = null;
let gbImportance = null;
let scatterCache = {}; // modelKey -> {points, metrics}
let inFlightController = null;
let debounceTimer = null;

const MODEL_FILES = {
  lr: "linear_regression_model.pkl",
  rf: "random_forest_model.pkl",
  gb: "gradient_boosting_model.pkl",
};

function readInputs() {
  document.getElementById("val-logp").textContent = parseFloat(els.logp.value).toFixed(2);
  document.getElementById("val-wt").textContent = parseFloat(els.wt.value).toFixed(1);
  document.getElementById("val-rot").textContent = parseFloat(els.rot.value).toFixed(0);
  document.getElementById("val-arom").textContent = parseFloat(els.arom.value).toFixed(2);

  return {
    MolLogP: parseFloat(els.logp.value),
    MolWt: parseFloat(els.wt.value),
    NumRotatableBonds: parseFloat(els.rot.value),
    AromaticProportion: parseFloat(els.arom.value),
    model: currentModel,
  };
}

async function requestPrediction() {
  const payload = readInputs();

  if (inFlightController) inFlightController.abort();
  inFlightController = new AbortController();

  const t0 = performance.now();
  let res;
  try {
    res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: inFlightController.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") return; // superseded by a newer request
    document.getElementById("pred-value").textContent = "err";
    return;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    document.getElementById("pred-value").textContent = "err";
    document.getElementById("latency").textContent = body.error || "request failed";
    return;
  }

  const data = await res.json();
  const ms = Math.round(performance.now() - t0);

  document.getElementById("pred-value").textContent = data.prediction.toFixed(2);
  document.getElementById("latency").textContent = `/predict → ${ms} ms`;
  updateGauge(data.prediction);
  moveUserPoint(data.prediction);
}

function scheduleRequest() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(requestPrediction, 60);
}

function renderCoefficients() {
  const body = document.getElementById("coef-body");
  const title = document.getElementById("model-panel-title");
  const colLabel = document.getElementById("coef-col-label");
  const note = document.getElementById("model-note");

  if (currentModel === "lr") {
    title.textContent = "What's driving the prediction";
    colLabel.textContent = "Coefficient";
    const maxAbs = Math.max(...Object.values(lrCoefficients).map(Math.abs));
    body.innerHTML = FEATURES.map((f) => {
      const v = lrCoefficients[f];
      const isNeg = v < 0;
      const pct = (Math.abs(v) / maxAbs) * 50;
      const side = isNeg ? `right:50%;width:${pct}%;` : `left:50%;width:${pct}%;`;
      const color = isNeg ? "var(--neon-red)" : "var(--neon-green)";
      return `<tr>
        <td>${f}</td>
        <td class="${isNeg ? "mono-neg" : ""}">${v.toFixed(4)}</td>
        <td><div class="coef-bar-bg"><div class="coef-bar" style="${side}background:${color};"></div></div></td>
      </tr>`;
    }).join("");
    note.textContent = `Intercept: ${lrIntercept.toFixed(4)}. Negative coefficients mean the descriptor pulls solubility down as it increases.`;
  } else {
    const importanceData = currentModel === "gb" ? gbImportance : rfImportance;
    title.textContent = "What's driving the prediction (feature importance)";
    colLabel.textContent = "Importance";
    const maxImp = Math.max(...Object.values(importanceData), 0.0001);
    body.innerHTML = FEATURES.map((f) => {
      const v = importanceData[f];
      const pct = (v / maxImp) * 100;
      return `<tr>
        <td>${f}</td>
        <td>${v.toFixed(4)}</td>
        <td><div class="coef-bar-bg"><div class="coef-bar" style="left:0;width:${pct}%;background:var(--neon-cyan);"></div></div></td>
      </tr>`;
    }).join("");
    
    note.textContent = currentModel === "gb" 
      ? `Gradient Boosting iteratively corrects errors. Importance shows how much each feature contributes across all trees.` 
      : `Random Forest builds multiple independent trees. Importance shows the average contribution of each feature.`;
  }
}

async function loadModelData(modelKey) {
  if (!scatterCache[modelKey]) {
    const res = await fetch(`/scatter?model=${modelKey}`);
    scatterCache[modelKey] = await res.json();
  }
  const { points, metrics } = scatterCache[modelKey];
  renderChart(points, metrics);
  document.getElementById("stat-r2").textContent = metrics.test_r2.toFixed(3);
  document.getElementById("stat-mse").textContent = metrics.test_mse.toFixed(3);
}

async function switchModel(modelKey) {
  currentModel = modelKey;
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    const active = btn.dataset.model === modelKey;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active);
  });
  document.getElementById("model-key-label").textContent = MODEL_FILES[modelKey];
  renderCoefficients();
  await loadModelData(modelKey);
  scheduleRequest();
}

const PRESETS = {
  aspirin: { logp: 1.19, wt: 180.16, rot: 3, arom: 0.46 },
  caffeine: { logp: -0.07, wt: 194.19, rot: 0, arom: 0.56 },
  steroid: { logp: 3.5, wt: 300, rot: 1, arom: 0.0 },
  pfas: { logp: 8.5, wt: 414, rot: 8, arom: 0.0 },
};

function applyPreset(key) {
  const p = PRESETS[key];
  els.logp.value = p.logp;
  els.wt.value = p.wt;
  els.rot.value = p.rot;
  els.arom.value = p.arom;
  readInputs();
  scheduleRequest();
}

async function predictFromSmiles() {
  const smilesInput = document.getElementById("smiles-input").value.trim();
  const errorEl = document.getElementById("smiles-error");
  errorEl.style.display = "none";

  if (!smilesInput) {
    errorEl.textContent = "Please enter a SMILES string.";
    errorEl.style.display = "block";
    return;
  }

  const payload = { smiles: smilesInput, model: currentModel };
  
  try {
    const res = await fetch("/predict/smiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      errorEl.textContent = data.error || "Failed to predict from SMILES.";
      errorEl.style.display = "block";
      return;
    }
    
    // Update sliders with computed descriptors
    els.logp.value = data.descriptors.MolLogP;
    els.wt.value = data.descriptors.MolWt;
    els.rot.value = data.descriptors.NumRotatableBonds;
    els.arom.value = data.descriptors.AromaticProportion;
    
    // Trigger the normal prediction flow to update UI
    readInputs();
    scheduleRequest();
    
  } catch (err) {
    errorEl.textContent = "Network error while predicting from SMILES.";
    errorEl.style.display = "block";
  }
}

async function init() {
  const metricsRes = await fetch("/metrics");
  const metricsData = await metricsRes.json();
  lrCoefficients = metricsData.lr_coefficients;
  lrIntercept = metricsData.lr_intercept;
  rfImportance = metricsData.rf_importance;
  gbImportance = metricsData.gb_importance;

  renderCoefficients();
  await loadModelData(currentModel);

  Object.values(els).forEach((inp) => {
    inp.addEventListener("input", () => {
      readInputs();
      scheduleRequest();
    });
  });

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
  });

  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.model !== currentModel) switchModel(btn.dataset.model);
    });
  });
  
  const smilesBtn = document.getElementById("smiles-btn");
  if (smilesBtn) {
    smilesBtn.addEventListener("click", predictFromSmiles);
  }

  readInputs();
  requestPrediction();
}

init();
