let players = [];
const tiersDocs = [
    { tier: "HT1", gamemode: "Fighter Tier", description: "Gives you 30 points." },
    { tier: "LT1", gamemode: "Fighter Tier", description: "Gives you 25 points." },
    { tier: "HT2", gamemode: "Fighter Tier", description: "Gives you 20 points." },
    { tier: "LT2", gamemode: "Fighter Tier", description: "Gives you 16 points." },
    { tier: "HT3", gamemode: "Fighter Tier", description: "Gives you 12 points." },
    { tier: "LT3", gamemode: "Fighter Tier", description: "Gives you 9 points." },
    { tier: "HT4", gamemode: "Fighter Tier", description: "Gives you 6 points." },
    { tier: "LT4", gamemode: "Fighter Tier", description: "Gives you 4 points." },
    { tier: "HT5", gamemode: "Fighter Tier", description: "Gives you 2 points." },
    { tier: "LT5", gamemode: "Fighter Tier", description: "Gives you 1 point." }
];

/* =============================
   LOADING SCREEN UTILITY
============================= */

const loadingScreen = document.getElementById("loading-screen");

function showLoadingScreen() {
    loadingScreen.classList.add("show");
}

function hideLoadingScreen() {
    loadingScreen.classList.remove("show");
}

async function loadPlayers() {
  try {
    const res = await fetch("/players");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    players = await res.json();
  } catch (err) {
    console.error("Failed to fetch players:", err);
    players = [];
  }

  // Update the footer with the number of players
  updateTestedCount();
}
/* =============================
   ELEMENTS
============================= */

const homeSection = document.getElementById("home-section");
const leaderboardSection = document.getElementById("leaderboard-section");
const modesSection = document.getElementById("modes-section");
const leaderboardsSection = document.getElementById("leaderboards-section");
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
const leaderboardModeFilter = document.getElementById("leaderboard-mode-filter");
const leaderboardsContainer = document.getElementById("leaderboards-container");
const modesCategoriesContainer = document.getElementById("modes-categories-container");

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

function updateTestedCount() {
  const playerCountEl = document.getElementById("player-count");
  const homePlayerCount = document.getElementById("home-fighter-count");
  const homeBuilderCount = document.getElementById("home-builder-count");
  
  if (playerCountEl) {
    playerCountEl.innerHTML = `
      <div>Fighters Tested: ${players.length}</div>
      <div>Builders Tested: ${builders.length}</div>
    `;
  }
  
  if (homePlayerCount) homePlayerCount.textContent = players.length;
  if (homeBuilderCount) homeBuilderCount.textContent = builders.length;
}

let currentBuildersRegion = "global";

document.querySelectorAll(".builder-option").forEach(opt => {
opt.addEventListener("click", async () => {
  const region = opt.dataset.region;
  currentBuildersRegion = region;
  await loadBuilders();
  showBuildersSection(region);
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

    // ✅ Recalculate builder points after normalization
    builders.forEach(b => b.points = calculatePoints(b, "builder"));

  } catch (err) {
    console.error("Failed to load builders:", err);
    builders = [];
  }

  updateTestedCount();
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
      <span class="modal-label">Placement:</span>
      <span class="modal-value">#${getBuilderPlacement(builder)}</span>
    </div>

    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Region:</span>
      <span class="modal-value">${builder.region || "Unknown"}</span>
    </div>

    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Rank:</span>
      <span class="modal-value">${getRankTitle(builder.points)}</span>
    </div>

    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Points:</span>
      <span class="modal-value">${builder.points.toLocaleString()}</span>
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

function sortBuilderTiers(tiersObj) {
  return Object.entries(tiersObj || {})
    .filter(([_, tier]) => tier && tier !== "Unknown")
    .sort((a, b) => {
      const aPoints = builderTierPointsMap[a[1]] || -1;
      const bPoints = builderTierPointsMap[b[1]] || -1;
      return bPoints - aPoints; // highest points first
    });
}

function generateBuilderTiersHTML(builder) {
  const sortedTiers = sortBuilderTiers(builder.tiers);

  // Always show exactly 4 slots
  const filled = sortedTiers.map(([subject, tier]) => {
    const tierNum = tier.match(/\d+/)?.[0];
    if (!tierNum) return `<div class="tier empty"></div>`;

const tierNumber = tier.match(/\d+/)?.[0];
const tierRank = tier.startsWith("HT") ? "HT" : "LT";

return `
<div class="tier"
  data-subject="${subject}"
  data-tier="${tierNumber}"
  data-rank="${tierRank}"
  data-tooltip="${subject} — ${tier}">
    <img src="${subject}.png" alt="${subject}" class="tier-subject-icon">
    <span>${tierRank}${tierNumber}</span>
</div>
`;
  });

  // Pad missing slots
  while (filled.length < 4) {
    filled.push(`<div class="tier empty"></div>`);
  }

  return filled.join("");
}

function getBuilderPlacement(builder, region = "global") {
  // Sort builders by points descending
  const sorted = [...builders].sort((a, b) => b.points - a.points);

  // Apply region filter if needed
  const filtered =
    region === "global"
      ? sorted
      : sorted.filter(b => b.region === region);

  // Find placement
  const index = filtered.findIndex(b => b.uuid === builder.uuid);
  return index >= 0 ? index + 1 : null;
}

function generateBuilderModeLeaderboard(subject) {
  if (!subject) return;

  tableHeader.style.display = "none";

  // Reset builder container
  buildersContainer.innerHTML = `
    <div class="mode-wrapper">
      <div class="mode-title">${subject} Leaderboard</div>
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

    // Append "No Builders" if column is empty
    if (playerList.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "mode-empty";
      emptyDiv.textContent = "No Builders";
      col.appendChild(emptyDiv);
    }
  });

  attachBuilderClick();
}

document.querySelectorAll(".subject-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const subject = btn.dataset.subject;

    // Save subject to URL hash
    window.location.hash = `subject=${encodeURIComponent(subject)}`;

    // Reload the page
    window.location.reload();
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
  updateTestedCount();
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
          <div>Composition: ${builder.tiers.Composition}</div>
          <div>Buildings: ${builder.tiers.Buildings}</div>
          <div>Organics: ${builder.tiers.Organics}</div>
          <div>Terrain: ${builder.tiers.Terrain}</div>
          <div>Details: ${builder.tiers.Details}</div>
          <div>Colouring: ${builder.tiers.Colouring}</div>
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

// Show PLAYER modal when clicking on a player
function showPlayerModal(player) {
  modalTitle.textContent = "";

  const sortedTiers = sortPlayerTiers(player.tiers, player.retired_modes);
  const tiersHTML = sortedTiers
    .map(t => {
      const tierMatch = t.tier.match(/\d+/);
      if (!tierMatch) return `<div class="tier empty"></div>`; // fallback for invalid tier
      const tierNumber = t.tier.match(/\d+/)?.[0];
      const tierRank = t.tier.startsWith("HT") ? "HT" : "LT";

      return `
<div class="tier ${player.retired_modes?.includes(t.gamemode) ? "retired" : ""}"
  data-gamemode="${t.gamemode}"
  data-tier="${tierNumber}"
  data-rank="${tierRank}"
  data-tooltip="${t.gamemode} — ${t.tier}">
    <img src="gamemodes/${t.gamemode}.png">
    <span>${tierRank}${tierNumber}</span>
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

// Close PLAYER modal with X button
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.classList.remove("show");
  });
}

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
    console.log(`🔄 showSection called with:`, sectionToShow?.id || 'null');
    
    if (!sectionToShow) {
        console.error(`❌ showSection: sectionToShow is null!`);
        return;
    }
    
    const sections = [
        homeSection,
        leaderboardSection,
        modesSection,
        leaderboardsSection,
        docsSection,
        applicationSection,
        testersSection,
        buildersSection
    ];
    
    // Check for null sections
    sections.forEach((section, i) => {
        if (!section) console.warn(`⚠️ Section ${i} is null!`);
    });

    sections.forEach(section => {
        if (!section) return; // Skip null sections
        
        if (section === sectionToShow) {
            section.classList.add("active-section");
            section.classList.remove("hidden-section");
            console.log(`✅ Showing section: ${section.id}`);
        } else {
            section.classList.remove("active-section");
            section.classList.add("hidden-section");
        }
    });

    // navbar active state
    document.querySelectorAll(".nav-center a, .nav-center .dropdown-trigger").forEach(el => el.classList.remove("active-tab"));

    if (sectionToShow === homeSection) window.location.hash = '';
    if (sectionToShow === leaderboardSection) document.querySelector(".rankings-btn")?.classList.add("active-tab");
    if (sectionToShow === docsSection) document.querySelector(".docs-btn")?.classList.add("active-tab");
    if (sectionToShow === applicationSection) document.querySelector(".application-btn")?.classList.add("active-tab");
    if (sectionToShow === testersSection) document.querySelector(".testers-btn")?.classList.add("active-tab");
    if (sectionToShow === buildersSection) document.querySelector(".builders-btn")?.classList.add("active-tab");
}

