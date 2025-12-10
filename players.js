import fs from "fs";
import path from "path";
import express from "express";

const app = express();
app.use(express.json());

const playersFileJS = path.join(process.cwd(), "players.js");

app.post("/update-player", (req, res) => {
  const { uuid, gamemode, newTier } = req.body;

  if (!uuid || !gamemode || !newTier) {
    return res.status(400).json({ error: "Missing uuid, gamemode, or newTier" });
  }

  let players = [];
  try {
    if (fs.existsSync(playersFileJS)) {
      const content = fs.readFileSync(playersFileJS, "utf-8");
      // Remove "export const players = " to parse JSON
      players = JSON.parse(content.replace(/^export const players = /, ""));
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to read players data" });
  }

  // Find player by UUID or create if not exists
  let player = players.find(p => p.uuid === uuid);
  if (!player) {
    player = {
      uuid,
      tiers: [
        {
          gamemode,
          tier: newTier
        }
      ]
    };
    players.push(player);
  } else {
    // Find the gamemode in tiers or add it
    const tierObj = player.tiers.find(t => t.gamemode === gamemode);
    if (tierObj) {
      tierObj.tier = newTier;
    } else {
      player.tiers.push({ gamemode, tier: newTier });
    }
  }

  // Save back to JS file
  try {
    fs.writeFileSync(playersFileJS, `export const players = ${JSON.stringify(players, null, 2)};`);
  } catch (err) {
    return res.status(500).json({ error: "Failed to write players data" });
  }

  return res.json({ message: "Player updated successfully", player });
});

// Simple health check
app.get("/", (req, res) => {
  res.send("Player API is running!");
});

export default app;