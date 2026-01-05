let players = [];
const tiersDocs = [
    { tier: "HT1", gamemode: "High Tier 1", description: "Gives you 30 points." },
    { tier: "LT1", gamemode: "Low Tier 1", description: "Gives you 25 points." },
    { tier: "HT2", gamemode: "High Tier 2", description: "Gives you 20 points." },
    { tier: "LT2", gamemode: "Low Tier 2", description: "Gives you 16 points." },
    { tier: "HT3", gamemode: "High Tier 3", description: "Gives you 12 points." },
    { tier: "LT3", gamemode: "Low Tier 3", description: "Gives you 9 points." },
    { tier: "HT4", gamemode: "High Tier 4", description: "Gives you 6 points." },
    { tier: "LT4", gamemode: "Low Tier 4", description: "Gives you 4 points." },
    { tier: "HT5", gamemode: "High Tier 5", description: "Gives you 2 points." },
    { tier: "LT5", gamemode: "Low Tier 5", description: "Gives you 1 point." }
];

async function loadPlayers() {
  const res = await fetch("/players");
  players = await res.json();

  // Update the footer with the number of players
  const playerCountEl = document.getElementById("player-count");
  playerCountEl.textContent = `Players Tested: ${players.length}`;
}
/* =============================
   ELEMENTS
============================= */

const leaderboardSection = document.getElementById("leaderboard-section");
const applicationSection = document.getElementById("application-section");
const docsSection = document.getElementById("docs-section");
const playersContainer = document.getElementById("players-container");
const tierDocsContainer = document.getElementById("tier-docs-container");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
const closeModalBtn = document.getElementById("close-modal");
const searchInput = document.getElementById("search-input");
const tableHeader = document.querySelector(".table-header");
const testersSection = document.getElementById("testers-section");
const testersContainer = document.getElementById("testers-container");
const testerModeFilter = document.getElementById("tester-mode-filter");
const testerRegionFilter = document.getElementById("tester-region-filter");

/* =============================
   PROFILE DESIGNER ELEMENTS
============================= */

const settingsBtn = document.getElementById("settings-btn");
const profileDesignerModal = document.getElementById("profile-designer-modal");
const closeDesignerBtn = document.getElementById("close-designer");

const profileBanner = document.getElementById("profile-banner");
const bannerSelector = document.getElementById("banner-selector");
const editBannerBtn = document.getElementById("edit-banner-btn");

const bannerOptions = document.querySelectorAll(".banner-options img");
const designerName = document.getElementById("designer-name");
const designerAvatar = document.getElementById("designer-avatar");

const buildersSection = document.getElementById("builders-section");
const buildersContainer = document.getElementById("builders-container");

let currentUser = null;
let testers = [];
let builders = [];

async function loadTesters() {
  try {
    const res = await fetch("/testers");
    const data = await res.json();
    testers = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch testers:", err);
    testers = [];
  }
}

document.querySelectorAll(".builder-option").forEach(opt => {
  opt.addEventListener("click", async () => {
    const region = opt.dataset.region;
    showSection(buildersSection);
    tableHeader.style.display = "grid";

    if (!builders.length) await loadBuilders();

    // Render builders for that region
    renderBuilders(region);
  });
});

function normalizeBuilderTiers() {
  builders.forEach(b => {
    if (Array.isArray(b.tiers)) {
      const obj = {};
      b.tiers.forEach(t => {
        if (t.subject && t.tier) obj[t.subject] = t.tier;
      });
      b.tiers = obj;
    }
  });
}

async function loadBuilders() {
  try {
    const res = await fetch("/builders");
    builders = await res.json();

    // Normalize tiers to object keyed by subject
    builders.forEach(b => {
      if (Array.isArray(b.tiers)) {
        const tiersObj = {};
        b.tiers.forEach(t => {
          if (t.subject && t.tier) {
            tiersObj[t.subject] = t.tier;
          }
        });
        b.tiers = tiersObj;
      }
    });
  } catch (err) {
    console.error("Failed to load builders:", err);
    builders = [];
  }
}