function sortPlayerTiers(tiers, retiredModes = []) {
  return tiers.slice().sort((a, b) => {
    const aEmpty = !a.tier || a.tier === "Unknown" ? 1 : 0;
    const bEmpty = !b.tier || b.tier === "Unknown" ? 1 : 0;

    // Empty tiers always go to the very end
    if (aEmpty !== bEmpty) return aEmpty - bEmpty;

    const aRetired = retiredModes?.includes(a.gamemode) ? 1 : 0;
    const bRetired = retiredModes?.includes(b.gamemode) ? 1 : 0;

    // Retired tiers come after active tiers
    if (aRetired !== bRetired) return aRetired - bRetired;

    // Both active or both retired: sort by points descending
    const aPoints = tierPointsMap[a.tier] || 0;
    const bPoints = tierPointsMap[b.tier] || 0;
    return bPoints - aPoints;
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

let currentLeaderboardRegion = "global";

document.querySelectorAll(".ranking-option").forEach(opt => {
  opt.addEventListener("click", () => {
    const region = opt.dataset.region;
    currentLeaderboardRegion = region;
    showSection(leaderboardSection);
    // Reset to main category and set active region tab
    document.querySelectorAll(".fighters-region-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelector(`.fighters-region-tab-btn[data-fighter-region='${region}']`).classList.add("active");
    document.querySelectorAll(".leaderboard-mode-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelector(".leaderboard-mode-tab-btn[data-mode-category='main']").classList.add("active");
    generatePlayers(region, "main");
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

// Helper function for card navigation
function handleCardNavigation(section) {
  console.log(`📍 handleCardNavigation called with section: "${section}"`);
  showLoadingScreen();
  setTimeout(() => {
    try {
      console.log(`⚙️ Processing section: "${section}"`);
      
      if (section === "rankings") {
        console.log(`→ Showing leaderboard section for rankings`);
        showSection(leaderboardSection);
        tableHeader.style.display = "grid";
        const fightRegionTabs = document.querySelector(".fighters-region-tabs");
        const leaderboardModeTabs = document.querySelector(".leaderboard-mode-tabs");
        if (fightRegionTabs) fightRegionTabs.style.display = "block";
        if (leaderboardModeTabs) leaderboardModeTabs.style.display = "none";
        generatePlayers("global", "main");
      } else if (section === "builders") {
        console.log(`→ Showing builders section`);
        showSection(buildersSection);
        tableHeader.style.display = "none";
        renderBuilders("global");
      } else if (section === "modes") {
        console.log(`→ Showing modes section`);
        showSection(modesSection);
        tableHeader.style.display = "none";
        renderModeCategories();
      } else if (section === "leaderboards") {
        console.log(`→ Showing leaderboards section`);
        showSection(leaderboardsSection);
        tableHeader.style.display = "none";
        populateLeaderboardModesWithTiers();
      } else if (section === "testers") {
        console.log(`→ Showing testers section`);
        showSection(testersSection);
        tableHeader.style.display = "none";
        if (!testers.length) {
          loadTesters().then(() => {
            populateTesterModes();
            renderTesters();
          });
        } else {
          renderTesters();
        }
      } else if (section === "docs") {
        console.log(`→ Showing docs section`);
        showSection(docsSection);
        tableHeader.style.display = "none";
      } else if (section === "application") {
        console.log(`→ Showing application section`);
        showSection(applicationSection);
        tableHeader.style.display = "none";
      } else {
        console.warn(`⚠️ Unknown section: "${section}"`);
      }
      
      hideLoadingScreen();
      console.log(`✅ handleCardNavigation complete`);
    } catch (err) {
      console.error(`❌ Error in handleCardNavigation:`, err);
      hideLoadingScreen();
    }
  }, 300);
}

// Logo/Home button
document.querySelector(".logo-img")?.addEventListener("click", () => {
  showLoadingScreen();
  setTimeout(() => {
    showSection(homeSection);
    hideLoadingScreen();
  }, 300);
});

// Home page card navigation
const homeCards = document.querySelectorAll(".home-card");
console.log(`🎯 Found ${homeCards.length} home cards on load`);

// Attach listeners to all home cards
function attachHomeCardListeners() {
  document.querySelectorAll(".home-card").forEach((card, index) => {
    const section = card.dataset.section;
    
    if (!section) {
      console.warn(`⚠️ Card ${index} has no data-section`);
      return;
    }
    
    // Main card click listener
    card.addEventListener("click", function(e) {
      try {
        // Prevent default and propagation
        if (e.target.tagName === 'A' || e.target.closest('form')) {
          return;
        }
        
        console.log(`✅ Card clicked - navigating to: ${section}`);
        handleCardNavigation(section);
      } catch (err) {
        console.error(`Error navigating to ${section}:`, err);
      }
    });
    
    // Specific button listener for better UX
    const button = card.querySelector(".card-button");
    if (button) {
      button.addEventListener("click", function(e) {
        e.stopPropagation();
        console.log(`✅ Button clicked - navigating to: ${section}`);
        handleCardNavigation(section);
      });
    }
  });
  
  console.log(`✅ Attached listeners to ${document.querySelectorAll(".home-card").length} cards`);
}

// Attach listeners on load
attachHomeCardListeners();

document.querySelector(".rankings-btn")?.addEventListener("click", () => {

  showLoadingScreen();
  setTimeout(() => {
    showSection(leaderboardSection);
    tableHeader.style.display = "grid";
    hideLoadingScreen();
  }, 300);
});

document.querySelector(".docs-btn")?.addEventListener("click", () => {
  showLoadingScreen();
  setTimeout(() => {
    showSection(docsSection);
    tableHeader.style.display = "none";
    hideLoadingScreen();
  }, 300);
});

document.querySelector(".application-btn")?.addEventListener("click", () => {
  showLoadingScreen();
  setTimeout(() => {
    showSection(applicationSection);
    tableHeader.style.display = "none";
    hideLoadingScreen();
  }, 300);
});

document.querySelector(".testers-btn")?.addEventListener("click", async () => {
  showLoadingScreen();
  setTimeout(async () => {
    showSection(testersSection);
    tableHeader.style.display = "none";

    if (!testers.length) {
      await loadTesters();
      populateTesterModes();
      renderTesters();
    }
    hideLoadingScreen();
  }, 300);
});

/* =============================
   MODE BUTTONS
============================= */

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;

    // Save mode to URL hash
    window.location.hash = `mode=${encodeURIComponent(mode)}`;

    // Show loading screen and reload
    showLoadingScreen();
    setTimeout(() => {
      window.location.reload();
    }, 350);
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

/* =============================
   MODE TAB SWITCHING
============================= */

document.querySelectorAll(".mode-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;
    
    // Show loading screen with brief delay for visual effect
    showLoadingScreen();
    
    setTimeout(() => {
      // Remove active class from all tabs and contents
      document.querySelectorAll(".mode-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".mode-tab-content").forEach(content => content.classList.remove("active"));
      
      // Add active class to clicked tab and corresponding content
      btn.classList.add("active");
      document.getElementById(`${tabName}-tab`).classList.add("active");
      
      // Hide loading screen
      hideLoadingScreen();
    }, 350);
  });
});

/* =============================
   LEADERBOARD MODE TAB SWITCHING
============================= */

document.querySelectorAll(".leaderboard-mode-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const category = btn.dataset.modeCategory;
    
    // Show loading screen
    showLoadingScreen();
    
    setTimeout(() => {
      // Remove active class from all tabs
      document.querySelectorAll(".leaderboard-mode-tab-btn").forEach(b => b.classList.remove("active"));
      
      // Add active class to clicked tab
      btn.classList.add("active");
      
      // Regenerate players with new category using current region
      generatePlayers(currentLeaderboardRegion, category);
      
      // Hide loading screen
      hideLoadingScreen();
    }, 350);
  });
});

/* =============================
   FIGHTERS REGION TAB SWITCHING
============================= */

document.querySelectorAll(".fighters-region-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const region = btn.dataset.fighterRegion;
    
    // Show loading screen
    showLoadingScreen();
    
    setTimeout(() => {
      // Remove active class from all tabs
      document.querySelectorAll(".fighters-region-tab-btn").forEach(b => b.classList.remove("active"));
      
      // Add active class to clicked tab
      btn.classList.add("active");
      
      // Get current mode category
      const modeCategory = document.querySelector(".leaderboard-mode-tab-btn.active")?.dataset.modeCategory || "main";
      
      // Update current region and regenerate players
      currentLeaderboardRegion = region;
      generatePlayers(region, modeCategory);
      
      // Hide loading screen
      hideLoadingScreen();
    }, 350);
  });
});

/* =============================
   BUILDERS REGION TAB SWITCHING
============================= */

document.querySelectorAll(".builders-region-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const region = btn.dataset.builderRegion;
    
    // Show loading screen
    showLoadingScreen();
    
    setTimeout(() => {
      // Remove active class from all tabs
      document.querySelectorAll(".builders-region-tab-btn").forEach(b => b.classList.remove("active"));
      
      // Add active class to clicked tab
      btn.classList.add("active");
      
      // Update current region and regenerate builders
      currentBuildersRegion = region;
      renderBuilders(region);
      
      // Hide loading screen
      hideLoadingScreen();
    }, 350);
  });
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
  "Spear Mace",
  "Diamond SMP",
  "OG Vanilla",
  "Bed",
  "DeBuff",
  "Speed",
  "Manhunt",
  "Elytra",
  "Spear Elytra",
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

