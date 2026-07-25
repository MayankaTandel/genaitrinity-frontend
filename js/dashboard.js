// Controls the 4-section SPA-style navigation inside dashboard.html

const PAGES = ["home", "food", "activity", "profile"];
let currentUser = null;

function setActivePage(page) {
  if (!PAGES.includes(page)) page = "home";

  document.querySelectorAll(".page-section").forEach((el) => el.classList.remove("active"));
  document.getElementById(`page-${page}`).classList.add("active");

  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });
  document.querySelectorAll(".mobile-nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  window.location.hash = page;

  // Ask the relevant page module to (re)load its data
  if (page === "home" && window.HomePage) window.HomePage.refresh();
  if (page === "food" && window.FoodPage) window.FoodPage.refresh();
  if (page === "activity" && window.ActivityPage) window.ActivityPage.refresh();
  if (page === "profile" && window.ProfilePage) window.ProfilePage.refresh(currentUser);
}

function wireNav() {
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((el) => {
    el.addEventListener("click", () => setActivePage(el.dataset.page));
  });
}

function wireSignOut() {
  ["signOutBtn", "signOutBtnMobile"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", signOut);
  });
}

function fillSidebar(user) {
  document.getElementById("sidebarAvatar").textContent = initials(user.name);
  document.getElementById("sidebarName").textContent = user.name;
  document.getElementById("sidebarGoal").textContent = user.goal ? `${user.goal} weight` : "No goal set";
  document.getElementById("profileAvatar").textContent = initials(user.name);
}

async function boot() {
  wireNav();
  wireSignOut();

  if (!getActiveProfileId()) {
    window.location.href = "profiles.html";
    return;
  }

  try {
    const { user } = await api("/profile");
    currentUser = user;

    if (!user || !user.onboarded) {
      window.location.href = "onboarding.html";
      return;
    }

    fillSidebar(user);

    const startPage = PAGES.includes(window.location.hash.slice(1))
      ? window.location.hash.slice(1)
      : "home";
    setActivePage(startPage);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    document.getElementById("loadingScreen").style.display = "none";
  }
}

boot();