function attachBuilderClick() {
  document.querySelectorAll("[data-builder]").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.builder;
      const builder = builders.find(b => b.name === name);
      if (!builder) return;

      const tiersHTML = generateBuilderTiersHTML(builder);
      const nitroClass = builder.nitro ? "nitro" : "";

      modalTitle.textContent = "";

      modalContent.innerHTML = `
        <div class="modal-header"
             style="background-image: url('anime-style-stone.jpg')">
          <img class="modal-avatar ${nitroClass}" src="https://render.crafty.gg/3d/bust/${builder.uuid}" alt="${builder.name} Avatar">
          <div class="modal-name ${nitroClass}">${builder.name || "Unknown Builder"}</div>
        </div>

        <div class="modal-section">
          <div class="modal-info-row ${nitroClass}">
            <span class="modal-label">Region:</span>
            <span class="modal-value">${builder.region || "Unknown"}</span>
          </div>
          <div class="modal-info-row ${nitroClass}">
            <span class="modal-label">Creativity:</span>
            <span class="modal-value">${builder.tiers?.Creativity || "N/A"}</span>
          </div>
          <div class="modal-info-row ${nitroClass}">
            <span class="modal-label">Spacing:</span>
            <span class="modal-value">${builder.tiers?.Spacing || "N/A"}</span>
          </div>
          <div class="modal-info-row ${nitroClass}">
            <span class="modal-label">Details:</span>
            <span class="modal-value">${builder.tiers?.Details || "N/A"}</span>
          </div>
          <div class="modal-info-row ${nitroClass}">
            <span class="modal-label">Execution:</span>
            <span class="modal-value">${builder.tiers?.Execution || "N/A"}</span>
          </div>
          <div class="modal-info-row ${nitroClass}">
            <span class="modal-label">Total Points:</span>
            <span class="modal-value">${builder.points || 0}</span>
          </div>
        </div>

        <h3 class="modal-subtitle ${nitroClass}">Tier Progress</h3>
        <div class="tiers-container">
          ${tiersHTML}
        </div>
      `;

      modal.classList.add("show");
    });
  });
}

function generateBuilderTiersHTML(builder) {
  const subjects = ["Creativity", "Spacing", "Execution", "Details"];

  return subjects.map(subject => {
    const tier = builder.tiers?.[subject];

    if (!tier || tier === "Unknown") {
      return `<div class="tier empty" data-tooltip="${subject} — Unrated"></div>`;
    }

    const tierNum = tier.match(/\d+/)?.[0];
    if (!tierNum) {
      return `<div class="tier empty"></div>`;
    }

    // Add subject image
    const subjectImage = `${subject}.png`; // assuming your images are named Creativity.png, Spacing.png, Details.png

    return `
      <div class="tier"
        data-subject="${subject}"
        data-tier="${tierNum}"
        data-tooltip="${subject} — ${tier}">
        <img src="${subjectImage}" alt="${subject}" class="tier-subject-icon">
        <span>${tier}</span>
      </div>
    `;
  }).join("");
}

function generateBuilderModeLeaderboard(subject) {
  if (!subject) return;

  tableHeader.style.display = "none";

  // 🔥 ALWAYS reset builder container (DO NOT reuse mode DOM)
  buildersContainer.innerHTML = `
    <div class="mode-wrapper">
      <div class="mode-title">${subject} Builders</div>
      <div class="mode-tiers" id="builder-mode-tiers"></div>
    </div>
  `;

  const tiersGrid = document.getElementById("builder-mode-tiers");

    // Create Tier 1–5 columns fresh every time
  for (let i = 1; i <= 5; i++) {
    const col = document.createElement("div");
    col.className = "mode-tier-column";
    col.innerHTML = `<div class="mode-tier-header">Tier ${i}</div>`;
    tiersGrid.appendChild(col);
  }

  // Append builders to the proper columns
  builders.forEach(builder => {
    const tierStr = builder.tiers?.[subject];
    if (!tierStr || tierStr === "Unknown") return;

    const tierNumber = parseInt(tierStr.match(/\d+/)[0]);
    const isHT = tierStr.includes("HT");
    const targetColumn = document.querySelectorAll(".mode-tier-column")[tierNumber - 1];
    if (!targetColumn) return;

    const builderDiv = document.createElement("div");
    builderDiv.className = "mode-player";
    builderDiv.dataset.builder = builder.name;
    builderDiv.dataset.region = builder.region.toLowerCase();
    builderDiv.dataset.signvalue = isHT ? 2 : 1;
    builderDiv.innerHTML = `
      <div class="mode-player-left">
        <img src="https://render.crafty.gg/3d/bust/${builder.uuid}">
        <span class="player-label">${builder.name}</span>
        <span class="tier-sign">${isHT ? "+" : "-"}</span>
      </div>
      <div class="region-box">
        <span>${builder.region.toUpperCase()}</span>
      </div>
    `;

    targetColumn.appendChild(builderDiv);
  });

  // Sort builders in each column so HT (+) is above LT (-)
  document.querySelectorAll(".mode-tier-column").forEach(col => {
    const playerList = [...col.querySelectorAll(".mode-player")];
    playerList
      .sort((a, b) => b.dataset.signvalue - a.dataset.signvalue)
      .forEach(el => col.appendChild(el));
  });

  attachBuilderClick();
}

