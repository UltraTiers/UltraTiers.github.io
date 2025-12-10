import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(process.cwd())));

// Path to players.json
const playersFile = path.join(process.cwd(), "players.json");

// Helper to load players
function loadPlayers() {
  if (!fs.existsSync(playersFile)) return [];
  const content = fs.readFileSync(playersFile, "utf-8");
  return JSON.parse(content);
}

// Helper to save players
function savePlayers(players) {
  fs.writeFileSync(playersFile, JSON.stringify(players, null, 2));
}

// ----------------- API Endpoints -----------------

// Health check
app.get("/health", (req, res) => res.send("API is running!"));

// Serve players as JSON
app.get("/players", (req, res) => {
  const players = loadPlayers();
  res.json(players);
});

// Update or add a player (used by your Discord bot)
app.post("/", (req, res) => {
  const { uuid, gamemode, newTier, name = null, region = null } = req.body;

  if (!uuid || !gamemode || !newTier) {
    return res.status(400).json({ error: "Missing uuid, gamemode, or newTier" });
  }

  const players = loadPlayers();
  let player = players.find(p => p.uuid === uuid);

  if (!player) {
    // Create new player if not found
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
    if (tierObj) {
      tierObj.tier = newTier;
    } else {
      player.tiers.push({ gamemode, tier: newTier });
    }
    // Update name/region if provided
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

  savePlayers(players);
  return res.json({ message: "Player updated successfully", player });
});

// Serve index.html for frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});