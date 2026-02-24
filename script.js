// --- Friends & Chat Routing / Client helpers ---
function openChatPage() {
    location.hash = '#ultratierchatting';
}

// Show maintenance page for root or unknown hashes
function setupHashRouting() {
    window.addEventListener('hashchange', handleHash);
    handleHash();
}

function getCurrentUser() {
    try {
        const ls = localStorage.getItem('ultratiers_user') || localStorage.getItem('ultra_user');
        if (ls) return JSON.parse(ls);
    } catch (e) {}
    return window.currentUser || null;
}

function handleHash() {
    const h = location.hash;
    if (!h || (h !== '#ultratierlist' && h !== '#ultratierchatting')) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;font-family: Arial, sans-serif;"><h1>The Website Is Getting Worked On</h1></div>';
        return;
    }
    const mainContainer = document.querySelector('.container');
    const user = getCurrentUser();
    if (h === '#ultratierlist') {
        // show main site UI and remove chat UI + cloned header if present
        const app = document.getElementById('ultratier-chat-app');
        if (app) app.remove();
        const cloneHeader = document.getElementById('chat-header-clone');
        if (cloneHeader) cloneHeader.remove();
        // restore original header markup if we modified it for chat
        const mainHeader = document.querySelector('.header');
        if (mainHeader && mainHeader.dataset && mainHeader.dataset.savedInner) {
            try {
                mainHeader.innerHTML = mainHeader.dataset.savedInner;
                delete mainHeader.dataset.savedInner;
                mainHeader.style.position = '';
                mainHeader.style.top = '';
                mainHeader.style.zIndex = '';
            } catch (e) { /* ignore */ }
        }
        if (mainContainer) mainContainer.style.display = '';
        // ensure main content is rendered and login/UI state is re-initialized
        try {
            renderDefaultTab();
            // re-run login/UI initialization so header shows the current user immediately
            try { initLoginSystem(); } catch (e) { /* ignore if not present */ }
            // refresh player data so lists and UI update without a full reload
            try { fetchAndOrganizePlayers(); } catch (e) { /* ignore */ }
        } catch (e) {}
        return;
    }
    if (h === '#ultratierchatting') {
        // If user is not logged in, don't allow access to chat — redirect to tierlist and open login
        if (!user) {
            location.hash = '#ultratierlist';
            setTimeout(() => { try { openLoginModal(); } catch (e) {} }, 150);
            return;
        }

        // hide main site UI and render chat
        if (mainContainer) mainContainer.style.display = 'none';
        try {
            // Render the chat page (renderChatPage handles cloning the header)
            renderChatPage();
        } catch (e) {
            console.warn('renderChatPage failed', e);
        }
        
    }
}

// Tier points mapping (client-side copy)
const tierPointsMap = { LT5:1, HT5:2, LT4:4, HT4:6, LT3:9, HT3:12, LT2:16, HT2:20, LT1:25, HT1:30 };

// Combat tags ordered from highest to lowest
const combatTags = ['Combat Grandmaster','Combat Master','Combat Ace','Combat Specialist','Combat Cadet','Combat Novice','Combat Rookie'];

// Combat tag thresholds per category
const combatTagThresholds = {
    main: {
        'Combat Grandmaster': 384,
        'Combat Master': 288,
        'Combat Ace': 192,
        'Combat Specialist': 120,
        'Combat Cadet': 58,
        'Combat Novice': 20,
        'Combat Rookie': 0
    },
    sub: {
        'Combat Grandmaster': 576,
        'Combat Master': 432,
        'Combat Ace': 288,
        'Combat Specialist': 180,
        'Combat Cadet': 86,
        'Combat Novice': 29,
        'Combat Rookie': 0
    },
    extra: {
        'Combat Grandmaster': 240,
        'Combat Master': 180,
        'Combat Ace': 120,
        'Combat Specialist': 75,
        'Combat Cadet': 36,
        'Combat Novice': 12,
        'Combat Rookie': 0
    },
    bonus: {
        'Combat Grandmaster': 96,
        'Combat Master': 72,
        'Combat Ace': 48,
        'Combat Specialist': 30,
        'Combat Cadet': 14,
        'Combat Novice': 5,
        'Combat Rookie': 0
    },
    all: {
        'Combat Grandmaster': 1296,
        'Combat Master': 972,
        'Combat Ace': 648,
        'Combat Specialist': 405,
        'Combat Cadet': 195,
        'Combat Novice': 65,
        'Combat Rookie': 0
    }
};

// Calculate points for a player
function calculatePlayerPoints(player) {
    if (!Array.isArray(player.tiers)) return 0;
    
    return player.tiers.reduce((sum, tierInfo) => {
        const tierValue = tierInfo.tier;
        return sum + (tierPointsMap[tierValue] || 0);
    }, 0);
}

// Get combat tag based on points and category
function getCombatTag(points, category = 'main') {
    const key = (category === 'all-modes') ? 'all' : (category || 'main');
    const thresholds = combatTagThresholds[key] || combatTagThresholds.main;
    for (const tag of combatTags) {
        if (points >= thresholds[tag]) return tag;
    }
    return 'Combat Rookie';
}

// Get medal rank styling
function getMedalRank(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
}

// Calculate category rank (Master/Advanced/Rookie)
function getCategoryRank(points, allPoints) {
    // Exclude players with 0 points
    const activePoints = allPoints.filter(p => p > 0);
    
    if (activePoints.length === 0) return 'Rookie';
    
    // If this player has 0 points, they're automatically Rookie
    if (points === 0) return 'Rookie';
    
    // Count how many players have MORE points (rank is 1 + count of players with more points)
    const playersWithMorePoints = activePoints.filter(p => p > points).length;
    const playerRank = playersWithMorePoints + 1;
    const percentile = ((playerRank - 1) / activePoints.length) * 100;
    
    // Ranking thresholds: top 20% = Master, top 60% = Advanced, rest = Rookie
    if (percentile <= 20) return 'Master';
    if (percentile <= 60) return 'Advanced';
    return 'Rookie';
}

// Get rank styling color
function getRankColor(rank) {
    switch(rank) {
        case 'Master': return '#fbbf24'; // Gold
        case 'Advanced': return '#fbbf24'; // Blue
        case 'Rookie': return '#fbbf24'; // Green
        default: return '#fbbf24'; // Gray
    }
}

// Category mappings for gamemodes (match server.js capitalization)
const categoryMappings = {
    main: ['Sword', 'Axe', 'Vanilla', 'Pot', 'NethOP', 'UHC', 'SMP', 'Mace'],
    sub: ['Speed', 'Creeper', 'Elytra', 'Minecart', 'Trident', 'Diamond Survival', 'Diamond SMP', 'OG Vanilla', 'DeBuff', 'Bed', 'Bow', 'Manhunt'],
    extra: ['AxePot', 'Pufferfish', 'OP', 'Spear Mace', 'Spear Elytra'],
    bonus: ['Bridge', 'Pearl', 'Sumo'],
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
    'pufferfish': 'Pufferfish',
    'sumo': 'Sumo',
    'op': 'OP',
    'spear-mace': 'Spear Mace',
    'spear-elytra': 'Spear Elytra',
    'bridge': 'Bridge',
    'pearl': 'Pearl',
};

// Region name mapping (abbreviations to full names)
const regionNameMap = {
    'AF': 'Africa',
    'AS': 'Asia',
    'AU': 'Australia',
    'EU': 'Europe',
    'NA': 'North America',
    'SA': 'South America',
    'OC': 'Oceania',
    'ME': 'Middle East',
};

// Get full region name
function getFullRegionName(regionCode) {
    return regionNameMap[regionCode] || regionCode;
}

// API endpoint URL
const API_URL = '/players';

// Gamemode icons mapping - use PNG files from gamemodes folder
const gamemodeIcons = {
    'Sword': 'gamemodes/Sword.png',
    'Axe': 'gamemodes/Axe.png',
    'Vanilla': 'gamemodes/Vanilla.png',
    'Pot': 'gamemodes/Pot.png',
    'NethOP': 'gamemodes/NethOP.png',
    'UHC': 'gamemodes/UHC.png',
    'SMP': 'gamemodes/SMP.png',
    'Mace': 'gamemodes/Mace.png',
    'Speed': 'gamemodes/Speed.png',
    'Creeper': 'gamemodes/Creeper.png',
    'Elytra': 'gamemodes/Elytra.png',
    'Minecart': 'gamemodes/Minecart.png',
    'Trident': 'gamemodes/Trident.png',
    'Diamond Survival': 'gamemodes/Diamond Survival.png',
    'Diamond SMP': 'gamemodes/Diamond SMP.png',
    'OG Vanilla': 'gamemodes/OG Vanilla.png',
    'DeBuff': 'gamemodes/DeBuff.png',
    'Bed': 'gamemodes/Bed.png',
    'Bow': 'gamemodes/Bow.png',
    'Manhunt': 'gamemodes/Manhunt.png',
    'AxePot': 'gamemodes/AxePot.png',
    'Pufferfish': 'gamemodes/Pufferfish.png',
    'Sumo': 'gamemodes/Sumo.png',
    'OP': 'gamemodes/OP.png',
    'Spear Mace': 'gamemodes/Spear Mace.png',
    'Spear Elytra': 'gamemodes/Spear Elytra.png',
    'Bridge': 'gamemodes/Bridge.png',
    'Pearl': 'gamemodes/Pearl.png',
};

// Get MC skin image element
function getPlayerAvatarElement(player) {
    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    
    if (player.uuid) {
        const img = document.createElement('img');
        img.src = `https://render.crafty.gg/3d/bust/${player.uuid}`;
        img.alt = player.name;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.borderRadius = '12px';
        img.style.objectFit = 'cover';
        img.onerror = function() {
            // Fallback to initial if image fails to load
            img.style.display = 'none';
            avatar.textContent = player.name.charAt(0).toUpperCase();
            avatar.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
            avatar.style.display = 'flex';
            avatar.style.alignItems = 'center';
            avatar.style.justifyContent = 'center';
            avatar.style.color = '#000';
            avatar.style.fontWeight = '700';
        };
        avatar.appendChild(img);
    } else {
        avatar.textContent = player.name.charAt(0).toUpperCase();
        avatar.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.color = '#000';
        avatar.style.fontWeight = '700';
    }
    
    return avatar;
}

const tierIcons = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
    4: '⭐',
    5: '⭐',
    'Unknown': '❓',
};