document.querySelectorAll(".subject-btn").forEach(btn => {
  btn.addEventListener("click", async () => {

    showSection(buildersSection);
    tableHeader.style.display = "none";

    await loadBuilders();
  normalizeBuilderTiers();
  generateBuilderModeLeaderboard(btn.dataset.subject);
  });
});

function renderBuilders(region = "global") {
  buildersContainer.innerHTML = "";

  const filtered =
    region === "global"
      ? builders
      : builders.filter(b => b.region === region);

  // Sort by points descending
  filtered.sort((a, b) => b.points - a.points);

  // HARD LIMIT TO TOP 100
  const top100 = filtered.slice(0, 100);

  top100.forEach((builder, index) => {
    const borderClass =
      index === 0 ? "gold" :
      index === 1 ? "silver" :
      index === 2 ? "bronze" : "";

    const nitroClass = builder.nitro ? "nitro" : "";

    const tiersHTML = generateBuilderTiersHTML(builder);

    const cardHTML = `
      <div class="builder-card ${borderClass}" data-builder="${builder.name}">
        <div class="rank">${index + 1}.</div>
        <img class="avatar" src="https://render.crafty.gg/3d/bust/${builder.uuid}">
        <div class="player-info">
          <div class="player-name ${nitroClass}">${builder.name}</div>
          <div class="player-sub ${nitroClass}">⭐ ${getRankTitle(builder.points)} (${builder.points})</div>
        </div>
        <div class="region region-${builder.region.toLowerCase()}">${builder.region}</div>
        <div class="tiers">${tiersHTML}</div>
      </div>
    `;

    buildersContainer.insertAdjacentHTML("beforeend", cardHTML);
  });

  attachBuilderClick();
}

function attachBuilderModeClick() {
  document.querySelectorAll("[data-builder]").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.builder;
      const builder = builders.find(b => b.name === name);
      if (!builder) return;

      modalTitle.textContent = builder.name;
      modalContent.innerHTML = `
        <div class="modal-header">
          <img class="modal-avatar" src="https://render.crafty.gg/3d/bust/${builder.uuid}">
        </div>
        <div class="modal-section">
          <div>Region: ${builder.region}</div>
          <div>Creativity: ${builder.tiers.Creativity}</div>
          <div>Spacing: ${builder.tiers.Spacing}</div>
          <div>Details: ${builder.tiers.Details}</div>
          <div>Execution: ${builder.tiers.Execution}</div>
          <div>Total Points: ${builder.points}</div>
        </div>
      `;
      modal.classList.add("show");
    });
  });
}

/* =============================
   SECTION SWITCHING HELPER
============================= */

function getPlayerPlacement(player, region = "global") {
  // Sort players by points descending
  const sorted = [...players].sort((a, b) => b.points - a.points);

  // Apply region filter
  const filtered =
    region === "global"
      ? sorted
      : sorted.filter(p => p.region === region);

  // Find placement
  const index = filtered.findIndex(p => p.uuid === player.uuid);

  return index >= 0 ? index + 1 : null;
}

// Close PLAYER modal with X button
closeModalBtn.addEventListener("click", () => {
  modal.classList.remove("show");
});

const loginBtn = document.getElementById("login-btn");
const authModal = document.getElementById("auth-modal");
const authCancelBtn = document.getElementById("auth-cancel");

authCancelBtn.addEventListener("click", closeAuth);

loginBtn.addEventListener("click", () => {
  authModal.classList.add("show");
});

function closeAuth() {
  authModal.classList.remove("show");
}

// Close PLAYER modal when clicking backdrop
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
  }
});

