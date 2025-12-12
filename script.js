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
}

/* =============================
   ELEMENTS
============================= */

const leaderboardSection = document.getElementById("leaderboard-section");
const docsSection = document.getElementById("docs-section");
const playersContainer = document.getElementById("players-container");
const tierDocsContainer = document.getElementById("tier-docs-container");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
const closeModalBtn = document.getElementById("close-modal");
const searchInput = document.getElementById("search-input");
const tableHeader = document.querySelector(".table-header");

/* =============================
   SECTION SWITCHING HELPER
============================= */

function showSection(sectionToShow) {
  const sections = [leaderboardSection, docsSection];
  sections.forEach(section => {
    if (section === sectionToShow) {
      section.classList.add("active-section");
      section.classList.remove("hidden-section");
    } else {
      section.classList.remove("active-section");
      section.classList.add("hidden-section");
    }
  });
}

function sortPlayerTiers(tiers) {
  return tiers.slice().sort((a, b) => {
    const aPoints = tierPointsMap[a.tier] || -1;
    const bPoints = tierPointsMap[b.tier] || -1;
    return bPoints - aPoints; // highest points first
  });
}

/* =============================
   NAVIGATION BUTTONS
============================= */

document.querySelector(".rankings-btn").addEventListener("click", () => {
  showSection(leaderboardSection);
  tableHeader.style.display = "grid";
  generatePlayers();
});

document.querySelector(".docs-btn").addEventListener("click", () => {
  showSection(docsSection);
});

/* =============================
   MODE BUTTONS
============================= */

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    showSection(leaderboardSection);
    generateModeLeaderboard(btn.dataset.mode);
  });
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

// Update all player points automatically
players.forEach(p => p.points = calculatePoints(p));


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

/* =============================
   NORMAL LEADERBOARD (TOP 3 BORDERS)
============================= */

function generatePlayers() {
  tableHeader.style.display = "grid"; // show header
  players.sort((a, b) => b.points - a.points);
  playersContainer.innerHTML = "";

  players.forEach((player, index) => {
const sortedTiers = sortPlayerTiers(player.tiers);
const tiersHTML = sortedTiers.map(t => {
  if (t.tier === "Unknown") return `<div class="tier empty"></div>`;
  const tierNumber = t.tier.match(/\d+/)[0];
  return `
    <div class="tier" data-gamemode="${t.gamemode}" data-tier="${tierNumber}">
      <img src="gamemodes/${t.gamemode}.png">
      <span>${t.tier}</span>
    </div>
  `;
}).join("");

    const avatarURL = `https://render.crafty.gg/3d/bust/${player.uuid}`;

    const borderClass =
      index === 0 ? "gold" :
      index === 1 ? "silver" :
      index === 2 ? "bronze" : "";

const nitroClass = player.nitro ? "nitro" : ""; // <-- NEW

const card = `
  <div class="player-card ${borderClass}" data-player="${player.name}">
    <div class="rank">${index + 1}.</div>
    <img class="avatar" src="${avatarURL}">
    <div class="player-info">
      <div class="player-name ${nitroClass}">${player.name}</div>
      <div class="player-sub">⭐ ${getRankTitle(player.points)} (${player.points})</div>
    </div>
    <div class="region region-${player.region.toLowerCase()}">${player.region}</div>
    <div class="tiers">${tiersHTML}</div>
  </div>
`;

    playersContainer.insertAdjacentHTML("beforeend", card);
  });

  attachPlayerClick();
}

const player = players.find(p => p.name.toLowerCase() === ign.toLowerCase());
if (player) {
    player.nitro = true;  // mark player as Nitro
    generatePlayers();    // re-render leaderboard
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
    const playerList = [...col.querySelectorAll(".mode-player")];

    playerList
      .sort((a, b) => b.dataset.signvalue - a.dataset.signvalue)
      .forEach(p => col.appendChild(p));

    // If column only has the header, show "No players"
    if (playerList.length === 0) {
      col.innerHTML += `<div class="mode-empty">No players</div>`;
    }
  });

  attachPlayerClick();
}


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
          const tierNumber = t.tier.match(/\d+/)[0];
          return `
            <div class="tier" data-gamemode="${t.gamemode}" data-tier="${tierNumber}">
              <img src="gamemodes/${t.gamemode}.png">
              <span>${t.tier}</span>
            </div>
          `;
        }).join("");

const nitroClass = player.nitro ? "nitro" : "";

modalContent.innerHTML = `
  <div class="modal-header">
    <img class="modal-avatar ${nitroClass}" src="https://render.crafty.gg/3d/bust/${player.uuid}" alt="${player.name} Avatar">
    <div class="modal-name ${nitroClass}">${player.name || "Unknown Player"}</div>
  </div>

  <div class="modal-section">
    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Placement:</span>
      <span class="modal-value">#${players.indexOf(player) + 1}</span>
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
        const tierNumber = t.tier.match(/\d+/)[0];
        return `
          <div class="tier" data-gamemode="${t.gamemode}" data-tier="${tierNumber}">
            <img src="gamemodes/${t.gamemode}.png">
            <span>${t.tier}</span>
          </div>
        `;
      }).join("");

const nitroClass = player.nitro ? "nitro" : "";

modalContent.innerHTML = `
  <div class="modal-header">
    <img class="modal-avatar ${nitroClass}" src="https://render.crafty.gg/3d/bust/${player.uuid}" alt="${player.name} Avatar">
    <div class="modal-name ${nitroClass}">${player.name || "Unknown Player"}</div>
  </div>

  <div class="modal-section">
    <div class="modal-info-row ${nitroClass}">
      <span class="modal-label">Placement:</span>
      <span class="modal-value">#${players.indexOf(player) + 1}</span>
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
   MODAL CLOSE
============================= */

closeModalBtn.addEventListener("click", () => modal.classList.remove("show"));

/* =============================
   INIT
============================= */

(async () => {
  await loadPlayers();    // fetch players from JSON
  await loadPlayerNames(); 
  generatePlayers();
})();
