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

// Initialize
document.addEventListener('DOMContentLoaded', async function () {
    await fetchAndOrganizePlayers();
    initLoginSystem();
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
    
    // Banner with anime background
    const bannerImg = player.banner || 'anime-style-stone.jpg';
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.style.backgroundImage = `url(${bannerImg})`;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
    header.style.height = '200px';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'center';
    header.style.position = 'relative';
    
    // Dark overlay on background
    const overlay2 = document.createElement('div');
    overlay2.style.position = 'absolute';
    overlay2.style.inset = '0';
    overlay2.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)';
    header.appendChild(overlay2);
    
    // Centered avatar
    const avatar = getPlayerAvatarElement(player);
    avatar.style.width = '100px';
    avatar.style.height = '100px';
    avatar.style.borderRadius = '12px';
    avatar.style.border = '4px solid rgba(255,255,255,0.95)';
    avatar.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
    avatar.style.position = 'relative';
    avatar.style.zIndex = '2';
    header.appendChild(avatar);
    
    // Player title
    const playerTitle = document.createElement('div');
    playerTitle.style.position = 'absolute';
    playerTitle.style.bottom = '16px';
    playerTitle.style.left = '0';
    playerTitle.style.right = '0';
    playerTitle.style.textAlign = 'center';
    playerTitle.style.color = '#fff';
    playerTitle.style.fontSize = '18px';
    playerTitle.style.fontWeight = '700';
    playerTitle.style.textShadow = '0 2px 8px rgba(0,0,0,0.7)';
    playerTitle.textContent = player.name;
    header.appendChild(playerTitle);
    
    modal.appendChild(header);
    
    // Player info section
    const infoSection = document.createElement('div');
    infoSection.className = 'modal-section';
    infoSection.style.padding = '20px';
    infoSection.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">UUID</div>
                <div style="font-size: 13px; color: rgba(255,255,255,0.9); font-family: monospace;">${player.uuid || 'N/A'}</div>
            </div>
            <div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Region</div>
                <div style="font-size: 13px; color: rgba(255,255,255,0.9);">${player.region || 'Unknown'}</div>
            </div>
        </div>
    `;
    modal.appendChild(infoSection);
    
    // Player tiers organized by category
    const tiersSection = document.createElement('div');
    tiersSection.className = 'modal-section';
    tiersSection.style.padding = '20px';
    
    const tiersTitle = document.createElement('h3');
    tiersTitle.style.marginTop = '0';
    tiersTitle.style.marginBottom = '16px';
    tiersTitle.style.fontSize = '16px';
    tiersTitle.style.fontWeight = '700';
    tiersTitle.textContent = 'Tier Progress';
    tiersSection.appendChild(tiersTitle);

    if (player.tiers && Array.isArray(player.tiers)) {
        // Organize tiers by category
        const tiersByCategory = {};
        player.tiers.forEach(tierInfo => {
            // Find which category this gamemode belongs to
            for (const [category, modes] of Object.entries(categoryMappings)) {
                if (modes.includes(tierInfo.gamemode)) {
                    if (!tiersByCategory[category]) {
                        tiersByCategory[category] = [];
                    }
                    tiersByCategory[category].push(tierInfo);
                    break;
                }
            }
        });

        // Display tiers by category
        for (const [category, tiers] of Object.entries(tiersByCategory)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.style.marginBottom = '18px';

            const categoryTitle = document.createElement('div');
            categoryTitle.style.fontSize = '12px';
            categoryTitle.style.fontWeight = '700';
            categoryTitle.style.color = 'rgba(255, 255, 255, 0.6)';
            categoryTitle.style.textTransform = 'uppercase';
            categoryTitle.style.marginBottom = '10px';
            categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1) + ' Modes';
            categoryDiv.appendChild(categoryTitle);

            const tiersGrid = document.createElement('div');
            tiersGrid.style.display = 'grid';
            tiersGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(90px, 1fr))';
            tiersGrid.style.gap = '8px';

            tiers.forEach(tierInfo => {
                const tierItem = document.createElement('div');
                tierItem.style.background = 'rgba(100, 116, 139, 0.15)';
                tierItem.style.border = '1px solid rgba(14, 165, 233, 0.2)';
                tierItem.style.borderRadius = '6px';
                tierItem.style.padding = '10px';
                tierItem.style.textAlign = 'center';
                tierItem.style.fontSize = '12px';
                tierItem.style.minHeight = '70px';
                tierItem.style.display = 'flex';
                tierItem.style.flexDirection = 'column';
                tierItem.style.justifyContent = 'center';
                tierItem.style.gap = '6px';

                const modeName = document.createElement('div');
                modeName.style.fontWeight = '600';
                modeName.style.color = 'rgba(255, 255, 255, 0.85)';
                modeName.style.fontSize = '12px';
                modeName.textContent = tierInfo.gamemode;

                const tierBadge = document.createElement('div');
                tierBadge.style.padding = '4px 8px';
                tierBadge.style.borderRadius = '4px';
                tierBadge.style.fontSize = '11px';
                tierBadge.style.fontWeight = '700';
                tierBadge.style.background = 'rgba(14, 165, 233, 0.3)';
                tierBadge.style.color = '#0ea5e9';
                tierBadge.textContent = tierInfo.tier;

                tierItem.appendChild(modeName);
                tierItem.appendChild(tierBadge);
                tiersGrid.appendChild(tierItem);
            });

            categoryDiv.appendChild(tiersGrid);
            tiersSection.appendChild(categoryDiv);
        }
    }
    
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

function openEditModal() {
    const user = localStorage.getItem('ultratiers_user');
    if (!user) return;

    const userData = JSON.parse(user);
    document.getElementById('edit-ign').value = userData.ign;
    
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.style.display = 'none';
}

function handleLogout() {
    localStorage.removeItem('ultratiers_user');
    showLoginPrompt();
}