const tierColors = {
    1: 'tier-1',
    2: 'tier-2',
    3: 'tier-3',
    4: 'tier-4',
    5: 'tier-5',
    'Unknown': 'tier-unknown',
};

// Map of player names to full player objects for quick lookup
window.playerMap = {};

// Initialize tierData object to store game rankings
const tierData = {
    main: {},
    sub: {},
    extra: {},
    bonus: {}
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

        // Create lookup map from player names to full player objects
        window.playerMap = {};
        players.forEach(player => {
            window.playerMap[player.name] = player;
        });

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
                    { tier: 'Unknown', players: [] },
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

                    if (tierValue === null || tierValue === undefined) {
                        tierValue = 'Unknown'; // Mark unknown tiers
                    } else if (tierValue < 1 || tierValue > 5) {
                        tierValue = 'Unknown'; // Mark out-of-range tiers as unknown
                    }

                    // Find which category this gamemode belongs to
                    for (const [category, modes] of Object.entries(categoryMappings)) {
                        if (modes.includes(gamemode)) {
                            if (tierData[category][gamemode]) {
                                // Find the tier array and add the player
                                const tierArray = tierData[category][gamemode].find(t => t.tier === tierValue);
                                if (tierArray) {
                                    // Determine HT/LT prefix from tierInfo.tier
                                    let prefixedName = player.name;
                                    if (typeof tierInfo.tier === 'string') {
                                        if (tierInfo.tier.startsWith('HT')) {
                                            prefixedName = 'HT' + player.name;
                                        } else if (tierInfo.tier.startsWith('LT')) {
                                            prefixedName = 'LT' + player.name;
                                        }
                                    }
                                    tierArray.players.push(prefixedName);
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

// Search System Functions
function initSearchSystem() {
    const searchInput = document.getElementById('player-search-input');
    const searchDropdown = document.getElementById('search-results-dropdown');
    
    if (!searchInput) return;
    
    // Handle input and filtering
    searchInput.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        
        if (query.length === 0) {
            searchDropdown.style.display = 'none';
            return;
        }
        
        // Filter players based on search query
        const results = window.allPlayers.filter(player => 
            player.name.toLowerCase().includes(query)
        ).slice(0, 8); // Limit to 8 players
        
        if (results.length === 0) {
            searchDropdown.innerHTML = '<div class="search-no-results">No players found</div>';
            searchDropdown.style.display = 'block';
            return;
        }
        
        // Create only all-modes results for each player
        const resultsHTML = results.map(player => {
            return `
                <div class="search-result-item" data-player-name="${player.name}" data-category="all-modes">
                    <img src="https://mc-heads.net/avatar/${player.uuid}/32" alt="${player.name}" class="search-result-avatar">
                    <div class="search-result-info">
                        <div class="search-result-name">${player.name}</div>
                        <div class="search-result-category">${getFullRegionName(player.region) || 'Unknown'} • Overall</div>
                    </div>
                </div>
            `;
        }).join('');
        
        searchDropdown.innerHTML = resultsHTML;
        searchDropdown.style.display = 'block';
        
        // Add click handlers to result items
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const playerName = this.getAttribute('data-player-name');
                const player = window.playerMap[playerName];
                if (player) {
                    // Show the all-modes modal
                    showAllModesModal(player);
                    searchInput.value = '';
                    searchDropdown.style.display = 'none';
                }
            });
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            searchDropdown.style.display = 'none';
        }
    });
    
    // Close dropdown on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchDropdown.style.display = 'none';
            searchInput.value = '';
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', async function () {
    setupHashRouting();
    const loadingChat = location.hash === '#ultratierchatting';
    // Always initialize app state (players + auth) so chat works on refresh,
    // but avoid rendering the default tierlist tab when user explicitly requested chat.
    await fetchAndOrganizePlayers();
    initLoginSystem();
    initSearchSystem();
    setupTabHandlers();
    if (!loadingChat) renderDefaultTab();
});

// --- Peak tooltip (delegated) ---
(() => {
    const tooltip = document.createElement('div');
    tooltip.className = 'mode-peak-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '99999';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.12s ease, transform 0.12s ease';
    document.body.appendChild(tooltip);

    let hideTimeout = null;

    function show(target, peak) {
        if (!peak) return;
        tooltip.textContent = `Peak • ${peak}`;
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0px)';
        const rect = target.getBoundingClientRect();
        // position centered above the icon
        const left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
        // reduce gap so arrow visually connects to the icon
        const top = rect.top - tooltip.offsetHeight - 6;
        tooltip.style.left = `${Math.max(8, left)}px`;
        tooltip.style.top = `${Math.max(8, top)}px`;
    }

    function hide() {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(-4px)';
    }

    document.addEventListener('mouseover', (e) => {
        const icon = e.target.closest('.mode-icon');
        if (!icon) return;
        const peak = icon.dataset.peak;
        if (!peak || peak === 'Unknown') return;
        if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
        // small delay to avoid flicker from fast mouse movements
        show(icon, peak);
    }, true);

    document.addEventListener('mouseout', (e) => {
        const icon = e.target.closest('.mode-icon');
        if (!icon) return;
        // delay hide slightly to make tooltip easier to read
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => hide(), 80);
    }, true);
})();

// --- Sync icon <-> badge hover (delegated) ---
(function() {
    let hoverTarget = null;

    function addHover(modeItem) {
        const icon = modeItem.querySelector('.mode-icon');
        const badge = modeItem.querySelector('.tier-badge-rounded, .player-modal-tier-badge, .tier-badge-small');
        if (icon) icon.classList.add('hovered');
        if (badge) badge.classList.add('hovered');
    }
    function removeHover(modeItem) {
        const icon = modeItem.querySelector('.mode-icon');
        const badge = modeItem.querySelector('.tier-badge-rounded, .player-modal-tier-badge, .tier-badge-small');
        if (icon) icon.classList.remove('hovered');
        if (badge) badge.classList.remove('hovered');
    }

    document.addEventListener('mouseover', (e) => {
        const modeItem = e.target.closest('.mode-item, .player-modal-tier-item');
        if (!modeItem || modeItem === hoverTarget) return;
        hoverTarget = modeItem;
        addHover(modeItem);
    }, true);

    document.addEventListener('mouseout', (e) => {
        const related = e.relatedTarget;
        const leftItem = e.target.closest('.mode-item, .player-modal-tier-item');
        // If leaving the same modeItem to somewhere outside it, remove hover
        if (!leftItem) return;
        if (leftItem && (!related || !leftItem.contains(related))) {
            removeHover(leftItem);
            if (hoverTarget === leftItem) hoverTarget = null;
        }
    }, true);
})();

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