// Mode categories mapping
const modeCategories = {
  overall: ["Axe", "Sword", "Bow", "Vanilla", "NethOP", "Pot", "UHC", "SMP", "Mace", "Spear Mace", "Diamond SMP", "OG Vanilla", "Bed", "DeBuff", "Speed", "Manhunt", "Elytra", "Spear Elytra", "Diamond Survival", "Minecart", "Creeper", "Trident", "AxePot", "Pearl", "Bridge", "Sumo", "OP"],
  main: ["Vanilla", "UHC", "Pot", "NethOP", "SMP", "Sword", "Axe", "Mace"],
  sub: ["Minecart", "Diamond Survival", "DeBuff", "Elytra", "Speed", "Creeper", "Manhunt", "Diamond SMP", "Bow", "Bed", "OG Vanilla", "Trident", "Spear Elytra", "Spear Mace"],
  extra: ["AxePot", "Sumo", "OP"],
  bonus: ["Bridge", "Pearl"]
};

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

// Builder-specific tier points
const builderTierPointsMap = {
  "LT5": 1,
  "HT5": 3,
  "LT4": 6,
  "HT4": 12,
  "LT3": 18,
  "HT3": 26,
  "LT2": 36,
  "HT2": 48,
  "LT1": 60,
  "HT1": 80
};

