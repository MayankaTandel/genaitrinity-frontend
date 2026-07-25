window.ProfilePage = (function () {
  function fillForm(user) {
    document.getElementById("profileAvatar").textContent = initials(user.name);
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileGoalLine").textContent = user.goal
      ? `Goal: ${capitalize(user.goal)} weight`
      : "No goal set yet";

    document.getElementById("pName").value = user.name || "";
    document.getElementById("pAge").value = user.age || "";
    document.getElementById("pGender").value = user.gender || "other";
    document.getElementById("pHeight").value = user.heightCm || "";
    document.getElementById("pWeight").value = user.weightKg || "";

    const goalInput = document.querySelector(`input[name="pGoal"][value="${user.goal}"]`);
    if (goalInput) goalInput.checked = true;
  }

  async function refresh(user) {
    try {
      const { user: fresh } = await api("/profile");
      currentUser = fresh;
      fillForm(fresh);
    } catch (err) {
      if (user) fillForm(user);
    }
  }

  function wireForm() {
    const form = document.getElementById("profileForm");
    const errorBanner = document.getElementById("profileError");
    const successBanner = document.getElementById("profileSuccess");
    const submitBtn = document.getElementById("profileSubmitBtn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBanner.classList.remove("show");
      successBanner.classList.remove("show");
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner spinner-dark"></span> Saving…';

      try {
        const name = document.getElementById("pName").value.trim();
        const age = Number(document.getElementById("pAge").value);
        const gender = document.getElementById("pGender").value;
        const heightCm = Number(document.getElementById("pHeight").value);
        const weightKg = Number(document.getElementById("pWeight").value);
        const goalEl = document.querySelector('input[name="pGoal"]:checked');
        const goal = goalEl ? goalEl.value : "maintain";

        const { user } = await api("/profile", {
          method: "PUT",
          body: { name, age, gender, heightCm, weightKg, goal },
        });

        currentUser = user;
        fillForm(user);
        fillSidebar(user);
        successBanner.classList.add("show");
        showToast("Profile updated ✓");
        if (window.HomePage) window.HomePage.refresh();
      } catch (err) {
        errorBanner.textContent = err.message;
        errorBanner.classList.add("show");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save changes";
      }
    });
  }

  wireForm();

  return { refresh };
})();
