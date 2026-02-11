// Tier data structure - will be populated from Supabase API
let tierData = {
    main: {},
    sub: {},
    extra: {},
    bonus: {},
};

// Category mappings for gamemodes
const categoryMappings = {
    main: ['sword', 'axe', 'vanilla', 'pot', 'nethop', 'uhc', 'smp', 'mace'],
    sub: ['speed', 'creeper', 'elytra', 'minecart', 'trident', 'diamond-survival', 'diamond-smp', 'og-vanilla', 'debuff', 'bed', 'bow', 'manhunt'],
    extra: ['axepot', 'sumo', 'op', 'spear-mace', 'spear-elytra'],
    bonus: ['bridge', 'pearl'],
};

// API endpoint URL
const API_URL = '/players';

const tierIcons = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
    4: '⭐',
    5: '💫',
};

const tierColors = {
    1: 'tier-1',
    2: 'tier-2',
    3: 'tier-3',
    4: 'tier-4',
    5: 'tier-5',
};

// Fetch players from Supabase and organize them by tier
async function fetchAndOrganizePlayers() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch players: ${response.statusText}`);
        }

        const players = await response.json();

        // Initialize category structures
        Object.keys(categoryMappings).forEach(category => {
            tierData[category] = {};
            categoryMappings[category].forEach(mode => {
                tierData[category][mode] = [
                    { tier: 1, players: [] },
                    { tier: 2, players: [] },
                    { tier: 3, players: [] },
                    { tier: 4, players: [] },
                    { tier: 5, players: [] },
                ];
            });
        });

        // Organize players by category, gamemode, and tier
        players.forEach(player => {
            if (Array.isArray(player.tiers)) {
                player.tiers.forEach(tierInfo => {
                    const gamemode = tierInfo.gamemode;
                    const tier = parseInt(tierInfo.tier);

                    // Find which category this gamemode belongs to
                    for (const [category, modes] of Object.entries(categoryMappings)) {
                        if (modes.includes(gamemode)) {
                            if (tierData[category][gamemode]) {
                                // Find the tier array and add the player
                                const tierArray = tierData[category][gamemode].find(t => t.tier === tier);
                                if (tierArray) {
                                    tierArray.players.push(player.name);
                                }
                            }
                            break;
                        }
                    }
                });
            }
        });

        console.log('✓ Players loaded and organized:', tierData);
    } catch (error) {
        console.error('Error fetching players:', error);
        // Continue with empty data if fetch fails
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async function () {
    await fetchAndOrganizePlayers();
    setupTabHandlers();
    renderDefaultTab();
});

function setupTabHandlers() {
    // Main tab handlers
    const mainTabs = document.querySelectorAll('.main-tab-btn');
    mainTabs.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            switchMainTab(tabName);
        });
    });
}

function switchMainTab(tabName) {
    // Update main tab buttons
    document.querySelectorAll('.main-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Setup mode tabs for this category
    setupModeTabsForCategory(tabName);
    
    // Show first mode
    const firstMode = document.querySelector(`#${tabName}-tab .mode-tab-btn`);
    if (firstMode) {
        firstMode.click();
    }
}

function setupModeTabsForCategory(categoryName) {
    const tabContent = document.getElementById(`${categoryName}-tab`);
    const modeTabs = tabContent.querySelectorAll('.mode-tab-btn');
    
    modeTabs.forEach(btn => {
        btn.addEventListener('click', function () {
            const modeName = this.getAttribute('data-mode');
            renderRankings(categoryName, modeName);
            
            // Update button state
            modeTabs.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function renderRankings(category, mode) {
    const container = document.getElementById(`${category}-rankings`);
    container.innerHTML = '';

    const data = tierData[category][mode] || [];

    if (!data || data.length === 0) {
        // Generate empty tier structure
        for (let i = 1; i <= 5; i++) {
            const card = createTierCard(i, []);
            container.appendChild(card);
        }
        return;
    }

    // Render existing data
    data.forEach(tierInfo => {
        const card = createTierCard(tierInfo.tier, tierInfo.players);
        container.appendChild(card);
    });
}

function createTierCard(tierNumber, players) {
    const card = document.createElement('div');
    card.className = `tier-card ${tierColors[tierNumber]}`;
    
    const header = document.createElement('div');
    header.className = 'tier-header';
    header.innerHTML = `
        <span class="tier-icon">${tierIcons[tierNumber]}</span>
        <span class="tier-title">Tier ${tierNumber}</span>
        <span class="tier-number">${players.length} players</span>
    `;
    
    card.appendChild(header);
    
    if (players.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = '<div class="empty-state-text">No players yet</div>';
        card.appendChild(empty);
    } else {
        const list = document.createElement('div');
        list.className = 'players-list';
        
        players.forEach((playerName, index) => {
            const item = document.createElement('div');
            item.className = 'player-item';
            
            const rank = document.createElement('div');
            rank.className = 'player-rank';
            rank.textContent = `#${index + 1}`;
            
            const avatar = document.createElement('div');
            avatar.className = 'player-avatar';
            avatar.textContent = playerName.charAt(0).toUpperCase();
            
            const info = document.createElement('div');
            info.className = 'player-info';
            
            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = playerName;
            
            info.appendChild(name);
            
            item.appendChild(rank);
            item.appendChild(avatar);
            item.appendChild(info);
            
            list.appendChild(item);
        });
        
        card.appendChild(list);
    }
    
    return card;
}

function renderDefaultTab() {
    switchMainTab('main');
}