const authForm = document.querySelector(".auth-form");

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const ign = document.getElementById("auth-ign").value.trim();
  const code = document.getElementById("auth-code").value.trim();

  if (!ign || !code) {
    alert("Please enter IGN and login code");
    return;
  }

  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ign, code })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

    // ✅ Save login state
    localStorage.setItem("ultratiers_user", JSON.stringify(data));

    // ✅ Update UI
    setLoggedInUser(data);

    closeAuth();
  } catch (err) {
    console.error(err);
    alert("Server error during login");
  }
});

function setLoggedInUser(user) {
  currentUser = user;

  authButtons.classList.add("hidden");
  userDropdown.classList.remove("hidden");

  // Avatar
  userAvatar.src = `https://render.crafty.gg/3d/bust/${user.uuid}`;

  // Designer info
  designerName.textContent = user.ign || user.name || "Player";
  designerAvatar.src = `https://render.crafty.gg/3d/bust/${user.uuid}`;

  // Load banner
const player = players.find(p => p.uuid === user.uuid);
profileBanner.style.backgroundImage =
  `url(${player?.banner || "anime-style-stone.jpg"})`;
}


function showSection(sectionToShow) {
    const sections = [
        leaderboardSection,
        docsSection,
        applicationSection,
        testersSection,
        buildersSection
    ];

    sections.forEach(section => {
        if (section === sectionToShow) {
            section.classList.add("active-section");
            section.classList.remove("hidden-section");
        } else {
            section.classList.remove("active-section");
            section.classList.add("hidden-section");
        }
    });

    // navbar active state
    document.querySelectorAll(".nav-center a, .nav-center .dropdown-trigger").forEach(el => el.classList.remove("active-tab"));

    if (sectionToShow === leaderboardSection) document.querySelector(".rankings-btn")?.classList.add("active-tab");
    if (sectionToShow === docsSection) document.querySelector(".docs-btn")?.classList.add("active-tab");
    if (sectionToShow === applicationSection) document.querySelector(".application-btn")?.classList.add("active-tab");
    if (sectionToShow === testersSection) document.querySelector(".testers-btn")?.classList.add("active-tab");
    if (sectionToShow === buildersSection) document.querySelector(".builders-btn")?.classList.add("active-tab");
}

function sortPlayerTiers(tiers) {
  return tiers.slice().sort((a, b) => {
    const aPoints = tierPointsMap[a.tier] || -1;
    const bPoints = tierPointsMap[b.tier] || -1;
    return bPoints - aPoints; // highest points first
  });
}

const authButtons = document.getElementById("auth-buttons");
const userDropdown = document.getElementById("user-profile-dropdown");
const userAvatar = document.getElementById("user-avatar");
const profileMenu = document.getElementById("profile-menu");
const logoutBtn = document.getElementById("logout-btn");

// Toggle dropdown
userDropdown.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent immediate closing
  userDropdown.classList.toggle("active");
});

// Close dropdown if clicking outside
document.addEventListener("click", (e) => {
  if (!userDropdown.contains(e.target)) {
    userDropdown.classList.remove("active");
  }
});

document.querySelectorAll(".ranking-option").forEach(opt => {
  opt.addEventListener("click", () => {
    const region = opt.dataset.region;
    showSection(leaderboardSection);
    generatePlayers(region);
  });
});


// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("ultratiers_user");

  currentUser = null;

  authButtons.classList.remove("hidden");
  userDropdown.classList.add("hidden");
  userDropdown.classList.remove("active");

  profileDesignerModal.classList.remove("show");

  console.log("User logged out");
});

/* =============================
   PROFILE DESIGNER LOGIC
============================= */

// Open settings
settingsBtn?.addEventListener("click", () => {
  if (!currentUser) return;
  profileDesignerModal.classList.add("show");
});

// Close modal
closeDesignerBtn.addEventListener("click", () => {
  profileDesignerModal.classList.remove("show");
  bannerSelector.classList.add("hidden");
});

// Close by backdrop
profileDesignerModal.addEventListener("click", e => {
  if (e.target === profileDesignerModal) {
    profileDesignerModal.classList.remove("show");
    bannerSelector.classList.add("hidden");
  }
});

// Pencil icon
editBannerBtn.addEventListener("click", () => {
  bannerSelector.classList.toggle("hidden");
});

