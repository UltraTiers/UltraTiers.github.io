// Tier data structure - will be populated from Supabase API
let tierData = {
    main: {},
    sub: {},
    extra: {},
    bonus: {},
};

// Category mappings for gamemodes (match server.js capitalization)
const categoryMappings = {
    main: ['Sword', 'Axe', 'Vanilla', 'Pot', 'NethOP', 'UHC', 'SMP', 'Mace'],
    sub: ['Speed', 'Creeper', 'Elytra', 'Minecart', 'Trident', 'Diamond Survival', 'Diamond SMP', 'OG Vanilla', 'DeBuff', 'Bed', 'Bow', 'Manhunt'],
    extra: ['AxePot', 'Sumo', 'OP', 'Spear Mace', 'Spear Elytra'],
    bonus: ['Bridge', 'Pearl'],
};

// Mode name mapping (HTML data-mode to server gamemode)
const modeNameMap = {
    'sword': 'Sword',
    'axe': 'Axe',
    'vanilla': 'Vanilla',
    'pot': 'Pot',
    'nethop': 'NethOP',
    'uhc': 'UHC',
    'smp': 'SMP',
    'mace': 'Mace',
    'speed': 'Speed',
    'creeper': 'Creeper',
    'elytra': 'Elytra',
    'minecart': 'Minecart',
    'trident': 'Trident',
    'diamond-survival': 'Diamond Survival',
    'diamond-smp': 'Diamond SMP',
    'og-vanilla': 'OG Vanilla',
    'debuff': 'DeBuff',
    'bed': 'Bed',
    'bow': 'Bow',
    'manhunt': 'Manhunt',
    'axepot': 'AxePot',
    'sumo': 'Sumo',
    'op': 'OP',
    'spear-mace': 'Spear Mace',
    'spear-elytra': 'Spear Elytra',
    'bridge': 'Bridge',
    'pearl': 'Pearl',
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
        console.log('Raw players from API:', players);

        // Store all players for the overall view
        window.allPlayers = players;

        // Initialize category structures with server gamemode names
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
                    let tierValue = tierInfo.tier;

                    // Parse tier format: "HT1" -> 1, "LT2" -> 2, or if already a number use it
                    if (typeof tierValue === 'string') {
                        const tierMatch = tierValue.match(/\d+/);
                        tierValue = tierMatch ? parseInt(tierMatch[0]) : null;
                    } else {
                        tierValue = parseInt(tierValue);
                    }

                    if (!tierValue || tierValue < 1 || tierValue > 5) {
                        return; // Skip if tier is invalid or "Unknown"
                    }

                    // Find which category this gamemode belongs to
                    for (const [category, modes] of Object.entries(categoryMappings)) {
                        if (modes.includes(gamemode)) {
                            if (tierData[category][gamemode]) {
                                // Find the tier array and add the player
                                const tierArray = tierData[category][gamemode].find(t => t.tier === tierValue);
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

    // Handle overall tab differently
    if (tabName === 'overall') {
        renderOverall();
    } else {
        // Setup mode tabs for other categories
        setupModeTabsForCategory(tabName);
        
        // Show second mode button (skip the Overall button at index 0)
        const modeButtons = document.querySelectorAll(`#${tabName}-tab .mode-tab-btn`);
        if (modeButtons.length > 1) {
            modeButtons[1].click();
        } else if (modeButtons.length > 0) {
            modeButtons[0].click();
        }
    }
}

// Render overall view with all players and their tiers
function renderOverall() {
    const container = document.getElementById('overall-players-list');
    container.innerHTML = '';

    if (!window.allPlayers || window.allPlayers.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No players found</div>';
        return;
    }

    // Create a player overview card for each player
    window.allPlayers.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-overview-card';
        
        // Player header with name
        const header = document.createElement('div');
        header.className = 'player-overview-header';
        header.innerHTML = `<h3>${player.name}</h3>`;
        
        // Create sections for each category
        const categoriesDiv = document.createElement('div');
        categoriesDiv.className = 'player-tiers-summary';
        
        Object.keys(categoryMappings).forEach(category => {
            const categorySection = document.createElement('div');
            categorySection.className = 'tier-category-section';
            
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryTitle.className = 'category-title';
            
            const tiersDiv = document.createElement('div');
            tiersDiv.className = 'player-category-tiers';
            
            // Get tiers for this category
            categoryMappings[category].forEach(gamemode => {
                const tierInfo = player.tiers.find(t => t.gamemode === gamemode);
                const tierValue = tierInfo ? tierInfo.tier : 'Unknown';
                
                // Parse tier value to get number
                let tierNumber = 0;
                if (typeof tierValue === 'string') {
                    const match = tierValue.match(/\d+/);
                    tierNumber = match ? parseInt(match[0]) : 0;
                }
                
                const tierBadge = document.createElement('div');
                tierBadge.className = `tier-badge ${tierNumber > 0 ? tierColors[tierNumber] : 'tier-unknown'}`;
                tierBadge.title = gamemode;
                tierBadge.innerHTML = `<span class="tier-icon">${tierNumber > 0 ? tierIcons[tierNumber] : '❓'}</span>`;
                
                tiersDiv.appendChild(tierBadge);
            });
            
            categorySection.appendChild(categoryTitle);
            categorySection.appendChild(tiersDiv);
            categoriesDiv.appendChild(categorySection);
        });
        
        card.appendChild(header);
        card.appendChild(categoriesDiv);
        container.appendChild(card);
    });
}

function setupModeTabsForCategory(categoryName) {
    const tabContent = document.getElementById(`${categoryName}-tab`);
    const modeTabs = tabContent.querySelectorAll('.mode-tab-btn');
    
    modeTabs.forEach(btn => {
        btn.addEventListener('click', function () {
            const modeName = this.getAttribute('data-mode');
            const categoryAttr = this.getAttribute('data-category');
            
            // Check if this is a category overall button
            if (categoryAttr && modeName.startsWith('overall-')) {
                renderCategoryOverall(categoryAttr);
            } else {
                renderRankings(categoryName, modeName);
            }
            
            // Update button state
            modeTabs.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Render overall view for a specific category
function renderCategoryOverall(category) {
    const container = document.getElementById(`${category}-rankings`);
    container.innerHTML = '';

    if (!window.allPlayers || window.allPlayers.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No players found</div>';
        return;
    }

    // Create a grid of players showing all tiers for this category
    const playerGrid = document.createElement('div');
    playerGrid.className = 'category-overall-grid';

    window.allPlayers.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'category-player-card';
        
        const playerName = document.createElement('h4');
        playerName.className = 'category-player-name';
        playerName.textContent = player.name;
        
        const tiersList = document.createElement('div');
        tiersList.className = 'category-tiers-list';
        
        // Get all gamemodes for this category
        categoryMappings[category].forEach(gamemode => {
            const tierInfo = player.tiers.find(t => t.gamemode === gamemode);
            const tierValue = tierInfo ? tierInfo.tier : 'Unknown';
            
            // Parse tier value to get number
            let tierNumber = 0;
            if (typeof tierValue === 'string') {
                const match = tierValue.match(/\d+/);
                tierNumber = match ? parseInt(match[0]) : 0;
            }
            
            const tierItem = document.createElement('div');
            tierItem.className = `category-tier-item ${tierNumber > 0 ? tierColors[tierNumber] : 'tier-unknown'}`;
            tierItem.title = gamemode;
            tierItem.innerHTML = `
                <span class="mode-short">${gamemode.substring(0, 3)}</span>
                <span class="tier-icon">${tierNumber > 0 ? tierIcons[tierNumber] : '❓'}</span>
            `;
            
            tiersList.appendChild(tierItem);
        });
        
        playerCard.appendChild(playerName);
        playerCard.appendChild(tiersList);
        playerGrid.appendChild(playerCard);
    });

    container.appendChild(playerGrid);
}

function renderRankings(category, mode) {
    const container = document.getElementById(`${category}-rankings`);
    container.innerHTML = '';

    // Convert HTML mode name (lowercase) to server gamemode name (capitalized)
    const serverModeName = modeNameMap[mode] || mode;
    const data = tierData[category][serverModeName] || [];

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
    switchMainTab('overall');
}