// Get unique regions from all players
function getAllRegions() {
    if (!window.allPlayers || window.allPlayers.length === 0) return [];
    
    const regions = new Set();
    window.allPlayers.forEach(player => {
        if (player.region && player.region !== 'Unknown') {
            regions.add(player.region);
        }
    });
    
    return Array.from(regions).sort((a, b) => getFullRegionName(a).localeCompare(getFullRegionName(b)));
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

    // Handle All Modes tab specially
    if (tabName === 'all-modes') {
        setupAllModesTab();
    } else {
        // Setup mode tabs for the category
        setupModeTabsForCategory(tabName);
        
        // Click the "All" button (first button) which shows category overall
        const modeButtons = document.querySelectorAll(`#${tabName}-tab .mode-tab-btn`);
        if (modeButtons.length > 0) {
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

    // Calculate points for each player and sort
    const playersWithPoints = window.allPlayers.map((player, index) => ({
        ...player,
        totalPoints: calculatePlayerPoints(player),
        index: index
    })).sort((a, b) => b.totalPoints - a.totalPoints);

    // Render player cards in leaderboard style
    playersWithPoints.forEach((player, rank) => {
        const medal = getMedalRank(rank + 1);
        const card = document.createElement('div');
        card.className = `player-card ${medal}`;
        
        // Rank number
        const rankDiv = document.createElement('div');
        rankDiv.className = 'rank';
        rankDiv.textContent = `#${rank + 1}`;
        
        // Avatar with MC skin
        const avatar = getPlayerAvatarElement(player);
        avatar.style.width = '48px';
        avatar.style.height = '48px';
        
        // Player info
        const info = document.createElement('div');
        info.className = 'player-info';
        const nameDiv = document.createElement('div');
        nameDiv.className = 'player-name';
        nameDiv.textContent = player.name;
        const pointsDiv = document.createElement('div');
        pointsDiv.className = 'player-sub';
        pointsDiv.textContent = `${player.totalPoints} points`;
        info.appendChild(nameDiv);
        info.appendChild(pointsDiv);
        
        // Tiers grid for all categories
        const tiersContainer = document.createElement('div');
        tiersContainer.className = 'overall-tiers-display';
        
        Object.keys(categoryMappings).forEach(category => {
            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'tier-category-group';
            
            categoryMappings[category].forEach(gamemode => {
                const tierInfo = player.tiers.find(t => t.gamemode === gamemode);
                const tierValue = tierInfo ? tierInfo.tier : 'Unknown';
                const peakValue = tierInfo ? (tierInfo.peak || tierInfo.tier) : 'Unknown';
                
                // Parse tier value to get number
                let tierNumber = 0;
                if (typeof tierValue === 'string') {
                    const match = tierValue.match(/\d+/);
                    tierNumber = match ? parseInt(match[0]) : 0;
                }
                
                const tierBadge = document.createElement('div');
                tierBadge.className = `tier-badge-small ${tierNumber > 0 ? tierColors[tierNumber] : 'tier-unknown'}`;
                tierBadge.innerHTML = tierNumber > 0 ? tierIcons[tierNumber] : '❓';
                
                categoryGroup.appendChild(tierBadge);
            });
            
            tiersContainer.appendChild(categoryGroup);
        });
        
        card.appendChild(rankDiv);
        card.appendChild(avatar);
        card.appendChild(info);
        card.appendChild(tiersContainer);
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
            
            // If button has data-category, it's the "All" button
            if (categoryAttr) {
                renderCategoryOverall(categoryAttr);
            } else {
                // Regular gamemode ranking
                renderRankings(categoryName, modeName);
            }
            
            // Update button state
            modeTabs.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Setup All Modes tab with region buttons
function setupAllModesTab() {
    const regionTabs = document.getElementById('region-tabs');
    const regions = getAllRegions();
    
    regionTabs.innerHTML = '';
    
    // Add "Overall" button
    const overallBtn = document.createElement('button');
    overallBtn.className = 'mode-tab-btn active';
    overallBtn.dataset.region = 'overall';
    overallBtn.textContent = 'Overall';
    overallBtn.addEventListener('click', function() {
        renderAllModesOverall();
        document.querySelectorAll('#region-tabs .mode-tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
    regionTabs.appendChild(overallBtn);
    
    // Add region buttons
    regions.forEach(region => {
        const btn = document.createElement('button');
        btn.className = 'mode-tab-btn';
        btn.dataset.region = region;
        btn.textContent = getFullRegionName(region);
        btn.addEventListener('click', function() {
            renderAllModesRegion(region);
            document.querySelectorAll('#region-tabs .mode-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
        regionTabs.appendChild(btn);
    });
    
    // Click the Overall button to render it
    overallBtn.click();
}

// Render All Modes overall (all modes, all regions)
function renderAllModesOverall() {
    const container = document.getElementById('all-modes-rankings');
    container.classList.remove('rankings-grid');
    container.classList.add('overall-container');
    container.innerHTML = '';

    if (!window.allPlayers || window.allPlayers.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No players found</div>';
        return;
    }

    // Calculate total points for all players across all modes
    const playersWithPoints = window.allPlayers.map(player => ({
        ...player,
        totalPoints: calculatePlayerPoints(player)
    })).sort((a, b) => b.totalPoints - a.totalPoints);

    // Get all points for rank calculation
    const allPoints = playersWithPoints.map(p => p.totalPoints);

    // Render each player as a row (capped at top 100)
    playersWithPoints.slice(0, 100).forEach((player, rank) => {
        const row = document.createElement('div');
        row.className = 'category-player-row';
        
        // Combined rank + avatar section
        const rankPlayerSection = document.createElement('div');
        rankPlayerSection.className = 'rank-player-section';
        
        const medal = getMedalRank(rank + 1);
        
        // Rank badge background
        const rankBadge = document.createElement('div');
        rankBadge.className = `rank-badge ${medal}`;
        rankBadge.textContent = `#${rank + 1}`;
        rankPlayerSection.appendChild(rankBadge);
        
        // Avatar
        const avatar = getPlayerAvatarElement(player);
        avatar.style.width = '80px';
        avatar.style.height = '80px';
        avatar.className = 'rank-avatar';
        rankPlayerSection.appendChild(avatar);
        
        // Player info section
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info-section';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = `player-name${player.nitro ? ' nitro' : ''}`;
        nameDiv.textContent = player.name;
        
        // Calculate overall rank
        const overallRank = getCategoryRank(player.totalPoints, allPoints);
        const rankColor = getRankColor(overallRank);

        const overallCombatTag = getCombatTag(player.totalPoints, 'all');
        const titleDiv = document.createElement('div');
        titleDiv.className = 'player-title';
        titleDiv.innerHTML = `<span style="color: ${rankColor}; font-weight: bold;">${overallCombatTag}</span> • ${player.totalPoints} points`;
        
        playerInfo.appendChild(nameDiv);
        playerInfo.appendChild(titleDiv);
        
        // Region section
        const regionSection = document.createElement('div');
        regionSection.className = 'region-section';
        regionSection.textContent = getFullRegionName(player.region) || 'Unknown';
        
        // Combine name/title and region
        const playerIdentitySection = document.createElement('div');
        playerIdentitySection.className = 'player-identity-section';
        playerIdentitySection.appendChild(playerInfo);
        playerIdentitySection.appendChild(regionSection);
        
        // Modes section - show all modes with tiers
        const modesSection = document.createElement('div');
        modesSection.className = 'modes-section';
        
        // Collect all modes grouped by category
        const modesByCategory = {};
        Object.keys(categoryMappings).forEach(category => {
            modesByCategory[category] = [];
            categoryMappings[category].forEach(gamemode => {
                const tierInfo = player.tiers.find(t => t.gamemode === gamemode);
                const tierValue = tierInfo ? tierInfo.tier : 'Unknown';
                const isRetired = Array.isArray(player.retired_modes) && player.retired_modes.includes(gamemode);
                
                let tierNumber = 0;
                if (typeof tierValue === 'string') {
                    const match = tierValue.match(/\d+/);
                    tierNumber = match ? parseInt(match[0]) : 0;
                }
                
                const peakValue = tierInfo ? (tierInfo.peak || tierInfo.tier) : 'Unknown';
                modesByCategory[category].push({ gamemode, tierValue, tierNumber, isRetired, peak: peakValue });
            });
        });
        
        // Flatten and sort by tier
        const allModes = [];
        Object.values(modesByCategory).forEach(modes => allModes.push(...modes));
        
        allModes.sort((a, b) => {
            if (a.isRetired && !b.isRetired) return 1;
            if (!a.isRetired && b.isRetired) return -1;
            if (a.tierNumber === 0) return 1;
            if (b.tierNumber === 0) return -1;
            if (a.tierNumber !== b.tierNumber) return a.tierNumber - b.tierNumber;
            
            const aIsHT = typeof a.tierValue === 'string' && a.tierValue.startsWith('HT');
            const bIsHT = typeof b.tierValue === 'string' && b.tierValue.startsWith('HT');
            if (aIsHT && !bIsHT) return -1;
            if (!aIsHT && bIsHT) return 1;
            return 0;
        });
        
        // Render all modes
        allModes.forEach(({ gamemode, tierValue, tierNumber, isRetired, peak }) => {
            const modeItem = document.createElement('div');
            modeItem.className = `mode-item${isRetired ? ' retired-tier' : ''}`;
            
            const icon = document.createElement('img');
            icon.className = 'mode-icon';
            icon.src = gamemodeIcons[gamemode] || 'gamemodes/Vanilla.png';
            icon.alt = gamemode;
            icon.title = gamemode;
            icon.dataset.peak = peak || 'Unknown';
            
            const tierBadge = document.createElement('div');
            tierBadge.className = `tier-badge-rounded ${isRetired ? 'tier-retired' : (tierNumber > 0 ? tierColors[tierNumber] : 'tier-unknown')}`;
            tierBadge.textContent = tierValue !== 'Unknown' ? tierValue : '?';
            
            modeItem.appendChild(icon);
            modeItem.appendChild(tierBadge);
            modesSection.appendChild(modeItem);
        });
        
        // Assemble the row
        row.appendChild(rankPlayerSection);
        row.appendChild(playerIdentitySection);
        row.appendChild(modesSection);
        
        container.appendChild(row);
    });
}

// Render All Modes for a specific region
function renderAllModesRegion(region) {
    const container = document.getElementById('all-modes-rankings');
    container.classList.remove('rankings-grid');
    container.classList.add('overall-container');
    container.innerHTML = '';

    if (!window.allPlayers || window.allPlayers.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No players found</div>';
        return;
    }

    // Filter players by region
    const regionPlayers = window.allPlayers.filter(p => p.region === region);
    
    if (regionPlayers.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No players in this region</div>';
        return;
    }

    // Calculate total points for players in this region
    const playersWithPoints = regionPlayers.map(player => ({
        ...player,
        totalPoints: calculatePlayerPoints(player)
    })).sort((a, b) => b.totalPoints - a.totalPoints);

    // Get all points for rank calculation
    const allPoints = playersWithPoints.map(p => p.totalPoints);

    // Render each player as a row (capped at top 100)
    playersWithPoints.slice(0, 100).forEach((player, rank) => {
        const row = document.createElement('div');
        row.className = 'category-player-row';
        
        // Combined rank + avatar section
        const rankPlayerSection = document.createElement('div');
        rankPlayerSection.className = 'rank-player-section';
        
        const medal = getMedalRank(rank + 1);
        
        // Rank badge background
        const rankBadge = document.createElement('div');
        rankBadge.className = `rank-badge ${medal}`;
        rankBadge.textContent = `#${rank + 1}`;
        rankPlayerSection.appendChild(rankBadge);
        
        // Avatar
        const avatar = getPlayerAvatarElement(player);
        avatar.style.width = '80px';
        avatar.style.height = '80px';
        avatar.className = 'rank-avatar';
        rankPlayerSection.appendChild(avatar);
        
        // Player info section
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info-section';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = `player-name${player.nitro ? ' nitro' : ''}`;
        nameDiv.textContent = player.name;
        
        // Calculate rank in region (for color) and show combat tag text instead
        const regionRank = getCategoryRank(player.totalPoints, allPoints);
        const rankColor = getRankColor(regionRank);
        const regionCombatTag = getCombatTag(player.totalPoints, 'all');

        const titleDiv = document.createElement('div');
        titleDiv.className = 'player-title';
        titleDiv.innerHTML = `<span style="color: ${rankColor}; font-weight: bold;">${regionCombatTag}</span> • ${player.totalPoints} points`;
        
        playerInfo.appendChild(nameDiv);
        playerInfo.appendChild(titleDiv);
        
        // Region section
        const regionSection = document.createElement('div');
        regionSection.className = 'region-section';
        regionSection.textContent = region;
        
        // Combine name/title and region
        const playerIdentitySection = document.createElement('div');
        playerIdentitySection.className = 'player-identity-section';
        playerIdentitySection.appendChild(playerInfo);
        playerIdentitySection.appendChild(regionSection);
        
        // Modes section - show all modes with tiers
        const modesSection = document.createElement('div');
        modesSection.className = 'modes-section';
        
        // Collect all modes
        const allModes = [];
        if (Array.isArray(player.tiers)) {
            player.tiers.forEach(tierInfo => {
                const gamemode = tierInfo.gamemode;
                const tierValue = tierInfo.tier;
                const isRetired = Array.isArray(player.retired_modes) && player.retired_modes.includes(gamemode);
                
                let tierNumber = 0;
                if (typeof tierValue === 'string') {
                    const match = tierValue.match(/\d+/);
                    tierNumber = match ? parseInt(match[0]) : 0;
                }
                
                const peakValue = tierInfo ? (tierInfo.peak || tierInfo.tier) : 'Unknown';
                allModes.push({ gamemode, tierValue, tierNumber, isRetired, peak: peakValue });
            });
        }
        
        // Sort modes
        allModes.sort((a, b) => {
            if (a.isRetired && !b.isRetired) return 1;
            if (!a.isRetired && b.isRetired) return -1;
            if (a.tierNumber === 0) return 1;
            if (b.tierNumber === 0) return -1;
            if (a.tierNumber !== b.tierNumber) return a.tierNumber - b.tierNumber;
            
            const aIsHT = typeof a.tierValue === 'string' && a.tierValue.startsWith('HT');
            const bIsHT = typeof b.tierValue === 'string' && b.tierValue.startsWith('HT');
            if (aIsHT && !bIsHT) return -1;
            if (!aIsHT && bIsHT) return 1;
            return 0;
        });
        
        // Render modes
        allModes.forEach(({ gamemode, tierValue, tierNumber, isRetired, peak }) => {
            const modeItem = document.createElement('div');
            modeItem.className = `mode-item${isRetired ? ' retired-tier' : ''}`;
            
            const icon = document.createElement('img');
            icon.className = 'mode-icon';
            icon.src = gamemodeIcons[gamemode] || 'gamemodes/Vanilla.png';
            icon.alt = gamemode;
            icon.title = gamemode;
            icon.dataset.peak = peak || 'Unknown';
            
            const tierBadge = document.createElement('div');
            tierBadge.className = `tier-badge-rounded ${isRetired ? 'tier-retired' : (tierNumber > 0 ? tierColors[tierNumber] : 'tier-unknown')}`;
            tierBadge.textContent = tierValue !== 'Unknown' ? tierValue : '?';
            
            modeItem.appendChild(icon);
            modeItem.appendChild(tierBadge);
            modesSection.appendChild(modeItem);
        });
        
        // Assemble the row
        row.appendChild(rankPlayerSection);
        row.appendChild(playerIdentitySection);
        row.appendChild(modesSection);
        
        container.appendChild(row);
    });
}

// Render category ranking with player details and mode icons
function renderCategoryOverall(category) {
    const container = document.getElementById(`${category}-rankings`);
    // ensure this container displays stacked overall rows instead of tier grid
    container.classList.remove('rankings-grid');
    container.classList.add('overall-container');
    container.innerHTML = '';

    if (!window.allPlayers || window.allPlayers.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No players found</div>';
        return;
    }

    // Calculate category-specific points for all players
    const playersWithCategoryPoints = window.allPlayers.map(player => {
        let categoryPoints = 0;
        
        if (Array.isArray(player.tiers)) {
            categoryMappings[category].forEach(gamemode => {
                const tierInfo = player.tiers.find(t => t.gamemode === gamemode);
                if (tierInfo) {
                    categoryPoints += tierPointsMap[tierInfo.tier] || 0;
                }
            });
        }
        
        return {
            ...player,
            categoryPoints: categoryPoints
        };
    }).sort((a, b) => {
        // Sort by category points descending (highest first)
        return b.categoryPoints - a.categoryPoints;
    });

    // Get all category points for rank calculation
    const allCategoryPoints = playersWithCategoryPoints.map(p => p.categoryPoints);

    // Render each player as a row (capped at top 100)
    playersWithCategoryPoints.slice(0, 100).forEach((player, rank) => {
        const row = document.createElement('div');
        row.className = 'category-player-row';
        
        // Combined rank + avatar section (integrated design)
        const rankPlayerSection = document.createElement('div');
        rankPlayerSection.className = 'rank-player-section';
        
        const medal = getMedalRank(rank + 1);
        
        // Rank badge background
        const rankBadge = document.createElement('div');
        rankBadge.className = `rank-badge ${medal}`;
        rankBadge.textContent = `#${rank + 1}`;
        rankPlayerSection.appendChild(rankBadge);
        
        // Avatar over the rank badge
        const avatar = getPlayerAvatarElement(player);
        avatar.style.width = '80px';
        avatar.style.height = '80px';
        avatar.className = 'rank-avatar';
        rankPlayerSection.appendChild(avatar);
        
        // Player info section
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info-section';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = `player-name${player.nitro ? ' nitro' : ''}`;
        nameDiv.textContent = player.name;
        
        // Calculate category rank (for color) and show category combat tag text instead
        const categoryRank = getCategoryRank(player.categoryPoints, allCategoryPoints);
        const rankColor = getRankColor(categoryRank);
        const categoryCombatTag = getCombatTag(player.categoryPoints, category);

        const titleDiv = document.createElement('div');
        titleDiv.className = 'player-title';
        titleDiv.innerHTML = `<span style="color: ${rankColor}; font-weight: bold;">${categoryCombatTag}</span> • ${player.categoryPoints} points`;
        
        playerInfo.appendChild(nameDiv);
        playerInfo.appendChild(titleDiv);
        
        // Region section
        const regionSection = document.createElement('div');
        regionSection.className = 'region-section';
        regionSection.textContent = getFullRegionName(player.region) || 'Unknown';
        
        // Combine name/title and region into one section
        const playerIdentitySection = document.createElement('div');
        playerIdentitySection.className = 'player-identity-section';
        playerIdentitySection.appendChild(playerInfo);
        playerIdentitySection.appendChild(regionSection);
        
        // Modes section with icons and tier badges - sort by tier (highest first)
        const modesSection = document.createElement('div');
        modesSection.className = 'modes-section';
        
        // Collect all modes with their tier info
        const modesWithTiers = categoryMappings[category].map(gamemode => {
            const tierInfo = player.tiers.find(t => t.gamemode === gamemode);
            const tierValue = tierInfo ? tierInfo.tier : 'Unknown';
            const peakValue = tierInfo ? (tierInfo.peak || tierInfo.tier) : 'Unknown';
            const isRetired = Array.isArray(player.retired_modes) && player.retired_modes.includes(gamemode);
            
            // Parse tier value to get number for sorting
            let tierNumber = 0;
            if (typeof tierValue === 'string') {
                const match = tierValue.match(/\d+/);
                tierNumber = match ? parseInt(match[0]) : 0;
            }
            
            return { gamemode, tierValue, tierNumber, isRetired, peak: peakValue };
        });
        
        // Sort: highest tier first (tier 1 = 1, tier 2 = 2, etc), Retired and Unknown last
        modesWithTiers.sort((a, b) => {
            if (a.isRetired && !b.isRetired) return 1;  // Retired goes to end
            if (!a.isRetired && b.isRetired) return -1; // Retired goes to end
            if (a.tierNumber === 0) return 1;  // Unknown goes to end
            if (b.tierNumber === 0) return -1; // Unknown goes to end
            
            // First sort by tier number
            if (a.tierNumber !== b.tierNumber) {
                return a.tierNumber - b.tierNumber; // Lower tier number comes first
            }
            
            // Within the same tier, HT comes before LT
            const aIsHT = typeof a.tierValue === 'string' && a.tierValue.startsWith('HT');
            const bIsHT = typeof b.tierValue === 'string' && b.tierValue.startsWith('HT');
            if (aIsHT && !bIsHT) return -1;  // HT comes first
            if (!aIsHT && bIsHT) return 1;   // LT comes second
            return 0;
        });
        
        // Render sorted modes
        modesWithTiers.forEach(({ gamemode, tierValue, tierNumber, isRetired, peak }) => {
            const modeItem = document.createElement('div');
            modeItem.className = `mode-item${isRetired ? ' retired-tier' : ''}`;
            
            const icon = document.createElement('img');
            icon.className = 'mode-icon';
            icon.src = gamemodeIcons[gamemode] || 'gamemodes/Vanilla.png';
            icon.alt = gamemode;
            icon.title = gamemode;
            icon.dataset.peak = peak || 'Unknown';
            
            const tierBadge = document.createElement('div');
            tierBadge.className = `tier-badge-rounded ${isRetired ? 'tier-retired' : (tierNumber > 0 ? tierColors[tierNumber] : 'tier-unknown')}`;
            tierBadge.textContent = tierValue !== 'Unknown' ? tierValue : '?';
            
            modeItem.appendChild(icon);
            modeItem.appendChild(tierBadge);
            modesSection.appendChild(modeItem);
        });
        
        // Assemble the row
        row.appendChild(rankPlayerSection);
        row.appendChild(playerIdentitySection);
        row.appendChild(modesSection);
        
        container.appendChild(row);
    });
}

function renderRankings(category, mode) {
    const container = document.getElementById(`${category}-rankings`);
    // ensure this container uses the tier grid layout for columns
    container.classList.remove('overall-container');
    container.classList.add('rankings-grid');
    container.innerHTML = '';

    // Convert HTML mode name (lowercase) to server gamemode name (capitalized)
    const serverModeName = modeNameMap[mode] || mode;
    const data = tierData[category][serverModeName] || [];

    console.log(`Rendering ${category} > ${mode} (${serverModeName})`, data);

    if (!data || data.length === 0) {
        // Generate empty tier structure
        for (let i = 1; i <= 5; i++) {
            const card = createTierCard(i, [], category);
            container.appendChild(card);
        }
        return;
    }

    // Sort tiers: 1-5 only (skip Unknown)
    const sortedData = [...data].filter(t => t.tier !== 'Unknown').sort((a, b) => {
        const tierOrder = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
        return (tierOrder[a.tier] ?? 6) - (tierOrder[b.tier] ?? 6);
    });

    // Render sorted tiers (unknown tier skipped)
    sortedData.forEach(tierInfo => {
        const card = createTierCard(tierInfo.tier, tierInfo.players, category);
        container.appendChild(card);
    });
}

function createTierCard(tierNumber, players, category = 'main') {
    const card = document.createElement('div');
    card.className = `tier-card ${tierColors[tierNumber]}`;
    
    // Sort players: HT first (higher tier prefixes), then LT
    const sortedPlayers = [...players].sort((a, b) => {
        const aIsHT = a.startsWith('HT');
        const bIsHT = b.startsWith('HT');
        if (aIsHT && !bIsHT) return -1;  // HT comes first
        if (!aIsHT && bIsHT) return 1;   // LT comes second
        return 0;
    });
    
    const header = document.createElement('div');
    header.className = 'tier-header';
    header.style.order = '0'; // Ensure header is always first
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
        
        sortedPlayers.forEach((playerName, index) => {
            const item = document.createElement('div');
            item.className = 'player-item';
            
            // Determine tier prefix and indicator
            let tierPrefix = '';
            let indicator = '';
            let cleanName = playerName;
            
            if (playerName.startsWith('HT')) {
                tierPrefix = 'HT';
                cleanName = playerName.substring(2); // Remove HT prefix
            } else if (playerName.startsWith('LT')) {
                tierPrefix = 'LT';
                cleanName = playerName.substring(2); // Remove LT prefix
            }
            
            const rank = document.createElement('div');
            rank.className = 'player-rank';
            let icon = '';
            if (tierPrefix === 'HT') {
                icon = '<i class="fa-solid fa-angles-up"></i>';
            } else if (tierPrefix === 'LT') {
                icon = '<i class="fa-solid fa-angle-up"></i>';
            }
            rank.innerHTML = `<div>${icon}</div>`;
            
            // Get player object for MC skin using clean name
            const playerObj = window.playerMap[cleanName] || { name: cleanName };
            const avatar = getPlayerAvatarElement(playerObj);
            avatar.style.width = '32px';
            avatar.style.height = '32px';
            avatar.style.minWidth = '32px';
            
            const info = document.createElement('div');
            info.className = 'player-info';
            
            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = cleanName;
            
            info.appendChild(name);
            
            item.appendChild(rank);
            item.appendChild(avatar);
            item.appendChild(info);
            
            // Add click handler to open player modal
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                showPlayerModal(playerObj, tierNumber, category);
            });
            
            list.appendChild(item);
        });
        
        card.appendChild(list);
    }
    
    return card;
}

function showPlayerModal(player, tierNumber, category = 'main') {
    // Remove existing modal if present
    const existingModal = document.getElementById('player-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'player-modal';
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal-content';
    
    // Banner background
    const bannerImg = player.banner || 'anime-style-stone.jpg';
    const banner = document.createElement('div');
    banner.className = 'player-modal-banner';
    banner.style.backgroundImage = `url(${bannerImg})`;
    modal.appendChild(banner);
    
    // Pop-out (overall) button (top-left)
    const popoutBtn = document.createElement('button');
    popoutBtn.className = 'player-modal-popout';
    popoutBtn.innerHTML = '<i class="fa-solid fa-up-right-from-square"></i>';
    popoutBtn.title = 'Open overall view';
    popoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.remove();
        try {
            showAllModesModal(player);
        } catch (err) {
            console.warn('Unable to open all-modes modal for player', err);
        }
    });
    modal.appendChild(popoutBtn);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'player-modal-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => overlay.remove());
    modal.appendChild(closeBtn);
    
    // Avatar section
    const avatarSection = document.createElement('div');
    avatarSection.className = 'player-modal-avatar-section';
    
    const avatar = getPlayerAvatarElement(player);
    avatar.className = 'player-modal-avatar';
    avatarSection.appendChild(avatar);
    
    const playerName = document.createElement('div');
    playerName.className = 'player-modal-name';
    playerName.textContent = player.name;
    avatarSection.appendChild(playerName);
    
    modal.appendChild(avatarSection);
    
    // Position section with region and rank badge
    const positionSection = document.createElement('div');
    positionSection.className = 'player-modal-section';
    
    const positionTitle = document.createElement('div');
    positionTitle.className = 'player-modal-section-title';
    positionTitle.textContent = 'POSITION';
    positionSection.appendChild(positionTitle);
    
    // Calculate category points and rank
    const categoryPoints = (() => {
        if (!player.tiers || !Array.isArray(player.tiers)) return 0;
        const categoryTiers = player.tiers.filter(t => {
            for (const [cat, modes] of Object.entries(categoryMappings)) {
                if (cat === category && modes.includes(t.gamemode)) return true;
            }
            return false;
        });
        return calculatePlayerPoints({tiers: categoryTiers});
    })();
    
    const allCategoryPoints = (window.allPlayers || []).map(p => {
        if (!p.tiers || !Array.isArray(p.tiers)) return 0;
        const categoryTiers = p.tiers.filter(t => {
            for (const [cat, modes] of Object.entries(categoryMappings)) {
                if (cat === category && modes.includes(t.gamemode)) return true;
            }
            return false;
        });
        return calculatePlayerPoints({tiers: categoryTiers});
    });
    
    const categoryRank = getCategoryRank(categoryPoints, allCategoryPoints);
    
    // Find player's rank in category
    const allPlayersPoints = (window.allPlayers || [])
        .map(p => ({
            name: p.name,
            points: (() => {
                if (!p.tiers || !Array.isArray(p.tiers)) return 0;
                const categoryTiers = p.tiers.filter(t => {
                    for (const [cat, modes] of Object.entries(categoryMappings)) {
                        if (cat === category && modes.includes(t.gamemode)) return true;
                    }
                    return false;
                });
                return calculatePlayerPoints({tiers: categoryTiers});
            })()
        }))
        .sort((a, b) => b.points - a.points);
    
    const playerRank = allPlayersPoints.findIndex(p => p.name === player.name) + 1;

    const positionBox = document.createElement('div');
    positionBox.className = 'player-modal-position';

    // Rank badge
    const rankBadge2 = document.createElement('div');
    rankBadge2.className = 'player-modal-position-rank';
    rankBadge2.textContent = playerRank > 0 ? playerRank : '?';
    positionBox.appendChild(rankBadge2);

    const positionInfo = document.createElement('div');
    positionInfo.className = 'player-modal-position-info';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'player-modal-position-label';
    labelDiv.textContent = `${category.toUpperCase()} CATEGORY`;
    positionInfo.appendChild(labelDiv);

    const valueDiv = document.createElement('div');
    valueDiv.className = 'player-modal-position-value';
    valueDiv.textContent = `${categoryPoints} points`;
    positionInfo.appendChild(valueDiv);

    const combatTagDiv = document.createElement('div');
    combatTagDiv.className = 'player-modal-position-tag';
    combatTagDiv.textContent = getCombatTag(categoryPoints, category);
    positionInfo.appendChild(combatTagDiv);

    positionBox.appendChild(positionInfo);

    // Region badge (far right)
    const regionBadge = document.createElement('div');
    regionBadge.className = 'player-modal-position-region';
    regionBadge.textContent = getFullRegionName(player.region) || 'Unknown';
    positionBox.appendChild(regionBadge);
    positionSection.appendChild(positionBox);
    modal.appendChild(positionSection);
    
    // Tiers section
    const tiersSection = document.createElement('div');
    tiersSection.className = 'player-modal-section';
    
    const tiersTitle = document.createElement('div');
    tiersTitle.className = 'player-modal-section-title';
    tiersTitle.textContent = 'TIERS';
    tiersSection.appendChild(tiersTitle);
    
    const tiersGrid = document.createElement('div');
    tiersGrid.className = 'player-modal-tiers';
    
    if (player.tiers && Array.isArray(player.tiers)) {
        const categoryTiers = player.tiers.filter(t => {
            for (const [cat, modes] of Object.entries(categoryMappings)) {
                if (cat === category && modes.includes(t.gamemode)) return true;
            }
            return false;
        });
        
        // Prepare tiers with metadata for sorting
        const tiersWithMetadata = categoryTiers.map(tierInfo => {
            const isRetired = Array.isArray(player.retired_modes) && player.retired_modes.includes(tierInfo.gamemode);
            const tierMatch = typeof tierInfo.tier === 'string' ? tierInfo.tier.match(/\d+/) : null;
            const tierNumber = tierMatch ? parseInt(tierMatch[0]) : (tierInfo.tier === 'Unknown' || tierInfo.tier === 'unknown' ? 0 :999);
            const peakValue = tierInfo.peak || tierInfo.tier || 'Unknown';
            
            return {
                ...tierInfo,
                tierNumber,
                isRetired,
                tierValue: tierInfo.tier,
                peakValue
            };
        });
        
        // Sort: highest tier first (tier 1 = 1, tier 2 = 2, etc), Retired and Unknown last
        tiersWithMetadata.sort((a, b) => {
            if (a.isRetired && !b.isRetired) return 1;  // Retired goes to end
            if (!a.isRetired && b.isRetired) return -1; // Retired goes to end
            if (a.tierNumber === 0) return 1;  // Unknown goes to end
            if (b.tierNumber === 0) return -1; // Unknown goes to end
            
            // First sort by tier number
            if (a.tierNumber !== b.tierNumber) {
                return a.tierNumber - b.tierNumber; // Lower tier number comes first
            }
            
            // Within the same tier, HT comes before LT
            const aIsHT = typeof a.tierValue === 'string' && a.tierValue.startsWith('HT');
            const bIsHT = typeof b.tierValue === 'string' && b.tierValue.startsWith('HT');
            if (aIsHT && !bIsHT) return -1;  // HT comes first
            if (!aIsHT && bIsHT) return 1;   // LT comes second
            return 0;
        });
        
        tiersWithMetadata.forEach(tierInfo => {
            const tierItem = document.createElement('div');
            tierItem.className = 'player-modal-tier-item';
            
            const gamemodeName = tierInfo.gamemode;
            
            const icon = document.createElement('img');
            // make modal icons behave like mode icons so tooltip + hover work
            icon.className = 'player-modal-tier-icon mode-icon';
            icon.src = gamemodeIcons[gamemodeName] || 'gamemodes/Vanilla.png';
            icon.alt = gamemodeName;
            // attach peak so the delegated tooltip will show when hovering
            icon.dataset.peak = tierInfo.peak || tierInfo.peakValue || tierInfo.tier || 'Unknown';
            tierItem.appendChild(icon);
            
            const badge = document.createElement('div');
            let badgeClass = 'player-modal-tier-badge';
            let badgeText = tierInfo.tierValue;
            
            if (tierInfo.tierNumber === 0) {
                // Unknown tier
                badgeClass += ' tier-unknown';
                badgeText = '?';
            } else if (tierInfo.isRetired) {
                // Retired tier - show the tier value (e.g., "HT1")
                badgeClass += ' tier-retired';
            } else {
                // Numbered tier (1-5)
                badgeClass += ` tier-${tierInfo.tierNumber}`;
            }
            
            badge.className = badgeClass;
            badge.textContent = badgeText;
            tierItem.appendChild(badge);
            
            tiersGrid.appendChild(tierItem);
        });
    }
    
    tiersSection.appendChild(tiersGrid);
    modal.appendChild(tiersSection);
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Show all modes/categories modal for a player
function showAllModesModal(player) {
    // Remove existing modal if present
    const existingModal = document.getElementById('player-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'player-modal';
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal-content';
    
    // Banner background
    const bannerImg = player.banner || 'anime-style-stone.jpg';
    const banner = document.createElement('div');
    banner.className = 'player-modal-banner';
    banner.style.backgroundImage = `url(${bannerImg})`;
    modal.appendChild(banner);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'player-modal-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => overlay.remove());
    modal.appendChild(closeBtn);
    
    // Avatar section
    const avatarSection = document.createElement('div');
    avatarSection.className = 'player-modal-avatar-section';
    
    const avatar = getPlayerAvatarElement(player);
    avatar.className = 'player-modal-avatar';
    avatarSection.appendChild(avatar);
    
    const playerName = document.createElement('div');
    playerName.className = 'player-modal-name';
    playerName.textContent = player.name;
    avatarSection.appendChild(playerName);
    
    modal.appendChild(avatarSection);
    
    // Show overall position at top of all-modes modal
    (function addOverallPosition() {
        const section = document.createElement('div');
        section.className = 'player-modal-section';

        // Overall rank (Everyone)
        const allPlayers = (window.allPlayers || []).map(p => ({ name: p.name, points: calculatePlayerPoints(p) })).sort((a, b) => b.points - a.points);
        const overallRank = allPlayers.findIndex(p => p.name === player.name) + 1 || '?';
        const overallPoints = calculatePlayerPoints(player);
        const box = document.createElement('div');
        box.className = 'player-modal-position';
        const rankEl = document.createElement('div');
        rankEl.className = 'player-modal-position-rank';
        rankEl.textContent = overallRank > 0 ? overallRank : '?';
        box.appendChild(rankEl);
        const info = document.createElement('div');
        info.className = 'player-modal-position-info';
        const label = document.createElement('div');
        label.className = 'player-modal-position-label';
        label.textContent = 'OVERALL';
        const value = document.createElement('div');
        value.className = 'player-modal-position-value';
        value.textContent = `${overallPoints} points`;
        info.appendChild(label);
        info.appendChild(value);
        box.appendChild(info);
        section.appendChild(box);
        modal.appendChild(section);
    })();
    
    // Categories section
    const categoriesSection = document.createElement('div');
    categoriesSection.className = 'player-modal-section';
    
    const categoriesTitle = document.createElement('div');
    categoriesTitle.className = 'player-modal-section-title';
    categoriesTitle.textContent = 'CATEGORIES';
    categoriesSection.appendChild(categoriesTitle);
    
    const categoriesGrid = document.createElement('div');
    categoriesGrid.className = 'player-modal-categories';
    
    const categoryLabels = { main: 'Main', sub: 'Sub', extra: 'Extra', bonus: 'Bonus' };
    const categories = ['main', 'sub', 'extra', 'bonus'];
    
    categories.forEach(category => {
        const categoryBox = document.createElement('div');
        categoryBox.className = 'player-modal-category-box';
        categoryBox.addEventListener('click', () => {
            showPlayerModal(player, 0, category);
        });
        categoryBox.style.cursor = 'pointer';
        
        // Calculate category points and rank
        const categoryPoints = (() => {
            if (!player.tiers || !Array.isArray(player.tiers)) return 0;
            const categoryTiers = player.tiers.filter(t => {
                for (const [cat, modes] of Object.entries(categoryMappings)) {
                    if (cat === category && modes.includes(t.gamemode)) return true;
                }
                return false;
            });
            return calculatePlayerPoints({tiers: categoryTiers});
        })();
        
        const allCategoryPoints = (window.allPlayers || []).map(p => {
            if (!p.tiers || !Array.isArray(p.tiers)) return 0;
            const categoryTiers = p.tiers.filter(t => {
                for (const [cat, modes] of Object.entries(categoryMappings)) {
                    if (cat === category && modes.includes(t.gamemode)) return true;
                }
                return false;
            });
            return calculatePlayerPoints({tiers: categoryTiers});
        });
        
        const categoryRank = getCategoryRank(categoryPoints, allCategoryPoints);
        
        // Find player's rank in category
        const allPlayersPoints = (window.allPlayers || [])
            .map(p => ({
                name: p.name,
                points: (() => {
                    if (!p.tiers || !Array.isArray(p.tiers)) return 0;
                    const categoryTiers = p.tiers.filter(t => {
                        for (const [cat, modes] of Object.entries(categoryMappings)) {
                            if (cat === category && modes.includes(t.gamemode)) return true;
                        }
                        return false;
                    });
                    return calculatePlayerPoints({tiers: categoryTiers});
                })()
            }))
            .sort((a, b) => b.points - a.points);
        
        const playerRank = allPlayersPoints.findIndex(p => p.name === player.name) + 1;
        
        // Rank badge
        const rankBadge = document.createElement('div');
        rankBadge.className = 'player-modal-category-rank';
        rankBadge.textContent = playerRank > 0 ? playerRank : '?';
        categoryBox.appendChild(rankBadge);
        
        // Category info
        const categoryInfo = document.createElement('div');
        categoryInfo.className = 'player-modal-category-info';
        
        const categoryNameDiv = document.createElement('div');
        categoryNameDiv.className = 'player-modal-category-label';
        categoryNameDiv.textContent = categoryLabels[category];
        categoryInfo.appendChild(categoryNameDiv);
        
        const pointsDiv = document.createElement('div');
        pointsDiv.className = 'player-modal-category-points';
        pointsDiv.textContent = `${categoryPoints} pts`;
        categoryInfo.appendChild(pointsDiv);
        
        const tagDiv = document.createElement('div');
        tagDiv.className = 'player-modal-category-tag';
        tagDiv.textContent = getCombatTag(categoryPoints, category);
        categoryInfo.appendChild(tagDiv);
        
        categoryBox.appendChild(categoryInfo);
        categoriesGrid.appendChild(categoryBox);
    });
    
    categoriesSection.appendChild(categoriesGrid);
    modal.appendChild(categoriesSection);
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function renderDefaultTab() {
    switchMainTab('all-modes');
}

// ========================================
// LOGIN SYSTEM
// ========================================

const API_BASE = 'https://ultratiers.onrender.com';

// Chat / Friends API helpers
async function sendFriendRequestAPI(from_uuid, to_name) {
    return fetch('/friend/request', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ from_uuid, to_name })
    }).then(r => r.json());
}

async function getIncomingRequestsAPI(uuid) {
    return fetch('/friend/requests/' + encodeURIComponent(uuid)).then(r => r.json());
}

async function acceptFriendAPI(requestId) {
    return fetch('/friend/accept', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requestId }) }).then(r=>r.json());
}

async function getFriendsAPI(uuid) {
    return fetch('/friends/' + encodeURIComponent(uuid)).then(r=>r.json());
}

async function removeFriendAPI(uuid, friend_uuid) {
    return fetch('/friend/remove', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ uuid, friend_uuid }) }).then(r=>r.json());
}

async function sendMessageAPI(from_uuid, to_uuid, message) {
    return fetch('/chat/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ from_uuid, to_uuid, message }) }).then(r=>r.json());
}

async function getChatHistoryAPI(user, friend) {
    return fetch('/chat/history?user=' + encodeURIComponent(user) + '&friend=' + encodeURIComponent(friend)).then(r=>r.json());
}

// Outgoing / decline / cancel helpers
async function getOutgoingRequestsAPI(uuid) {
    return fetch('/friend/requests/outgoing/' + encodeURIComponent(uuid)).then(r => r.json());
}

async function declineFriendAPI(requestId) {
    return fetch('/friend/decline', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requestId }) }).then(r=>r.json());
}

