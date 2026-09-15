// Classifies a predicted logS value and positions the gauge needle.
// Thresholds follow the common medicinal-chemistry solubility bands.

function classifySolubility(value) {
  if (value >= -0.5) return { label: "VERY SOLUBLE", color: "#00F0FF" }; // Neon Cyan
  if (value >= -2)   return { label: "SOLUBLE",      color: "#00E676" }; // Neon Green
  if (value >= -4)   return { label: "MODERATE",     color: "#FFD700" }; // Gold
  if (value >= -6)   return { label: "POOR",         color: "#FF9933" }; // Orange
  return                  { label: "INSOLUBLE",   color: "#FF3366" }; // Neon Red
}

// Maps a logS value in [-11, 2] onto a 2%-98% gauge position.
function gaugePosition(value) {
  const clamped = Math.max(-11, Math.min(2, value));
  return ((clamped - -11) / (2 - -11)) * 96 + 2;
}

function updateGauge(value) {
  const cls = classifySolubility(value);
  const badge = document.getElementById("pred-badge");
  badge.textContent = cls.label;
  badge.style.color = cls.color;
  badge.style.borderColor = cls.color;
  badge.style.background = cls.color + "1a"; // 10% opacity for neon glow
  badge.style.boxShadow = `0 0 10px ${cls.color}33`; // 20% opacity glow

  document.getElementById("gauge-needle").style.left = gaugePosition(value) + "%";
  return cls;
}
