import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(process.cwd())));

// Path to players.js
const playersFile = path.join(process.cwd(), "players.js");

// Helper to read players
function loadPlayers() {
  if (!fs.existsSync(playersFile)) return [];
  let content = fs.readFileSync(playersFile, "utf-8");
  content = content.replace(/^export const players = /, "").replace(/;$/, "");
  return JSON.parse(content);
}

// Helper to save players
function savePlayers(players) {
  fs.writeFileSync(playersFile, `export const players = ${JSON.stringify(players, null, 2)};`);
}

// Endpoint to update player
app.post("/update-player", (req, res) => {
  const { uuid, gamemode, newTier } = req.body;
  if (!uuid || !gamemode || !newTier) return res.status(400).json({ error: "Missing uuid, gamemode, or newTier" });

  const players = loadPlayers();
  let player = players.find(p => p.uuid === uuid);

  if (!player) {
    // If player doesn’t exist, create it
    player = { uuid, name: null, region: null, tiers: [{ gamemode, tier: newTier }], points: 0 };
    players.push(player);
  } else {
    const tierObj = player.tiers.find(t => t.gamemode === gamemode);
    if (tierObj) tierObj.tier = newTier;
    else player.tiers.push({ gamemode, tier: newTier });
  }

  savePlayers(players);
  return res.json({ message: "Player updated successfully", player });
});

// Health check
app.get("/health", (req, res) => res.send("API is running!"));

// Serve index.html by default
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});