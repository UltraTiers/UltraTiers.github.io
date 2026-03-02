// BrawlTiers JS: Orange themed, password protected

const BRAWL_PASSWORD = "BrawlTiers";

function promptPassword() {
    let entered = prompt("Enter password to access BrawlTiers:");
    if (entered !== BRAWL_PASSWORD) {
        alert("Incorrect password.");
        window.location.href = "../index.html";
        return false;
    }
    return true;
}

if (!promptPassword()) {
    // Prevent further loading
    throw new Error("Access denied");
}

// --- Main logic: Only All Modes and Rankings tabs ---

document.addEventListener('DOMContentLoaded', function () {
    setupBrawlTabs();
    fetchAndOrganizePlayers();
    initSearchSystem();
});

function setupBrawlTabs() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="main-tabs">
            <button class="main-tab-btn active" id="all-modes-tab">All Modes</button>
            <button class="main-tab-btn" id="rankings-tab">Rankings</button>
        </div>
        <div class="tab-content active" id="all-modes-content"></div>
        <div class="tab-content" id="rankings-content"></div>
    `;
    document.getElementById('all-modes-tab').onclick = () => switchBrawlTab('all-modes');
    document.getElementById('rankings-tab').onclick = () => switchBrawlTab('rankings');
    switchBrawlTab('all-modes');
}

function switchBrawlTab(tab) {
    document.getElementById('all-modes-content').classList.toggle('active', tab === 'all-modes');
    document.getElementById('rankings-content').classList.toggle('active', tab === 'rankings');
    document.getElementById('all-modes-tab').classList.toggle('active', tab === 'all-modes');
    document.getElementById('rankings-tab').classList.toggle('active', tab === 'rankings');
    if (tab === 'all-modes') {
        renderAllModesOverall();
    } else {
        renderBrawlRankings();
    }
}

function renderBrawlRankings() {
    // TODO: Implement leaderboard per mode (reuse logic from main site)
    const rankingsContent = document.getElementById('rankings-content');
    rankingsContent.innerHTML = '<h2>Rankings (Leaderboards per mode)</h2>';
    // You can reuse renderRankings() logic here
}

// Reuse fetchAndOrganizePlayers, initSearchSystem, renderAllModesOverall from main site
// You may need to expose these functions globally or duplicate them for BrawlTiers
