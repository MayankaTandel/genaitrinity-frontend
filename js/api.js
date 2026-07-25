// Shared helpers used by every page: fetch wrapper + toast + formatting.
// Requires config.js to be loaded first (defines API_BASE_URL).

// ---- Active profile ("who's using Vital right now") ----
// No passwords involved - just a per-browser switch between local profiles,
// like picking a name off a fridge whiteboard. The chosen profile's id is
// kept in localStorage and sent as X-User-Id on every API call so the
// backend knows whose data to read/write.
const ACTIVE_PROFILE_KEY = "vitalActiveProfileId";

function getActiveProfileId() {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}
function setActiveProfileId(id) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}
function clearActiveProfileId() {
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
}
// "Sign out" — go back to the profile picker so someone else can sign in.
function signOut() {
  clearActiveProfileId();
  window.location.href = "profiles.html";
}

async function api(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";
  const profileId = getActiveProfileId();
  if (profileId) headers["X-User-Id"] = profileId;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* no body */
  }

  if (!res.ok) {
    if (res.status === 400 && data && data.error === "No profile selected. Choose or create a profile first.") {
      clearActiveProfileId();
      window.location.href = "profiles.html";
    }
    throw new Error((data && data.error) || "Something went wrong.");
  }
  return data;
}

// ---- Toast ----
let toastTimer = null;
function showToast(message, type = "success") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = type === "error" ? "error show" : "show";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// ---- Small format helpers ----
function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function activityLabel(type) {
  const map = {
    running: "Running",
    swimming: "Swimming",
    cycling: "Cycling",
    yoga: "Yoga",
    weight_training: "Weight Training",
    walking: "Walking",
    hiking: "Hiking",
    other: "Other",
  };
  return map[type] || capitalize(type);
}

const ACTIVITY_ICON = {
  running: "🏃",
  swimming: "🏊",
  cycling: "🚴",
  yoga: "🧘",
  weight_training: "🏋️",
  walking: "🚶",
  hiking: "🥾",
  other: "⚡",
};

const MEAL_ICON = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
};