async function cancelRequestAPI(requestId) {
    return fetch('/friend/cancel', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requestId }) }).then(r=>r.json());
}

// Small chat UI renderer is called from handleHash() when hash is #ultratierchatting
function renderChatPage() {
    const user = getCurrentUser();
    const mainContainer = document.querySelector('.container');
    // remove previous app if present
    const existing = document.getElementById('ultratier-chat-app');
    if (existing) existing.remove();

    // ensure main container is hidden
    if (mainContainer) mainContainer.style.display = 'none';

    const app = document.createElement('div');
    app.id = 'ultratier-chat-app';
    app.style.padding = '0';
    app.style.color = '#fff';
    app.style.minHeight = '100vh';
    app.style.boxSizing = 'border-box';

    if (!user) {
        // show prominent sign-in CTA when not logged in
        app.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;font-family:Arial, sans-serif;">
                <div style="text-align:center;max-width:420px;">
                    <h2 style="margin-bottom:12px;">Sign in to use UltraTiers Chat</h2>
                    <p style="color:#bcd; margin-bottom:18px;">You need an account to send friend requests and chat.</p>
                    <button id="open-login-from-chat" style="background:#128C7E;color:#fff;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;">Sign In</button>
                    <div style="margin-top:12px;color:#889">Or go back to the site: <a href="#ultratierlist" style="color:#25d366">UltraTiers List</a></div>
                </div>
            </div>
        `;
        document.body.appendChild(app);
        const btn = document.getElementById('open-login-from-chat');
        if (btn) btn.addEventListener('click', () => { openLoginModal(); });
        return;
    }

    app.innerHTML = `
        <div class="chat-navbar">
            <div class="logo-section chat-logo">
                <img class="logo" src="UltraLogo.png" alt="UltraTiers" />
                <h1>ULTRATIERS</h1>
            </div>
        </div>
        <div class="chat-app">
            <aside class="chat-sidebar">
                <div class="friend-add">
                    <input id="friend-name-input" placeholder="Minecraft name" />
                    <button id="send-request-btn" class="add-btn">+</button>
                </div>
                <div class="sidebar-section">
                    <h4>Incoming</h4>
                    <div id="incoming-list" class="incoming-list"></div>
                </div>
                <div class="sidebar-section">
                    <h4>Outgoing</h4>
                    <div id="outgoing-list" class="outgoing-list"></div>
                </div>
                <div class="sidebar-section">
                    <h4>Friends</h4>
                    <div id="friends-list-items" class="friends-list-items"></div>
                </div>
            </aside>
            <section class="chat-window">
                <header class="chat-header" id="chat-with">No conversation selected</header>
                <div class="chat-body" id="chat-messages"></div>
                <div class="chat-input-area">
                    <input id="chat-input" placeholder="Type a message" />
                    <button id="send-chat-btn" class="send-btn">Send</button>
                </div>
            </section>
        </div>
    `;

    // Re-use the original header but adjust it for chat mode (remove search/profile, add back button)
    try {
        const mainHeader = document.querySelector('.header');
        if (mainHeader) {
            // save original header markup so we can restore it when leaving chat
            if (!mainHeader.dataset.savedInner) mainHeader.dataset.savedInner = mainHeader.innerHTML;

            // remove searchbar if present
            const searchRow = mainHeader.querySelector('.searchbar-row');
            if (searchRow) searchRow.remove();

            // remove profile area from header in chat mode
            const profileSection = mainHeader.querySelector('#profile-section');
            if (profileSection) profileSection.remove();

            // adjust testers/friends button to act as 'back to list'
            const btn = mainHeader.querySelector('#testers-icon-btn, #friends-link-btn');
            if (btn) {
                btn.id = 'chat-back-btn';
                btn.title = 'Back to Tierlist';
                btn.innerHTML = '<i class="fas fa-list"></i>';
                btn.addEventListener('click', () => { location.hash = '#ultratierlist'; });
            }

            // ensure header stays visible and doesn't overlap content (sticky)
            mainHeader.style.position = 'sticky';
            mainHeader.style.top = '0';
            mainHeader.style.zIndex = '9999';
        }
    } catch (e) {
        console.warn('Header adjust failed', e);
    }

    document.body.appendChild(app);

    // Global click handler: close any open dropdown menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-menu') && !e.target.closest('.three-dots-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(d => d.style.display = 'none');
        }
    });

    // friend name lookup set for quick client-side checks
    let friendNameSet = new Set();

    // make navbar logo/title navigate back to the tierlist
    try {
        const chatLogo = document.querySelector('.chat-navbar .chat-logo');
        if (chatLogo) chatLogo.addEventListener('click', () => { location.hash = '#ultratierlist'; });
    } catch (e) { /* ignore */ }

    // show placeholder when no conversation selected and disable input
    const msgEl = document.getElementById('chat-messages');
    function showNoConversation() {
        msgEl.innerHTML = '<div class="no-convo">Select a friend on the left to start chatting</div>';
        const chatInputEl = document.getElementById('chat-input');
        const sendBtnEl = document.getElementById('send-chat-btn');
        if (chatInputEl) { chatInputEl.disabled = true; chatInputEl.value = ''; }
        if (sendBtnEl) { sendBtnEl.disabled = true; sendBtnEl.classList.remove('active'); }
    }

    showNoConversation();

    document.getElementById('send-request-btn').addEventListener('click', async () => {
        const target = document.getElementById('friend-name-input').value.trim();
        const btn = document.getElementById('send-request-btn');
        if (!target) return alert('Enter a name');
        if (btn && btn.disabled) return alert('Cannot send request to this user');
        const res = await sendFriendRequestAPI(user.uuid, target);
        if (res?.error) return alert(res.error || 'Failed');
        alert('Request sent');
        document.getElementById('friend-name-input').value = '';
        loadInbox();
    });

    // Add a small hint area and live-input check to prevent sending requests to existing friends
    try {
        const friendAdd = document.querySelector('.friend-add');
        if (friendAdd) {
            const hint = document.createElement('div');
            hint.id = 'friend-add-hint';
            hint.style.fontSize = '12px';
            hint.style.color = 'var(--text-secondary)';
            hint.style.marginTop = '6px';
            friendAdd.appendChild(hint);

            const friendInput = document.getElementById('friend-name-input');
            function checkFriendTarget() {
                const target = friendInput ? friendInput.value.trim().toLowerCase() : '';
                const btn = document.getElementById('send-request-btn');
                const hintEl = document.getElementById('friend-add-hint');
                if (!btn || !hintEl) return;
                if (!target) { btn.disabled = false; hintEl.textContent = ''; return; }
                if (user && (user.name || '').toLowerCase() === target) { btn.disabled = true; hintEl.textContent = 'You cannot friend yourself.'; return; }
                if (friendNameSet.has(target)) { btn.disabled = true; hintEl.textContent = 'Already in your friends list.'; return; }
                btn.disabled = false; hintEl.textContent = '';
            }

            friendInput.addEventListener('input', checkFriendTarget);
        }
    } catch (e) { /* ignore */ }

    async function loadInbox() {
        const inc = await getIncomingRequestsAPI(user.uuid);
        const container = document.getElementById('incoming-list');
        container.innerHTML = '';
        const valid = (inc || []).filter(req => req && (req.from_uuid || req.from_name));
        if (!valid || valid.length === 0) {
            container.innerHTML = '<div class="no-requests">No friend requests pending</div>';
            return;
        }

        valid.forEach(req => {
            const el = document.createElement('div');
            el.className = 'incoming-row';

            const meta = document.createElement('div');
            meta.className = 'meta incoming-meta';
            meta.style.display = 'flex';
            meta.style.alignItems = 'center';
            meta.style.gap = '10px';

            const avatar = document.createElement('img');
            avatar.className = 'avatar';
            avatar.src = req.from_uuid ? `https://mc-heads.net/avatar/${req.from_uuid}/64` : 'UltraLogo.png';
            avatar.alt = req.from_name || req.from_uuid || '';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.borderRadius = '50%';

            const nameWrap = document.createElement('div');
            nameWrap.style.flex = '1';
            nameWrap.innerHTML = `<strong>${req.from_name || req.from_uuid}</strong>`;

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '8px';

            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'accept-icon';
            acceptBtn.title = 'Accept';
            acceptBtn.dataset.id = req.id;
            acceptBtn.innerHTML = '✔';

            const declineBtn = document.createElement('button');
            declineBtn.className = 'decline-icon';
            declineBtn.title = 'Decline';
            declineBtn.dataset.id = req.id;
            declineBtn.innerHTML = '✖';

            meta.appendChild(avatar);
            meta.appendChild(nameWrap);

            actions.appendChild(acceptBtn);
            actions.appendChild(declineBtn);

            el.appendChild(meta);
            el.appendChild(actions);
            container.appendChild(el);

            acceptBtn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const res = await acceptFriendAPI(id);
                if (res?.success) { loadFriends(); loadInbox(); loadOutgoing(); }
            });

            declineBtn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const res = await declineFriendAPI(id);
                if (res?.success) { loadInbox(); }
            });
        });
    }

    async function loadOutgoing() {
        const out = await getOutgoingRequestsAPI(user.uuid);
        const container = document.getElementById('outgoing-list');
        container.innerHTML = '';
        if (!out || out.length === 0) {
            container.innerHTML = '<div class="no-requests">No friend requests send</div>';
            return;
        }
        out.forEach(r => {
            const el = document.createElement('div');
            el.className = 'outgoing-row';
            const meta = document.createElement('div');
            meta.className = 'meta outgoing-meta';
            meta.style.display = 'flex';
            meta.style.alignItems = 'center';
            meta.style.gap = '10px';

            const avatar = document.createElement('img');
            avatar.className = 'avatar';
            avatar.src = r.to_uuid ? `https://mc-heads.net/avatar/${r.to_uuid}/64` : 'UltraLogo.png';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.borderRadius = '50%';

            const nameWrap = document.createElement('div');
            nameWrap.style.flex = '1';
            nameWrap.innerHTML = `<strong>${r.to_name || r.to_uuid}</strong>`;

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-icon';
            cancelBtn.title = 'Cancel request';
            cancelBtn.dataset.id = r.id;
            cancelBtn.innerHTML = '✖';

            meta.appendChild(avatar);
            meta.appendChild(nameWrap);
            el.appendChild(meta);
            el.appendChild(cancelBtn);
            container.appendChild(el);

            cancelBtn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (!confirm('Cancel friend request?')) return;
                const res = await cancelRequestAPI(id);
                if (res?.success) loadOutgoing();
            });
        });
    }

    async function loadFriends() {
        const friends = await getFriendsAPI(user.uuid);
        const container = document.getElementById('friends-list-items');
        container.innerHTML = '';
        // update client-side lookup set
        try { friendNameSet.clear(); } catch (e) { friendNameSet = new Set(); }
        (friends || []).forEach(f => {
            try { if (f && f.name) friendNameSet.add((f.name || '').toLowerCase()); } catch(e) {}
            const el = document.createElement('div');
            el.className = 'friend-row';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'space-between';

            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.alignItems = 'center';
            left.style.gap = '10px';

            // build meta with avatar + textual meta to avoid duplicate empty profile elements
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.style.display = 'flex';
            meta.style.alignItems = 'center';
            meta.style.gap = '10px';

            const avatar = document.createElement('img');
            avatar.className = 'avatar';
            avatar.src = f.friend_uuid ? `https://mc-heads.net/avatar/${f.friend_uuid}/64` : 'UltraLogo.png';
            avatar.alt = f.name || f.friend_uuid;
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.borderRadius = '50%';

            const textWrap = document.createElement('div');
            textWrap.style.display = 'flex';
            textWrap.style.flexDirection = 'column';

            const nameEl = document.createElement('span');
            nameEl.className = 'name';
            nameEl.textContent = f.name || f.friend_uuid;
            const sub = document.createElement('span');
            sub.className = 'sub';
            sub.textContent = '';

            textWrap.appendChild(nameEl);
            textWrap.appendChild(sub);

            meta.appendChild(avatar);
            meta.appendChild(textWrap);

            left.appendChild(meta);
            // clicking the left area opens the conversation
            left.style.cursor = 'pointer';
            // left area no longer needs its own listener; whole row will be clickable

            const actions = document.createElement('div');
            actions.style.position = 'relative';

            const menuBtn = document.createElement('button');
            menuBtn.className = 'three-dots-btn';
            menuBtn.textContent = '⋯';
            menuBtn.title = 'Actions';

            // show confirm modal (matching site modal styles) when actions or menu button clicked
            function openFriendActionsModal() {
                const overlay = document.createElement('div');
                overlay.className = 'confirm-modal-overlay';

                const dialog = document.createElement('div');
                dialog.className = 'confirm-modal';

                const title = document.createElement('h3');
                title.textContent = 'Manage Friend';
                title.style.margin = '0 0 8px 0';
                title.style.color = 'var(--accent)';

                const body = document.createElement('div');
                body.textContent = 'Manage friend ' + (f.name || f.friend_uuid);
                body.style.marginBottom = '12px';

                const btnRow = document.createElement('div');
                btnRow.style.display = 'flex';
                btnRow.style.justifyContent = 'flex-end';
                btnRow.style.gap = '8px';

                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'modal-cancel-btn';
                cancelBtn.textContent = 'Cancel';

                const removeBtn = document.createElement('button');
                removeBtn.className = 'modal-remove-btn';
                removeBtn.textContent = 'Remove';

                btnRow.appendChild(cancelBtn);
                btnRow.appendChild(removeBtn);

                dialog.appendChild(title);
                dialog.appendChild(body);
                dialog.appendChild(btnRow);
                overlay.appendChild(dialog);
                document.body.appendChild(overlay);

                // prevent clicks inside dialog from closing
                dialog.addEventListener('click', (ev) => ev.stopPropagation());
                overlay.addEventListener('click', () => overlay.remove());
                cancelBtn.addEventListener('click', () => overlay.remove());

                removeBtn.addEventListener('click', async (ev) => {
                    ev.stopPropagation();
                    if (!confirm('Remove friend ' + (f.name || f.friend_uuid) + '?')) return;
                    const res = await removeFriendAPI(user.uuid, f.friend_uuid);
                    if (res?.success) {
                        overlay.remove();
                        loadFriends();
                        if (activeFriend && (activeFriend.friend_uuid === f.friend_uuid || activeFriend.uuid === f.friend_uuid)) {
                            activeFriend = null;
                            showNoConversation();
                        }
                    } else {
                        alert(res?.error || 'Failed to remove');
                    }
                });
            }

            menuBtn.addEventListener('click', (e) => { e.stopPropagation(); openFriendActionsModal(); });
            actions.addEventListener('click', (e) => { e.stopPropagation(); openFriendActionsModal(); });

            actions.appendChild(menuBtn);

            el.appendChild(left);
            el.appendChild(actions);

            // clicking the entire row opens the chat (but ignore clicks on the menu or dropdown)
            el.addEventListener('click', (e) => {
                if (e.target.closest('.three-dots-btn') || e.target.closest('.dropdown-menu')) return;
                selectFriend(f);
            });

            container.appendChild(el);
        });

        // show placeholder when user has no friends
        if (!friends || (Array.isArray(friends) && friends.length === 0)) {
            container.innerHTML = '<div class="no-friends">No friends added</div>';
        }
    }

    let activeFriend = null;
    async function selectFriend(f) {
        activeFriend = f;
        document.getElementById('chat-with').textContent = 'Chat with ' + (f.name || f.friend_uuid);
        // enable input when a friend is selected
        const chatInputEl = document.getElementById('chat-input');
        const sendBtnEl = document.getElementById('send-chat-btn');
        if (chatInputEl) chatInputEl.disabled = false;
        if (sendBtnEl) sendBtnEl.disabled = false;
        await loadHistory();
    }

    async function loadHistory() {
        if (!activeFriend) return;
        const msgEl = document.getElementById('chat-messages');
        const history = await getChatHistoryAPI(user.uuid, activeFriend.friend_uuid || activeFriend.uuid);
        msgEl.innerHTML = '';
        (history || []).forEach(m => {
            const bubble = document.createElement('div');
            const isMe = (m.from_uuid === user.uuid);
            bubble.className = 'msg ' + (isMe ? 'me' : 'them');
            const text = document.createElement('div');
            text.className = 'bubble-text';
            // simple escape to avoid HTML injection
            const safe = String(m.message).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            text.innerHTML = safe;
            const time = document.createElement('small');
            time.textContent = new Date(m.created_at).toLocaleTimeString();
            bubble.appendChild(text);
            bubble.appendChild(time);
            msgEl.appendChild(bubble);
        });
        msgEl.scrollTop = msgEl.scrollHeight;
    }

    document.getElementById('send-chat-btn').addEventListener('click', async () => {
        const txt = document.getElementById('chat-input').value.trim();
        if (!txt || !activeFriend) return alert('Select friend and type a message');
        await sendMessageAPI(user.uuid, activeFriend.friend_uuid || activeFriend.uuid, txt);
        document.getElementById('chat-input').value = '';
        await loadHistory();
    });

    // Enter to send (without Shift)
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('send-chat-btn').click();
        }
    });

    // Floating send icon behavior: show active when input has content
    const sendBtn = document.getElementById('send-chat-btn');
    function updateSendBtn() {
        if (!chatInput) return;
        const has = chatInput.value.trim().length > 0;
        if (has) {
            sendBtn.classList.add('active');
        } else {
            sendBtn.classList.remove('active');
        }
    }
    chatInput.addEventListener('input', updateSendBtn);
    updateSendBtn();

    loadInbox();
    loadFriends();
    loadOutgoing();
    setInterval(() => { if (document.getElementById('ultratier-chat-app')) { loadInbox(); loadFriends(); loadOutgoing(); if (activeFriend) loadHistory(); } }, 5000);
}