// Banner selection
bannerOptions.forEach(img => {
  img.addEventListener("click", async () => {
    if (!currentUser) return;

    const banner = img.dataset.banner;

    // Update designer preview
    profileBanner.style.backgroundImage = `url(${banner})`;

    // Save to backend
    await fetch("/profile/banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uuid: currentUser.uuid,
        banner
      })
    });

    // Update local player cache
    const player = players.find(p => p.uuid === currentUser.uuid);
    if (player) player.banner = banner;

    // ✅ leaderboard is untouched
  });
});


/* =============================
   NAVIGATION BUTTONS
============================= */

document.querySelector(".rankings-btn").addEventListener("click", () => {
  showSection(leaderboardSection);
  tableHeader.style.display = "grid";
});

document.querySelector(".docs-btn").addEventListener("click", () => {
  showSection(docsSection);
  tableHeader.style.display = "none";
});

document.querySelector(".application-btn").addEventListener("click", () => {
  showSection(applicationSection);
  tableHeader.style.display = "none";
});

document.querySelector(".testers-btn")?.addEventListener("click", async () => {
  showSection(testersSection);
  tableHeader.style.display = "none";

  if (!testers.length) {
    await loadTesters();
    populateTesterModes();
    renderTesters();
  }
});

/* =============================
   MODE BUTTONS
============================= */

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    showSection(leaderboardSection);
    tableHeader.style.display = "none";

    generateModeLeaderboard(btn.dataset.mode);
  });
});

// Toggle info popup
document.querySelectorAll(".mode-info").forEach(icon => {
  icon.addEventListener("click", e => {
    e.stopPropagation(); // prevent mode leaderboard click

    const modeBtn = icon.closest(".mode-btn");

    // Close other popups
    document.querySelectorAll(".mode-btn").forEach(btn => {
      if (btn !== modeBtn) btn.classList.remove("show-info");
    });

    // Toggle current popup
    modeBtn.classList.toggle("show-info");
  });
});

// Close popups when clicking outside
document.addEventListener("click", () => {
  document.querySelectorAll(".mode-btn").forEach(btn => btn.classList.remove("show-info"));
});

const mode = [
  "Axe",
  "Sword",
  "Bow",
  "Vanilla",
  "NethOP",
  "Pot",
  "UHC",
  "SMP",
  "Mace",
  "Diamond SMP",
  "OG Vanilla",
  "Bed",
  "DeBuff",
  "Speed",
  "Manhunt",
  "Elytra",
  "Diamond Survival",
  "Minecart",
  "Creeper",
  "Trident",
  "AxePot",
  "Pearl",
  "Bridge",
  "Sumo",
  "OP"
];

// Optional: auto-set kit image src based on mode name (dynamic)
document.querySelectorAll(".mode-btn").forEach(btn => {
  const mode = btn.dataset.mode;
  const img = btn.querySelector(".mode-info-popup img");
  if (img) img.src = `kitsmodes/${mode}Kit.png`;
});


/* =============================
   RANK TITLE
============================= */

function getRankTitle(points) {
  if (points >= 400) return "Legend";
  if (points >= 300) return "Master";
  if (points >= 225) return "Professional";
  if (points >= 150) return "Expert";
  if (points >= 100) return "Advanced";
  if (points >= 50) return "Rookie";
  return "Starter";
}

// Map tiers to points exactly as specified
const tierPointsMap = {
  "LT5": 1,
  "HT5": 2,
  "LT4": 4,
  "HT4": 6,
  "LT3": 9,
  "HT3": 12,
  "LT2": 16,
  "HT2": 20,
  "LT1": 25,
  "HT1": 30
};

// Calculate total points for a player based on the fixed tierPointsMap
function calculatePoints(player) {
  return player.tiers.reduce((sum, t) => {
    if (!t.tier || t.tier === "Unknown") return sum;
    return sum + (tierPointsMap[t.tier] || 0);
  }, 0);
}


/* =============================
   DROPDOWNS
============================= */

document.querySelectorAll('.dropdown-container').forEach(container => {
  const trigger = container.querySelector('.dropdown-trigger');

  trigger.addEventListener('click', e => {
    e.stopPropagation();

    document.querySelectorAll('.dropdown-container').forEach(c => {
      if (c !== container) c.classList.remove('open');
    });

    container.classList.toggle('open');
  });
});

