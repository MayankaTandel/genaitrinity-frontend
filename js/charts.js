// Small wrapper around Chart.js so home.js stays readable.

let weekChartInstance = null;
let mealChartInstance = null;

function showChartLoadError(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const wrap = canvas.closest(".chart-wrap");
  if (wrap && !wrap.querySelector(".chart-load-error")) {
    canvas.style.display = "none";
    const msg = document.createElement("div");
    msg.className = "chart-load-error";
    msg.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:12.5px;text-align:center;padding:0 16px;";
    msg.textContent = "Charts couldn't load — check your internet connection and refresh the page.";
    wrap.appendChild(msg);
  }
}

function renderWeekChart(labels, consumedData, burnedData) {
  const ctx = document.getElementById("weekChart");
  if (!ctx) return;

  if (typeof Chart === "undefined") {
    showChartLoadError("weekChart");
    return;
  }

  if (weekChartInstance) weekChartInstance.destroy();

  weekChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Consumed",
          data: consumedData,
          borderColor: "#2fd675",
          backgroundColor: "rgba(47, 214, 117, 0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#2fd675",
        },
        {
          label: "Burned",
          data: burnedData,
          borderColor: "#ff5a3c",
          backgroundColor: "rgba(255, 90, 60, 0.08)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#ff5a3c",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#10241e",
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "#eef1f0" }, ticks: { font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
}

function renderMealChart(mealBreakdown) {
  const ctx = document.getElementById("mealChart");
  if (!ctx) return;

  if (typeof Chart === "undefined") {
    showChartLoadError("mealChart");
    return;
  }

  if (mealChartInstance) mealChartInstance.destroy();

  const values = [mealBreakdown.breakfast || 0, mealBreakdown.lunch || 0, mealBreakdown.dinner || 0];
  const hasData = values.some((v) => v > 0);

  mealChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Breakfast", "Lunch", "Dinner"],
      datasets: [
        {
          data: hasData ? values : [1, 1, 1],
          backgroundColor: hasData
            ? ["#ffb020", "#2fd675", "#3d5aff"]
            : ["#eef1f0", "#eef1f0", "#eef1f0"],
          borderWidth: 0,
          hoverOffset: hasData ? 6 : 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      animation: { duration: 700, easing: "easeOutQuart" },
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11.5 } },
        },
        tooltip: { enabled: hasData },
      },
    },
  });
}
