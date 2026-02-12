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
    if (allPoints.length === 0) return 'Rookie';
    
    // Sort points to calculate percentiles
    const sortedPoints = [...allPoints].sort((a, b) => b - a);
    const playerIndex = sortedPoints.indexOf(points);
    const percentile = (playerIndex / sortedPoints.length) * 100;
    
    // Ranking thresholds: top 20% = Master, top 60% = Advanced, rest = Rookie
    if (percentile <= 20) return 'Master';
    if (percentile <= 60) return 'Advanced';
    return 'Rookie';
}

// Get rank styling color
function getRankColor(rank) {
    switch(rank) {
        case 'Master': return '#fbbf24'; // Gold
        case 'Advanced': return '#60a5fa'; // Blue
        case 'Rookie': return '#34d399'; // Green
        default: return '#9ca3af'; // Gray
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
        avatar.style.width = '64px';
        avatar.style.height = '64px';
        avatar.className = 'rank-avatar';
        rankPlayerSection.appendChild(avatar);
        
        // Player info section
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info-section';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'player-name';
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
            
            // Parse tier value to get number for sorting
            let tierNumber = 0;
            if (typeof tierValue === 'string') {
                const match = tierValue.match(/\d+/);
                tierNumber = match ? parseInt(match[0]) : 0;
            }
            
            return { gamemode, tierValue, tierNumber };
        });
        
        // Sort: highest tier first (tier 1 = 1, tier 2 = 2, etc), Unknown last (tier 0)
        modesWithTiers.sort((a, b) => {
            if (a.tierNumber === 0) return 1;  // Unknown goes to end
            if (b.tierNumber === 0) return -1; // Unknown goes to end
            return a.tierNumber - b.tierNumber; // Lower tier number comes first
        });
        
        // Render sorted modes
        modesWithTiers.forEach(({ gamemode, tierValue, tierNumber }) => {
            const modeItem = document.createElement('div');
            modeItem.className = 'mode-item';
            
            const icon = document.createElement('img');
            icon.className = 'mode-icon';
            icon.src = gamemodeIcons[gamemode] || 'gamemodes/Vanilla.png';
            icon.alt = gamemode;
            icon.title = gamemode;
            
            const tierBadge = document.createElement('div');
            tierBadge.className = `tier-badge-rounded ${tierNumber > 0 ? tierColors[tierNumber] : 'tier-unknown'}`;
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
            const card = createTierCard(i, []);
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
        const card = createTierCard(tierInfo.tier, tierInfo.players);
        container.appendChild(card);
    });
}

function createTierCard(tierNumber, players) {
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
            if (playerName.startsWith('HT')) {
                tierPrefix = 'HT';
                indicator = '+'; // + for HT (high tier)
            } else if (playerName.startsWith('LT')) {
                tierPrefix = 'LT';
                indicator = '-'; // - for LT (low tier)
            }
            
            const rank = document.createElement('div');
            rank.className = 'player-rank';
            const icon = tierPrefix === 'HT' ? '<i class="fa-solid fa-angles-up"></i>' : '<i class="fa-solid fa-angle-up"></i>';
            rank.innerHTML = `${indicator}<div>${icon}</div>`;
            
            // Get player object for MC skin
            const playerObj = window.playerMap[playerName] || { name: playerName };
            const avatar = getPlayerAvatarElement(playerObj);
            avatar.style.width = '32px';
            avatar.style.height = '32px';
            avatar.style.minWidth = '32px';
            
            const info = document.createElement('div');
            info.className = 'player-info';
            
            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = playerName;
            
            info.appendChild(name);
            
            item.appendChild(rank);
            item.appendChild(avatar);
            item.appendChild(info);
            
            // Add click handler to open player modal
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                showPlayerModal(playerObj, tierNumber);
            });
            
            list.appendChild(item);
        });
        
        card.appendChild(list);
    }
    
    return card;
}

function showPlayerModal(player, tierNumber) {
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
    
    // Player header with avatar
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const avatar = getPlayerAvatarElement(player);
    avatar.style.width = '80px';
    avatar.style.height = '80px';
    avatar.style.borderRadius = '8px';
    
    const playerInfo = document.createElement('div');
    playerInfo.className = 'modal-player-info';
    playerInfo.innerHTML = `
        <h2>${player.name}</h2>
        <p><strong>UUID:</strong> ${player.uuid || 'N/A'}</p>
        <p><strong>Region:</strong> ${player.region || 'Unknown'}</p>
    `;
    
    header.appendChild(avatar);
    header.appendChild(playerInfo);
    modal.appendChild(header);
    
    // Player tiers
    const tiersSection = document.createElement('div');
    tiersSection.className = 'modal-section';
    tiersSection.innerHTML = '<h3>Tiers</h3>';
    
    const tiersList = document.createElement('div');
    tiersList.className = 'modal-tiers-list';
    
    if (player.tiers && Array.isArray(player.tiers)) {
        player.tiers.forEach(tierInfo => {
            const tierItem = document.createElement('div');
            tierItem.className = 'modal-tier-item';
            tierItem.innerHTML = `
                <span class="tier-name">${tierInfo.gamemode}</span>
                <span class="tier-badge">${tierInfo.tier}</span>
            `;
            tiersList.appendChild(tierItem);
        });
    }
    
    tiersSection.appendChild(tiersList);
    modal.appendChild(tiersSection);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => overlay.remove());
    modal.appendChild(closeBtn);
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function renderDefaultTab() {
    switchMainTab('main');
}
