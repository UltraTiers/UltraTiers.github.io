import { players, tiersDocs } from './players.js';

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
  if (points >= 26) return "Master";
  if (points >= 11) return "Advanced";
  return "Rookie";
}

// Map tiers to points
const tierPointsMap = {};
tiersDocs.forEach(t => {
  const points = parseInt(t.description.match(/\d+/)[0]);
  tierPointsMap[t.tier] = points;
});

// Calculate total points for a player
function calculatePoints(player) {
  return player.tiers.reduce((sum, t) => {
    if (t.tier === "Unknown") return sum;
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

const MAX_TIERS = 8

/* =============================
   NORMAL LEADERBOARD (TOP 3 BORDERS)
============================= */

function generatePlayers() {
  tableHeader.style.display = "grid"; // show header
  players.sort((a, b) => b.points - a.points);
  playersContainer.innerHTML = "";

  players.forEach((player, index) => {
// Separate real tiers and unknown tiers
const realTiers = player.tiers.filter(t => t.tier !== "Unknown");

// Map real tiers to HTML
const realTiersHTML = realTiers.map(t => {
  const tierNumber = t.tier.match(/\d+/)[0];
  return `
    <div class="tier" data-gamemode="${t.gamemode}" data-tier="${tierNumber}">
      <img src="gamemodes/${t.gamemode}.png">
      <span>${t.tier}</span>
    </div>
  `;
});

// Calculate how many empty tiers are needed
const emptyTiersCount = MAX_TIERS - realTiersHTML.length;

// Generate empty tiers HTML
const emptyTiersHTML = Array(emptyTiersCount).fill(`<div class="tier empty"></div>`);

// Combine real tiers first, then empty tiers
const finalTiersHTML = [...realTiersHTML, ...emptyTiersHTML].join("");

    const avatarURL = `https://render.crafty.gg/3d/bust/${player.name}`;

    const borderClass =
      index === 0 ? "gold" :
      index === 1 ? "silver" :
      index === 2 ? "bronze" : "";

    const card = `
      <div class="player-card ${borderClass}" data-player="${player.name}">
        <div class="rank">${index + 1}.</div>
        <img class="avatar" src="${avatarURL}">
        <div class="player-info">
          <div class="player-name">${player.name}</div>
          <div class="player-sub">⭐ ${getRankTitle(player.points)} (${player.points})</div>
        </div>
        <div class="region region-${player.region.toLowerCase()}">${player.region}</div>
        <div class="tiers">${finalTiersHTML}</div>
      </div>
    `;

    playersContainer.insertAdjacentHTML("beforeend", card);
  });

  attachPlayerClick();
}

/* =============================
   MODE LEADERBOARD
============================= */

function getTierSymbolForMode(player, mode) {
  const tierObj = player.tiers.find(t => t.gamemode === mode && t.tier !== "Unknown");
  if (!tierObj) return "";
  if (tierObj.tier.startsWith("HT")) return "+";
  if (tierObj.tier.startsWith("LT")) return "-";
  return "";
}

function generateModeLeaderboard(mode) {
  tableHeader.style.display = "none"; // hide header

  playersContainer.innerHTML = `
    <div class="mode-wrapper">
      <div class="mode-title">${mode} Leaderboard</div>
      <div class="mode-tiers" id="mode-tiers"></div>
    </div>
  `;

  // Map symbol to a rank value for stable sorting: "+" -> 0, "" -> 1, "-" -> 2
  const symbolRank = s => (s === "+" ? 0 : s === "-" ? 2 : 1);

  // Build an array of players with their symbol for this mode
  const playersWithSymbol = players.map(p => ({
    player: p,
    symbol: getTierSymbolForMode(p, mode) // "+", "-", or ""
  }));

  // Sort so "+" first, neutrals next, "-" last; then fallback to name
  playersWithSymbol.sort((a, b) => {
    const ra = symbolRank(a.symbol);
    const rb = symbolRank(b.symbol);
    if (ra !== rb) return ra - rb;
    return a.player.name.localeCompare(b.player.name);
  });

  const tiersGrid = document.getElementById("mode-tiers");

  // create 5 tier columns
  for (let i = 1; i <= 5; i++) {
    const col = document.createElement("div");
    col.className = "mode-tier-column";
    col.innerHTML = `<div class="mode-tier-header">Tier ${i}</div>`;
    tiersGrid.appendChild(col);
  }

  // Place players into their tier columns in the sorted order
  playersWithSymbol.forEach(({ player, symbol }) => {
    const tierObj = player.tiers.find(t => t.gamemode === mode && t.tier !== "Unknown");
    if (!tierObj) return; // player doesn't have a real tier for this mode

    const tierNumber = parseInt(tierObj.tier.match(/\d+/)[0], 10);
    const targetColumn = document.querySelectorAll(".mode-tier-column")[tierNumber - 1];
    if (!targetColumn) return;

    const playerDiv = document.createElement("div");
    playerDiv.className = "mode-player";
    playerDiv.dataset.player = player.name;

    playerDiv.innerHTML = `
      <img src="https://render.crafty.gg/3d/bust/${player.name}">
      <span class="player-name-mode">${player.name}</span>
      ${symbol ? `<span class="tier-symbol">${symbol}</span>` : ""}
    `;

    targetColumn.appendChild(playerDiv);
  });

  // If column only contains header -> add placeholder
  document.querySelectorAll(".mode-tier-column").forEach(col => {
    if (col.children.length === 1) col.innerHTML += `<div class="mode-empty">No players</div>`;
  });

  attachPlayerClick();
}

/* =============================
   PLAYER CLICK
============================= */

function attachPlayerClick() {
  document.querySelectorAll("[data-player]").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.player;
      const player = players.find(p => p.name === name);

      modalTitle.textContent = player.name;

      const tiersHTML = player.tiers
        .filter(t => t.tier !== "Unknown") // only show known tiers in modal
        .map(t => {
          const tierNumber = t.tier.match(/\d+/)[0];
          return `
            <div class="tier" data-gamemode="${t.gamemode}" data-tier="${tierNumber}">
              <img src="gamemodes/${t.gamemode}.png">
              <span>${t.tier}</span>
            </div>
          `;
        }).join("");

      modalContent.innerHTML = `
        <p><b>Region:</b> ${player.region}</p>
        <p><b>Rank:</b> ${getRankTitle(player.points)}</p>
        <p><b>Points:</b> ${player.points}</p>
        <div class="tiers">${tiersHTML}</div>
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

    modalTitle.textContent = player.name;

    const tiersHTML = player.tiers
      .filter(t => t.tier !== "Unknown") // modal hides empty tiers
      .map(t => {
        const tierNumber = t.tier.match(/\d+/)[0];
        return `
          <div class="tier" data-gamemode="${t.gamemode}" data-tier="${tierNumber}">
            <img src="gamemodes/${t.gamemode}.png">
            <span>${t.tier}</span>
          </div>
        `;
      }).join("");

    modalContent.innerHTML = `
      <p><b>Region:</b> ${player.region}</p>
      <p><b>Rank:</b> ${getRankTitle(player.points)}</p>
      <p><b>Points:</b> ${player.points}</p>
      <div class="tiers">${tiersHTML}</div>
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

generatePlayers();
