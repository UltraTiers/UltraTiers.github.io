  data-tier="${tierNumber}"
  data-rank="${tierRank}"
  data-tooltip="${t.gamemode} â€” ${t.tier}">
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
    });
  });
}

/* =============================
   DOCS
============================= */

function showPlayerModal(player) {
