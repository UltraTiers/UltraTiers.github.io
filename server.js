import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Path to your player data (modify if your frontend reads from a different file)
const playersFile = path.join(process.cwd(), "players.json");

// Endpoint to update player tiers
app.post("/update-player", (req, res) => {
  const { uuid, gamemode, newTier } = req.body;

  if (!uuid || !gamemode || !newTier) {
    return res.status(400).json({ error: "Missing uuid, gamemode, or newTier" });
  }

  let players = [];
  try {
    players = JSON.parse(fs.readFileSync(playersFile, "utf-8"));
  } catch (err) {
    return res.status(500).json({ error: "Failed to read players data" });
  }

  const player = players.find(p => p.uuid === uuid);
  if (!player) return res.status(404).json({ error: "Player not found" });

  // Update the tier for the gamemode
  const tierObj = player.tiers.find(t => t.gamemode === gamemode);
  if (tierObj) tierObj.tier = newTier;

  // Save back
  fs.writeFileSync(playersFile, JSON.stringify(players, null, 2));

  return res.json({ message: "Player updated successfully", player });
});

// Simple health check
app.get("/", (req, res) => {
  res.send("API is running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});