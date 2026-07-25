window.HomePage = (function () {
  function setRing(consumed, goal, burned) {
    const ring = document.getElementById("vitalRing");
    const pct = goal > 0 ? Math.min(100, Math.max(0, (consumed / goal) * 100)) : 0;
    ring.style.setProperty("--pct", pct.toFixed(1));

    const remaining = goal - consumed + burned;
    const ringNum = document.getElementById("ringNum");
    const ringLbl = ring.querySelector(".lbl");

    if (remaining >= 0) {
      ringNum.textContent = Math.round(remaining).toLocaleString();
      ringLbl.textContent = "kcal left";
      ringNum.style.color = "var(--ink)";
    } else {
      ringNum.textContent = Math.round(Math.abs(remaining)).toLocaleString();
      ringLbl.textContent = "kcal over";
      ringNum.style.color = "var(--signal)";
    }
  }

  function setBmi(bmi, category) {
    document.getElementById("bmiValue").textContent = bmi.toFixed(1);
    const badge = document.getElementById("bmiCategoryBadge");
    badge.textContent = category;

    const colors = {
      Underweight: ["#e1e9ff", "#2437b8"],
      Normal: ["var(--growth-soft)", "#146b3a"],
      Overweight: ["#fff2d6", "#a6690c"],
      Obese: ["#fdeceb", "var(--danger)"],
    };
    const [bg, fg] = colors[category] || ["var(--growth-soft)", "#146b3a"];
    badge.style.background = bg;
    badge.style.color = fg;

    // Map BMI 15-40 onto the 0-100% meter track
    const pct = Math.min(100, Math.max(0, ((bmi - 15) / (40 - 15)) * 100));
    document.getElementById("bmiMarker").style.left = pct + "%";
  }

  async function loadWeekChart() {
    const [foodRange, activityRange] = await Promise.all([
      api("/food/range?days=7"),
      api("/activity/range?days=7"),
    ]);

    const dates = Object.keys(foodRange.totals);
    const labels = dates.map((d) =>
      new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })
    );
    const consumedData = dates.map((d) => foodRange.totals[d]);
    const burnedData = dates.map((d) => activityRange.totals[d] || 0);

    renderWeekChart(labels, consumedData, burnedData);
  }

  async function refresh() {
    document.getElementById("homeDate").textContent = todayLabel();

    try {
      const summary = await api("/dashboard/summary");
      if (!summary.onboarded) return;

      document.getElementById("homeGreetName").textContent = currentUser ? currentUser.name.split(" ")[0] : "there";

      setRing(summary.caloriesConsumed, summary.dailyCalorieGoal, summary.caloriesBurned);
      setBmi(summary.bmi, summary.bmiCategory);

      document.getElementById("legendConsumed").textContent = summary.caloriesConsumed.toLocaleString();
      document.getElementById("legendBurned").textContent = summary.caloriesBurned.toLocaleString();
      document.getElementById("legendGoal").textContent = summary.dailyCalorieGoal.toLocaleString();

      document.getElementById("statConsumed").textContent = summary.caloriesConsumed.toLocaleString();
      document.getElementById("statFoodCount").textContent = `${summary.foodEntryCount} ${summary.foodEntryCount === 1 ? "entry" : "entries"} today`;

      document.getElementById("statBurned").textContent = summary.caloriesBurned.toLocaleString();
      document.getElementById("statActivityCount").textContent = `${summary.activityEntryCount} ${summary.activityEntryCount === 1 ? "workout" : "workouts"} today`;

      document.getElementById("statGoal").textContent = summary.dailyCalorieGoal.toLocaleString();
      document.getElementById("statGoalType").textContent = `To ${summary.goal} weight`;

      renderMealChart(summary.mealBreakdown);
      await loadWeekChart();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return { refresh };
})();