function initLoginSystem() {
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('ultratiers_user');
    if (loggedInUser) {
        showUserProfile(JSON.parse(loggedInUser));
    } else {
        showLoginPrompt();
    }

    // Login prompt click
    const loginPrompt = document.getElementById('login-prompt');
    if (loginPrompt) {
        loginPrompt.addEventListener('click', openLoginModal);
    }

    // Close login modal
    const closeLoginModalBtn = document.getElementById('close-login-modal');
    if (closeLoginModalBtn) {
        closeLoginModalBtn.addEventListener('click', closeLoginModal);
    }

    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeLoginModal();
        });
    }

    // Submit login
    const submitBtn = document.getElementById('submit-login');
    if (submitBtn) {
        submitBtn.addEventListener('click', handleLogin);
    }

    // Enter key to submit
    const igninput = document.getElementById('login-ign');
    const codeInput = document.getElementById('login-code');
    if (igninput) igninput.addEventListener('keypress', (e) => e.key === 'Enter' && handleLogin());
    if (codeInput) codeInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleLogin());

    // Edit profile
    const editBtn = document.getElementById('profile-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', openEditModal);
    }

    // Close edit modal
    const closeEditBtn = document.getElementById('close-edit-modal');
    const closeEditBtnBottom = document.getElementById('close-edit-btn');
    if (closeEditBtn) closeEditBtn.addEventListener('click', closeEditModal);
    if (closeEditBtnBottom) closeEditBtnBottom.addEventListener('click', closeEditModal);

    // Save profile changes
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfileChanges);
    }

    const editModal = document.getElementById('edit-profile-modal');
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModal();
        });
    }

    // Logout
    const logoutBtn = document.getElementById('profile-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function showLoginPrompt() {
    const prompt = document.getElementById('login-prompt');
    const profile = document.getElementById('user-profile');
    if (prompt) prompt.style.display = 'flex';
    if (profile) profile.style.display = 'none';
}