// Calculate total points for a player based on the fixed tierPointsMap
function calculatePoints(entity, type = "player") {
  if (type === "builder") {
    // For builders, sum over subjects using builderTierPointsMap
    const subjects = [
  "Composition",
  "Buildings",
  "Organics",
  "Terrain",
  "Details",
  "Colouring"
];
    let total = 0;
    subjects.forEach(subj => {
      const tier = entity.tiers?.[subj];
      if (tier && tier !== "Unknown") total += builderTierPointsMap[tier] || 0;
    });
    return total;
  } else {
    // Default: player/fighter points
    return entity.tiers.reduce((sum, t) => {
      if (!t.tier || t.tier === "Unknown") return sum;
      return sum + (tierPointsMap[t.tier] || 0);
    }, 0);
  }
}

function calculateCategoryPoints(player, categoryModes) {
  // Calculate points based only on tiers from specified modes
  if (!player.tiers || !Array.isArray(player.tiers)) return 0;
  
  return player.tiers.reduce((sum, t) => {
    if (!categoryModes.includes(t.gamemode) || !t.tier || t.tier === "Unknown") return sum;
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

function generatePlayers(region = "global", modeCategory = "main") {
  tableHeader.style.display = "grid";
  playersContainer.innerHTML = "";

  // Sort by points (global order)
  const sorted = [...players].sort((a, b) => b.points - a.points);

  // Apply region filter
  const filtered =
    region === "global"
      ? sorted
      : sorted.filter(p => p.region === region);

  // Filter by mode category - only include players who have tiers in the selected category
  const categoryModes = modeCategories[modeCategory] || modeCategories.main;
  const categoryFiltered = filtered.filter(player => {
    return player.tiers && player.tiers.some(t => categoryModes.includes(t.gamemode));
  });

  // Sort filtered players by points again to get proper ranking within category
  categoryFiltered.sort((a, b) => b.points - a.points);

  // ✅ HARD LIMIT TO TOP 100
  const top100 = categoryFiltered.slice(0, 100);

  top100.forEach((player, index) => {
    const sortedTiers = sortPlayerTiers(player.tiers, player.retired_modes);

    const tiersHTML = sortedTiers.map(t => {
      if (!t.tier || t.tier === "Unknown") return `<div class="tier empty"></div>`;
      const tierNum = t.tier.match(/\d+/)?.[0];
      if (!tierNum) return `<div class="tier empty"></div>`;

const tierNumber = t.tier.match(/\d+/)?.[0];
const tierRank = t.tier.startsWith("HT") ? "HT" : "LT";

return `
<div class="tier ${player.retired_modes?.includes(t.gamemode) ? "retired" : ""}"
  data-gamemode="${t.gamemode}"
  data-tier="${tierNumber}"
  data-rank="${tierRank}"
  data-tooltip="${t.gamemode} — ${t.tier}">
    <img src="gamemodes/${t.gamemode}.png">
    <span>${tierRank}${tierNumber}</span>
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

function showBuildersSection(region = "global") {
  showSection(buildersSection);        // show the builders section
  tableHeader.style.display = "none";  // hide table header

  // Set active tab
  document.querySelectorAll(".builders-region-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.builders-region-tab-btn[data-builder-region='${region}']`).classList.add("active");

  if (!builders.length) {
    loadBuilders().then(() => renderBuilders(region));
  } else {
    renderBuilders(region);
  }
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

// ⭐ Sort players inside each column and append "No players" if empty
document.querySelectorAll(".mode-tier-column").forEach((col, i) => {
  // Get all player divs already appended to this column
  const playerList = [...col.querySelectorAll(".mode-player")];

  // Sort HT (+) above LT (-)
  playerList
    .sort((a, b) => b.dataset.signvalue - a.dataset.signvalue)
    .forEach(p => col.appendChild(p));

  // Append "No players" only if column is truly empty
  if (playerList.length === 0) {
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
    // Remove existing listeners to prevent duplicates
    el.removeEventListener("click", handlePlayerClick);
    el.addEventListener("click", handlePlayerClick);
  });
}

function handlePlayerClick(e) {
  const el = e.currentTarget;
  const name = el.dataset.player;
  const player = players.find(p => p.name === name);
  if (!player) return;
  
  showPlayerModal(player);
}

/* =============================
   DOCS
============================= */

function generateDocs() {
  tierDocsContainer.innerHTML = "";

  // Add player/fighter tiers
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

  // Add builder tiers
  const builderTiers = [
        { tier: "HT1", subject: "Builder Tier", points: 80 },
        { tier: "LT1", subject: "Builder Tier", points: 60 },
        { tier: "HT2", subject: "Builder Tier", points: 48 },
        { tier: "LT2", subject: "Builder Tier", points: 36 },
        { tier: "HT3", subject: "Builder Tier", points: 26 },
        { tier: "LT3", subject: "Builder Tier", points: 18 },
        { tier: "HT4", subject: "Builder Tier", points: 12 },
        { tier: "LT4", subject: "Builder Tier", points: 6 },
        { tier: "HT5", subject: "Builder Tier", points: 3 },
        { tier: "LT5", subject: "Builder Tier", points: 1 },
  ];

  builderTiers.forEach(b => {
    const item = document.createElement("div");
    item.className = "tier-item builder-tier";
    item.dataset.subject = b.subject;
    item.dataset.tier = b.tier;
    item.dataset.points = b.points;
    item.innerHTML = `
      <strong>${b.tier}</strong> (${b.subject})<br>
      <span>Gives ${b.points} points.</span>
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

const sortedTiers = sortPlayerTiers(player.tiers, player.retired_modes);
const tiersHTML = sortedTiers
  .map(t => {
        const tierMatch = t.tier.match(/\d+/);
if (!tierMatch) return `<div class="tier empty"></div>`; // fallback for invalid tier
const tierNumber = t.tier.match(/\d+/)?.[0];
const tierRank = t.tier.startsWith("HT") ? "HT" : "LT";

return `
<div class="tier ${player.retired_modes?.includes(t.gamemode) ? "retired" : ""}"
  data-gamemode="${t.gamemode}"
  data-tier="${tierNumber}"
  data-rank="${tierRank}"
  data-tooltip="${t.gamemode} — ${t.tier}">
    <img src="gamemodes/${t.gamemode}.png">
    <span>${tierRank}${tierNumber}</span>
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
   FIGHTERS - ALL MODES COMBINED
============================= */

const fighterModesToShow = {
  "Main": ["Vanilla", "UHC", "Pot", "NethOP", "SMP", "Sword", "Axe", "Mace"],
  "Sub": ["Minecart", "Diamond Survival", "DeBuff", "Elytra", "Speed", "Creeper", "Manhunt", "Diamond SMP", "Bow", "Bed", "OG Vanilla", "Trident", "Spear Elytra", "Spear Mace"],
  "Extra": ["AxePot", "Sumo", "OP"],
  "Bonus": ["Bridge", "Pearl"]
};

function generateAllPlayerModes(region = "global") {
  playersContainer.innerHTML = "";
  tableHeader.style.display = "none";
  
  // Flatten all modes to show
  const allModesToShow = Object.values(fighterModesToShow).flat();
  
  // Filter players by region
  const filteredPlayers = region === "global" ? players : players.filter(p => p.region === region);
  
  // Build the grid structure with 5 tiers (1-5)
  const tiersHTML = `
    <div class="mode-wrapper">
      <div class="mode-tiers" id="fighter-mode-tiers">
        ${Array.from({length: 5}, (_, i) => {
          const tierNum = 5 - i; // 5, 4, 3, 2, 1
          return '<div class="mode-tier-column"><div class="mode-tier-header">Tier ' + tierNum + '</div></div>';
        }).join('')}
      </div>
    </div>
  `;
  
  playersContainer.innerHTML = tiersHTML;
  
  // Add players to their tier columns
  filteredPlayers.forEach(player => {
    if (!player.tiers || !Array.isArray(player.tiers)) return;
    
    // Get highest tier from the modes we're showing
    const relevantTiers = player.tiers.filter(t => 
      allModesToShow.some(mode => {
        // Handle mode name variations
        if (mode === "Diamond Survival" && (t.gamemode === "Diamond Survival" || t.gamemode === "Diamond Vanilla")) return true;
        return t.gamemode === mode;
      }) && t.tier !== "Unknown"
    );
    
    if (relevantTiers.length === 0) return;
    
    // Get the highest tier
    const highestTier = relevantTiers.reduce((max, current) => {
      const maxNum = parseInt(max.tier.match(/\d+/)[0]);
      const curNum = parseInt(current.tier.match(/\d+/)[0]);
      return curNum > maxNum ? current : max;
    });
    
    const tierNumber = parseInt(highestTier.tier.match(/\d+/)[0]);
    const tierColumn = document.querySelectorAll(".mode-tier-column")[5 - tierNumber]; // Reverse mapping
    
    if (!tierColumn) return;
    
    const playerDiv = document.createElement("div");
    playerDiv.className = "mode-player";
    playerDiv.dataset.player = player.name;
    playerDiv.dataset.region = player.region.toLowerCase();
    
    const isHT = highestTier.tier.includes("HT");
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
    
    playerDiv.addEventListener("click", () => showPlayerModal(player));
    tierColumn.appendChild(playerDiv);
  });
  
  // Sort players in each column (HT above LT)
  document.querySelectorAll(".mode-tier-column").forEach(col => {
    const playerList = [...col.querySelectorAll(".mode-player")];
    playerList
      .sort((a, b) => b.dataset.signvalue - a.dataset.signvalue)
      .forEach(p => col.appendChild(p));
  });
}

/* =============================
   MODES - CATEGORIES VIEW
============================= */

const modeCategoriesDisplay = {
  "Main": ["Vanilla", "UHC", "Pot", "NethOP", "SMP", "Sword", "Axe", "Mace"],
  "Sub": ["Minecart", "Diamond Survival", "DeBuff", "Elytra", "Speed", "Creeper", "Manhunt", "Diamond SMP", "Bow", "Bed", "OG Vanilla", "Trident", "Spear Elytra", "Spear Mace"],
  "Extra": ["AxePot", "Sumo", "OP"],
  "Bonus": ["Bridge", "Pearl"]
};

function renderModeCategories() {
  modesCategoriesContainer.innerHTML = "";
  
  // Create category filter buttons
  const filterContainer = document.createElement("div");
  filterContainer.className = "mode-category-filters";
  
  Object.entries(modeCategoriesDisplay).forEach(([category, modes]) => {
    const filterBtn = document.createElement("button");
    filterBtn.className = "mode-category-btn";
    filterBtn.textContent = category;
    filterBtn.dataset.category = category.toLowerCase();
    
    filterBtn.addEventListener("click", () => {
      // Update active button
      document.querySelectorAll(".mode-category-btn").forEach(btn => {
        btn.classList.remove("active");
      });
      filterBtn.classList.add("active");
      
      // Show players for this category
      showLoadingScreen();
      setTimeout(() => {
        showModesCategoryPlayers(category, modes);
        hideLoadingScreen();
      }, 300);
    });
    
    filterContainer.appendChild(filterBtn);
  });
  
  modesCategoriesContainer.appendChild(filterContainer);
  
  // Set "Main" as active by default and show its players
  const mainBtn = filterContainer.querySelector('[data-category="main"]');
  if (mainBtn) {
    mainBtn.classList.add("active");
  }
  
  // Create container for mode list and players
  const contentContainer = document.createElement("div");
  contentContainer.className = "mode-category-content";
  contentContainer.id = "mode-category-content";
  modesCategoriesContainer.appendChild(contentContainer);
  
  // Show Main category by default
  showModesCategoryPlayers("Main", modeCategoriesDisplay["Main"]);
}

function showModesCategoryPlayers(category, modes) {
  const contentContainer = document.getElementById("mode-category-content");
  if (!contentContainer) return;
  
  contentContainer.innerHTML = "";
  
  // Show the modes list
  const modesListDiv = document.createElement("div");
  modesListDiv.className = "modes-list-display";
  modesListDiv.innerHTML = `
    <div class="modes-separator"></div>
    <h3 class="modes-category-label">${category}</h3>
    <div class="modes-separator"></div>
    <div class="modes-in-category">
      ${modes.map(mode => `<div class="mode-badge">${mode}</div>`).join("")}
    </div>
    <div class="modes-separator"></div>
  `;
  contentContainer.appendChild(modesListDiv);
  
  // Create a container for the players
  const playersDiv = document.createElement("div");
  playersDiv.id = "modes-players-container";
  contentContainer.appendChild(playersDiv);
  
  // Generate and display players for this category
  generatePlayersForCategory(category.toLowerCase(), modes);
}

function generatePlayersForCategory(category, modes) {
  const playersDiv = document.getElementById("modes-players-container");
  if (!playersDiv) return;
  
  playersDiv.innerHTML = "";
  
  // Calculate category-specific points for each player
  const playersWithCategoryPoints = players
    .map(player => ({
      ...player,
      categoryPoints: calculateCategoryPoints(player, modes)
    }))
    .filter(player => player.categoryPoints > 0); // Only include players with tiers in this category
  
  // Sort by category points (NOT overall points)
  playersWithCategoryPoints.sort((a, b) => b.categoryPoints - a.categoryPoints);
  
  // DEBUG: Log top 3 for this category
  console.log(`${category} Category Top 3:`, playersWithCategoryPoints.slice(0, 3).map(p => ({name: p.name, categoryPoints: p.categoryPoints, globalPoints: p.points})));
  
  // ✅ HARD LIMIT TO TOP 100
  const top100 = playersWithCategoryPoints.slice(0, 100);
  
  top100.forEach((player, index) => {
    // Create tiers for all modes in the category, using "Unknown" for untested
    const categoryTiers = modes.map(mode => {
      const existingTier = player.tiers.find(t => t.gamemode === mode);
      return existingTier || { gamemode: mode, tier: "Unknown" };
    });
    const sortedTiers = sortPlayerTiers(categoryTiers, player.retired_modes);
    
    // Generate tier HTML - for all modes in category
    const tiersHTML = sortedTiers
      .map(t => {
        const tierNum = t.tier === "Unknown" ? "?" : t.tier.match(/\d+/)?.[0];
        if (!tierNum) return "";
        
        const tierRank = t.tier === "Unknown" ? "Unknown" : (t.tier.startsWith("HT") ? "HT" : "LT");
        
        return `<div class="tier ${player.retired_modes?.includes(t.gamemode) ? "retired" : ""} ${t.tier === "Unknown" ? "unknown empty" : ""}"
          data-gamemode="${t.gamemode}"
          data-tier="${tierNum}"
          data-rank="${tierRank}"
          data-tooltip="${t.gamemode} — ${t.tier}">
            ${t.tier === "Unknown" ? "" : `<img src="gamemodes/${t.gamemode}.png">`}
            ${t.tier === "Unknown" ? "" : `<span>${tierRank + tierNum}</span>`}
        </div>`;
      }).filter(html => html !== "").join("");
    
    const borderClass =
      index === 0 ? "gold" :
      index === 1 ? "silver" :
      index === 2 ? "bronze" : "";
    
    const nitroClass = player.nitro ? "nitro" : "";
    
    playersDiv.insertAdjacentHTML("beforeend", `
      <div class="player-card ${borderClass}" data-player="${player.name}">
        <div class="rank">${index + 1}.</div>
        <img class="avatar" src="https://render.crafty.gg/3d/bust/${player.uuid}">
        <div class="player-info">
          <div class="player-name ${nitroClass}">${player.name}</div>
          <div class="player-sub">⭐ ${getRankTitle(player.categoryPoints)} (${player.categoryPoints})</div>
        </div>
        <div class="region region-${player.region.toLowerCase()}">${player.region}</div>
        <div class="tiers">${tiersHTML}</div>
      </div>
    `);
  });
  
  // Attach click handlers to player cards
  attachPlayerClick();
}



/* =============================
   LEADERBOARDS - PER MODE
============================= */

function populateLeaderboardModes() {
  const allModes = new Set();
  players.forEach(p => {
    if (p.tiers && Array.isArray(p.tiers)) {
      p.tiers.forEach(t => {
        if (t.gamemode && t.tier !== "Unknown") {
          allModes.add(t.gamemode);
        }
      });
    }
  });
  
  const sortedModes = Array.from(allModes).sort();
  leaderboardModeFilter.innerHTML = '<option value="">-- Select a Mode --</option>';
  sortedModes.forEach(mode => {
    const option = document.createElement("option");
    option.value = mode;
    option.textContent = mode;
    leaderboardModeFilter.appendChild(option);
  });
  
  leaderboardModeFilter.addEventListener("change", (e) => {
    const mode = e.target.value;
    if (mode) {
      renderLeaderboardForMode(mode);
    } else {
      leaderboardsContainer.innerHTML = "";
    }
  });
}

function renderLeaderboardForMode(mode) {
  leaderboardsContainer.innerHTML = "";
  
  // Get all players with this mode
  const playersWithMode = players
    .filter(p => p.tiers && p.tiers.some(t => t.gamemode === mode && t.tier !== "Unknown"))
    .map(p => {
      const tierData = p.tiers.find(t => t.gamemode === mode);
      return {
        ...p,
        modeTier: tierData?.tier || "Unknown",
        modeTierNumber: tierData?.tier?.match(/\d+/)?.[0] || 0,
        isHT: tierData?.tier?.includes("HT") || false
      };
    });
  
  // Create tier columns (1, 2, 3, 4, 5)
  const tiersHTML = `
    <div class="mode-wrapper">
      <div class="mode-tiers" id="leaderboard-mode-tiers">
        ${Array.from({length: 5}, (_, i) => {
          const tierNum = i + 1; // 1, 2, 3, 4, 5
          return '<div class="mode-tier-column"><div class="mode-tier-header">Tier ' + tierNum + '</div></div>';
        }).join('')}
      </div>
    </div>
  `;
  
  leaderboardsContainer.innerHTML = tiersHTML;
  
  // Add players to their tier columns, sorted by HT first
  playersWithMode.forEach(player => {
    const tierNumber = parseInt(player.modeTierNumber);
    const tierColumn = document.querySelectorAll("#leaderboard-mode-tiers .mode-tier-column")[tierNumber - 1];
    
    if (!tierColumn) return;
    
    const playerDiv = document.createElement("div");
    playerDiv.className = "mode-player";
    playerDiv.dataset.player = player.name;
    playerDiv.dataset.region = player.region.toLowerCase();
    playerDiv.dataset.signvalue = player.isHT ? 2 : 1;
    
    playerDiv.innerHTML = `
      <div class="mode-player-left">
        <img src="https://render.crafty.gg/3d/bust/${player.name}">
        <span class="player-label">${player.name}</span>
        <span class="tier-sign">${player.isHT ? "+" : "-"}</span>
      </div>
      <div class="region-box">
        <span>${player.region.toUpperCase()}</span>
      </div>
    `;
    
    tierColumn.appendChild(playerDiv);
  });
  
  // Sort players in each column (HT above LT)
  document.querySelectorAll("#leaderboard-mode-tiers .mode-tier-column").forEach(col => {
    const playerList = [...col.querySelectorAll(".mode-player")];
    playerList
      .sort((a, b) => b.dataset.signvalue - a.dataset.signvalue)
      .forEach(p => col.appendChild(p));
  });
  
  // Attach click handlers to leaderboard players
  attachPlayerClick();
}

/* =============================
   LEADERBOARDS - PER MODE (TIER COLUMNS VIEW)
============================= */

function populateLeaderboardModesWithTiers() {
  // Get all unique modes
  const allModes = new Set();
  players.forEach(p => {
    if (p.tiers && Array.isArray(p.tiers)) {
      p.tiers.forEach(t => {
        if (t.gamemode && t.tier !== "Unknown") {
          allModes.add(t.gamemode);
        }
      });
    }
  });
  
  const sortedModes = Array.from(allModes).sort();
  
  // Clear and populate the mode buttons
  const buttonsContainer = document.getElementById("leaderboards-mode-buttons");
  buttonsContainer.innerHTML = "";
  
  // Add "Overview" button
  const allButton = document.createElement("button");
  allButton.className = "leaderboard-mode-btn active";
  allButton.textContent = "Overview";
  allButton.dataset.mode = "";
  allButton.addEventListener("click", handleLeaderboardModeChange);
  buttonsContainer.appendChild(allButton);
  
  sortedModes.forEach(mode => {
    const button = document.createElement("button");
    button.className = "leaderboard-mode-btn";
    button.textContent = mode;
    button.dataset.mode = mode;
    button.addEventListener("click", handleLeaderboardModeChange);
    buttonsContainer.appendChild(button);
  });
  
  // Show all players in tier grid by default
  showAllPlayersInTierGrid();
}

function handleLeaderboardModeChange(e) {
  const mode = e.target.dataset.mode;
  
  // Update active button
  document.querySelectorAll(".leaderboard-mode-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  e.target.classList.add("active");
  
  if (mode) {
    renderLeaderboardForMode(mode);
  } else {
    showAllPlayersInTierGrid();
  }
}

function showAllPlayersInTierGrid() {
  leaderboardsContainer.innerHTML = "";
  
  // Create tier columns (1, 2, 3, 4, 5) with ALL players shown together
  const tiersHTML = `
    <div class="mode-wrapper">
      <div class="mode-tiers" id="leaderboard-all-tiers">
        ${Array.from({length: 5}, (_, i) => {
          const tierNum = i + 1; // 1, 2, 3, 4, 5
          return '<div class="mode-tier-column"><div class="mode-tier-header">Tier ' + tierNum + '</div></div>';
        }).join('')}
      </div>
    </div>
  `;
  
  leaderboardsContainer.innerHTML = tiersHTML;
  
  // Get all players with their best tier across all modes
  const allPlayers = players.filter(p => p.tiers && Array.isArray(p.tiers) && p.tiers.length > 0);
  
  // Add players to their tier columns
  allPlayers.forEach(player => {
    // Find the best tier for this player
    const validTiers = player.tiers.filter(t => t.tier !== "Unknown");
    if (validTiers.length === 0) return;
    
    // Get highest tier (numerically lowest number)
    const bestTier = validTiers.reduce((best, current) => {
      const bestNum = parseInt(best.tier.match(/\d+/)?.[0] || "5");
      const currentNum = parseInt(current.tier.match(/\d+/)?.[0] || "5");
      return currentNum < bestNum ? current : best;
    });
    
    const tierNumber = parseInt(bestTier.tier.match(/\d+/)[0]);
    const tierColumn = document.querySelectorAll("#leaderboard-all-tiers .mode-tier-column")[tierNumber - 1];
    
    if (!tierColumn) return;
    
    const playerDiv = document.createElement("div");
    playerDiv.className = "mode-player";
    playerDiv.dataset.player = player.name;
    playerDiv.dataset.region = player.region.toLowerCase();
    
    const isHT = bestTier.tier.includes("HT");
    playerDiv.dataset.signvalue = isHT ? 2 : 1;
    
    playerDiv.innerHTML = `
      <div class="mode-player-left">
        <img src="https://render.crafty.gg/3d/bust/${player.uuid}">
        <span class="player-label">${player.name}</span>
        <span class="tier-sign">${isHT ? "+" : "-"}</span>
      </div>
      <div class="region-box">
        <span>${player.region.toUpperCase()}</span>
      </div>
    `;
    
    playerDiv.addEventListener("click", () => showPlayerModal(player));
    tierColumn.appendChild(playerDiv);
  });
  
  // Sort players in each column (HT above LT)
  document.querySelectorAll("#leaderboard-all-tiers .mode-tier-column").forEach(col => {
    const playerList = [...col.querySelectorAll(".mode-player")];
    playerList
      .sort((a, b) => b.dataset.signvalue - a.dataset.signvalue)
      .forEach(p => col.appendChild(p));
  });
}

function showAllModesInTiers() {
  leaderboardsContainer.innerHTML = "";
  
  // Get all modes
  const allModes = new Set();
  players.forEach(p => {
    if (p.tiers && Array.isArray(p.tiers)) {
      p.tiers.forEach(t => {
        if (t.gamemode && t.tier !== "Unknown") {
          allModes.add(t.gamemode);
        }
      });
    }
  });
  
  const sortedModes = Array.from(allModes).sort();
  
  // Create a section for each mode with tier columns
  sortedModes.forEach(mode => {
    const modeSection = document.createElement("div");
    modeSection.className = "leaderboard-mode-section";
    modeSection.innerHTML = `
      <h3 class="mode-section-title">${mode}</h3>
      <div class="mode-wrapper">
        <div class="mode-tiers" data-mode="${mode}">
          ${Array.from({length: 5}, (_, i) => {
            const tierNum = i + 1;
            return '<div class="mode-tier-column"><div class="mode-tier-header">Tier ' + tierNum + '</div></div>';
          }).join('')}
        </div>
      </div>
    `;
    leaderboardsContainer.appendChild(modeSection);
  });
  
  // Add players to their appropriate tier columns
  players.forEach(player => {
    if (!player.tiers || !Array.isArray(player.tiers)) return;
    
    player.tiers.forEach(tierData => {
      if (!tierData.gamemode || tierData.tier === "Unknown") return;
      
      const mode = tierData.gamemode;
      const modeTiers = leaderboardsContainer.querySelector(`.mode-tiers[data-mode="${mode}"]`);
      if (!modeTiers) return;
      
      const tierNumber = parseInt(tierData.tier.match(/\d+/)?.[0]) || 0;
      if (tierNumber < 1 || tierNumber > 5) return;
      
      const tierColumn = modeTiers.querySelectorAll(".mode-tier-column")[tierNumber - 1];
      if (!tierColumn) return;
      
      // Check if player already exists in this column
      const existingPlayer = tierColumn.querySelector(`[data-player="${player.name}"]`);
      if (existingPlayer) return;
      
      const playerDiv = document.createElement("div");
      playerDiv.className = "mode-player";
      playerDiv.dataset.player = player.name;
      playerDiv.dataset.region = player.region.toLowerCase();
      playerDiv.dataset.signvalue = tierData.tier.includes("HT") ? 2 : 1;
      
      playerDiv.innerHTML = `
        <div class="mode-player-left">
          <img src="https://render.crafty.gg/3d/bust/${player.uuid}">
          <span class="player-label">${player.name}</span>
          <span class="tier-sign">${tierData.tier.includes("HT") ? "+" : "-"}</span>
        </div>
        <div class="region-box">
          <span>${player.region.toUpperCase()}</span>
        </div>
      `;
      
      tierColumn.appendChild(playerDiv);
    });
  });
  
  // Sort players in each column (HT above LT)
  leaderboardsContainer.querySelectorAll(".mode-tier-column").forEach(col => {
    const playerList = [...col.querySelectorAll(".mode-player")];
    playerList
      .sort((a, b) => b.dataset.signvalue - a.dataset.signvalue)
      .forEach(p => col.appendChild(p));
  });
  
  // Attach click handlers to leaderboard players
  attachPlayerClick();
}

(async () => {
  await loadPlayers();
  players.forEach(p => p.points = calculatePoints(p, "player"));
  builders.forEach(b => b.points = calculatePoints(b, "builder"));
  await loadPlayerNames();
  await loadTesters();
  await loadBuilders(); // builders loaded here, updateTestedCount() is called inside loadBuilders

  updateTestedCount();

  const hash = window.location.hash;

  if (hash.startsWith("#subject=")) {
    // Restore builder subject leaderboard
    const subject = decodeURIComponent(hash.split("=")[1]);
    normalizeBuilderTiers();
    showBuildersSection("global");
    generateBuilderModeLeaderboard(subject);

} else if (hash.startsWith("#mode=")) {
  const mode = decodeURIComponent(hash.split("=")[1]);
  showSection(leaderboardSection);
  tableHeader.style.display = "none";
  generateModeLeaderboard(mode);
} else {
    // Default: show home page
    showSection(homeSection);
  }

  // Load testers
  populateTesterModes();
  renderTesters();

  // Restore logged-in user
  const savedUser = localStorage.getItem("ultratiers_user");
  if (savedUser) setLoggedInUser(JSON.parse(savedUser));
})();