document.querySelectorAll('.dropdown-menu').forEach(menu => menu.addEventListener('click', e => e.stopPropagation()));

document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-container').forEach(c => c.classList.remove('open'));
});

document.querySelector(".application-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    discord: document.getElementById("discord").value,
    ign: document.getElementById("ign").value,
    modes: document.getElementById("modes").value,
    reason: document.getElementById("reason").value,
    region: document.getElementById("region").value
  };

  const res = await fetch("/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert("✅ Application submitted successfully!");
    e.target.reset();
  } else {
    alert("❌ Failed to submit application.");
  }
});

/* =============================
   NORMAL LEADERBOARD (TOP 3 BORDERS)
============================= */

function generatePlayers(region = "global") {
  tableHeader.style.display = "grid";
  playersContainer.innerHTML = "";

  // Sort by points (global order)
  const sorted = [...players].sort((a, b) => b.points - a.points);

  // Apply region filter
  const filtered =
    region === "global"
      ? sorted
      : sorted.filter(p => p.region === region);

  // ✅ HARD LIMIT TO TOP 100
  const top100 = filtered.slice(0, 100);

  top100.forEach((player, index) => {
    const sortedTiers = sortPlayerTiers(player.tiers);

    const tiersHTML = sortedTiers.map(t => {
      if (!t.tier || t.tier === "Unknown") return `<div class="tier empty"></div>`;
      const tierNum = t.tier.match(/\d+/)?.[0];
      if (!tierNum) return `<div class="tier empty"></div>`;

      return `
        <div class="tier"
          data-gamemode="${t.gamemode}"
          data-tier="${tierNum}"
          data-tooltip="${t.gamemode} — ${t.tier}">
          <img src="gamemodes/${t.gamemode}.png">
          <span>${t.tier}</span>
        </div>
      `;
    }).join("");

    const borderClass =
      index === 0 ? "gold" :
      index === 1 ? "silver" :
      index === 2 ? "bronze" : "";

    const nitroClass = player.nitro ? "nitro" : "";

    playersContainer.insertAdjacentHTML("beforeend", `
      <div class="player-card ${borderClass}" data-player="${player.name}">
        <div class="rank">${index + 1}.</div>
        <img class="avatar" src="https://render.crafty.gg/3d/bust/${player.uuid}">
        <div class="player-info">
          <div class="player-name ${nitroClass}">${player.name}</div>
          <div class="player-sub">⭐ ${getRankTitle(player.points)} (${player.points})</div>
        </div>
        <div class="region region-${player.region.toLowerCase()}">${player.region}</div>
        <div class="tiers">${tiersHTML}</div>
      </div>
    `);
  });

  attachPlayerClick();
}

/* =============================
   MODE LEADERBOARD
============================= */

function generateModeLeaderboard(mode) {
  tableHeader.style.display = "none"; // hide header

  playersContainer.innerHTML = `
    <div class="mode-wrapper">
      <div class="mode-title">${mode} Leaderboard</div>
      <div class="mode-tiers" id="mode-tiers"></div>
    </div>
  `;

  const tiersGrid = document.getElementById("mode-tiers");

  // Create Tier 1–5 columns
  for (let i = 1; i <= 5; i++) {
    const col = document.createElement("div");
    col.className = "mode-tier-column";
    col.innerHTML = `<div class="mode-tier-header">Tier ${i}</div>`;
    tiersGrid.appendChild(col);
  }

  // Add players into columns
  players.forEach(player => {
    const tierObj = player.tiers.find(t => t.gamemode === mode && t.tier !== "Unknown");
    if (!tierObj) return;

    const tierNumber = parseInt(tierObj.tier.match(/\d+/)[0]);
    const targetColumn = document.querySelectorAll(".mode-tier-column")[tierNumber - 1];

    const playerDiv = document.createElement("div");
    playerDiv.className = "mode-player";
    playerDiv.dataset.player = player.name;
    playerDiv.dataset.region = player.region.toLowerCase();

    // Assign + or - rank
    const isHT = tierObj.tier.includes("HT");
    playerDiv.dataset.signvalue = isHT ? 2 : 1;

    playerDiv.innerHTML = `
      <div class="mode-player-left">
        <img src="https://render.crafty.gg/3d/bust/${player.name}">
        <span class="player-label">${player.name}</span>
        <span class="tier-sign">${isHT ? "+" : "-"}</span>
      </div>
      <div class="region-box">
        <span>${player.region.toUpperCase()}</span>
      </div>
    `;

    targetColumn.appendChild(playerDiv);
  });

  // ⭐ Sort players inside each column so HT (+) is always above LT (–)
document.querySelectorAll(".mode-tier-column").forEach(col => {
  // Get only actual player cards
  const playerList = [...col.querySelectorAll(".mode-player")];

  // Sort HT (+) above LT (-)
  playerList
    .sort((a, b) => b.dataset.signvalue - a.dataset.signvalue)
    .forEach(p => col.appendChild(p));

  // ✅ Only append “No players” if truly empty (ignore header)
  const hasOnlyHeader = col.querySelectorAll(".mode-player").length === 0;
  if (hasOnlyHeader) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "mode-empty";
    emptyDiv.textContent = "No players";
    col.appendChild(emptyDiv);
  }
});

  attachPlayerClick();
}