function showUserProfile(user) {
    const prompt = document.getElementById('login-prompt');
    const profile = document.getElementById('user-profile');
    if (prompt) prompt.style.display = 'none';
    if (profile) {
        profile.style.display = 'block';
        const ignEl = document.getElementById('profile-ign');
        if (ignEl) ignEl.textContent = user.ign;
    }
}

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => document.getElementById('login-ign').focus(), 100);
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'none';
    document.getElementById('login-ign').value = '';
    document.getElementById('login-code').value = '';
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.style.display = 'none';
}

async function handleLogin() {
    const ign = document.getElementById('login-ign').value.trim();
    const code = document.getElementById('login-code').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!ign || !code) {
        if (errorEl) {
            errorEl.textContent = 'Please enter both IGN and code';
            errorEl.style.display = 'block';
        }
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ign, code })
        });

        const data = await response.json();

        if (!response.ok) {
            if (errorEl) {
                errorEl.textContent = data.error || 'Invalid login code';
                errorEl.style.display = 'block';
            }
            return;
        }

        // Login successful
        const user = { ign: data.ign, uuid: data.uuid };
        localStorage.setItem('ultratiers_user', JSON.stringify(user));
        closeLoginModal();
        showUserProfile(user);
    } catch (err) {
        console.error('Login error:', err);
        if (errorEl) {
            errorEl.textContent = 'An error occurred. Please try again.';
            errorEl.style.display = 'block';
        }
    }
}

