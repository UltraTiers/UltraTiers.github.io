import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Path to your players.js file
const playersFile = path.join(process.cwd(), "players.js");

// Endpoint to update players.js
app.post("/update-player", (req, res) => {
  const { uuid, gamemode, newTier } = req.body;

  if (!uuid || !gamemode || !newTier) {
    return res.status(400).json({
      error: "Missing uuid, gamemode, or newTier"
    });
  }

  let players = [];
  try {
    if (fs.existsSync(playersFile)) {
      let content = fs.readFileSync(playersFile, "utf-8");

      // Remove "export const players = " so JSON can parse
      content = content.replace(/^export const players = /, "");

      players = JSON.parse(content);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to read players.js" });
  }

  const player = players.find(p => p.uuid === uuid);
  if (!player) return res.status(404).json({ error: "Player not found" });

  // Update tier
  const tierObj = player.tiers.find(t => t.gamemode === gamemode);
  if (tierObj) {
    tierObj.tier = newTier;
  } else {
    return res.status(404).json({ error: "Gamemode not found for this player" });
  }

  // Save updated JS back
  try {
    fs.writeFileSync(
      playersFile,
      `export const players = ${JSON.stringify(players, null, 2)};`
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save players.js" });
  }

  return res.json({ message: "Player updated successfully", player });
});

// Health check
app.get("/", (req, res) => {
  res.send("API is running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});