function normalizeModes(modes) {
  if (Array.isArray(modes)) return modes;
  if (typeof modes === "string") return [modes];
  return [];
}

function renderTesters() {
  testersContainer.innerHTML = "";

  const modeFilter = testerModeFilter.value;
  const regionFilter = testerRegionFilter.value.toLowerCase();

  const filtered = testers.filter(t => {
    const modes = normalizeModes(t.mode);
    return (
      (!modeFilter || modes.includes(modeFilter)) &&
      (!regionFilter || t.region.toLowerCase() === regionFilter)
    );
  });

  filtered.forEach(t => {
    const modes = normalizeModes(t.mode);

    const modeBadgesHTML = modes
      .map(m => `<span class="tester-mode-badge">${m}</span>`)
      .join("");

    const card = document.createElement("div");
    card.className = "tester-card";
    card.dataset.uuid = t.uuid;
    card.dataset.region = t.region.toLowerCase();

    card.innerHTML = `
      <img class="tester-avatar" src="https://render.crafty.gg/3d/bust/${t.uuid}">
      <div class="tester-info">
        <div class="tester-name">${t.name}</div>
        <div class="tester-modes">${modeBadgesHTML}</div>
      </div>
      <div class="tester-region ${t.region.toLowerCase()}">${t.region}</div>
    `;

    testersContainer.appendChild(card);
  });
}

function populateTesterModes() {
  if (!Array.isArray(testers)) return;

  const modes = [
    ...new Set(
      testers.flatMap(t => normalizeModes(t.mode))
    )
  ];

  testerModeFilter.innerHTML =
    `<option value="">All Modes</option>` +
    modes.map(m => `<option value="${m}">${m}</option>`).join("");
}

testerModeFilter.addEventListener("change", renderTesters);
testerRegionFilter.addEventListener("change", renderTesters);

/* =============================
   FETCH NAME FROM UUID (client-side, prefers Ashcon)
============================= */