// Available banner options
const AVAILABLE_BANNERS = [
    { name: 'Stone', file: 'anime-style-stone.jpg' },
    { name: 'Forest', file: 'anime-style-forest.jpg' },
    { name: 'Clouds', file: 'anime-style-clouds.jpg' },
    { name: 'Planet', file: 'anime-style-planet.jpg' },
    { name: 'Pumpkin', file: 'anime-style-pumpkin.jpg' },
    { name: 'Snow', file: 'anime-style-snow.jpg' }
];

function openEditModal() {
    const user = localStorage.getItem('ultratiers_user');
    if (!user) return;

    const userData = JSON.parse(user);
    
    // Populate banner grid
    const bannerGrid = document.getElementById('banner-grid');
    if (bannerGrid) {
        bannerGrid.innerHTML = '';
        AVAILABLE_BANNERS.forEach(banner => {
            const bannerOption = document.createElement('div');
            bannerOption.className = 'banner-option';
            bannerOption.style.backgroundImage = `url(${banner.file})`;
            bannerOption.dataset.banner = banner.file;
            
            const label = document.createElement('div');
            label.className = 'banner-label';
            label.textContent = banner.name;
            bannerOption.appendChild(label);
            
            bannerOption.addEventListener('click', () => {
                document.querySelectorAll('.banner-option').forEach(el => {
                    el.classList.remove('selected');
                });
                bannerOption.classList.add('selected');
            });
            
            bannerGrid.appendChild(bannerOption);
        });
    }
    
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.style.display = 'none';
}

