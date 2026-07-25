window.ActivityPage = (function () {
  // Mirrors utils/calc.js MET_TABLE for an instant client-side estimate.
  const MET_TABLE = {
    running: 9.8,
    swimming: 7.0,
    cycling: 7.5,
    yoga: 3.0,
    weight_training: 5.0,
    walking: 3.8,
    hiking: 6.0,
    other: 4.0,
  };

  function estimateCalories(type, minutes) {
    const weight = currentUser && currentUser.weightKg ? currentUser.weightKg : null;
    if (!weight || !minutes) return null;
    const met = MET_TABLE[type] || MET_TABLE.other;
    return Math.round((met * 3.5 * weight) / 200 * minutes);
  }

  function updateEstimate() {
    const type = document.getElementById("activityType").value;
    const minutes = Number(document.getElementById("activityDuration").value);
    const el = document.getElementById("activityEstimate");
    const estimate = estimateCalories(type, minutes);
    el.textContent = estimate ? `Estimated burn: ~${estimate} kcal` : "";
  }

  function renderList(logs) {
    const list = document.getElementById("activityList");
    const total = logs.reduce((s, a) => s + a.caloriesBurned, 0);
    document.getElementById("activityTotalToday").textContent = `${total.toLocaleString()} kcal burned`;

    if (logs.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="icon">🏃</div>No workouts logged yet today.<br/>Log one on the left to get started.</div>`;
      return;
    }

    list.innerHTML = logs
      .slice()
      .reverse()
      .map(
        (a) => `
      <div class="entry-row">
        <div class="entry-icon">${ACTIVITY_ICON[a.activityType] || "⚡"}</div>
        <div class="entry-main">
          <div class="entry-title">${activityLabel(a.activityType)}</div>
          <div class="entry-meta">${a.durationMinutes} min</div>
        </div>
        <div class="entry-cal burn tabular">-${a.caloriesBurned}</div>
        <button class="btn-danger-ghost" data-id="${a.id}" title="Delete">✕</button>
      </div>`
      )
      .join("");

    list.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => deleteEntry(btn.dataset.id));
    });
  }

  async function deleteEntry(id) {
    try {
      await api(`/activity/${id}`, { method: "DELETE" });
      showToast("Removed from activity log");
      await refresh();
      if (window.HomePage) window.HomePage.refresh();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function refresh() {
    try {
      const { logs } = await api("/activity");
      renderList(logs);
      updateEstimate();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function wireForm() {
    const form = document.getElementById("activityForm");
    const errorBanner = document.getElementById("activityError");
    const submitBtn = document.getElementById("activitySubmitBtn");

    document.getElementById("activityType").addEventListener("change", updateEstimate);
    document.getElementById("activityDuration").addEventListener("input", updateEstimate);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBanner.classList.remove("show");
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Logging…';

      try {
        const activityType = document.getElementById("activityType").value;
        const durationMinutes = Number(document.getElementById("activityDuration").value);

        await api("/activity", { method: "POST", body: { activityType, durationMinutes } });

        showToast("Workout logged 💪");
        form.reset();
        document.getElementById("activityEstimate").textContent = "";
        await refresh();
        if (window.HomePage) window.HomePage.refresh();
      } catch (err) {
        errorBanner.textContent = err.message;
        errorBanner.classList.add("show");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Log activity";
      }
    });
  }

  wireForm();

  return { refresh };
})();
