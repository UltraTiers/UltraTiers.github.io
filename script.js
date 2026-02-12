// Point system mapping
const tierPointsMap = { 
    'LT5': 1, 'HT5': 2, 
    'LT4': 4, 'HT4': 6, 
    'LT3': 9, 'HT3': 12, 
    'LT2': 16, 'HT2': 20, 
    'LT1': 25, 'HT1': 30 
};

// Calculate points for a player
function calculatePlayerPoints(player) {
    if (!Array.isArray(player.tiers)) return 0;
    
    return player.tiers.reduce((sum, tierInfo) => {
        const tierValue = tierInfo.tier;
        return sum + (tierPointsMap[tierValue] || 0);
    }, 0);
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
        
        // Create category results for each player
        const categories = ['main', 'sub', 'extra', 'bonus'];
        const categoryLabels = { main: 'Main', sub: 'Sub', extra: 'Extra', bonus: 'Bonus' };
        
        const resultsHTML = results.map(player => {
            const categoryResults = categories.map(category => `
                <div class="search-result-item" data-player-name="${player.name}" data-category="${category}">
                    <img src="https://mc-heads.net/avatar/${player.uuid}/32" alt="${player.name}" class="search-result-avatar">
                    <div class="search-result-info">
                        <div class="search-result-name">${player.name}</div>
                        <div class="search-result-category">${categoryLabels[category]}</div>
                    </div>
                </div>
            `).join('');
            return categoryResults;
        }).join('');
        
        searchDropdown.innerHTML = resultsHTML;
        searchDropdown.style.display = 'block';
        
        // Add click handlers to result items
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const playerName = this.getAttribute('data-player-name');
                const category = this.getAttribute('data-category');
                const player = window.playerMap[playerName];
                if (player) {
                    showPlayerModal(player, 0, category);
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
    await fetchAndOrganizePlayers();
    initLoginSystem();
    initSearchSystem();
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

    // Setup mode tabs for the category
    setupModeTabsForCategory(tabName);
    
    // Click the "All" button (first button) which shows category overall
    const modeButtons = document.querySelectorAll(`#${tabName}-tab .mode-tab-btn`);
    if (modeButtons.length > 0) {
        modeButtons[0].click();
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
                
                // Parse tier value to get number
                let tierNumber = 0;
                if (typeof tierValue === 'string') {
                    const match = tierValue.match(/\d+/);
                    tierNumber = match ? parseInt(match[0]) : 0;
                }
                
                const tierBadge = document.createElement('div');
                tierBadge.className = `tier-badge-small ${tierNumber > 0 ? tierColors[tierNumber] : 'tier-unknown'}`;
                tierBadge.title = gamemode;
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
        
        // Calculate category rank
        const categoryRank = getCategoryRank(player.categoryPoints, allCategoryPoints);
        const rankColor = getRankColor(categoryRank);
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'player-title';
        titleDiv.innerHTML = `<span style="color: ${rankColor}; font-weight: bold;">${categoryRank}</span> • ${player.categoryPoints} points`;
        
        playerInfo.appendChild(nameDiv);
        playerInfo.appendChild(titleDiv);
        
        // Region section
        const regionSection = document.createElement('div');
        regionSection.className = 'region-section';
        regionSection.textContent = player.region || 'Unknown';
        
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
            const isRetired = Array.isArray(player.retired_modes) && player.retired_modes.includes(gamemode);
            
            // Parse tier value to get number for sorting
            let tierNumber = 0;
            if (typeof tierValue === 'string') {
                const match = tierValue.match(/\d+/);
                tierNumber = match ? parseInt(match[0]) : 0;
            }
            
            return { gamemode, tierValue, tierNumber, isRetired };
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
        modesWithTiers.forEach(({ gamemode, tierValue, tierNumber, isRetired }) => {
            const modeItem = document.createElement('div');
            modeItem.className = `mode-item${isRetired ? ' retired-tier' : ''}`;
            
            const icon = document.createElement('img');
            icon.className = 'mode-icon';
            icon.src = gamemodeIcons[gamemode] || 'gamemodes/Vanilla.png';
            icon.alt = gamemode;
            icon.title = gamemode;
            
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
    
    positionBox.appendChild(positionInfo);
    
    // Region badge (far right)
    const regionBadge = document.createElement('div');
    regionBadge.className = 'player-modal-position-region';
    regionBadge.textContent = player.region || 'Unknown';
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
            
            return {
                ...tierInfo,
                tierNumber,
                isRetired,
                tierValue: tierInfo.tier
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
            icon.className = 'player-modal-tier-icon';
            icon.src = gamemodeIcons[gamemodeName] || 'gamemodes/Vanilla.png';
            icon.alt = gamemodeName;
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

function renderDefaultTab() {
    switchMainTab('main');
}

// ========================================
// LOGIN SYSTEM
// ========================================

const API_BASE = 'https://ultratiers.onrender.com';

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