async function saveProfileChanges() {
    const user = localStorage.getItem('ultratiers_user');
    if (!user) return;

    const userData = JSON.parse(user);
    const selectedBanner = document.querySelector('.banner-option.selected');
    
    if (!selectedBanner) {
        alert('Please select a banner');
        return;
    }

    const bannerFile = selectedBanner.dataset.banner;

    try {
        // Send update to backend
        const response = await fetch(`${API_BASE}/profile/banner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uuid: userData.uuid,
                banner: bannerFile
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Failed to save changes');
            return;
        }

        // Update local storage with new banner
        userData.banner = bannerFile;
        localStorage.setItem('ultratiers_user', JSON.stringify(userData));
        
        // Update player object in memory with new banner
        if (window.playerMap && window.playerMap[userData.ign]) {
            window.playerMap[userData.ign].banner = bannerFile;
        }
        if (window.allPlayers) {
            const playerIndex = window.allPlayers.findIndex(p => p.uuid === userData.uuid);
            if (playerIndex !== -1) {
                window.allPlayers[playerIndex].banner = bannerFile;
            }
        }
        
        closeEditModal();
        alert('Profile updated successfully!');
    } catch (err) {
        console.error('Save profile error:', err);
        alert('An error occurred. Please try again.');
    }
}

function handleLogout() {
    localStorage.removeItem('ultratiers_user');
    showLoginPrompt();
}