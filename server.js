import express from "express";
import path from "path";
import cors from "cors";
import Database from "better-sqlite3";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd())));

// -------------------
// SQLite setup
// -------------------
const db = new Database(path.join(process.cwd(), "players.db"));

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS players (
    uuid TEXT PRIMARY KEY,
    name TEXT,
    region TEXT,
    tiers TEXT,
    points INTEGER
  )
`).run();

// -------------------
// Helper Functions
// -------------------

// Load all players
function loadPlayers() {
  const rows = db.prepare("SELECT * FROM players").all();
  return rows.map(r => ({
    uuid: r.uuid,
    name: r.name,
    region: r.region,
    tiers: JSON.parse(r.tiers),
    points: r.points
  }));
}

// Save or update a player
function saveOrUpdatePlayer({ uuid, name, region, tiers, points }) {
  const tiersStr = JSON.stringify(tiers);
  const existing = db.prepare("SELECT * FROM players WHERE uuid = ?").get(uuid);

  if (existing) {
    db.prepare("UPDATE players SET name=?, region=?, tiers=?, points=? WHERE uuid=?")
      .run(name, region, tiersStr, points, uuid);
  } else {
    db.prepare("INSERT INTO players (uuid, name, region, tiers, points) VALUES (?, ?, ?, ?, ?)")
      .run(uuid, name, region, tiersStr, points);
  }
}

// -------------------
// API Endpoints
// -------------------

// Health check
app.get("/health", (req, res) => res.send("API is running!"));

// Get all players
app.get("/players", (req, res) => {
  const players = loadPlayers();
  res.json(players);
});

// Update/add player (POST from Discord bot)
app.post("/", (req, res) => {
  const { uuid, gamemode, newTier, name = null, region = null } = req.body;

  if (!uuid || !gamemode || !newTier) {
    return res.status(400).json({ error: "Missing uuid, gamemode, or newTier" });
  }

  const players = loadPlayers();
  let player = players.find(p => p.uuid === uuid);

  if (!player) {
    // New player
    player = {
      uuid,
      name,
      region,
      tiers: [{ gamemode, tier: newTier }],
      points: 0
    };
    players.push(player);
  } else {
    // Update existing player
    const tierObj = player.tiers.find(t => t.gamemode === gamemode);
    if (tierObj) tierObj.tier = newTier;
    else player.tiers.push({ gamemode, tier: newTier });

    if (name) player.name = name;
    if (region) player.region = region;
  }

  // Recalculate points
  const tierPointsMap = {
    "LT5": 1, "HT5": 2,
    "LT4": 4, "HT4": 6,
    "LT3": 9, "HT3": 12,
    "LT2": 16, "HT2": 20,
    "LT1": 25, "HT1": 30
  };
  player.points = player.tiers.reduce((sum, t) => {
    if (!t.tier || t.tier === "Unknown") return sum;
    return sum + (tierPointsMap[t.tier] || 0);
  }, 0);

  // Save/update in database
  saveOrUpdatePlayer(player);

  return res.json({ message: "Player updated successfully", player });
});

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
