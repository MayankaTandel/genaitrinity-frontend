window.FoodPage = (function () {
  let aiSource = false;

  function badgeClass(meal) {
    return `badge badge-${meal}`;
  }

  function renderList(logs) {
    const list = document.getElementById("foodList");
    const total = logs.reduce((s, f) => s + f.calories, 0);
    document.getElementById("foodTotalToday").textContent = `${total.toLocaleString()} kcal logged`;

    if (logs.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="icon">🍽️</div>No meals logged yet today.<br/>Add one on the left to get started.</div>`;
      return;
    }

    list.innerHTML = logs
      .slice()
      .reverse()
      .map(
        (f) => `
      <div class="entry-row">
        <div class="entry-icon">${MEAL_ICON[f.mealType] || "🍽️"}</div>
        <div class="entry-main">
          <div class="entry-title">${escapeHtml(f.foodName)}</div>
          <div class="entry-meta">
            <span class="${badgeClass(f.mealType)}">${f.mealType}</span>
            ${f.source === "ai" ? '<span class="badge badge-ai">✨ AI</span>' : ""}
          </div>
        </div>
        <div class="entry-cal fuel tabular">+${f.calories}</div>
        <button class="btn-danger-ghost" data-id="${f.id}" title="Delete">✕</button>
      </div>`
      )
      .join("");

    list.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => deleteEntry(btn.dataset.id));
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function deleteEntry(id) {
    try {
      await api(`/food/${id}`, { method: "DELETE" });
      showToast("Removed from food log");
      await refresh();
      if (window.HomePage) window.HomePage.refresh();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function refresh() {
    try {
      const { logs } = await api("/food");
      renderList(logs);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function wireForm() {
    const form = document.getElementById("foodForm");
    const errorBanner = document.getElementById("foodError");
    const submitBtn = document.getElementById("foodSubmitBtn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBanner.classList.remove("show");
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Adding…';

      try {
        const foodName = document.getElementById("foodName").value.trim();
        const calories = Number(document.getElementById("foodCalories").value);
        const mealType = document.getElementById("foodMeal").value;

        await api("/food", {
          method: "POST",
          body: { foodName, calories, mealType, source: aiSource ? "ai" : "manual" },
        });

        showToast("Added to food log 🎉");
        form.reset();
        aiSource = false;
        resetSnapUI();
        await refresh();
        if (window.HomePage) window.HomePage.refresh();
      } catch (err) {
        errorBanner.textContent = err.message;
        errorBanner.classList.add("show");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Add to log";
      }
    });
  }

  function resetSnapUI() {
    document.getElementById("snapPreview").style.display = "none";
    document.getElementById("snapError").classList.remove("show");
    document.getElementById("snapInput").value = "";
  }

  async function handleFile(file) {
    if (!file) return;
    const errorEl = document.getElementById("snapError");
    errorEl.classList.remove("show");

    const preview = document.getElementById("snapPreview");
    const img = document.getElementById("snapImg");
    const nameEl = document.getElementById("snapName");
    const calEl = document.getElementById("snapCal");

    img.src = URL.createObjectURL(file);
    preview.style.display = "flex";
    nameEl.innerHTML = '<span class="spinner spinner-dark"></span> Analyzing photo…';
    calEl.textContent = "";

    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await api("/gemini/analyze-food", { method: "POST", body: formData, isForm: true });

      nameEl.textContent = result.foodName;
      calEl.textContent = `~${result.calories} kcal · ${result.confidence} confidence`;

      document.getElementById("foodName").value = result.foodName;
      document.getElementById("foodCalories").value = result.calories;
      aiSource = true;
      showToast("Food recognized — review and add it below ✨");
    } catch (err) {
      nameEl.textContent = "Couldn't analyze that photo";
      calEl.textContent = "";
      errorEl.textContent = err.message;
      errorEl.classList.add("show");
    }
  }

  function wireSnapZone() {
    const zone = document.getElementById("snapZone");
    const input = document.getElementById("snapInput");

    input.addEventListener("change", () => handleFile(input.files[0]));

    ["dragover", "dragenter"].forEach((evt) =>
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.add("dragover");
      })
    );
    ["dragleave", "drop"].forEach((evt) =>
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.remove("dragover");
      })
    );
    zone.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  }

  wireForm();
  wireSnapZone();

  return { refresh };
})();