async function fetchNameFromUUID(uuid) {
  const clean = uuid.replace(/-/g, "");

  try {
    const res = await fetch(`https://playerdb.co/api/player/minecraft/${clean}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && data.data.player && data.data.player.username) {
        return data.data.player.username;  // always the CURRENT name
      }
    }
  } catch (err) {
    console.warn("PlayerDB failed:", err);
  }

  return "Unknown";
}


async function loadPlayerNames() {
  const promises = players.map(async (player) => {
    // if name already present, skip
    if (player.name && typeof player.name === 'string') return;
    player.name = await fetchNameFromUUID(player.uuid);
  });
  await Promise.all(promises);
}

/* =============================
   PLAYER CLICK
============================= */

function attachPlayerClick() {
  document.querySelectorAll("[data-player]").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.player;
      const player = players.find(p => p.name === name);

      // Set modal title to empty because the player name is now displayed below avatar
      modalTitle.textContent = "";

const sortedTiers = sortPlayerTiers(player.tiers.filter(t => t.tier !== "Unknown"));
const tiersHTML = sortedTiers
  .map(t => {
          const tierMatch = t.tier.match(/\d+/);
if (!tierMatch) return `<div class="tier empty"></div>`; // fallback for invalid tier
const tierNumber = tierMatch[0];
return `
  <div class="tier"
       data-gamemode="${t.gamemode}"
       data-tier="${tierNumber}"
       data-tooltip="${t.gamemode} — ${t.tier}">
    <img src="gamemodes/${t.gamemode}.png">
    <span>${t.tier}</span>
  </div>
`;
        }).join("");

const nitroClass = player.nitro ? "nitro" : "";

modalContent.innerHTML = `
  <div class="modal-header"
     style="background-image: url(${player.banner || 'anime-style-stone.jpg'})">
    <img class="modal-avatar ${nitroClass}" src="https://render.crafty.gg/3d/bust/${player.uuid}" alt="${player.name} Avatar">
    <div class="modal-name ${nitroClass}">${player.name || "Unknown Player"}</div>
  </div>

  <div class="modal-section">
    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Placement:</span>
      <span class="modal-value">#${getPlayerPlacement(player)}</span>
    </div>

    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Region:</span>
      <span class="modal-value">${player.region || "Unknown"}</span>
    </div>

    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Rank:</span>
      <span class="modal-value">${getRankTitle(player.points)}</span>
    </div>

    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Points:</span>
      <span class="modal-value">${player.points.toLocaleString()}</span>
    </div>
  </div>

  <h3 class="modal-subtitle ${nitroClass}">Tier Progress</h3>
  <div class="tiers-container">
    ${tiersHTML}
  </div>
`;

      modal.classList.add("show");
    });
  });
}

/* =============================
   DOCS
============================= */

function generateDocs() {
  tierDocsContainer.innerHTML = "";
  tiersDocs.forEach(t => {
    const item = document.createElement("div");
    item.className = "tier-item";
    item.dataset.gamemode = t.gamemode;
    item.dataset.description = t.description;
    item.innerHTML = `
      <strong>${t.tier}</strong> (${t.gamemode})<br>
      <span>${t.description}</span>
    `;
    tierDocsContainer.appendChild(item);
  });
}

generateDocs();

/* =============================
   SEARCH
============================= */

searchInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    const searchValue = searchInput.value.trim().toLowerCase();
    const player = players.find(p => p.name.toLowerCase() === searchValue);
    if (!player) return alert("Player not found!");

    // Use same modal format as clicking a player
    modalTitle.textContent = ""; // same as click modal

const sortedTiers = sortPlayerTiers(player.tiers.filter(t => t.tier !== "Unknown"));
const tiersHTML = sortedTiers
  .map(t => {
        const tierMatch = t.tier.match(/\d+/);
if (!tierMatch) return `<div class="tier empty"></div>`; // fallback for invalid tier
const tierNumber = tierMatch[0];
return `
  <div class="tier"
       data-gamemode="${t.gamemode}"
       data-tier="${tierNumber}"
       data-tooltip="${t.gamemode} — ${t.tier}">
    <img src="gamemodes/${t.gamemode}.png">
    <span>${t.tier}</span>
  </div>
`;

      }).join("");

const nitroClass = player.nitro ? "nitro" : "";

modalContent.innerHTML = `
  <div class="modal-header"
     style="background-image: url(${player.banner || 'anime-style-stone.jpg'})">
    <img class="modal-avatar ${nitroClass}" src="https://render.crafty.gg/3d/bust/${player.uuid}" alt="${player.name} Avatar">
    <div class="modal-name ${nitroClass}">${player.name || "Unknown Player"}</div>
  </div>

  <div class="modal-section">
    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Placement:</span>
      <span class="modal-value">#${getPlayerPlacement(player)}</span>
    </div>

    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Region:</span>
      <span class="modal-value">${player.region || "Unknown"}</span>
    </div>

    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Rank:</span>
      <span class="modal-value">${getRankTitle(player.points)}</span>
    </div>

    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Points:</span>
      <span class="modal-value">${player.points.toLocaleString()}</span>
    </div>
  </div>

  <h3 class="modal-subtitle ${nitroClass}">Tier Progress</h3>
  <div class="tiers-container">
    ${tiersHTML}
  </div>
`;

    modal.classList.add("show");
  }
});

/* =============================
   INIT
============================= */

(async () => {
  await loadPlayers();
  await loadPlayerNames();
  await loadTesters();

  showSection(leaderboardSection);
  generatePlayers();

  populateTesterModes();
  renderTesters();

  const savedUser = localStorage.getItem("ultratiers_user");
  if (savedUser) setLoggedInUser(JSON.parse(savedUser));
})();

