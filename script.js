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
  if (points >= 36) return "Master";
  if (points >= 16) return "Advanced";
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

/* =============================
   NORMAL LEADERBOARD (TOP 3 BORDERS)
============================= */

function generatePlayers() {
  tableHeader.style.display = "grid"; // show header
  players.sort((a, b) => b.points - a.points);
  playersContainer.innerHTML = "";

  players.forEach((player, index) => {
    const tiersHTML = player.tiers.map(t => {
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

    const card = `
      <div class="player-card ${borderClass}" data-player="${player.name}">
        <div class="rank">${index + 1}.</div>
        <img class="avatar" src="${avatarURL}">
        <div class="player-info">
          <div class="player-name">${player.name}</div>
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

  for (let i = 1; i <= 5; i++) {
    const col = document.createElement("div");
    col.className = "mode-tier-column";
    col.innerHTML = `<div class="mode-tier-header">Tier ${i}</div>`;
    tiersGrid.appendChild(col);
  }

players.forEach(player => {
    const tierObj = player.tiers.find(t => t.gamemode === mode && t.tier !== "Unknown");
    if (!tierObj) return;

    const tierNumber = parseInt(tierObj.tier.match(/\d+/)[0]);
    const targetColumn = document.querySelectorAll(".mode-tier-column")[tierNumber - 1];

    const playerDiv = document.createElement("div");
    playerDiv.className = "mode-player";
    playerDiv.dataset.player = player.name;
    playerDiv.dataset.region = player.region.toLowerCase();

    // Add region for hover & border
    playerDiv.dataset.region = player.region.toLowerCase();

    let sign = "";
    let signValue = 0;

    if (tierObj.tier.includes("HT")) { 
        sign = "+";
        signValue = 2;
    }
    if (tierObj.tier.includes("LT")) { 
        sign = "-";
        signValue = 1;
    }

    playerDiv.dataset.signvalue = signValue;

    playerDiv.innerHTML = `
      <div class="mode-player-left">
        <img src="https://render.crafty.gg/3d/bust/${player.name}">
        <span class="player-label">${player.name}</span>
        <span class="tier-sign">${sign}</span>
      </div>
      <div class="region-box">
        <span>${player.region.toUpperCase()}</span>
      </div>
    `;

    targetColumn.appendChild(playerDiv);
});


  document.querySelectorAll(".mode-tier-column").forEach(col => {
    if (col.children.length === 1) col.innerHTML += `<div class="mode-empty">No players</div>`;
  });

  attachPlayerClick();
}

document.querySelectorAll(".mode-tier-column").forEach(col => {
    const players = [...col.querySelectorAll(".mode-player")];

    players.sort((a, b) => {
        return b.dataset.signvalue - a.dataset.signvalue;
    });

    players.forEach(p => col.appendChild(p));
});

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

(async () => {
  await loadPlayerNames();  // fetch names from UUID
  generatePlayers();        // now build leaderboard
})();
